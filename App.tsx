
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { AgentArea } from './components/AgentArea';
import { RightSidebar } from './components/RightSidebar';
import { TerminalArea } from './components/TerminalArea';
import { SettingsModal } from './components/SettingsModal';
import { DeviceFlowModal } from './components/DeviceFlowModal';
import { AIProviderId, ProviderInfo, Message, ChatSession, ProjectFile, AppView, Session, User, DeviceFlowResponse, LocalProviderConfig } from './types';
import { OpenAIService } from './services/openaiService';
import { GrokService } from './services/grokService';
import { GeminiService, IntelligenceMode, AgentSettings } from './services/geminiService';
import { LocalAiService } from './services/localAiService';
import { io, Socket } from 'socket.io-client';
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2 } from 'lucide-react';
import { HeifiLogo } from './components/HeifiLogo';

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

  // Local AI State
  const [localConfig, setLocalConfig] = useState<LocalProviderConfig>({
    baseUrl: 'http://localhost:11434/v1',
    model: 'llama3'
  });

  // Agent Matrix Control States
  const [agentSafetyLevel, setAgentSafetyLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [agentAlwaysAsk, setAgentAlwaysAsk] = useState(true);
  const [toolPermissions, setToolPermissions] = useState({
    terminal: true,
    files: true,
    search: false,
    compute: true
  });
  
  const [connectedProviders, setConnectedProviders] = useState<Record<string, boolean>>({
    [AIProviderId.GEMINI]: true,
  });

  const providers: ProviderInfo[] = useMemo(() => [
    { id: AIProviderId.GEMINI, name: 'HEIFI Core (Gemini)', description: 'Primary system reasoning backbone.', models: ['gemini-3-pro-preview', 'gemini-3-flash-preview'], icon: '✨', isConnected: !!connectedProviders[AIProviderId.GEMINI] },
    { id: AIProviderId.LOCAL, name: 'Local Engine', description: 'Private reasoning via Ollama/LM Studio.', models: [localConfig.model], icon: '🏠', isConnected: !!connectedProviders[AIProviderId.LOCAL] },
    { id: AIProviderId.COPILOT, name: 'GitHub Copilot', description: 'GitHub intelligence link.', models: ['gpt-4o'], icon: '🐙', isConnected: !!connectedProviders[AIProviderId.COPILOT] },
    { id: AIProviderId.OPENAI, name: 'OpenAI GPT', description: 'HTTP authentication with username/password.', models: ['gpt-4o', 'o1-preview'], icon: '🧠', isConnected: !!connectedProviders[AIProviderId.OPENAI] },
    { id: AIProviderId.GROK, name: 'xAI Grok', description: 'HTTP authentication with username/password.', models: ['grok-3'], icon: '✖️', isConnected: !!connectedProviders[AIProviderId.GROK] },
  ], [connectedProviders, localConfig.model]);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeDeviceFlow, setActiveDeviceFlow] = useState<DeviceFlowResponse | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const isStoppingRef = useRef(false);

  useEffect(() => {
    const recoverSession = async () => {
      try {
        const storedIdentity = localStorage.getItem('heifi_user_v1_secure');
        const storedProviders = localStorage.getItem('heifi_provider_sync_v1');
        const storedLocal = localStorage.getItem('heifi_local_config');
        if (storedLocal) setLocalConfig(JSON.parse(storedLocal));
        if (storedProviders) setConnectedProviders(JSON.parse(storedProviders));
        if (storedIdentity) {
          const user = JSON.parse(storedIdentity);
          setSession({ user, expires: 'never' });
        }
      } catch (err) {
        console.warn("Security handshake disrupted.");
      } finally {
        setTimeout(() => setAuthLoading(false), 1200);
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
        id: 'heifi-' + Math.random().toString(36).substr(2, 9), 
        name: authMode === 'signup' ? 'New Operator' : 'Nexus Operator', 
        email: 'operator@heifi.ai', 
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}` 
      };
      localStorage.setItem('heifi_user_v1_secure', JSON.stringify(user));
      setSession({ user, expires: 'never' });
      setAuthLoading(false);
    }, 1000);
  };

  const handleLogout = () => {
    localStorage.removeItem('heifi_user_v1_secure');
    localStorage.removeItem('heifi_provider_sync_v1');
    setSession(null);
    setIsSettingsOpen(false);
    setSessions([]);
    setActiveSessionId('');
    setConnectedProviders({ [AIProviderId.GEMINI]: true });
  };

  /**
   * PROVIDER AUTHENTICATION CONNECTOR
   * Handles the initialization logic for different AI providers.
   * - COPILOT: Uses Device Flow (OAuth2).
   * - OPENAI/GROK: Uses HTTP authentication with username/password.
   * - LOCAL: Local Engine config.
   */
  const startProviderLink = async (providerId: AIProviderId) => {
    if (providerId === AIProviderId.COPILOT) {
      try {
        // Step 1: Request Device Code from Backend
        const res = await fetch('/api/auth/github/start', { method: 'POST' });
        const data = await res.json();
        setActiveDeviceFlow(data);
        pollProviderLink(data.device_code, providerId);
      } catch (e) {
        setAuthError("Auth gateway handshake failed.");
      }
    } else if (providerId === AIProviderId.OPENAI || providerId === AIProviderId.GROK) {
      // Prompt for HTTP authentication credentials
      const username = prompt(`Enter ${providerId === AIProviderId.OPENAI ? 'OpenAI' : 'Grok'} username:`);
      if (!username) return;
      
      const password = prompt(`Enter ${providerId === AIProviderId.OPENAI ? 'OpenAI' : 'Grok'} password:`);
      if (!password) return;

      try {
        // Test connection with provided credentials
        const config = {
          username,
          password,
          model: providerId === AIProviderId.OPENAI ? 'gpt-4o' : 'grok-3'
        };

        const isConnected = providerId === AIProviderId.OPENAI 
          ? await OpenAIService.testConnection(config)
          : await GrokService.testConnection(config);
          
        if (isConnected) {
          if (providerId === AIProviderId.OPENAI) {
            OpenAIService.setConfig(config);
          } else {
            GrokService.setConfig(config);
          }
          updateProviderConnection(providerId, true);
        } else {
          setAuthError(`${providerId === AIProviderId.OPENAI ? 'OpenAI' : 'Grok'} authentication failed. Check your credentials.`);
        }
      } catch (e) {
        setAuthError(`${providerId === AIProviderId.OPENAI ? 'OpenAI' : 'Grok'} service error.`);
      }
    } else if (providerId === AIProviderId.LOCAL) {
      updateProviderConnection(providerId, true);
    }
    setActiveProvider(providerId);
  };

  /**
   * OAUTH DEVICE FLOW POLLING
   * Periodically checks with the backend to see if the user has completed the GitHub/Copilot handshake.
   */
  const pollProviderLink = async (deviceCode: string, providerId: AIProviderId) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/github/poll', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
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
      localStorage.setItem('heifi_provider_sync_v1', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (session) {
      // Initialize Socket.io connection for SSH Bridge
      socketRef.current = io('/ssh', { path: '/socket.io', transports: ['websocket'] });
      if (sessions.length === 0) handleNewChat();
    }
    return () => { socketRef.current?.disconnect(); };
  }, [session]);

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      providerId: activeProvider,
      title: currentView === AppView.AGENT ? 'HEIFI Objective' : 'Neural Conversation',
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

  /**
   * NEURAL REASONING LOOP (AGENT TURN)
   * Dispatches the prompt to the selected AI model (Gemini or Local).
   * Processes tool calls and handles automatic execution based on safety levels.
   */
  const runAgentTurn = async (prompt: string | null, history: Message[], toolResponse?: any) => {
    if (isStoppingRef.current) return;
    setIsTyping(true);
    try {
      const isAgent = currentView === AppView.AGENT || isAgentMode;
      const agentSettings: AgentSettings = {
        safetyLevel: agentSafetyLevel,
        alwaysAsk: agentAlwaysAsk,
        toolPermissions
      };

      let response;
      // Branch reasoning to the selected intelligence backbone
      if (activeProvider === AIProviderId.LOCAL) {
        response = await LocalAiService.chat(prompt, history, localConfig, isAgent);
      } else {
        response = await GeminiService.chat(prompt, history, projectFiles, isAgent, intelligenceMode, agentSettings, toolResponse);
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + Math.random()).toString(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        thought: response.toolCalls?.length ? "Processing multi-step objective..." : undefined,
        toolCalls: response.toolCalls?.map((tc: any) => ({
          id: tc.id || Math.random().toString(36).substr(2, 9),
          name: tc.name,
          args: tc.args,
          status: 'pending' as const
        }))
      };

      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, assistantMessage] } : s));

      // Handle Automatic Tool Execution (Autonomous Logic)
      if (assistantMessage.toolCalls?.length && !agentAlwaysAsk && !isStoppingRef.current) {
        const canAutoApprove = assistantMessage.toolCalls.every(tc => ['list_dir', 'read_file', 'connect_ssh'].includes(tc.name));
        if (canAutoApprove || agentSafetyLevel === 'low') {
           for (const tc of assistantMessage.toolCalls) {
              await handleApproveTool(assistantMessage.id, tc.id);
           }
        }
      }
    } catch (error) {
      console.error("Neural reasoning link failed:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!activeSessionId) return;
    isStoppingRef.current = false;
    const newMessage: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    const updatedHistory = [...(activeSession?.messages || []), newMessage];
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: updatedHistory } : s));
    await runAgentTurn(text, updatedHistory);
  };

  /**
   * TOOL EXECUTION HANDLER
   * Communicates with the backend SSH bridge via Socket.io to perform system actions.
   * Feeds the execution result back into the agent reasoning loop for synthesis.
   */
  const handleApproveTool = async (messageId: string, toolCallId: string) => {
    let currentSessionMessages: Message[] = [];
    setSessions(prev => {
        const sess = prev.find(s => s.id === activeSessionId);
        if (sess) currentSessionMessages = sess.messages;
        return prev;
    });

    const currentMessage = currentSessionMessages.find(m => m.id === messageId);
    const toolCall = currentMessage?.toolCalls?.find(tc => tc.id === toolCallId);
    
    if (!toolCall || !socketRef.current) return;

    setSessions(prev => prev.map(s => ({
      ...s,
      messages: s.messages.map(m => m.id === messageId ? {
        ...m,
        toolCalls: m.toolCalls?.map(tc => tc.id === toolCallId ? { ...tc, status: 'executing' as const } : tc)
      } : m)
    })));

    // Emit specialized SSH events to the backend bridge
    const executeOnBackend = (): Promise<any> => {
      return new Promise((resolve) => {
        const socket = socketRef.current!;
        switch (toolCall.name) {
          case 'connect_ssh': socket.emit('agent-ssh-connect', toolCall.args, resolve); break;
          case 'ssh_exec': socket.emit('agent-ssh-exec', { command: toolCall.args.command }, resolve); break;
          case 'read_file': socket.emit('agent-ssh-read', { path: toolCall.args.path }, resolve); break;
          case 'write_file': socket.emit('agent-ssh-write', { path: toolCall.args.path, content: toolCall.args.content }, resolve); break;
          case 'list_dir': socket.emit('agent-ssh-list-dir', { path: toolCall.args.path }, resolve); break;
          case 'end_agent': socket.emit('agent-ssh-disconnect', resolve); break;
          default: resolve({ error: 'Tool capability not linked to backend.' });
        }
      });
    };

    const result = await executeOnBackend();
    const resultStr = result.error ? `Error: ${result.error}` : (result.output || result.content || result.message || 'Operation Synchronized.');

    setSessions(prev => {
        const updated = prev.map(s => ({
            ...s,
            messages: s.messages.map(m => m.id === messageId ? {
              ...m,
              toolCalls: m.toolCalls?.map(tc => tc.id === toolCallId ? { ...tc, status: 'completed' as const, result: resultStr } : tc)
            } : m)
          }));
        
        const finalSession = updated.find(s => s.id === activeSessionId);
        // Step 2: Feed tool output back to Gemini/Local AI for next step
        if (finalSession && !isStoppingRef.current) {
            runAgentTurn(null, finalSession.messages, { id: toolCallId, name: toolCall.name, response: result });
        }
        return updated;
    });
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
      <div className="flex h-screen w-full bg-[#000000] items-center justify-center">
        <div className="flex flex-col items-center gap-8 px-6 text-center animate-pulse">
          <div className="relative">
            <HeifiLogo className="w-16 h-16 relative z-10" />
          </div>
          <div>
            <p className="text-[10px] text-[#71717a] font-black uppercase tracking-[0.4em]">Handshaking...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen w-full bg-[#000000] items-center justify-center p-4 md:p-6 relative overflow-hidden">
        <div className="max-w-md w-full rounded-[2.5rem] p-8 md:p-12 relative z-20 animate-in fade-in duration-700">
          <div className="flex flex-col items-center mb-12 text-center">
            <div className="mb-8">
              <HeifiLogo className="w-24 h-24" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">HEIFI</h2>
            <p className="text-[#71717a] text-[11px] font-black tracking-[0.3em] uppercase opacity-60">Authorize Neural Session</p>
          </div>

          <form onSubmit={handleAppAuthSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[#71717a]" size={18} />
                <input 
                  type="email" 
                  required 
                  placeholder="Nexus Address" 
                  className="w-full bg-[#0a0a0a] border border-[#27272a] rounded-2xl py-5 pl-14 pr-5 text-[15px] font-medium text-white focus:border-white outline-none transition-all placeholder:text-[#3f3f46]" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#71717a]" size={18} />
                <input 
                  type="password" 
                  required 
                  placeholder="Passkey" 
                  className="w-full bg-[#0a0a0a] border border-[#27272a] rounded-2xl py-5 pl-14 pr-5 text-[15px] font-medium text-white focus:border-white outline-none transition-all placeholder:text-[#3f3f46]" 
                />
              </div>
            </div>

            <button type="submit" className="w-full py-5 bg-white text-black font-black uppercase tracking-[0.2em] rounded-full hover:bg-[#f4f4f5] transition-all flex items-center justify-center gap-3 group mt-4 text-[13px]">
              {authMode === 'signin' ? 'Verify Operator' : 'Register Identity'} 
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-12 text-center">
            <button onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')} className="text-[11px] text-[#52525b] font-black uppercase tracking-widest hover:text-white transition-colors">
              {authMode === 'signin' ? "Create New Profile" : "Back to Verification"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#000000] overflow-hidden text-grok-foreground flex-col md:flex-row">
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
        {currentView === AppView.CHAT && (
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
            onApproveTool={(m, t) => handleApproveTool(m, t)}
            onRejectTool={handleRejectTool}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />
        )}
        {currentView === AppView.AGENT && (
          <AgentArea 
            messages={activeSession?.messages || []}
            onSendMessage={handleSendMessage}
            isTyping={isTyping}
            intelligenceMode={intelligenceMode}
            onSetIntelligenceMode={setIntelligenceMode}
            onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            isRightSidebarOpen={isRightSidebarOpen}
            onApproveTool={(m, t) => handleApproveTool(m, t)}
            onRejectTool={handleRejectTool}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />
        )}
        {currentView === AppView.TERMINAL && <TerminalArea onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />}
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
          localConfig={localConfig}
          onSetLocalConfig={(conf) => {
            setLocalConfig(conf);
            localStorage.setItem('heifi_local_config', JSON.stringify(conf));
          }}
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
