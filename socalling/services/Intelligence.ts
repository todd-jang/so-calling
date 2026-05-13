import { LocalLLMService } from './LocalLLM';

/**
 * IntelligenceService: Orchestrates AI tasks like classification and summarization
 * using the local IBM Granite model.
 */
export class IntelligenceService {
  private static instance: IntelligenceService;
  private llm: LocalLLMService;

  private constructor() {
    this.llm = LocalLLMService.getInstance();
  }

  public static getInstance(): IntelligenceService {
    if (!IntelligenceService.instance) {
      IntelligenceService.instance = new IntelligenceService();
    }
    return IntelligenceService.instance;
  }

  /**
   * Classifies a list of strings into predefined categories.
   */
  public async classifyItems(items: string[]): Promise<{ item: string, category: string }[]> {
    const textToClassify = items.join('\n');
    const prompt = `
      Classify each of the following items into one of these categories: [Flight, Hotel, Transport, General].
      Return only in format "Item: Category".
      Items:
      ${textToClassify}
    `;

    try {
      const rawResponse = await this.llm.analyzeCode(prompt); // Reusing analysis logic for classification
      return rawResponse.split('\n').map(line => {
        const [item, category] = line.split(':').map(s => s.trim());
        return { item: item || 'Unknown', category: category || 'General' };
      });
    } catch (error) {
      console.error('[Intelligence] Classification failed:', error);
      return items.map(item => ({ item, category: 'General' }));
    }
  }

  /**
   * Summarizes user comments and extracts overall sentiment trend.
   */
  public async summarizeActivity(comments: string[]): Promise<string> {
    if (comments.length === 0) return "분석할 데이터가 없습니다.";
    
    const combinedText = comments.join(' | ');
    const prompt = `
      Analyze these user comments and provide a one-sentence summary of the overall discussion and sentiment trend in Korean:
      Comments: ${combinedText}
    `;

    return await this.llm.summarize(prompt);
  }
}
