import axios from 'axios';

interface GithubWorkflowPayload {
  action: string; // 'completed' | 'requested' | 'in_progress'
  workflow_run: {
    id: number;
    name: string;
    status: 'queued' | 'in_progress' | 'completed';
    conclusion: 'success' | 'failure' | 'cancelled' | 'neutral' | null;
    head_branch: string;
    head_commit: {
      id: string;
      message: string;
      author: {
        name: string;
        email: string;
      };
    };
    head_sha: string;
    url: string;
    html_url: string;
    created_at: string;
    updated_at: string;
    run_number: number;
    event: string;
  };
  repository: {
    full_name: string;
    html_url: string;
    owner: {
      login: string;
    };
  };
}

/**
 * Telegram CI/CD Bot Service
 * Automatically notifies GitHub Actions workflow results to Telegram
 */
export class TelegramCIBot {
  private botToken: string;
  private chatId: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = process.env.TELEGRAM_CHAT_ID || '';

    if (!this.botToken || !this.chatId) {
      throw new Error('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set in environment');
    }
  }

  /**
   * Generate status emoji based on workflow conclusion
   */
  private getStatusEmoji(conclusion: string | null): string {
    switch (conclusion) {
      case 'success':
        return '✅';
      case 'failure':
        return '❌';
      case 'cancelled':
        return '⏸️';
      default:
        return '⏳';
    }
  }

  /**
   * Generate status text
   */
  private getStatusText(conclusion: string | null): string {
    switch (conclusion) {
      case 'success':
        return 'BUILD SUCCESS';
      case 'failure':
        return 'BUILD FAILED';
      case 'cancelled':
        return 'BUILD CANCELLED';
      default:
        return 'BUILD IN PROGRESS';
    }
  }

  /**
   * Format workflow run data into Telegram message
   */
  private formatMessage(payload: GithubWorkflowPayload): {
    message: string;
    parseMode: 'HTML' | 'Markdown';
  } {
    const {
      workflow_run: run,
      repository: repo,
    } = payload;

    const emoji = this.getStatusEmoji(run.conclusion);
    const status = this.getStatusText(run.conclusion);
    const branch = run.head_branch;
    const commitSha = run.head_sha.substring(0, 7);
    const commitMsg = run.head_commit.message.split('\n')[0]; // First line only
    const author = run.head_commit.author.name;
    const runNumber = run.run_number;
    const workflowName = run.name;

    // Color-coded status bar
    let statusBar = '';
    if (run.conclusion === 'success') {
      statusBar = '🟢 성공';
    } else if (run.conclusion === 'failure') {
      statusBar = '🔴 실패';
    } else if (run.conclusion === 'cancelled') {
      statusBar = '🟡 취소됨';
    } else {
      statusBar = '🔵 진행 중';
    }

    const message = `
${emoji} <b>${status}</b>

<b>📦 Repository:</b> ${repo.full_name}
<b>🔧 Workflow:</b> ${workflowName}
<b>🌿 Branch:</b> <code>${branch}</code>
<b>📝 Commit:</b> <code>${commitSha}</code> - ${commitMsg}
<b>👤 Author:</b> ${author}
<b>📊 Run #:</b> ${runNumber}

<b>Status:</b> ${statusBar}

<a href="${run.html_url}">🔍 View Workflow Logs</a>
<a href="${repo.html_url}">📂 Go to Repository</a>

<i>Time: ${new Date(run.updated_at).toLocaleString('ko-KR')}</i>
`;

    return {
      message: message.trim(),
      parseMode: 'HTML',
    };
  }

  /**
   * Send notification to Telegram
   */
  async notifyWorkflowStatus(payload: GithubWorkflowPayload): Promise<void> {
    try {
      // Only notify on completion
      if (payload.action !== 'completed') {
        console.log('[TelegramBot] Workflow not completed yet, skipping notification');
        return;
      }

      const { message, parseMode } = this.formatMessage(payload);

      const response = await axios.post(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          chat_id: this.chatId,
          text: message,
          parse_mode: parseMode,
          disable_web_page_preview: false,
          link_preview_options: { is_disabled: false },
        }
      );

      if (response.data.ok) {
        console.log(`[TelegramBot] ✅ Notification sent successfully. Message ID: ${response.data.result.message_id}`);
      } else {
        console.error(`[TelegramBot] ❌ Failed to send notification:`, response.data.description);
      }
    } catch (error) {
      console.error('[TelegramBot] Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send custom alert message to Telegram
   */
  async sendAlert(title: string, message: string, isError: boolean = false): Promise<void> {
    try {
      const emoji = isError ? '⚠️' : 'ℹ️';
      const htmlMessage = `
${emoji} <b>${title}</b>

${message}

<i>Time: ${new Date().toLocaleString('ko-KR')}</i>
`;

      const response = await axios.post(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          chat_id: this.chatId,
          text: htmlMessage.trim(),
          parse_mode: 'HTML',
        }
      );

      if (response.data.ok) {
        console.log(`[TelegramBot] Alert sent: ${title}`);
      }
    } catch (error) {
      console.error('[TelegramBot] Error sending alert:', error);
    }
  }

  /**
   * Health check - test Telegram bot connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(
        `https://api.telegram.org/bot${this.botToken}/getMe`
      );

      if (response.data.ok) {
        console.log(`[TelegramBot] ✅ Connected as @${response.data.result.username}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[TelegramBot] Connection test failed:', error);
      return false;
    }
  }
}
