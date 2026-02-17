
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Message, ProjectFile } from "../types";

export type IntelligenceMode = 'fast' | 'balanced' | 'deep';

export interface AgentSettings {
  safetyLevel: 'low' | 'medium' | 'high';
  alwaysAsk: boolean;
  toolPermissions: {
    terminal: boolean;
    files: boolean;
    search: boolean;
    compute: boolean;
  };
}

const getSshTools = (permissions: AgentSettings['toolPermissions']): FunctionDeclaration[] => {
  const tools: FunctionDeclaration[] = [
    {
      name: "connect_ssh",
      description: "Establish a secure connection to a remote server. This MUST be the first operation before any other system tasks.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          host: { type: Type.STRING, description: "IP address or hostname." },
          username: { type: Type.STRING, description: "SSH username." },
          port: { type: Type.NUMBER, description: "SSH port (default 22)." },
          password: { type: Type.STRING, description: "SSH password if required." }
        },
        required: ["host", "username"]
      }
    }
  ];

  if (permissions.terminal) {
    tools.push({
      name: "ssh_exec",
      description: "Run a single shell command on the remote host and capture the output.",
      parameters: {
        type: Type.OBJECT,
        properties: { command: { type: Type.STRING, description: "The full shell command string." } },
        required: ["command"]
      }
    });
  }

  if (permissions.files) {
    tools.push(
      {
        name: "read_file",
        description: "Retrieve the content of a specific file from the remote system.",
        parameters: {
          type: Type.OBJECT,
          properties: { path: { type: Type.STRING, description: "Absolute path to the file." } },
          required: ["path"]
        }
      },
      {
        name: "write_file",
        description: "Create or replace a file on the remote server with new content.",
        parameters: {
          type: Type.OBJECT,
          properties: { 
            path: { type: Type.STRING, description: "Destination path." },
            content: { type: Type.STRING, description: "The data to be written." }
          },
          required: ["path", "content"]
        }
      },
      {
        name: "list_dir",
        description: "Enumerate entries in a remote directory.",
        parameters: {
          type: Type.OBJECT,
          properties: { path: { type: Type.STRING, description: "Path to list (defaults to home)." } }
        }
      }
    );
  }

  tools.push({
    name: "end_agent",
    description: "Finalize the current objective and close the neural bridge.",
    parameters: {
      type: Type.OBJECT,
      properties: { summary: { type: Type.STRING, description: "Concise summary of results." } }
    }
  });

  return tools;
};

export class GeminiService {
  static async chat(
    prompt: string | null, 
    history: Message[], 
    files: ProjectFile[] = [], 
    isAgentMode: boolean = false,
    intelligenceMode: IntelligenceMode = 'balanced',
    agentSettings?: AgentSettings,
    toolResponse?: { id: string, name: string, response: any }
  ): Promise<{ text: string; toolCalls?: any[] }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Use guidelines for model selection
    let modelName = 'gemini-3-flash-preview';
    let thinkingBudget = 0;

    if (intelligenceMode === 'fast') {
      modelName = 'gemini-flash-lite-latest';
    } else if (intelligenceMode === 'deep') {
      modelName = 'gemini-3-pro-preview';
      thinkingBudget = 32768; // Max for Pro
    }

    if (isAgentMode) {
      modelName = 'gemini-3-pro-preview'; // Pro is better for reasoning/tool use
      if (intelligenceMode === 'balanced') {
        thinkingBudget = 16384;
      }
    }

    try {
      const contents: any[] = history.map(m => {
        const parts: any[] = [];
        if (m.content) parts.push({ text: m.content });
        
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
        
        // Handle tool results in history
        if (m.role === 'assistant' && m.toolCalls) {
          // In a real history, tool results usually follow as a separate message or part
          // but for this simplified history, we'll ensure parts are clean
        }

        return {
          role: m.role === 'user' ? 'user' : 'model',
          parts: parts.length > 0 ? parts : [{ text: " " }]
        };
      });

      // Inject the latest tool response if available
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

      // Add current prompt
      if (prompt) {
        const fileParts = files.map(file => ({
          inlineData: {
            data: file.content || '',
            mimeType: file.type || 'text/plain'
          }
        }));
        
        const lastContent = contents[contents.length - 1];
        if (lastContent && lastContent.role === 'user') {
           lastContent.parts.push(...fileParts, { text: prompt });
        } else {
           contents.push({
             role: 'user',
             parts: [...fileParts, { text: prompt }]
           });
        }
      }

      const activeTools = isAgentMode && agentSettings 
        ? getSshTools(agentSettings.toolPermissions)
        : undefined;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents as any,
        config: {
          temperature: 0.7,
          systemInstruction: `SYSTEM IDENTITY: OmniChat Neural Interface [Core_v3].
OPERATIONAL STATUS: [Intelligence: ${intelligenceMode.toUpperCase()}] [Agent: ${isAgentMode ? 'ENABLED' : 'ADVISORY'}].
SAFETY PROTOCOL: ${agentSettings?.safetyLevel.toUpperCase() || 'MEDIUM'} RISK TOLERANCE.
HITL POLICY: ${agentSettings?.alwaysAsk ? 'MANDATORY AUTHENTICATION FOR ALL TOOL EXECUTION.' : 'AUTOMATIC EXECUTION FOR NON-DESTRUCTIVE ACTIONS.'}

CORE DIRECTIVES:
1. Provide concise, expert-level technical responses. 
2. ${isAgentMode ? "AUTONOMOUS MODE: You control infrastructure via SSH tools. Always verify directory contents before reading/writing files. If a command fails, interpret the stderr and adjust your approach. You must ALWAYS use 'connect_ssh' first." : "ADVISORY MODE: You are an expert code architect. Do not attempt system manipulation."}
3. Maintain the professional, high-fidelity 'OmniMatrix' aesthetic. No fluff, only high-density intelligence.`,
          tools: activeTools ? [{ functionDeclarations: activeTools }] : undefined,
          ...(thinkingBudget > 0 ? { thinkingConfig: { thinkingBudget }, maxOutputTokens: thinkingBudget + 4000 } : {})
        }
      });

      return {
        text: response.text || "",
        toolCalls: response.functionCalls
      };
    } catch (error) {
      console.error("Gemini Critical Error:", error);
      return { text: "Neural Link Disrupted. Error code: " + (error instanceof Error ? error.message : "0xDEADBEEF") };
    }
  }
}
