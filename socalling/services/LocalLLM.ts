import axios from 'axios';

/**
 * HybridLLMService: Supports both Local Ollama and Cloud Serverless APIs.
 * Designed to scale from Free Serverless to Dedicated GPU infrastructure.
 */
export class LocalLLMService {
  private static instance: LocalLLMService;
  private readonly MODE = process.env.AI_MODE || 'cloud'; // 'local' or 'cloud'
  
  // Local Config
  private readonly OLLAMA_URL = 'http://localhost:11434/api/generate';
  private readonly LOCAL_MODEL = 'granite-code';

  // Cloud Config (Initial Serverless Mode)
  // Using Gemini Flash for high performance and low cost
  private readonly CLOUD_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  private readonly API_KEY = process.env.CLOUD_AI_API_KEY;

  private constructor() {}

  public static getInstance(): LocalLLMService {
    if (!LocalLLMService.instance) {
      LocalLLMService.instance = new LocalLLMService();
    }
    return LocalLLMService.instance;
  }

  public async summarize(text: string): Promise<string> {
    const prompt = `Summarize the following flight-related activity in Korean:\n\n${text}`;
    return this.MODE === 'local' ? this.callLocal(prompt) : this.callCloud(prompt);
  }

  public async analyzeCode(code: string): Promise<string> {
    const prompt = `Analyze this code for optimization:\n\n${code}`;
    return this.MODE === 'local' ? this.callLocal(prompt) : this.callCloud(prompt);
  }

  private async callLocal(prompt: string): Promise<string> {
    try {
      const response = await axios.post(this.OLLAMA_URL, {
        model: this.LOCAL_MODEL,
        prompt: prompt,
        stream: false
      });
      return response.data.response.trim();
    } catch (e) {
      console.error('[LocalAI] Failed. Falling back to Cloud if available...');
      return this.callCloud(prompt);
    }
  }

  private async callCloud(prompt: string): Promise<string> {
    if (!this.API_KEY) return "AI API Key missing for Serverless Mode.";
    
    try {
      const response = await axios.post(`${this.CLOUD_API_URL}?key=${this.API_KEY}`, {
        contents: [{ parts: [{ text: prompt }] }]
      });
      return response.data.candidates[0].content.parts[0].text.trim();
    } catch (e) {
      console.error('[CloudAI] Error:', e);
      return "AI 분석 일시적 오류";
    }
  }
}
