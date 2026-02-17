import { Message, ProjectFile } from "../types";

export interface OpenAIConfig {
  username: string;
  password: string;
  model: string;
}

export class OpenAIService {
  private config: OpenAIConfig | null = null;

  /**
   * Set OpenAI configuration with HTTP authentication
   */
  static setConfig(config: OpenAIConfig): void {
    // Store config securely (in production, this should be encrypted)
    localStorage.setItem('openai_config', JSON.stringify(config));
  }

  /**
   * Get OpenAI configuration
   */
  static getConfig(): OpenAIConfig | null {
    const stored = localStorage.getItem('openai_config');
    return stored ? JSON.parse(stored) : null;
  }

  /**
   * Clear OpenAI configuration
   */
  static clearConfig(): void {
    localStorage.removeItem('openai_config');
  }

  /**
   * Test OpenAI connection with HTTP auth
   */
  static async testConnection(config: OpenAIConfig): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${config.username}:${config.password}`),
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }

  /**
   * Send chat request to OpenAI with HTTP authentication
   */
  static async chat(
    prompt: string,
    history: Message[],
    files: ProjectFile[] = [],
    model: string = 'gpt-4o'
  ): Promise<{ text: string }> {
    const config = this.getConfig();
    if (!config) {
      throw new Error('OpenAI configuration not found');
    }

    try {
      // Prepare messages for OpenAI API
      const messages = [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. Provide clear, concise responses.'
        },
        ...history.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content || ''
        })).filter(msg => msg.content),
        {
          role: 'user',
          content: prompt
        }
      ];

      // Add file context if provided
      if (files.length > 0) {
        const fileContext = files.map(file => 
          `File: ${file.name}\nContent: ${file.content?.substring(0, 2000)}...`
        ).join('\n\n');
        
        messages.push({
          role: 'system',
          content: `Context from uploaded files:\n${fileContext}`
        });
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${config.username}:${config.password}`),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || config.model,
          messages: messages,
          max_tokens: 4000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        text: data.choices[0]?.message?.content || 'No response received'
      };
    } catch (error) {
      console.error('OpenAI chat error:', error);
      throw error;
    }
  }
}
