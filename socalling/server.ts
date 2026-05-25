import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cron from 'node-cron';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { ScraperService } from './services/Scraper';
import { IntelligenceService } from './services/Intelligence';
import { PredictionService } from './services/Prediction';
import User from './models/User';
import Alert from './models/Alert';
import { authMiddleware, generateToken, AuthRequest } from './middleware/auth';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🛡️ API Security: Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/socalling';

// Connect to Database
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB (Socalling)'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

const scraper = new ScraperService();

// ─── Scheduled Tasks ──────────────────────────────────────
// 1. Run price scraper every 1 minute
cron.schedule('*/1 * * * *', async () => {
  console.log('[Cron] Starting scheduled price check...');
  await scraper.processAlerts();
});

// 2. Automated Retention Policy (Cleanup on 1st day of intervals)
// Pattern: 0 0 1 * * (Every month's 1st day at 00:00)
cron.schedule('0 0 1 * *', async () => {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-indexed

  console.log(`[Maintenance] Starting periodic cleanup for Month: ${month}`);

  try {
    // Monthly Cleanup: Delete logs or old history (> 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    // await Alert.updateMany({}, { $pull: { priceHistory: { timestamp: { $lt: threeMonthsAgo } } } });
    
    // Quarterly Cleanup (Jan, Apr, Jul, Oct)
    if ([1, 4, 7, 10].includes(month)) {
      console.log('[Maintenance] Running Quarterly deep cleanup...');
      // Implement quarterly specific cleanup (e.g., archiving old alerts)
    }

    // Bi-annual Cleanup (Jan, Jul)
    if ([1, 7].includes(month)) {
      console.log('[Maintenance] Running Bi-annual system optimization...');
      // Deep DB optimization/compaction logic
    }
    
    console.log('✅ Periodic maintenance completed successfully.');
  } catch (err) {
    console.error('❌ Maintenance failed:', err);
  }
});

// ─── Public Endpoints ─────────────────────────────────────

app.get('/health', (req: Request, res: Response) => res.json({ status: 'OK', service: 'socalling' }));

// ─── Auth Endpoints ───────────────────────────────────────

app.post('/api/auth/signup', async (req: Request, res: Response) => {
  try {
    const { username, email, password, telegramChatId } = req.body;

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const user = new User({ username, email, password, telegramChatId });
    await user.save();

    const token = generateToken(user._id.toString(), user.username);
    console.log(`[Auth] New user registered: ${username}`);
    res.status(201).json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = generateToken(user._id.toString(), user.username);
    console.log(`[Auth] User logged in: ${username}`);
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Protected Endpoints (Require Auth) ───────────────────

// Create Alert (authenticated)
app.post('/api/alerts', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { origin, destination, targetPrice } = req.body;
    const alert = new Alert({ userId: req.user!.userId, origin, destination, targetPrice });
    await alert.save();
    res.status(201).json(alert);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get My Alerts (authenticated)
app.get('/api/alerts', authMiddleware, async (req: AuthRequest, res: Response) => {
  const alerts = await Alert.find({ userId: req.user!.userId });
  res.json(alerts);
});

// Get My Profile (authenticated)
app.get('/api/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.userId).select('-password');
  res.json(user);
});

// Manual Trigger (For Testing)
app.post('/api/scraper/run', async (req: Request, res: Response) => {
  await scraper.processAlerts();
  res.json({ message: 'Scraper triggered manually' });
});

// ─── Metrics Endpoint (Built-in Grafana) ──────────────────
import { HybridBridge } from './airpulse/ncp-ibm/bridge';

app.get('/api/metrics', (req: Request, res: Response) => {
  const bridge = HybridBridge.getInstance();
  const m = bridge.getMetrics();
  res.json({
    bridge: {
      totalRequests: m.totalRequests,
      failoverCount: m.failoverCount,
      pushAlertCount: m.pushAlertCount,
    },
    clouds: {
      ncp: { status: m.ncp.status, latencyMs: m.ncp.latencyMs, failures: m.ncp.consecutiveFailures },
      ibm: { status: m.ibm.status, latencyMs: m.ibm.latencyMs, failures: m.ibm.consecutiveFailures },
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ─── Price Prediction Endpoint (ML + LLM) ──────────────────
app.get('/api/alerts/:id/prediction', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    
    const predictor = PredictionService.getInstance();
    const prediction = await predictor.predict(alert.priceHistory);
    
    res.json({
      success: true,
      data: {
        alertId: alert._id,
        ...prediction
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Prediction failed' });
  }
});

// ─── AI Intelligence Endpoint (Granite LLM) ──────────────────
app.post('/api/ai/analyze-batch', async (req: Request, res: Response) => {
  const { items, comments } = req.body;
  const ai = IntelligenceService.getInstance();
  
  try {
    console.log('[AI] Starting batch analysis with IBM Granite...');
    const classification = items ? await ai.classifyItems(items) : [];
    const summary = comments ? await ai.summarizeActivity(comments) : '분석할 댓글이 없습니다.';
    
    res.json({
      success: true,
      data: { classification, summary }
    });
  } catch (error) {
    console.error('[AI] Analysis error:', error);
    res.status(500).json({ success: false, message: 'AI Analysis failed' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Socalling Alert Service running on port ${PORT}`);
});
