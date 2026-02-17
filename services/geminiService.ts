
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
      // Build parts from history
      const contents = history.map(m => {
        const parts: any[] = [{ text: m.content || " " }];
        
        // If this message had tool calls, we need to represent them in model role
        if (m.toolCalls && m.toolCalls.length > 0 && m.role === 'assistant') {
          // In Google GenAI SDK, function calls are part of the model content
          // However, for simplicity in this bridge, we handle the latest prompt
        }
        
        return {
          role: m.role === 'user' ? 'user' : 'model',
          parts
        };
      });

      // Add tool responses if any
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

      // Add latest prompt
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
        model: 'gemini-3-pro-preview',
        contents: contents as any,
        config: {
          temperature: 0.7,
          systemInstruction: `You are OmniChat Agent.
          ${isAgentMode ? "AGENT MODE ACTIVE. Use SSH tools to manage servers. Plan steps. If a user asks to deploy, connect first, then git pull/npm install. Always show your thinking. Ask for approval on sudo/rm." : "Standard Mode."}`,
          tools: isAgentMode ? [{ functionDeclarations: sshTools }] : undefined
        }
      });

      return {
        text: response.text || "",
        toolCalls: response.candidates?.[0]?.content?.parts
          ?.filter(p => p.functionCall)
          ?.map(p => p.functionCall)
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      return { text: "Connection error with AI service." };
    }
  }
}
