
import { GoogleGenAI } from "@google/genai";
import { Message, ProjectFile } from "../types";

export class GeminiService {
  private static ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  static async chat(prompt: string, history: Message[], files: ProjectFile[] = []): Promise<string> {
    try {
      // Construct parts, including file memory if available
      const fileParts = files.map(file => ({
        inlineData: {
          data: file.content || '',
          mimeType: file.type || 'text/plain'
        }
      }));

      const historyParts = history.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const contents = [
        ...historyParts,
        { 
          role: 'user', 
          parts: [
            ...fileParts,
            { text: prompt }
          ] 
        }
      ];

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents as any,
        config: {
          temperature: 0.7,
          topP: 0.95,
          topK: 64,
          maxOutputTokens: 2048,
          systemInstruction: "You are OmniChat, a high-performance AI assistant. You have access to project memory (files uploaded by the user). When files are provided, prioritize information from them. Keep answers sharp, technical where needed, and always accurate."
        }
      });

      return response.text || "I'm sorry, I couldn't generate a response.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Error: Could not reach Gemini. Please check your network or API key.";
    }
  }
}
