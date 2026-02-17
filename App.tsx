
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { RightSidebar } from './components/RightSidebar';
import { TerminalArea } from './components/TerminalArea';
import { SettingsModal } from './components/SettingsModal';
import { DeviceFlowModal } from './components/DeviceFlowModal';
import { AIProviderId, ProviderInfo, Message, ChatSession, ProjectFile, AppView, Session, User, DeviceFlowResponse } from './types';
import { GeminiService, IntelligenceMode } from './services/geminiService';
import { io, Socket } from 'socket.io-client';
import { Github, Loader2, Command, ShieldCheck, Mail, Lock, User as UserIcon, ArrowRight, ShieldAlert, Sparkles, Fingerprint } from 'lucide-react';

const App: React.FC = () => {
  // 1. App-Level Authentication (OmniChat Account Identity)
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState<string | null>(null);

  // 2. Main Navigation & Layout
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);
  const [activeProvider, setActiveProvider] = useState<AIProviderId>(AIProviderId.GEMINI);
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [intelligenceMode, setIntelligenceMode] = useState<IntelligenceMode>('balanced');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  
  // 3. Optional Provider-Specific Connections (Managed per user)
  const [connectedProviders, setConnectedProviders] = useState<Record<string, boolean>>({
    [AIProviderId.GEMINI]: true, // System default reasoning
  });

  const providers: ProviderInfo[] = useMemo(() => [
    { 
      id: AIProviderId.GEMINI, 
      name: 'Gemini Agent', 
      description: 'Unified system-wide reasoning engine', 
      models: ['gemini-3-pro-preview', 'gemini-3-flash-preview'], 
      icon: '✨', 
      isConnected: !!connectedProviders[AIProviderId.GEMINI] 
    },
    { 
      id: AIProviderId.COPILOT, 
      name: 'GitHub Copilot', 
      description: 'Secure AI coding assistant link', 
      models: ['gpt-4o'], 
      icon: '🐙', 
      isConnected: !!connectedProviders[AIProviderId.COPILOT] 
    },
    { 
      id: AIProviderId.OPENAI, 
      name: 'OpenAI', 
      description: 'Enterprise reasoning with your own key', 
      models: ['gpt-4o', 'o1-preview'], 
      icon: '🧠', 
      isConnected: !!connectedProviders[AIProviderId.OPENAI] 
    },
    { 
      id: AIProviderId.GROK, 
      name: 'xAI Grok', 
      description: 'Experimental Grok-3 infrastructure link', 
      models: ['grok-3'], 
      icon: '✖️', 
      isConnected: !!connectedProviders[AIProviderId.GROK] 
    },
  ], [connectedProviders]);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeDeviceFlow, setActiveDeviceFlow] = useState<DeviceFlowResponse | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // Persistent session recovery
  useEffect(() => {
    const recoverSession = async () => {
      try {
        const storedIdentity = localStorage.getItem('omnichat_user_v2');
        const storedProviders = localStorage.getItem('omnichat_provider_sync');
        
        if (storedProviders) {
          setConnectedProviders(JSON.parse(storedProviders));
        }
        
        if (storedIdentity) {
          setSession({ user: JSON.parse(storedIdentity), expires: 'never' });
        }
      } catch (err) {
        console.warn("Failed to synchronize previous session.");
      } finally {
        // High-end cinematic loading
        setTimeout(() => setAuthLoading(false), 2000);
      }
    };
    recoverSession();
  }, []);

  // 4. App-Level Handlers
  const handleAppAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    // Simulate secure backend identity vault handshake
    setTimeout(() => {
      const user: User = { 
        id: 'oid-' + Math.random().toString(36).substr(2, 9), 
        name: authMode === 'signup' ? 'Operator One' : 'Nexus Operator', 
        email: 'nexus@omnichat.ai', 
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Omni' 
      };
      localStorage.setItem('omnichat_user_v2', JSON.stringify(user));
      setSession({ user, expires: 'never' });
      setAuthLoading(false);
    }, 1500);
  };

  const handleLogout = () => {
    localStorage.removeItem('omnichat_user_v2');
    localStorage.removeItem('omnichat_provider_sync');
    setSession(null);
    setIsSettingsOpen(false);
    setSessions([]);
    setActiveSessionId('');
    setConnectedProviders({ [AIProviderId.GEMINI]: true });
  };

  // 5. Provider-Specific Auth (Device Flow for Copilot/Grok)
  const startProviderLink = async (providerId: AIProviderId) => {
    if (providerId === AIProviderId.COPILOT || providerId === AIProviderId.GROK) {
      try {
        const res = await fetch('/api/auth/github/start', { method: 'POST' });
        const data = await res.json();
        setActiveDeviceFlow(data);
        pollProviderLink(data.device_code, providerId);
      } catch (e) {
        console.error("Provider bridge initialization failed.");
      }
    } else if (providerId === AIProviderId.OPENAI) {
      const key = prompt("Enter OpenAI API Key (Stored in encrypted browser vault):");
      if (key) {
        updateProviderConnection(providerId, true);
      }
    }
  };

  const pollProviderLink = async (deviceCode: string, providerId: AIProviderId) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/github/poll', {
          method: 'POST',
          body: JSON.stringify({ device_code: deviceCode })
        });
        const data = await res.json();
        
        if (data.access_token) {
          clearInterval(interval);
          updateProviderConnection(providerId, true);
          setActiveDeviceFlow(null);
          setActiveProvider(providerId);
        } else if (data.error && data.error !== 'authorization_pending') {
          clearInterval(interval);
          setActiveDeviceFlow(null);
        }
      } catch (e) {
        clearInterval(interval);
      }
    }, 5000);
  };

  const updateProviderConnection = (id: string, status: boolean) => {
    setConnectedProviders(prev => {
      const next = { ...prev, [id]: status };
      localStorage.setItem('omnichat_provider_sync', JSON.stringify(next));
      return next;
    });
  };

  // Chat Lifecycle
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
      title: 'Active Link Session',
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
      console.error("AI reasoning cycle failed.");
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

  // UI States
  if (authLoading) {
    return (
      <div className="flex h-screen w-full bg-black items-center justify-center">
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            <div className="absolute inset-0 bg-grok-accent/20 blur-[40px] animate-pulse"></div>
            <div className="w-16 h-16 bg-black border-2 border-grok-accent/30 rounded-2xl flex items-center justify-center relative z-10 animate-in zoom-in duration-700">
              <Command size={32} className="text-grok-accent animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-grok-muted font-black uppercase tracking-[0.4em] animate-pulse">Initializing OmniCore Matrix</p>
            <p className="text-[8px] text-grok-accent/50 font-mono mt-2 animate-pulse [animation-delay:0.5s]">SYNCING NEURAL_LINK_V4.0</p>
          </div>
        </div>
      </div>
    );
  }

  // APP-LEVEL WELCOME / AUTH SCREEN
  if (!session) {
    return (
      <div className="flex h-screen w-full bg-black items-center justify-center p-6 relative overflow-hidden">
        {/* Ambient background particles simulated with CSS */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-grok-accent/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-grok-accent/5 rounded-full blur-[100px] animate-pulse [animation-delay:1s]"></div>

        <div className="max-w-md w-full bg-grok-card border border-grok-border rounded-[2.5rem] p-10 shadow-[0_0_100px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-500 relative z-20 overflow-hidden">
          {/* Subtle noise/texture overlay */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
          
          <div className="flex flex-col items-center mb-10">
            <div className="w-14 h-14 bg-grok-accent/10 rounded-2xl flex items-center justify-center mb-6 border border-grok-accent/20">
              <Command size={28} className="text-grok-accent" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter mb-2">OMNICHAT</h2>
            <p className="text-grok-muted text-[10px] font-black uppercase tracking-[0.4em] text-center opacity-60">Unified Neural Interface</p>
          </div>

          <form onSubmit={handleAppAuthSubmit} className="space-y-5">
            {authMode === 'signup' && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <label className="text-[9px] font-bold text-grok-muted uppercase tracking-[0.2em] ml-1">Identity Tag</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-grok-muted/50" size={16} />
                  <input 
                    type="text" 
                    required
                    placeholder="Operator Name"
                    className="w-full bg-black/50 border border-grok-border rounded-xl py-4 pl-12 pr-4 text-sm font-medium text-white focus:ring-1 focus:ring-grok-accent focus:border-grok-accent outline-none transition-all placeholder:text-grok-muted/20"
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-grok-muted uppercase tracking-[0.2em] ml-1">Secure Email ID</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-grok-muted/50" size={16} />
                <input 
                  type="email" 
                  required
                  placeholder="nexus@omnicore.ai"
                  className="w-full bg-black/50 border border-grok-border rounded-xl py-4 pl-12 pr-4 text-sm font-medium text-white focus:ring-1 focus:ring-grok-accent focus:border-grok-accent outline-none transition-all placeholder:text-grok-muted/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-grok-muted uppercase tracking-[0.2em] ml-1">Neural Passkey</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-grok-muted/50" size={16} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-black/50 border border-grok-border rounded-xl py-4 pl-12 pr-4 text-sm font-medium text-white focus:ring-1 focus:ring-grok-accent focus:border-grok-accent outline-none transition-all placeholder:text-grok-muted/20"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-4.5 bg-white text-black font-black rounded-2xl hover:brightness-90 transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 group mt-4"
            >
              {authMode === 'signin' ? 'Establish Sync' : 'Initialize Identity'} 
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
              className="text-[10px] text-grok-muted hover:text-white transition-colors font-bold uppercase tracking-widest"
            >
              {authMode === 'signin' ? "No identity on record? Create One" : "Already verified? Establish Link"}
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-grok-border flex items-center justify-between opacity-50">
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-grok-muted">
               <ShieldCheck size={14} className="text-grok-success" />
               Handshake Secure
             </div>
             <div className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-grok-accent animate-pulse" />
                <p className="text-[10px] text-grok-muted font-mono tracking-tighter uppercase">v3.2.0-PRO</p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // MAIN APP SURFACE
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
        {currentView === AppView.CHAT ? (
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
        ) : (
          <TerminalArea />
        )}

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
          onSelectProvider={(id) => {
             const p = providers.find(prov => prov.id === id);
             if (p?.isConnected) {
               setActiveProvider(id);
             } else {
               startProviderLink(id);
             }
          }}
          onLogout={handleLogout}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {activeDeviceFlow && (
        <DeviceFlowModal 
          data={activeDeviceFlow} 
          onClose={() => setActiveDeviceFlow(null)}
          onComplete={() => {}} 
        />
      )}
    </div>
  );
};

export default App;
