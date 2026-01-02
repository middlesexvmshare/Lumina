
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export class GeminiService {
  private static instance: GeminiService;

  private constructor() {}

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  private getClient(): GoogleGenAI {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async summarizeNote(title: string, content: string): Promise<string> {
    try {
      const ai = this.getClient();
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Please provide a concise, professional 3-sentence summary of the following note titled "${title}":\n\n${content}`,
        config: {
          temperature: 0.7,
        }
      });
      return response.text || "Could not generate summary.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Error connecting to AI service.";
    }
  }

  async analyzeFile(fileName: string, fileDataUrl: string, mimeType: string): Promise<string> {
    try {
      const ai = this.getClient();
      // Extract base64 data from dataUrl
      const base64Data = fileDataUrl.split(',')[1];
      
      const parts: any[] = [{ text: `Explain what is in this file (${fileName}) and provide a short overview.` }];
      
      if (mimeType.startsWith('image/')) {
        parts.push({
          inlineData: {
            mimeType,
            data: base64Data
          }
        });
      }

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: {
          temperature: 0.7,
        }
      });
      
      return response.text || "Could not analyze file.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Error analyzing file with AI.";
    }
  }
}
