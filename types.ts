
export enum AIProviderId {
  GEMINI = 'gemini',
  COPILOT = 'copilot',
  OPENAI = 'openai',
  GROK = 'grok'
}

export enum AppView {
  CHAT = 'chat',
  TERMINAL = 'terminal',
  AGENT = 'agent'
}

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface Session {
  user: User;
  expires: string;
}

export interface ToolCall {
  id: string;
  name: string;
  args: any;
  status: 'pending' | 'approved' | 'rejected' | 'executing' | 'completed' | 'error';
  result?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  thought?: string;
}

export interface ChatSession {
  id: string;
  providerId: AIProviderId;
  title: string;
  messages: Message[];
  createdAt: Date;
  isAgentMode?: boolean;
}

export interface ProjectFile {
  id: string;
  name: string;
  size: string;
  type: string;
  content?: string; // Base64 content for Gemini
}

export interface ProviderInfo {
  id: AIProviderId;
  name: string;
  description: string;
  models: string[];
  icon: string;
  isConnected: boolean;
}

export interface DeviceFlowResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export interface SSHConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
}
