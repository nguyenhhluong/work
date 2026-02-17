
import { GoogleGenAI } from "@google/genai";
import { Message, ProjectFile } from "../types";

export class GeminiService {
  static async chat(prompt: string, history: Message[], files: ProjectFile[] = []): Promise<string> {
    // Always initialize with process.env.API_KEY as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
      // Construct parts, including file memory if available
      const fileParts = files.map(file => ({
        inlineData: {
          data: file.content || '',
          mimeType: file.type || 'text/plain'
        }
      }));

      // History mapping to Gemini format
      const historyParts = history.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      // Merge history, files, and current prompt
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

      // Use the correct model name and directly access .text property
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents as any,
        config: {
          temperature: 0.7,
          topP: 0.95,
          topK: 64,
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
