
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { RightSidebar } from './components/RightSidebar';
import { TerminalArea } from './components/TerminalArea';
import { DeviceFlowModal } from './components/DeviceFlowModal';
import { AIProviderId, ProviderInfo, Message, DeviceFlowResponse, ChatSession, ProjectFile, AppView } from './types';
import { GeminiService } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);
  const [activeProvider, setActiveProvider] = useState<AIProviderId>(AIProviderId.GEMINI);
  const [providers, setProviders] = useState<ProviderInfo[]>([
    { 
      id: AIProviderId.GEMINI, 
      name: 'Google Gemini', 
      description: 'Next-gen multimodal reasoning', 
      models: ['gemini-3-flash-preview', 'gemini-3-pro-preview'], 
      icon: '✨', 
      isConnected: true 
    },
    { 
      id: AIProviderId.COPILOT, 
      name: 'GitHub Copilot', 
      description: 'The world’s most widely adopted AI developer tool', 
      models: ['gpt-4o', 'claude-3.5-sonnet'], 
      icon: '🐙', 
      isConnected: false 
    },
    { 
      id: AIProviderId.OPENAI, 
      name: 'OpenAI', 
      description: 'Advanced language models from OpenAI', 
      models: ['gpt-4o', 'o1-preview'], 
      icon: '🧠', 
      isConnected: false 
    },
    { 
      id: AIProviderId.GROK, 
      name: 'xAI Grok', 
      description: 'Sassy and real-time knowledge via GitHub Models', 
      models: ['grok-3', 'grok-4'], 
      icon: '✖️', 
      isConnected: false 
    },
  ]);

  // Session Management
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);

  // Auth State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDeviceFlow, setCurrentDeviceFlow] = useState<DeviceFlowResponse | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Initialize first session
  useEffect(() => {
    if (sessions.length === 0) {
      handleNewChat();
    }
  }, []);

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      providerId: activeProvider,
      title: 'New Conversation',
      messages: [],
      createdAt: new Date()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setCurrentView(AppView.CHAT);
  };

  const activeSession = useMemo(() => 
    sessions.find(s => s.id === activeSessionId) || sessions[0], 
  [sessions, activeSessionId]);

  const handleProviderSelect = (id: AIProviderId) => {
    setActiveProvider(id);
    setCurrentView(AppView.CHAT);
    if (activeSession && activeSession.messages.length === 0) {
      setSessions(prev => prev.map(s => 
        s.id === activeSessionId ? { ...s, providerId: id } : s
      ));
    }
  };

  const handleLogin = (id: AIProviderId) => {
    setCurrentDeviceFlow({
      user_code: 'GH-8291-C2',
      verification_uri: 'https://github.com/login/device',
      device_code: 'temp_device_code_123',
      expires_in: 900,
      interval: 5
    });
    setIsModalOpen(true);
  };

  const handleAuthComplete = () => {
    setProviders(prev => prev.map(p => 
      p.id === activeProvider ? { ...p, isConnected: true } : p
    ));
    setIsModalOpen(false);
    setCurrentDeviceFlow(null);
  };

  const handleSendMessage = async (text: string) => {
    if (!activeSessionId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        const isFirstMessage = s.messages.length === 0;
        return {
          ...s,
          title: isFirstMessage ? text.slice(0, 30) + (text.length > 30 ? '...' : '') : s.title,
          messages: [...s.messages, newMessage]
        };
      }
      return s;
    }));

    setIsTyping(true);
    try {
      if (activeProvider === AIProviderId.GEMINI) {
        const geminiResponse = await GeminiService.chat(
          text, 
          activeSession.messages,
          projectFiles
        );
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: geminiResponse,
          timestamp: new Date()
        };
        setSessions(prev => prev.map(s => 
          s.id === activeSessionId ? { ...s, messages: [...s.messages, assistantMessage] } : s
        ));
      } else {
        await new Promise(r => setTimeout(r, 1500));
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `This is a simulated response from ${activeProvider}. Connect your real keys to enable live completions.`,
          timestamp: new Date()
        };
        setSessions(prev => prev.map(s => 
          s.id === activeSessionId ? { ...s, messages: [...s.messages, assistantMessage] } : s
        ));
      }
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const newFile: ProjectFile = {
        id: Date.now().toString(),
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type,
        content: content.split(',')[1]
      };
      setProjectFiles(prev => [...prev, newFile]);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (id: string) => {
    setProjectFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden text-slate-100">
      <Sidebar 
        providers={providers} 
        activeId={activeProvider}
        currentView={currentView}
        onSelectProvider={handleProviderSelect}
        onSelectView={setCurrentView}
        onLogin={handleLogin}
      />
      
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
        {currentView === AppView.CHAT ? (
          <ChatArea 
            provider={providers.find(p => p.id === activeProvider)!}
            messages={activeSession?.messages || []}
            onSendMessage={handleSendMessage}
            isTyping={isTyping}
            onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            isRightSidebarOpen={isRightSidebarOpen}
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
          onNewChat={handleNewChat}
          onSelectSession={setActiveSessionId}
          onUploadFile={handleFileUpload}
          onRemoveFile={handleRemoveFile}
          onClose={() => setIsRightSidebarOpen(false)}
        />
      )}

      {isModalOpen && currentDeviceFlow && (
        <DeviceFlowModal 
          data={currentDeviceFlow} 
          onClose={() => setIsModalOpen(false)}
          onComplete={handleAuthComplete}
        />
      )}
    </div>
  );
};

export default App;
