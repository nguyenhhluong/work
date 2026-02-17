
import React, { useState, useRef, useEffect, memo } from 'react';
import { Message, ProviderInfo } from '../types';
import { Send, User, Bot, Sparkles, Loader2, PanelRight, PanelRightOpen } from 'lucide-react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

interface ChatAreaProps {
  provider: ProviderInfo;
  messages: Message[];
  onSendMessage: (text: string) => void;
  isTyping: boolean;
  onToggleRightSidebar: () => void;
  isRightSidebarOpen: boolean;
}

// Memoized Message Component to prevent re-renders of static history items
const MessageItem = memo(({ msg }: { msg: Message }) => (
  <div className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} py-3 animate-in slide-in-from-bottom-2 duration-300`}>
    <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${
        msg.role === 'user' ? 'bg-slate-700' : 'bg-blue-600'
      }`}>
        {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
      </div>
      <div className={`p-4 rounded-2xl ${
        msg.role === 'user' 
          ? 'bg-slate-800 text-slate-100 rounded-tr-none' 
          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-xl'
      }`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        <p className="text-[10px] text-slate-500 mt-2 font-mono">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  </div>
));

export const ChatArea: React.FC<ChatAreaProps> = ({ 
  provider, 
  messages, 
  onSendMessage, 
  isTyping, 
  onToggleRightSidebar,
  isRightSidebarOpen
}) => {
  const [input, setInput] = useState('');
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !provider.isConnected) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{provider.icon}</span>
          <div>
            <h2 className="font-bold text-sm">{provider.name}</h2>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${provider.isConnected ? 'bg-green-500' : 'bg-slate-500'}`}></span>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                {provider.isConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-2">
            {provider.models.map(m => (
              <span key={m} className="px-2 py-1 bg-slate-800 text-[10px] font-mono text-slate-300 rounded border border-slate-700">
                {m}
              </span>
            ))}
          </div>
          <button 
            onClick={onToggleRightSidebar}
            className={`p-2 rounded-lg transition-colors ${isRightSidebarOpen ? 'text-blue-500 bg-blue-500/10' : 'text-slate-400 hover:bg-slate-800'}`}
            title="Toggle Right Sidebar"
          >
            {isRightSidebarOpen ? <PanelRightOpen size={20} /> : <PanelRight size={20} />}
          </button>
        </div>
      </header>

      {/* Virtualized Messages List */}
      <div className="flex-1 min-h-0 relative">
        {messages.length === 0 && !isTyping ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center max-w-md mx-auto animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-600/20">
              <Sparkles className="text-blue-500 w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">OmniChat Session</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Experience the power of {provider.name}. Upload files to the project memory on the right to give the AI context about your codebase or documents.
            </p>
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            data={messages}
            className="h-full custom-scrollbar"
            initialTopMostItemIndex={messages.length - 1}
            followOutput="auto"
            alignToBottom={true}
            itemContent={(index, msg) => <div className="px-6"><MessageItem msg={msg} /></div>}
            components={{
              Header: () => <div className="h-4" />,
              Footer: () => (
                <div className="px-6 pb-6">
                  {isTyping && (
                    <div className="flex gap-4 animate-in fade-in duration-200 pt-3">
                      <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-blue-600 animate-pulse">
                        <Bot size={18} />
                      </div>
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                        <span className="text-sm text-slate-400 font-medium">{provider.name} is processing...</span>
                      </div>
                    </div>
                  )}
                  <div className="h-4" />
                </div>
              )
            }}
          />
        )}
      </div>

      {/* Input */}
      <div className="p-6 pt-0 bg-gradient-to-t from-slate-950 to-transparent">
        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!provider.isConnected}
            placeholder={provider.isConnected ? `Ask ${provider.name} anything...` : `Sign in to chat with ${provider.name}`}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all placeholder:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl"
          />
          <button
            type="submit"
            disabled={!input.trim() || !provider.isConnected}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-500 transition-colors disabled:bg-slate-800 disabled:text-slate-600"
          >
            <Send size={18} />
          </button>
        </form>
        <p className="text-center text-[10px] text-slate-600 mt-3 font-medium uppercase tracking-widest">
          Multi-Model Unified Intelligence Interface
        </p>
      </div>
    </div>
  );
};
