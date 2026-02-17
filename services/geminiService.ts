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
        host: { type: Type.STRING, description: "Hostname or IP." },
        username: { type: Type.STRING, description: "SSH username." },
        port: { type: Type.NUMBER, description: "Port (default 22)." },
        password: { type: Type.STRING, description: "Password if applicable." }
      },
      required: ["host", "username"]
    }
  },
  {
    name: "ssh_exec",
    description: "Execute a command on the remote server and return output.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        command: { type: Type.STRING, description: "Shell command to run." }
      },
      required: ["command"]
    }
  },
  {
    name: "read_file",
    description: "Read content from a remote file.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: "Path to file." }
      },
      required: ["path"]
    }
  },
  {
    name: "write_file",
    description: "Create or overwrite a file with specified content.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: "Destination path." },
        content: { type: Type.STRING, description: "Content to write." }
      },
      required: ["path", "content"]
    }
  },
  {
    name: "list_dir",
    description: "List contents of a directory.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: "Directory path (default current)." }
      }
    }
  },
  {
    name: "end_agent",
    description: "Explicitly end the current agent task and close the remote session. Use this when the requested task is fully completed.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING, description: "A brief summary of what was accomplished." }
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

    // 1. Model Selection Logic
    // Fast: gemini-2.5-flash-lite-latest
    // Balanced: gemini-3-flash-preview
    // Deep Thinking: gemini-3-pro-preview (with max thinking budget)
    let modelName = 'gemini-3-flash-preview';
    let thinkingBudget = 0;

    if (intelligenceMode === 'fast') {
      modelName = 'gemini-2.5-flash-lite-latest';
    } else if (intelligenceMode === 'deep') {
      modelName = 'gemini-3-pro-preview';
      thinkingBudget = 32768; // Max budget for Gemini 3 Pro reasoning
    }

    // Agent mode defaults to Pro for complex tool execution unless Fast is explicitly requested
    if (isAgentMode && intelligenceMode !== 'fast') {
      modelName = 'gemini-3-pro-preview';
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
          systemInstruction: `You are OmniChat Agent v3. Operating in ${intelligenceMode.toUpperCase()} mode.
          ${isAgentMode ? "AGENT MODE ACTIVE: Use tools to manage SSH infrastructure. Plan logically." : "STANDARD MODE: Helpful assistant."}`,
          tools: isAgentMode ? [{ functionDeclarations: sshTools }] : undefined,
          // Handle thinking budget only if > 0
          ...(thinkingBudget > 0 ? { thinkingConfig: { thinkingBudget } } : {})
        }
      });

      return {
        text: response.text || "",
        toolCalls: response.functionCalls
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      return { text: "AI Service error. Ensure API_KEY is valid and network connectivity is stable." };
    }
  }
}