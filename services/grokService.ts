import { Message, ProjectFile } from "../types";

export interface GrokConfig {
  username: string;
  password: string;
  model: string;
}

export class GrokService {
  private config: GrokConfig | null = null;

  /**
   * Set Grok configuration with HTTP authentication
   */
  static setConfig(config: GrokConfig): void {
    // Store config securely (in production, this should be encrypted)
    localStorage.setItem('grok_config', JSON.stringify(config));
  }

  /**
   * Get Grok configuration
   */
  static getConfig(): GrokConfig | null {
    const stored = localStorage.getItem('grok_config');
    return stored ? JSON.parse(stored) : null;
  }

  /**
   * Clear Grok configuration
   */
  static clearConfig(): void {
    localStorage.removeItem('grok_config');
  }

  /**
   * Test Grok connection with HTTP auth
   */
  static async testConnection(config: GrokConfig): Promise<boolean> {
    try {
      const response = await fetch('https://api.x.ai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${config.username}:${config.password}`),
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Grok connection test failed:', error);
      return false;
    }
  }

  /**
   * Send chat request to Grok with HTTP authentication
   */
  static async chat(
    prompt: string,
    history: Message[],
    files: ProjectFile[] = [],
    model: string = 'grok-3'
  ): Promise<{ text: string }> {
    const config = this.getConfig();
    if (!config) {
      throw new Error('Grok configuration not found');
    }

    try {
      // Prepare messages for Grok API
      const messages = [
        {
          role: 'system',
          content: 'You are Grok, a helpful AI assistant. Provide clear, insightful responses.'
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

      const response = await fetch('https://api.x.ai/v1/chat/completions', {
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
        throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        text: data.choices[0]?.message?.content || 'No response received'
      };
    } catch (error) {
      console.error('Grok chat error:', error);
      throw error;
    }
  }
}
