
import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import { Message, ProjectFile } from "../types";

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
  }
];

export class GeminiService {
  static async chat(
    prompt: string | null, 
    history: Message[], 
    files: ProjectFile[] = [], 
    isAgentMode: boolean = false,
    toolResponse?: { id: string, name: string, response: any }
  ): Promise<{ text: string; toolCalls?: any[] }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
      // Build parts from history ensuring role consistency for tool calls
      const contents = history.map(m => {
        const parts: any[] = [{ text: m.content || " " }];
        
        // Assistant turns with tool calls must represent the functionCall in history
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

      // Add tool responses if any as a user turn immediately after the call
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

      // Add latest prompt with attached project context
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

      // Execute content generation using the Gemini 3 Pro model
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: contents as any,
        config: {
          temperature: 0.7,
          systemInstruction: `You are OmniChat Agent.
          ${isAgentMode ? "AGENT MODE ACTIVE. Use SSH tools to manage servers. Plan steps. If a user asks to deploy, connect first, then git pull/npm install. Always show your thinking. Ask for approval on sudo/rm." : "Standard Mode."}`,
          tools: isAgentMode ? [{ functionDeclarations: sshTools }] : undefined
        }
      });

      // Directly access .text property and .functionCalls for clean output extraction
      return {
        text: response.text || "",
        toolCalls: response.functionCalls
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      return { text: "Connection error with AI service." };
    }
  }
}
