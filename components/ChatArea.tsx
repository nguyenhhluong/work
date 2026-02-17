
import React, { useState, useRef, useEffect, memo } from 'react';
import { Message, ProviderInfo, ToolCall } from '../types';
import { Send, User, Bot, Sparkles, Loader2, PanelRight, PanelRightOpen, Terminal, ChevronRight, Check, X, ShieldAlert, Cpu } from 'lucide-react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

interface ChatAreaProps {
  provider: ProviderInfo;
  messages: Message[];
  onSendMessage: (text: string) => void;
  isTyping: boolean;
  isAgentMode: boolean;
  onToggleRightSidebar: () => void;
  isRightSidebarOpen: boolean;
  onApproveTool?: (messageId: string, toolCallId: string) => void;
  onRejectTool?: (messageId: string, toolCallId: string) => void;
}

const ToolCallCard = ({ tool, onApprove, onReject }: { tool: ToolCall, onApprove?: () => void, onReject?: () => void }) => {
  const isDestructive = tool.name === 'ssh_exec' && (tool.args.command?.includes('rm') || tool.args.command?.includes('sudo') || tool.args.command?.includes('kill'));

  return (
    <div className={`mt-3 border rounded-2xl overflow-hidden transition-all ${
      tool.status === 'pending' ? 'bg-slate-900 border-indigo-500/30' :
      tool.status === 'executing' ? 'bg-indigo-600/5 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' :
      tool.status === 'completed' ? 'bg-slate-900/50 border-emerald-500/20' :
      'bg-slate-900 border-slate-800'
    }`}>
      <div className="px-4 py-3 bg-slate-950/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${tool.status === 'pending' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
            <Terminal size={14} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Agent Action</p>
            <p className="text-xs font-bold text-slate-200">{tool.name.replace('_', ' ')}</p>
          </div>
        </div>
        {tool.status === 'executing' && <Loader2 size={14} className="text-indigo-500 animate-spin" />}
        {tool.status === 'completed' && <Check size={14} className="text-emerald-500" />}
      </div>

      <div className="p-4 space-y-3">
        <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 font-mono text-[11px] text-slate-300">
          <span className="text-indigo-400 font-bold">$ </span>
          {tool.name === 'ssh_exec' ? tool.args.command : 
           tool.name === 'connect_ssh' ? `ssh ${tool.args.username}@${tool.args.host}` :
           `${tool.name}(${Object.values(tool.args).join(', ')})`}
        </div>

        {tool.status === 'pending' && (
          <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
            {isDestructive && (
              <div className="flex items-center gap-2 p-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-[10px] font-bold">
                <ShieldAlert size={14} /> Warning: This command may be destructive.
              </div>
            )}
            <div className="flex gap-2">
              <button 
                onClick={onApprove}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-2"
              >
                <Check size={14} /> Approve Action
              </button>
              <button 
                onClick={onReject}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-[11px] font-bold transition-all"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {tool.result && (
          <div className="mt-2 pt-2 border-t border-slate-800">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Execution Output</p>
            <pre className="text-[10px] text-emerald-400/80 bg-black/30 p-2 rounded-lg max-h-32 overflow-y-auto custom-scrollbar font-mono">
              {tool.result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

const MessageItem = memo(({ msg, onApprove, onReject }: { msg: Message, onApprove?: (id: string) => void, onReject?: (id: string) => void }) => (
  <div className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} py-4 animate-in slide-in-from-bottom-2 duration-300`}>
    <div className={`flex gap-4 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center shadow-lg ${
        msg.role === 'user' ? 'bg-slate-800 text-slate-300' : 'bg-indigo-600 text-white shadow-indigo-600/20'
      }`}>
        {msg.role === 'user' ? <User size={20} /> : (msg.toolCalls?.length ? <Cpu size={20} /> : <Bot size={20} />)}
      </div>
      <div className="flex-1">
        <div className={`p-4 rounded-[1.5rem] ${
          msg.role === 'user' 
            ? 'bg-slate-800 text-slate-100 rounded-tr-none' 
            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-xl'
        }`}>
          {msg.thought && (
            <div className="mb-3 pb-3 border-b border-slate-800 text-slate-500 italic text-xs leading-relaxed">
              <span className="font-bold uppercase tracking-widest text-[9px] not-italic block mb-1">Agent Reasoning</span>
              "{msg.thought}"
            </div>
          )}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          <p className="text-[10px] text-slate-500 mt-2 font-mono opacity-50">
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {msg.toolCalls?.map(tool => (
          <ToolCallCard 
            key={tool.id} 
            tool={tool} 
            onApprove={() => onApprove?.(tool.id)}
            onReject={() => onReject?.(tool.id)}
          />
        ))}
      </div>
    </div>
  </div>
));

export const ChatArea: React.FC<ChatAreaProps> = ({ 
  provider, 
  messages, 
  onSendMessage, 
  isTyping, 
  isAgentMode,
  onToggleRightSidebar,
  isRightSidebarOpen,
  onApproveTool,
  onRejectTool
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
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{provider.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm">{provider.name}</h2>
              {isAgentMode && <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded border border-indigo-500/20">Agent Ready</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${provider.isConnected ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                {provider.isConnected ? 'Active Tunnel' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-2">
            {provider.models.slice(0, 1).map(m => (
              <span key={m} className="px-2 py-1 bg-slate-800 text-[10px] font-mono text-slate-300 rounded border border-slate-700">
                {m}
              </span>
            ))}
          </div>
          <button 
            onClick={onToggleRightSidebar}
            className={`p-2 rounded-xl transition-colors ${isRightSidebarOpen ? 'text-indigo-400 bg-indigo-400/10' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            {isRightSidebarOpen ? <PanelRightOpen size={20} /> : <PanelRight size={20} />}
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 relative">
        {messages.length === 0 && !isTyping ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center max-w-md mx-auto animate-in fade-in zoom-in duration-500 px-6">
            <div className="w-20 h-20 bg-indigo-600/10 rounded-3xl flex items-center justify-center mb-6 border border-indigo-600/20 relative">
              <div className="absolute inset-0 bg-indigo-500/5 blur-xl animate-pulse"></div>
              {isAgentMode ? <Cpu className="text-indigo-500 w-10 h-10 relative" /> : <Sparkles className="text-indigo-500 w-10 h-10 relative" />}
            </div>
            <h3 className="text-2xl font-black mb-2 tracking-tight">{isAgentMode ? 'OmniChat Autonomous' : 'OmniChat Assistant'}</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              {isAgentMode 
                ? "I can autonomously use SSH tools to manage your servers, deploy code, and debug production issues. Just give me a high-level task."
                : `Experience the power of ${provider.name}. Connect project memory to give the AI context about your documents.`}
            </p>
            {isAgentMode && (
              <div className="grid grid-cols-2 gap-3 w-full">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-left">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Capabilities</p>
                  <p className="text-[11px] text-slate-400 font-medium">Git Ops, NPM, Docker, Nginx config, and Log analysis.</p>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-left">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Safety</p>
                  <p className="text-[11px] text-slate-400 font-medium">All tool executions require your explicit approval.</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            data={messages}
            className="h-full custom-scrollbar"
            initialTopMostItemIndex={messages.length - 1}
            followOutput="auto"
            alignToBottom={true}
            itemContent={(index, msg) => (
              <div className="px-6">
                <MessageItem 
                  msg={msg} 
                  onApprove={(toolCallId) => onApproveTool?.(msg.id, toolCallId)}
                  onReject={(toolCallId) => onRejectTool?.(msg.id, toolCallId)}
                />
              </div>
            )}
            components={{
              Header: () => <div className="h-4" />,
              Footer: () => (
                <div className="px-6 pb-6">
                  {isTyping && (
                    <div className="flex gap-4 animate-in fade-in duration-200 pt-3">
                      <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center bg-indigo-600 animate-pulse shadow-lg shadow-indigo-600/20">
                        <Bot size={20} className="text-white" />
                      </div>
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                        <span className="text-sm text-slate-400 font-medium">
                          {isAgentMode ? 'Agent is planning actions...' : 'AI is processing...'}
                        </span>
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

      <div className="p-6 pt-0 bg-gradient-to-t from-slate-950 to-transparent">
        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto group">
          <div className="absolute inset-0 bg-indigo-500/5 blur-2xl group-focus-within:bg-indigo-500/10 transition-all rounded-3xl"></div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!provider.isConnected}
            placeholder={isAgentMode ? "Command agent (e.g., 'Deploy the latest from main to production server')" : `Ask ${provider.name} anything...`}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-5 pl-6 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/50 transition-all placeholder:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl relative"
          />
          <button
            type="submit"
            disabled={!input.trim() || !provider.isConnected}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-500 transition-all disabled:bg-slate-800 disabled:text-slate-600 shadow-xl shadow-indigo-600/20 active:scale-95"
          >
            <Send size={20} className="text-white" />
          </button>
        </form>
        <div className="flex items-center justify-center gap-6 mt-4">
          <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">Autonomous Agent Interface v2.0</p>
          {isAgentMode && <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div><span className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest">Live Execution Loop</span></div>}
        </div>
      </div>
    </div>
  );
};
