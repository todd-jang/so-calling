import { TelegramService } from './telegram-service';

interface PushMessage {
  title: string;
  body: string;
  userId: string;
  channel: 'ncp' | 'ibm' | 'both' | 'telegram' | 'all';
}

export class PushService {
  private telegram = new TelegramService();

  async send(msg: PushMessage): Promise<boolean> {
    const results: Promise<boolean>[] = [];

    if (msg.channel === 'ncp' || msg.channel === 'both' || msg.channel === 'all') {
      results.push(this.sendToNCP(msg));
    }
    if (msg.channel === 'ibm' || msg.channel === 'both' || msg.channel === 'all') {
      results.push(this.sendToIBM(msg));
    }
    if (msg.channel === 'telegram' || msg.channel === 'all') {
      results.push(this.telegram.sendMessage(msg.body));
    }

    const outcomes = await Promise.all(results);
    return outcomes.every((res) => res === true);
  }

  private async sendToNCP(msg: PushMessage): Promise<boolean> {
    console.log(`[Airpulse NCP] Sending push to ${msg.userId}`);
    return true;
  }

  private async sendToIBM(msg: PushMessage): Promise<boolean> {
    console.log(`[Airpulse IBM] Sending push to ${msg.userId}`);
    return true;
  }
}
