
import { Message, LocalProviderConfig } from "../types";

export class LocalAiService {
  static async chat(
    prompt: string | null,
    history: Message[],
    config: LocalProviderConfig,
    isAgentMode: boolean = false
  ): Promise<{ text: string; toolCalls?: any[] }> {
    const messages = history.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content || " "
    }));

    if (prompt) {
      messages.push({ role: 'user', content: prompt });
    }

    try {
      // Use the local proxy on the backend to avoid CORS issues if necessary, 
      // but here we'll try a direct fetch to the user-provided URL or proxy via our server
      const response = await fetch('/api/local-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: config.baseUrl,
          model: config.model,
          messages,
          isAgentMode
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      return {
        text: data.choices[0].message.content,
        toolCalls: data.choices[0].message.tool_calls // If supported by local model
      };
    } catch (error) {
      console.error("Local AI Error:", error);
      return { text: "Connection failed — ensure Ollama or LM Studio is running at " + config.baseUrl };
    }
  }

  static async fetchModels(baseUrl: string): Promise<string[]> {
    try {
      const response = await fetch('/api/local-ai/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl })
      });
      const data = await response.json();
      return data.models || [];
    } catch (e) {
      return [];
    }
  }
}
