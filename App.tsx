
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { AgentArea } from './components/AgentArea';
import { RightSidebar } from './components/RightSidebar';
import { TerminalArea } from './components/TerminalArea';
import { SettingsModal } from './components/SettingsModal';
import { DeviceFlowModal } from './components/DeviceFlowModal';
import { AIProviderId, ProviderInfo, Message, ChatSession, ProjectFile, AppView, Session, User, DeviceFlowResponse } from './types';
import { GeminiService, IntelligenceMode } from './services/geminiService';
import { io, Socket } from 'socket.io-client';
import { Command, Mail, Lock, User as UserIcon, ArrowRight, ShieldAlert, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState<string | null>(null);

  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);
  const [activeProvider, setActiveProvider] = useState<AIProviderId>(AIProviderId.GEMINI);
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [intelligenceMode, setIntelligenceMode] = useState<IntelligenceMode>('balanced');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Agent Specific Config
  const [agentSafetyLevel, setAgentSafetyLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [agentAlwaysAsk, setAgentAlwaysAsk] = useState(true);
  
  const [connectedProviders, setConnectedProviders] = useState<Record<string, boolean>>({
    [AIProviderId.GEMINI]: true,
  });

  const providers: ProviderInfo[] = useMemo(() => [
    { id: AIProviderId.GEMINI, name: 'OmniCore (Gemini)', description: 'The primary system reasoning backbone.', models: ['gemini-3-pro-preview', 'gemini-3-flash-preview'], icon: '✨', isConnected: !!connectedProviders[AIProviderId.GEMINI] },
    { id: AIProviderId.COPILOT, name: 'GitHub Copilot', description: 'Connect to GitHub for coding intelligence.', models: ['gpt-4o'], icon: '🐙', isConnected: !!connectedProviders[AIProviderId.COPILOT] },
    { id: AIProviderId.OPENAI, name: 'OpenAI GPT', description: 'Legacy reasoning with enterprise keys.', models: ['gpt-4o', 'o1-preview'], icon: '🧠', isConnected: !!connectedProviders[AIProviderId.OPENAI] },
    { id: AIProviderId.GROK, name: 'xAI Grok', description: 'Direct Grok-3 infrastructure linkage.', models: ['grok-3'], icon: '✖️', isConnected: !!connectedProviders[AIProviderId.GROK] },
  ], [connectedProviders]);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeDeviceFlow, setActiveDeviceFlow] = useState<DeviceFlowResponse | null>(null);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const recoverSession = async () => {
      try {
        const storedIdentity = localStorage.getItem('omnichat_user_v2');
        const storedProviders = localStorage.getItem('omnichat_provider_sync');
        if (storedProviders) setConnectedProviders(JSON.parse(storedProviders));
        if (storedIdentity) {
          const user = JSON.parse(storedIdentity);
          setSession({ user, expires: 'never' });
        }
      } catch (err) {
        console.warn("Security Handshake Refused.");
      } finally {
        setTimeout(() => setAuthLoading(false), 1500);
      }
    };
    recoverSession();
  }, []);

  const handleAppAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setTimeout(() => {
      const user: User = { 
        id: 'oid-' + Math.random().toString(36).substr(2, 9), 
        name: authMode === 'signup' ? 'New Operator' : 'Nexus Operator', 
        email: 'operator@omnicore.ai', 
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}` 
      };
      localStorage.setItem('omnichat_user_v2', JSON.stringify(user));
      setSession({ user, expires: 'never' });
      setAuthLoading(false);
    }, 1000);
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

  const startProviderLink = async (providerId: AIProviderId) => {
    if (providerId === AIProviderId.COPILOT || providerId === AIProviderId.GROK) {
      try {
        const res = await fetch('/api/auth/github/start', { method: 'POST' });
        const data = await res.json();
        setActiveDeviceFlow(data);
        pollProviderLink(data.device_code, providerId);
      } catch (e) {
        setAuthError("Handshake with external portal failed.");
      }
    } else if (providerId === AIProviderId.OPENAI) {
      const key = prompt("Enter OpenAI API Key:");
      if (key) updateProviderConnection(providerId, true);
    }
  };

  const pollProviderLink = async (deviceCode: string, providerId: AIProviderId) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/github/poll', { method: 'POST', body: JSON.stringify({ device_code: deviceCode }) });
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
      } catch (e) { clearInterval(interval); }
    }, 5000);
  };

  const updateProviderConnection = (id: string, status: boolean) => {
    setConnectedProviders(prev => {
      const next = { ...prev, [id]: status };
      localStorage.setItem('omnichat_provider_sync', JSON.stringify(next));
      return next;
    });
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
      title: currentView === AppView.AGENT ? 'Agent Workflow Session' : 'Active Link Session',
      messages: [],
      createdAt: new Date(),
      isAgentMode: currentView === AppView.AGENT
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setIsMobileMenuOpen(false);
    setIsRightSidebarOpen(false);
  };

  const activeSession = useMemo(() => sessions.find(s => s.id === activeSessionId) || sessions[0], [sessions, activeSessionId]);

  const runAgentTurn = async (prompt: string | null, history: Message[], toolResponse?: any) => {
    setIsTyping(true);
    try {
      const isAgent = currentView === AppView.AGENT || isAgentMode;
      const response = await GeminiService.chat(prompt, history, projectFiles, isAgent, intelligenceMode, toolResponse);
      const assistantMessage: Message = {
        id: (Date.now() + Math.random()).toString(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        thought: response.text.includes('thinking') ? "Analyzing current link infrastructure and optimizing for remote execution..." : undefined,
        toolCalls: response.toolCalls?.map((tc: any) => ({
          id: tc.id || Math.random().toString(36).substr(2, 9),
          name: tc.name,
          args: tc.args,
          status: 'pending' as const
        }))
      };
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, assistantMessage] } : s));
    } catch (error) {
      console.error("Neural Reasoning Fault:", error);
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
          default: resolve({ error: 'Tool not supported.' });
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
      const newFile: ProjectFile = { id: Math.random().toString(36).substring(2, 11), name: file.name, size: `${(file.size / 1024).toFixed(1)} KB`, type: file.type || 'text/plain', content: base64 };
      setProjectFiles(prev => [...prev, newFile]);
    };
    reader.readAsDataURL(file);
  }, []);

  if (authLoading) {
    return (
      <div className="flex h-screen w-full bg-black items-center justify-center">
        <div className="flex flex-col items-center gap-8 px-6 text-center animate-pulse">
          <div className="relative">
            <div className="absolute inset-0 bg-grok-accent/30 blur-[60px]"></div>
            <div className="w-16 h-16 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center relative z-10">
              <Command size={32} className="text-grok-accent" />
            </div>
          </div>
          <div>
            <p className="text-[10px] text-grok-muted font-black uppercase tracking-[0.4em]">Initializing OmniCore Matrix</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen w-full bg-black items-center justify-center p-4 md:p-6 relative overflow-hidden">
        {/* Animated decorative shapes */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-grok-accent/5 rounded-full blur-[120px] animate-float"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[#1d9bf0]/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: '3s' }}></div>

        <div className="max-w-md w-full glass-panel rounded-[2.5rem] p-8 md:p-12 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative z-20 overflow-hidden animate-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-[#1d9bf0] rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(29,155,240,0.4)] transition-transform hover:scale-105 duration-500">
              <Command size={32} className="text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2">OMNICHAT</h2>
            <p className="text-[#a3a3a3] text-[11px] font-bold tracking-[0.2em] uppercase opacity-80">Establish Neural Handshake</p>
          </div>

          <form onSubmit={handleAppAuthSubmit} className="space-y-6">
            {authMode === 'signup' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#71717a] uppercase tracking-wider ml-1">Identity Tag</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717a] group-focus-within:text-[#1d9bf0] transition-colors" size={16} />
                  <input type="text" required placeholder="Full Name" className="w-full bg-black/40 border border-[#27272a] rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-white focus:ring-1 focus:ring-[#1d9bf0] focus:border-[#1d9bf0] outline-none transition-all placeholder:text-[#71717a]/40" />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#71717a] uppercase tracking-wider ml-1">Nexus Node</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717a] group-focus-within:text-[#1d9bf0] transition-colors" size={16} />
                <input type="email" required placeholder="nexus@omnicore.ai" className="w-full bg-black/40 border border-[#27272a] rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-white focus:ring-1 focus:ring-[#1d9bf0] focus:border-[#1d9bf0] outline-none transition-all placeholder:text-[#71717a]/40" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#71717a] uppercase tracking-wider ml-1">Secure Passkey</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717a] group-focus-within:text-[#1d9bf0] transition-colors" size={16} />
                <input type="password" required placeholder="••••••••••••" className="w-full bg-black/40 border border-[#27272a] rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-white focus:ring-1 focus:ring-[#1d9bf0] focus:border-[#1d9bf0] outline-none transition-all placeholder:text-[#71717a]/40" />
              </div>
            </div>

            {authError && <div className="p-3 bg-grok-error/10 border border-grok-error/20 rounded-xl text-grok-error text-[11px] font-bold text-center">{authError}</div>}

            <button type="submit" className="w-full py-4.5 bg-[#1d9bf0] text-white font-bold rounded-full hover:bg-[#1a8cd8] hover:shadow-[0_0_20px_rgba(29,155,240,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 group mt-4 text-[15px]">
              {authMode === 'signin' ? 'Verify Identity' : 'Initialize Profile'} 
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-10 text-center">
            <button onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')} className="text-[11px] text-[#71717a] font-bold uppercase tracking-widest hover:text-white transition-colors">
              {authMode === 'signin' ? "No Operator ID? Create One" : "Already Verified? Sign In"}
            </button>
          </div>
          
          <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between opacity-50">
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#71717a]">
               <ShieldCheck size={14} className="text-grok-success" /> Handshake Secure
             </div>
             <p className="text-[10px] text-[#71717a] font-mono tracking-tighter uppercase">MATRIX v3.2-PRO</p>
          </div>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch(currentView) {
      case AppView.CHAT:
        return (
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
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />
        );
      case AppView.AGENT:
        return (
          <AgentArea 
            messages={activeSession?.messages || []}
            onSendMessage={handleSendMessage}
            isTyping={isTyping}
            intelligenceMode={intelligenceMode}
            onSetIntelligenceMode={setIntelligenceMode}
            onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            isRightSidebarOpen={isRightSidebarOpen}
            onApproveTool={handleApproveTool}
            onRejectTool={handleRejectTool}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />
        );
      case AppView.TERMINAL:
        return <TerminalArea onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-full bg-transparent overflow-hidden text-grok-foreground flex-col md:flex-row">
      <Sidebar 
        currentView={currentView}
        isAgentMode={isAgentMode}
        onToggleAgentMode={() => {
           setIsAgentMode(!isAgentMode);
           if (currentView !== AppView.AGENT) setCurrentView(AppView.AGENT);
        }}
        onSelectView={(v) => { setCurrentView(v); setIsMobileMenuOpen(false); }}
        onOpenSettings={() => { setIsSettingsOpen(true); setIsMobileMenuOpen(false); }}
        onNewChat={handleNewChat}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={setIsSidebarCollapsed}
        user={session.user}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />
      
      <main className="flex-1 flex flex-col min-w-0 bg-transparent relative z-0 h-full overflow-hidden">
        {renderView()}
      </main>

      <RightSidebar 
        sessions={sessions}
        activeSessionId={activeSessionId}
        projectFiles={projectFiles}
        onSelectSession={(id) => { setActiveSessionId(id); setIsRightSidebarOpen(false); }}
        onUploadFile={handleFileUpload}
        onRemoveFile={(id) => setProjectFiles(prev => prev.filter(f => f.id !== id))}
        isOpen={isRightSidebarOpen}
        onToggle={setIsRightSidebarOpen}
      />

      {isSettingsOpen && (
        <SettingsModal 
          providers={providers}
          activeProviderId={activeProvider}
          agentSafetyLevel={agentSafetyLevel}
          onSetAgentSafetyLevel={setAgentSafetyLevel}
          agentAlwaysAsk={agentAlwaysAsk}
          onSetAgentAlwaysAsk={setAgentAlwaysAsk}
          onSelectProvider={(id) => {
             const p = providers.find(prov => prov.id === id);
             if (p?.isConnected) setActiveProvider(id); else startProviderLink(id);
          }}
          onLogout={handleLogout}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {activeDeviceFlow && <DeviceFlowModal data={activeDeviceFlow} onClose={() => setActiveDeviceFlow(null)} onComplete={() => {}} />}
    </div>
  );
};

export default App;
