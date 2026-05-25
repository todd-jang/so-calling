import { Request, Response } from 'express';
import { TelegramCIBot } from '../services/TelegramCIBot';

type GitHubWebhookRequest = Request & {
  rawBody?: Buffer | string;
};

/**
 * GitHub Webhook Controller
 * Handles incoming webhook events from GitHub Actions and routes them to Telegram
 */
export class GitHubWebhookController {
  private telegramBot: TelegramCIBot;

  constructor() {
    this.telegramBot = new TelegramCIBot();
  }

  /**
   * Webhook endpoint for GitHub Actions workflow events
   * POST /api/github/webhook
   */
  async handleWorkflowWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['x-hub-signature-256'] as string;
      const event = req.headers['x-github-event'] as string;
      const payload = req.body;

      console.log(`[GitHubWebhook] Received event: ${event}`);

      // Verify webhook signature (optional but recommended)
      if (!this.verifySignature(req, signature)) {
        console.warn('[GitHubWebhook] Invalid signature');
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      // Only process workflow_run events
      if (event !== 'workflow_run') {
        res.status(200).json({ message: 'Event ignored (not workflow_run)' });
        return;
      }

      // Send to Telegram
      await this.telegramBot.notifyWorkflowStatus(payload);

      res.status(200).json({
        success: true,
        message: 'Webhook processed and Telegram notification sent',
      });
    } catch (error) {
      console.error('[GitHubWebhook] Error processing webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Health check endpoint
   * GET /api/github/health
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const isConnected = await this.telegramBot.testConnection();

      if (isConnected) {
        res.status(200).json({
          status: 'healthy',
          message: 'GitHub Webhook & Telegram Bot are connected',
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(503).json({
          status: 'unhealthy',
          message: 'Telegram Bot connection failed',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        error: String(error),
      });
    }
  }

  /**
   * Verify GitHub webhook signature
   * Uses HMAC SHA256 for security
   */
  private verifySignature(req: GitHubWebhookRequest, signature: string): boolean {
    const crypto = require('crypto');
    const secret = process.env.GITHUB_WEBHOOK_SECRET || '';

    if (!secret) {
      console.warn('[GitHubWebhook] GITHUB_WEBHOOK_SECRET not set, skipping verification');
      return true; // Allow if secret not configured
    }

    const hmac = crypto.createHmac('sha256', secret);
    const rawBody = req.rawBody ?? JSON.stringify(req.body);
    const digest = 'sha256=' + hmac.update(rawBody).digest('hex');

    return digest === signature;
  }
}
