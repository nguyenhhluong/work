
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { RightSidebar } from './components/RightSidebar';
import { TerminalArea } from './components/TerminalArea';
import { DeviceFlowModal } from './components/DeviceFlowModal';
import { SettingsModal } from './components/SettingsModal';
import { AIProviderId, ProviderInfo, Message, DeviceFlowResponse, ChatSession, ProjectFile, AppView, ToolCall } from './types';
import { GeminiService } from './services/geminiService';
import { io, Socket } from 'socket.io-client';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);
  const [activeProvider, setActiveProvider] = useState<AIProviderId>(AIProviderId.GEMINI);
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [providers, setProviders] = useState<ProviderInfo[]>([
    { 
      id: AIProviderId.GEMINI, 
      name: 'Gemini Agent', 
      description: 'Autonomous reasoning & tool use', 
      models: ['gemini-3-pro-preview'], 
      icon: '✨', 
      isConnected: true 
    },
    { 
      id: AIProviderId.COPILOT, 
      name: 'GitHub Copilot', 
      description: 'AI developer tool with GitHub flow', 
      models: ['gpt-4o', 'claude-3.5-sonnet'], 
      icon: '🐙', 
      isConnected: false 
    },
    { 
      id: AIProviderId.OPENAI, 
      name: 'OpenAI', 
      description: 'GPT-4o & Reasoning models', 
      models: ['gpt-4o', 'o1-preview'], 
      icon: '🧠', 
      isConnected: false 
    },
    { 
      id: AIProviderId.GROK, 
      name: 'xAI Grok', 
      description: 'Sassy intelligence via GitHub Models', 
      models: ['grok-3', 'grok-4'], 
      icon: '✖️', 
      isConnected: false 
    },
  ]);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentDeviceFlow, setCurrentDeviceFlow] = useState<DeviceFlowResponse | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Backend Socket for Tools
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io('/ssh', { path: '/socket.io', transports: ['websocket'] });
    if (sessions.length === 0) handleNewChat();
    return () => { socketRef.current?.disconnect(); };
  }, []);

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      providerId: activeProvider,
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
      isAgentMode
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setCurrentView(AppView.CHAT);
  };

  const activeSession = useMemo(() => 
    sessions.find(s => s.id === activeSessionId) || sessions[0], 
  [sessions, activeSessionId]);

  const runAgentTurn = async (prompt: string | null, history: Message[], toolResponse?: any) => {
    setIsTyping(true);
    try {
      const response = await GeminiService.chat(prompt, history, projectFiles, isAgentMode, toolResponse);
      
      const assistantMessage: Message = {
        id: (Date.now() + Math.random()).toString(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        toolCalls: response.toolCalls?.map((tc: any) => ({
          id: tc.id || Math.random().toString(36).substr(2, 9),
          name: tc.name,
          args: tc.args,
          status: 'pending'
        }))
      };

      setSessions(prev => prev.map(s => 
        s.id === activeSessionId ? { ...s, messages: [...s.messages, assistantMessage] } : s
      ));

      // Automatic tool execution for non-destructive read/list tasks if desired,
      // but specification says HITL for all first execs or destructive.
      // We'll wait for manual approval as per spec.
    } catch (error) {
      console.error("Agent Loop Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!activeSessionId) return;
    const newMessage: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    
    const updatedHistory = [...(activeSession?.messages || []), newMessage];
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: updatedHistory } : s));

    await runAgentTurn(text, activeSession?.messages || []);
  };

  const handleApproveTool = async (messageId: string, toolCallId: string) => {
    // 1. Mark as executing
    setSessions(prev => prev.map(s => ({
      ...s,
      messages: s.messages.map(m => m.id === messageId ? {
        ...m,
        toolCalls: m.toolCalls?.map(tc => tc.id === toolCallId ? { ...tc, status: 'executing' } : tc)
      } : m)
    })));

    const currentMessage = activeSession.messages.find(m => m.id === messageId);
    const toolCall = currentMessage?.toolCalls?.find(tc => tc.id === toolCallId);
    if (!toolCall || !socketRef.current) return;

    // 2. Execute via Backend
    const executeOnBackend = (): Promise<any> => {
      return new Promise((resolve) => {
        const socket = socketRef.current!;
        switch (toolCall.name) {
          case 'connect_ssh':
            socket.emit('agent-ssh-connect', toolCall.args, resolve);
            break;
          case 'ssh_exec':
            socket.emit('agent-ssh-exec', { command: toolCall.args.command }, resolve);
            break;
          case 'read_file':
            socket.emit('agent-ssh-read', { path: toolCall.args.path }, resolve);
            break;
          case 'write_file':
            socket.emit('agent-ssh-write', { path: toolCall.args.path, content: toolCall.args.content }, resolve);
            break;
          default:
            resolve({ error: 'Unknown tool' });
        }
      });
    };

    const result = await executeOnBackend();
    const resultStr = result.error ? `Error: ${result.error}` : (result.output || result.content || result.message || 'Success');

    setSessions(prev => prev.map(s => ({
      ...s,
      messages: s.messages.map(m => m.id === messageId ? {
        ...m,
        toolCalls: m.toolCalls?.map(tc => tc.id === toolCallId ? { ...tc, status: 'completed', result: resultStr } : tc)
      } : m)
    })));

    // 3. Continue the turn: feed result back to Gemini
    await runAgentTurn(null, activeSession.messages, {
      id: toolCallId,
      name: toolCall.name,
      response: result
    });
  };

  const handleRejectTool = (messageId: string, toolCallId: string) => {
    setSessions(prev => prev.map(s => ({
      ...s,
      messages: s.messages.map(m => m.id === messageId ? {
        ...m,
        toolCalls: m.toolCalls?.map(tc => tc.id === toolCallId ? { ...tc, status: 'rejected' } : tc)
      } : m)
    })));
  };

  // Added handleFileUpload to resolve compilation error and enable project file uploads
  const handleFileUpload = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Extract base64 payload from data URL
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      
      const newFile: ProjectFile = {
        id: Math.random().toString(36).substring(2, 11),
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type || 'text/plain',
        content: base64
      };
      setProjectFiles(prev => [...prev, newFile]);
    };
    reader.readAsDataURL(file);
  }, []);

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden text-slate-100">
      <Sidebar 
        activeProviderId={activeProvider}
        currentView={currentView}
        isAgentMode={isAgentMode}
        onToggleAgentMode={() => setIsAgentMode(!isAgentMode)}
        onSelectView={setCurrentView}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onNewChat={handleNewChat}
      />
      
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
        {currentView === AppView.CHAT ? (
          <ChatArea 
            provider={providers.find(p => p.id === activeProvider)!}
            messages={activeSession?.messages || []}
            onSendMessage={handleSendMessage}
            isTyping={isTyping}
            isAgentMode={isAgentMode}
            onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            isRightSidebarOpen={isRightSidebarOpen}
            onApproveTool={handleApproveTool}
            onRejectTool={handleRejectTool}
          />
        ) : (
          <TerminalArea />
        )}
      </main>

      {isRightSidebarOpen && currentView === AppView.CHAT && (
        <RightSidebar 
          sessions={sessions}
          activeSessionId={activeSessionId}
          projectFiles={projectFiles}
          onSelectSession={setActiveSessionId}
          onUploadFile={handleFileUpload}
          onRemoveFile={(id) => setProjectFiles(prev => prev.filter(f => f.id !== id))}
          onClose={() => setIsRightSidebarOpen(false)}
        />
      )}

      {isModalOpen && currentDeviceFlow && (
        <DeviceFlowModal data={currentDeviceFlow} onClose={() => setIsModalOpen(false)} onComplete={() => setIsModalOpen(false)} />
      )}

      {isSettingsOpen && (
        <SettingsModal 
          providers={providers}
          activeProviderId={activeProvider}
          onSelectProvider={setActiveProvider}
          onLogin={(id) => {
            setCurrentDeviceFlow({ user_code: 'GH-X-AGENT', verification_uri: 'https://github.com/login/device', device_code: 'x', expires_in: 900, interval: 5 });
            setIsModalOpen(true);
          }}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
