const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Sentiment = require('sentiment');
const natural = require('natural');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = 5001;
const SECRET_KEY = 'super-secret-key';
const sentiment = new Sentiment();
const tokenizer = new natural.WordTokenizer();

app.use(cors());
app.use(bodyParser.json());

// --- Persistent State (Real DB Ready) ---
let USERS = [];
let TODOS = [];
let COMMENTS = [];

// --- Local AI Algorithms ---

// 1. Sentiment & Analysis Logic
const analyzeMessage = (text) => {
    const result = sentiment.analyze(text);
    let mood = '😐';
    if (result.score > 2) mood = '😊';
    if (result.score < -2) mood = '😠';
    return { score: result.score, mood };
};

// 2. Todo Classification (Simple Keyword-based)
const classifyTodo = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('work') || lower.includes('project') || lower.includes('meeting')) return '🏢 Work';
    if (lower.includes('buy') || lower.includes('shop') || lower.includes('eat')) return '🛒 Life';
    if (lower.includes('study') || lower.includes('learn') || lower.includes('read')) return '📚 Study';
    return '📝 General';
};

// 3. Extractive Summarization (Keyword Frequency)
const getSummary = (texts) => {
    if (texts.length === 0) return "No data to summarize.";
    const allWords = tokenizer.tokenize(texts.join(' '));
    const freq = {};
    allWords.forEach(w => { if(w.length > 3) freq[w] = (freq[w] || 0) + 1; });
    const topKeywords = Object.keys(freq).sort((a, b) => freq[b] - freq[a]).slice(0, 5);
    return `Summary: Focus on ${topKeywords.join(', ')}. Total ${texts.length} messages analyzed.`;
};

// --- API Endpoints ---
app.get('/', (req, res) => res.send('<h1>AI Real-time Server is running!</h1>'));

app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;
    if (USERS.find(u => u.username === username)) return res.status(400).json({ success: false, message: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    USERS.push({ username, password: hashedPassword });
    res.json({ success: true, message: 'Registration successful!' });
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = USERS.find(u => u.username === username);
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        return res.json({ success: true, token });
    }
    res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// --- Real-time Socket.io Logic ---
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Initial Data Sync
    socket.emit('init_data', { todos: TODOS, comments: COMMENTS, summary: getSummary(COMMENTS.map(c => c.text)) });

    // Handle New Todo
    socket.on('add_todo', (data) => {
        const category = classifyTodo(data.text);
        const newTodo = { id: Date.now(), text: data.text, category, user: data.user };
        TODOS.push(newTodo);
        io.emit('todo_added', newTodo);
    });

    // Handle New Comment
    socket.on('add_comment', (data) => {
        const { mood, score } = analyzeMessage(data.text);
        const newComment = { id: Date.now(), text: data.text, user: data.user, mood, score, time: new Date().toLocaleTimeString() };
        COMMENTS.push(newComment);
        
        const summary = getSummary(COMMENTS.map(c => c.text));
        io.emit('comment_added', { comment: newComment, summary });
    });

    socket.on('disconnect', () => console.log('User disconnected'));
});

server.listen(PORT, () => console.log(`AI Real-time Server at http://localhost:${PORT}`));
