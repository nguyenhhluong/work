
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Message, ProjectFile } from "../types";

export type IntelligenceMode = 'fast' | 'balanced' | 'deep';

const sshTools: FunctionDeclaration[] = [
  {
    name: "connect_ssh",
    description: "Connect to a remote server via SSH. Returns a success status.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        host: { type: Type.STRING, description: "Hostname or IP address of the target server." },
        username: { type: Type.STRING, description: "The SSH username for authentication." },
        port: { type: Type.NUMBER, description: "The SSH port (default is 22)." },
        password: { type: Type.STRING, description: "The password for authentication (if applicable)." }
      },
      required: ["host", "username"]
    }
  },
  {
    name: "ssh_exec",
    description: "Execute a shell command on the connected remote server and return the standard output/error.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        command: { type: Type.STRING, description: "The shell command to be executed." }
      },
      required: ["command"]
    }
  },
  {
    name: "read_file",
    description: "Read the full content of a file on the remote server.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: "The absolute or relative path to the file." }
      },
      required: ["path"]
    }
  },
  {
    name: "write_file",
    description: "Create a new file or overwrite an existing file on the remote server with the specified content.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: "The destination file path." },
        content: { type: Type.STRING, description: "The text content to be written to the file." }
      },
      required: ["path", "content"]
    }
  },
  {
    name: "list_dir",
    description: "List all files and directories within a specific directory on the remote server.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: "The directory path (defaults to current working directory)." }
      }
    }
  },
  {
    name: "end_agent",
    description: "Finalize the current agent task and terminate the remote session. Use this once all user instructions are fulfilled.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING, description: "A summary of the actions performed and final status." }
      }
    }
  }
];

export class GeminiService {
  static async chat(
    prompt: string | null, 
    history: Message[], 
    files: ProjectFile[] = [], 
    isAgentMode: boolean = false,
    intelligenceMode: IntelligenceMode = 'balanced',
    toolResponse?: { id: string, name: string, response: any }
  ): Promise<{ text: string; toolCalls?: any[] }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Mode Mapping:
    // Fast: gemini-2.5-flash-lite-latest (Lower latency)
    // Balanced: gemini-3-flash-preview (Standard powerful multimodal)
    // Deep: gemini-3-pro-preview (Advanced reasoning with maximum thinking budget)
    
    let modelName = 'gemini-3-flash-preview';
    let thinkingBudget = 0;

    if (intelligenceMode === 'fast') {
      modelName = 'gemini-2.5-flash-lite-latest';
    } else if (intelligenceMode === 'deep') {
      modelName = 'gemini-3-pro-preview';
      thinkingBudget = 32768; // Maximum reasoning capabilities for complex coding/SSH tasks
    }

    // Force Pro model for autonomous Agent Mode if not explicitly in 'fast' mode
    if (isAgentMode && intelligenceMode !== 'fast') {
      modelName = 'gemini-3-pro-preview';
      // If we are in agent mode but not 'deep', give it a moderate thinking budget
      if (intelligenceMode === 'balanced') {
        thinkingBudget = 16384;
      }
    }

    try {
      const contents = history.map(m => {
        const parts: any[] = [{ text: m.content || " " }];
        if (m.toolCalls && m.toolCalls.length > 0 && m.role === 'assistant') {
          m.toolCalls.forEach(tc => {
            parts.push({
              functionCall: {
                name: tc.name,
                args: tc.args
              }
            });
          });
        }
        return {
          role: m.role === 'user' ? 'user' : 'model',
          parts
        };
      });

      // Inject tool execution result back into the context
      if (toolResponse) {
        contents.push({
          role: 'user',
          parts: [{
            functionResponse: {
              name: toolResponse.name,
              response: toolResponse.response
            }
          }]
        } as any);
      }

      // Handle user prompt and multimodal file attachments
      if (prompt) {
        const fileParts = files.map(file => ({
          inlineData: {
            data: file.content || '',
            mimeType: file.type || 'text/plain'
          }
        }));
        contents.push({
          role: 'user',
          parts: [...fileParts, { text: prompt }]
        });
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents as any,
        config: {
          temperature: 0.7,
          systemInstruction: `Identity: OmniChat Autonomous Interface.
Status: [Mode: ${intelligenceMode.toUpperCase()}] [Agent: ${isAgentMode ? 'ACTIVE' : 'IDLE'}].
Core Directives:
1. Provide concise, expert-level technical guidance.
2. ${isAgentMode ? "AUTONOMOUS MODE: Use the provided SSH tools to explore and manage the server environment. Plan multi-step actions." : "ADVISORY MODE: Assist with coding and technical queries without direct system access unless requested."}
3. Maintain the Grok-2026 aesthetic: futuristic, professional, and slightly edgy.`,
          tools: isAgentMode ? [{ functionDeclarations: sshTools }] : undefined,
          ...(thinkingBudget > 0 ? { thinkingConfig: { thinkingBudget } } : {})
        }
      });

      return {
        text: response.text || "",
        toolCalls: response.functionCalls
      };
    } catch (error) {
      console.error("Gemini Core Error:", error);
      return { text: "Neural Link Failure: Communication with the core AI was interrupted. Check your API configuration and network status." };
    }
  }
}
