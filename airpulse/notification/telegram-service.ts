import axios from 'axios';

/**
 * Telegram Bot Service
 * ─────────────────────────────────────
 * Sends real-time alerts to a Telegram chat.
 */
export class TelegramService {
  private botToken: string;
  private chatId: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = process.env.TELEGRAM_CHAT_ID || '';
  }

  /**
   * Send a formatted message to the configured Telegram chat
   */
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
        parse_mode: 'HTML'
      });
      console.log('[Telegram] Message sent successfully.');
      return true;
    } catch (error: any) {
      console.error('[Telegram] Failed to send message:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Send a rich price alert message
   */
  async sendPriceAlert(origin: string, destination: string, price: number, airline: string): Promise<boolean> {
    const message = `
🎯 <b>Flight Price Alert!</b>
──────────────────
✈️ <b>Route:</b> ${origin} → ${destination}
航空公司: <b>${airline}</b>
💰 <b>Price:</b> ${price.toLocaleString()} KRW

<i>Socalling x Airpulse Hybrid Cloud</i>
    `.trim();

    return this.sendMessage(message);
  }
}
