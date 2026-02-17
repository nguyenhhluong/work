
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { RightSidebar } from './components/RightSidebar';
import { TerminalArea } from './components/TerminalArea';
import { DeviceFlowModal } from './components/DeviceFlowModal';
import { SettingsModal } from './components/SettingsModal';
import { AIProviderId, ProviderInfo, Message, DeviceFlowResponse, ChatSession, ProjectFile, AppView, Session } from './types';
import { GeminiService, IntelligenceMode } from './services/geminiService';
import { io, Socket } from 'socket.io-client';
import { Github, Loader2, Command, ShieldCheck, ArrowRight } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);
  const [activeProvider, setActiveProvider] = useState<AIProviderId>(AIProviderId.GEMINI);
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [intelligenceMode, setIntelligenceMode] = useState<IntelligenceMode>('balanced');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  
  const [providers] = useState<ProviderInfo[]>([
    { 
      id: AIProviderId.GEMINI, 
      name: 'Gemini Agent', 
      description: 'Autonomous reasoning & tool use', 
      models: ['gemini-3-pro-preview', 'gemini-3-flash-preview', 'gemini-2.5-flash-lite-latest'], 
      icon: '✨', 
      isConnected: true 
    },
    { id: AIProviderId.COPILOT, name: 'GitHub Copilot', description: 'AI developer tool', models: ['gpt-4o'], icon: '🐙', isConnected: true },
    { id: AIProviderId.OPENAI, name: 'OpenAI', description: 'Reasoning models', models: ['gpt-4o', 'o1-preview'], icon: '🧠', isConnected: true },
    { id: AIProviderId.GROK, name: 'xAI Grok', description: 'Sassy intelligence', models: ['grok-3'], icon: '✖️', isConnected: true },
  ]);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  // Simulated real auth check on mount
  useEffect(() => {
    const checkSession = async () => {
      // In a real NextAuth scenario, we would call fetch('/api/auth/session')
      // For this implementation, we simulate the fetch result
      setTimeout(() => {
        const mockUser = localStorage.getItem('omni_user');
        if (mockUser) {
          setSession({ user: JSON.parse(mockUser), expires: 'never' });
        }
        setAuthLoading(false);
      }, 1200);
    };

    checkSession();
  }, []);

  const handleLogin = () => {
    setAuthLoading(true);
    // Simulate GitHub OAuth Redirect & Success
    setTimeout(() => {
      const user = { id: '1', name: 'Grok Operator', email: 'operator@x.ai', image: 'https://github.com/github.png' };
      localStorage.setItem('omni_user', JSON.stringify(user));
      setSession({ user, expires: 'never' });
      setAuthLoading(false);
    }, 1500);
  };

  const handleLogout = () => {
    localStorage.removeItem('omni_user');
    setSession(null);
    setIsSettingsOpen(false);
  };

  useEffect(() => {
    if (session) {
      socketRef.current = io('/ssh', { path: '/socket.io', transports: ['websocket'] });
      if (sessions.length === 0) handleNewChat();
    }
    return () => { socketRef.current?.disconnect(); };
  }, [session]);

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
      const response = await GeminiService.chat(
        prompt, 
        history, 
        projectFiles, 
        isAgentMode, 
        intelligenceMode,
        toolResponse
      );
      
      const assistantMessage: Message = {
        id: (Date.now() + Math.random()).toString(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        toolCalls: response.toolCalls?.map((tc: any) => ({
          id: tc.id || Math.random().toString(36).substr(2, 9),
          name: tc.name,
          args: tc.args,
          status: 'pending' as const
        }))
      };

      setSessions(prev => prev.map(s => 
        s.id === activeSessionId ? { ...s, messages: [...s.messages, assistantMessage] } : s
      ));
    } catch (error) {
      console.error("Agent Turn Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!activeSessionId) return;
    const newMessage: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    const updatedHistory = [...(activeSession?.messages || []), newMessage];
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: updatedHistory } : s));
    await runAgentTurn(text, updatedHistory);
  };

  const handleApproveTool = async (messageId: string, toolCallId: string) => {
    const currentMessage = activeSession.messages.find(m => m.id === messageId);
    const toolCall = currentMessage?.toolCalls?.find(tc => tc.id === toolCallId);
    if (!toolCall || !socketRef.current) return;

    setSessions(prev => prev.map(s => ({
      ...s,
      messages: s.messages.map(m => m.id === messageId ? {
        ...m,
        toolCalls: m.toolCalls?.map(tc => tc.id === toolCallId ? { ...tc, status: 'executing' as const } : tc)
      } : m)
    })));

    const executeOnBackend = (): Promise<any> => {
      return new Promise((resolve) => {
        const socket = socketRef.current!;
        switch (toolCall.name) {
          case 'connect_ssh': socket.emit('agent-ssh-connect', toolCall.args, resolve); break;
          case 'ssh_exec': socket.emit('agent-ssh-exec', { command: toolCall.args.command }, resolve); break;
          case 'read_file': socket.emit('agent-ssh-read', { path: toolCall.args.path }, resolve); break;
          case 'write_file': socket.emit('agent-ssh-write', { path: toolCall.args.path, content: toolCall.args.content }, resolve); break;
          case 'end_agent': socket.emit('agent-ssh-disconnect', resolve); break;
          default: resolve({ error: 'Unknown tool' });
        }
      });
    };

    const result = await executeOnBackend();
    const resultStr = result.error ? `Error: ${result.error}` : (result.output || result.content || result.message || 'Success');

    setSessions(prev => prev.map(s => ({
      ...s,
      messages: s.messages.map(m => m.id === messageId ? {
        ...m,
        toolCalls: m.toolCalls?.map(tc => tc.id === toolCallId ? { ...tc, status: 'completed' as const, result: resultStr } : tc)
      } : m)
    })));

    if (toolCall.name !== 'end_agent') {
      const updatedMessages = activeSession.messages.map(m => m.id === messageId ? {
        ...m,
        toolCalls: m.toolCalls?.map(tc => tc.id === toolCallId ? { ...tc, status: 'completed' as const, result: resultStr } : tc)
      } : m);
      await runAgentTurn(null, updatedMessages, { id: toolCallId, name: toolCall.name, response: result });
    }
  };

  const handleRejectTool = (messageId: string, toolCallId: string) => {
    setSessions(prev => prev.map(s => ({
      ...s,
      messages: s.messages.map(m => m.id === messageId ? {
        ...m,
        toolCalls: m.toolCalls?.map(tc => tc.id === toolCallId ? { ...tc, status: 'rejected' as const } : tc)
      } : m)
    })));
  };

  const handleFileUpload = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
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

  if (authLoading) {
    return (
      <div className="flex h-screen w-full bg-black items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 bg-grok-accent rounded-xl flex items-center justify-center animate-pulse">
            <Command size={24} className="text-white" />
          </div>
          <Loader2 className="animate-spin text-grok-muted" size={20} />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen w-full bg-black items-center justify-center p-6">
        <div className="max-w-md w-full bg-grok-card border border-grok-border rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-grok-accent/10 rounded-2xl flex items-center justify-center mb-8 border border-grok-accent/20">
            <Command size={32} className="text-grok-accent" />
          </div>
          <h2 className="text-3xl font-black text-white mb-3 tracking-tighter">GROK-2026 Protocol</h2>
          <p className="text-grok-muted text-sm leading-relaxed mb-10 font-medium">
            Authentication required to establish a neural link with the OmniCore autonomous grid. Use your verified credentials to proceed.
          </p>
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-4 py-4 bg-white text-black font-black rounded-2xl hover:brightness-90 transition-all shadow-xl active:scale-[0.98]"
          >
            <Github size={20} /> Sign in with GitHub
          </button>
          <div className="mt-10 pt-8 border-t border-grok-border flex items-center justify-between opacity-50">
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-grok-muted">
               <ShieldCheck size={14} className="text-grok-success" />
               E2E Secure
             </div>
             <p className="text-[10px] text-grok-muted font-mono tracking-tighter uppercase">OmniCore v3.2</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-grok-bg overflow-hidden text-grok-foreground">
      <Sidebar 
        currentView={currentView}
        isAgentMode={isAgentMode}
        onToggleAgentMode={() => setIsAgentMode(!isAgentMode)}
        onSelectView={setCurrentView}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onNewChat={handleNewChat}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={setIsSidebarCollapsed}
        user={session.user}
      />
      
      <main className="flex-1 flex flex-col min-w-0 bg-grok-bg relative z-0">
        <ChatArea 
          provider={providers.find(p => p.id === activeProvider)!}
          messages={activeSession?.messages || []}
          onSendMessage={handleSendMessage}
          isTyping={isTyping}
          isAgentMode={isAgentMode}
          intelligenceMode={intelligenceMode}
          onSetIntelligenceMode={setIntelligenceMode}
          onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
          isRightSidebarOpen={isRightSidebarOpen}
          onApproveTool={handleApproveTool}
          onRejectTool={handleRejectTool}
        />

        {(!isSidebarCollapsed || isRightSidebarOpen) && (
          <div 
            className="fixed inset-0 bg-black/0 z-[5] lg:hidden"
            onClick={() => {
                setIsSidebarCollapsed(true);
                setIsRightSidebarOpen(false);
            }}
          />
        )}
      </main>

      <RightSidebar 
        sessions={sessions}
        activeSessionId={activeSessionId}
        projectFiles={projectFiles}
        onSelectSession={setActiveSessionId}
        onUploadFile={handleFileUpload}
        onRemoveFile={(id) => setProjectFiles(prev => prev.filter(f => f.id !== id))}
        isOpen={isRightSidebarOpen}
        onToggle={setIsRightSidebarOpen}
      />

      {isSettingsOpen && (
        <SettingsModal 
          providers={providers}
          activeProviderId={activeProvider}
          onSelectProvider={setActiveProvider}
          onLogout={handleLogout}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
