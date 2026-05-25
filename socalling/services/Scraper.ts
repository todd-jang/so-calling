import { HybridBridge } from '../airpulse/ncp-ibm/bridge';
import { PushService } from '../airpulse/notification/push-service';
import { FlightAPIService } from './FlightAPI';
import Alert, { IAlert } from '../models/Alert';

/**
 * Socalling Price Scraper Service
 * Responsible for fetching real-time flight data and triggering alerts.
 */
export class ScraperService {
  private bridge: HybridBridge;
  private pushService: PushService;
  private flightAPI: FlightAPIService;

  constructor() {
    this.bridge = HybridBridge.getInstance();
    this.pushService = new PushService();
    this.flightAPI = new FlightAPIService();
  }

  /**
   * Process all active alerts
   */
  async processAlerts() {
    const activeAlerts = await Alert.find({ isActive: true });
    console.log(`[Scraper] Processing ${activeAlerts.length} active alerts.`);

    for (const alert of activeAlerts) {
      const offer = await this.flightAPI.searchCheapestFlight(alert.origin, alert.destination);
      if (!offer) continue;

      const currentPrice = offer.price;

      // Update price history
      alert.currentPrice = currentPrice;
      alert.lastChecked = new Date();
      alert.priceHistory.push({ price: currentPrice, timestamp: new Date() });

      // Keep only last 30 history points
      if (alert.priceHistory.length > 30) alert.priceHistory.shift();

      await alert.save();

      // Check if price dropped below target
      if (currentPrice <= alert.targetPrice) {
        console.log(`[🎯 ALERT] Target reached for ${alert.origin}->${alert.destination}: ${currentPrice} <= ${alert.targetPrice}`);

        // Use the Airpulse Hybrid Bridge to sync this event globally
        try {
          await this.bridge.syncData({
            type: 'PRICE_ALERT',
            alertId: alert._id.toString(),
            userId: alert.userId.toString(),
            origin: alert.origin,
            destination: alert.destination,
            price: currentPrice
          });
        } catch (bridgeError) {
          console.error('[Airpulse] Bridge sync failed, but continuing with local notifications:', bridgeError);
        }

        // Trigger Multi-channel Push Notification
        await this.pushService.send({
          title: '🎯 Flight Price Alert!',
          // 여기에 (${offer.airline}) 부분이 항공사 이름을 출력합니다!
          body: `${alert.origin} -> ${alert.destination} (${offer.airline}) is now ${currentPrice.toLocaleString()} KRW!`,
          userId: alert.userId.toString(),
          channel: 'all'
        });

        // Record metrics for Grafana
        this.bridge.recordPushAlert();
      }
    }
  }
}
