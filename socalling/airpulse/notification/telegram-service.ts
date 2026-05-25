import axios from 'axios';

export class TelegramService {
  private botToken: string;
  private chatId: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = process.env.TELEGRAM_CHAT_ID || '';
  }

  async sendMessage(message: string): Promise<boolean> {
    if (!this.botToken || !this.chatId) {
      console.warn('[Telegram] Skipping send: Bot token or Chat ID not configured.');
      return false;
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      await axios.post(url, {
        chat_id: this.chatId,
        text: message,
        parse_mode: 'HTML',
      });
      console.log('[Telegram] Message sent successfully.');
      return true;
    } catch (error: any) {
      console.error('[Telegram] Failed to send message:', error.response?.data || error.message);
      return false;
    }
  }
}
