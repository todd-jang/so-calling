import { IntelligenceService } from './Intelligence';

interface PricePoint {
  price: number;
  timestamp: Date;
}

/**
 * PredictionService: Uses Simple Linear Regression and LLM insights
 * to forecast future price movements for flight alerts.
 */
export class PredictionService {
  private static instance: PredictionService;
  private intelligence: IntelligenceService;

  private constructor() {
    this.intelligence = IntelligenceService.getInstance();
  }

  public static getInstance(): PredictionService {
    if (!PredictionService.instance) {
      PredictionService.instance = new PredictionService();
    }
    return PredictionService.instance;
  }

  /**
   * Predicts the next expected price and provides a recommendation.
   */
  public async predict(history: PricePoint[]): Promise<{
    nextPrice: number,
    trend: 'UP' | 'DOWN' | 'STABLE',
    recommendation: string
  }> {
    if (history.length < 3) {
      return { nextPrice: 0, trend: 'STABLE', recommendation: "충분한 데이터가 쌓이지 않았습니다." };
    }

    // 1. Simple Linear Regression (y = mx + b)
    const n = history.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    history.forEach((point, i) => {
      const x = i; // Use index as time proxy
      const y = point.price;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Predict next point (n-th index)
    const nextPrice = Math.round(slope * n + intercept);
    const trend = slope > 100 ? 'UP' : (slope < -100 ? 'DOWN' : 'STABLE');

    // 2. Combine with LLM for qualitative recommendation
    const context = `현재 가격 추세는 ${trend === 'UP' ? '상승' : trend === 'DOWN' ? '하락' : '안정'}세이며, 다음 예상 가격은 ${nextPrice.toLocaleString()}원입니다.`;
    const recommendation = await this.intelligence.summarizeActivity([context, "과거 데이터 기반 구매 추천 요청"]);

    return { nextPrice, trend, recommendation };
  }
}
