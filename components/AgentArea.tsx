
import React, { useState, useRef, useEffect, memo } from 'react';
import { Message, ToolCall } from '../types';
import { IntelligenceMode } from '../services/geminiService';
import { User, Bot, Loader2, Terminal, Check, X, PanelRight, ArrowUp, Menu, Brain, ShieldAlert, Cpu, Power } from 'lucide-react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

interface AgentAreaProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isTyping: boolean;
  intelligenceMode: IntelligenceMode;
  onSetIntelligenceMode: (mode: IntelligenceMode) => void;
  onToggleRightSidebar: () => void;
  isRightSidebarOpen: boolean;
  onApproveTool?: (messageId: string, toolCallId: string) => void;
  onRejectTool?: (messageId: string, toolCallId: string) => void;
  onOpenMobileMenu: () => void;
}

const ToolCallCard: React.FC<{ tool: ToolCall, onApprove?: () => void, onReject?: () => void }> = ({ tool, onApprove, onReject }) => {
  return (
    <div className="mt-4 border rounded-[1.5rem] overflow-hidden bg-[#0a0a0a]/80 backdrop-blur-md border-[#27272a] animate-slide-up shadow-2xl">
      <div className="px-5 py-3 border-b border-[#27272a] flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-grok-accent" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#71717a]">Neural Execution Vector</p>
        </div>
        {tool.status === 'executing' && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-grok-accent uppercase tracking-widest animate-pulse">Running</span>
            <Loader2 size={14} className="animate-spin text-grok-accent" />
          </div>
        )}
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-grok-accent/10 flex items-center justify-center">
                <Cpu size={16} className="text-grok-accent" />
            </div>
            <p className="text-sm font-bold text-white uppercase tracking-tight">{tool.name.replace(/_/g, ' ')}</p>
        </div>
        <pre className="text-[12px] font-mono p-4 bg-black/60 rounded-xl border border-[#27272a] overflow-x-auto text-[#d4d4d8] custom-scrollbar">
          {tool.name === 'ssh_exec' ? tool.args.command : `${tool.name}(${JSON.stringify(tool.args, null, 2)})`}
        </pre>
        {tool.status === 'pending' && (
          <div className="flex gap-2 pt-2">
            <button onClick={onApprove} className="flex-1 py-3 bg-[#1d9bf0] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-grok-accent/20 active:scale-95">
              <Check size={16} /> Authorize Execution
            </button>
            <button onClick={onReject} className="px-5 py-3 bg-white/5 text-[#71717a] border border-[#27272a] rounded-xl hover:text-white transition-all active:scale-95">
              <X size={16} /> Abort
            </button>
          </div>
        )}
        {tool.result && (
          <div className="mt-4 animate-fade-in pt-4 border-t border-[#27272a]">
            <p className="text-[9px] font-black text-[#71717a] uppercase tracking-widest mb-2">Stdout Stream</p>
            <pre className="text-[11px] font-mono p-4 bg-black/40 rounded-xl border border-[#27272a] max-h-40 overflow-y-auto text-grok-success custom-scrollbar">
              {tool.result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

const MessageItem = memo(({ msg, onApprove, onReject }: { msg: Message, onApprove?: (id: string) => void, onReject?: (id: string) => void }) => (
  <div className={`flex gap-4 md:gap-6 py-8 md:py-10 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
    <div className={`flex gap-4 md:gap-5 max-w-[94%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center shadow-lg ${msg.role === 'user' ? 'bg-[#1d9bf0] shadow-grok-accent/20' : 'glass-card'}`}>
        {msg.role === 'user' ? <User size={18} className="text-white" /> : <Bot size={18} className="text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        {msg.thought && (
            <div className="mb-4 p-5 bg-[#111111] border border-[#27272a] rounded-[1.5rem] italic text-[13px] text-[#71717a] animate-fade-in flex items-start gap-4 shadow-inner">
                <Brain size={16} className="mt-0.5 shrink-0 text-grok-accent/50 animate-pulse" />
                <p className="leading-relaxed opacity-80">{msg.thought}</p>
            </div>
        )}
        <div className={`p-4 md:p-5 rounded-[1.5rem] leading-relaxed transition-all ${msg.role === 'user' ? 'bg-[#1d9bf0]/10 border border-[#1d9bf0]/20 text-white shadow-xl' : 'text-[#e4e4e7]'}`}>
           <p className="text-[15px] md:text-[16px] whitespace-pre-wrap break-words">{msg.content}</p>
        </div>
        {msg.toolCalls?.map(tool => (
          <ToolCallCard key={tool.id} tool={tool} onApprove={() => onApprove?.(tool.id)} onReject={() => onReject?.(tool.id)} />
        ))}
      </div>
    </div>
  </div>
));

export const AgentArea: React.FC<AgentAreaProps> = ({ 
  messages, onSendMessage, isTyping, intelligenceMode, onSetIntelligenceMode, onToggleRightSidebar, isRightSidebarOpen, onApproveTool, onRejectTool, onOpenMobileMenu 
}) => {
  const [input, setInput] = useState('');
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  useEffect(() => { if (!isTyping) textareaRef.current?.focus(); }, [isTyping]);

  const displayMessages = messages.length > 0 ? messages : [
    {
        id: 'welcome',
        role: 'assistant',
        content: "OmniCore Agent System Synchronized. I am standing by for autonomous infrastructure objectives. Example: 'Deploy my Node.js application to the staging server at 142.250.190.46'.",
        timestamp: new Date()
    },
    {
        id: 'demo-user',
        role: 'user',
        content: "Check server status and list active docker containers on 1.2.3.4",
        timestamp: new Date()
    },
    {
        id: 'demo-agent',
        role: 'assistant',
        thought: "Objective received. Initializing SSH handshake with node 1.2.3.4. I will first establish connectivity, then execute container enumeration via 'docker ps'.",
        content: "Beginning infrastructure scan on node 1.2.3.4. Awaiting authorization for SSH link.",
        timestamp: new Date(),
        toolCalls: [
            {
                id: 'tc-1',
                name: 'connect_ssh',
                args: { host: '1.2.3.4', username: 'root', port: 22 },
                status: 'pending'
            }
        ]
    }
  ] as Message[];

  return (
    <div className="flex flex-col h-full bg-transparent relative overflow-hidden">
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-black/40 backdrop-blur-xl shrink-0 z-30">
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={onOpenMobileMenu} className="md:hidden p-2.5 text-grok-muted hover:text-white transition-all active:scale-90">
            <Menu size={22} />
          </button>
          <div className="flex flex-col md:flex-row md:items-center md:gap-4">
            <h2 className="font-black text-sm text-white tracking-tight flex items-center gap-2">
              <Bot size={16} className="text-grok-success" /> AGENT ENGINE
            </h2>
            <div className="flex items-center gap-1.5 opacity-60">
               <div className="w-1.5 h-1.5 bg-grok-success rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
               <span className="text-[9px] text-white font-black uppercase tracking-[0.2em]">AUTONOMOUS MODE</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:flex items-center glass-card rounded-full p-0.5 px-1">
            {['fast', 'balanced', 'deep'].map((mode) => (
              <button 
                key={mode} onClick={() => onSetIntelligenceMode(mode as IntelligenceMode)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${intelligenceMode === mode ? 'bg-grok-success text-white shadow-xl shadow-grok-success/20' : 'text-[#71717a] hover:text-white'}`}
              >
                {mode}
              </button>
            ))}
          </div>
          <button onClick={onToggleRightSidebar} className={`p-2.5 rounded-full transition-all active:scale-90 ${isRightSidebarOpen ? 'text-grok-accent bg-white/5' : 'text-[#71717a] hover:text-white'}`}>
            <PanelRight size={22} />
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 relative">
        <Virtuoso
          ref={virtuosoRef}
          data={displayMessages}
          className="h-full custom-scrollbar"
          initialTopMostItemIndex={displayMessages.length > 1 ? displayMessages.length - 1 : 0}
          followOutput="auto"
          alignToBottom={true}
          itemContent={(index, msg) => (
            <div className="px-4 md:px-8 max-w-4xl mx-auto">
              <MessageItem msg={msg} onApprove={(toolId) => onApproveTool?.(msg.id, toolId)} onReject={(toolId) => onRejectTool?.(msg.id, toolId)} />
            </div>
          )}
          components={{
            Header: () => <div className="h-4 md:h-12" />,
            Footer: () => (
              <div className="px-4 md:px-8 pb-36 md:pb-32 max-w-4xl mx-auto">
                {isTyping && (
                  <div className="flex gap-4 py-8 animate-fade-in">
                    <div className="w-9 h-9 rounded-full glass-card flex items-center justify-center">
                        <Loader2 size={16} className="animate-spin text-grok-success" />
                    </div>
                    <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-1.5">
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                        </div>
                        <p className="text-[10px] font-black text-grok-success uppercase tracking-[0.2em] opacity-60">Synthesizing action sequence...</p>
                    </div>
                  </div>
                )}
              </div>
            )
          }}
        />
      </div>

      <div className="absolute bottom-0 left-0 w-full p-5 md:p-8 bg-gradient-to-t from-black via-black/90 to-transparent pt-16 z-20 pointer-events-none">
        <div className="max-w-3xl mx-auto pointer-events-auto">
          <div className="glass-panel rounded-[2rem] md:rounded-[3rem] p-1.5 md:p-2 flex items-center gap-3 shadow-2xl transition-all focus-within:ring-2 focus-within:ring-grok-success/20 focus-within:border-grok-success/40 relative group">
            <div className="absolute inset-0 bg-grok-success/5 rounded-[inherit] opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
            <textarea
              ref={textareaRef} rows={1} value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              placeholder="Assign high-level objective..."
              className="flex-1 bg-transparent border-none py-4 md:py-5 px-5 md:px-7 text-[16px] text-white focus:outline-none placeholder:text-[#71717a]/60 resize-none min-h-[58px] md:min-h-[68px] max-h-40 md:max-h-52 relative z-10"
            />
            {isTyping ? (
                 <button
                    onClick={() => {}} 
                    className="px-6 py-2 bg-grok-error/20 text-grok-error border border-grok-error/40 rounded-full flex items-center justify-center hover:bg-grok-error/30 transition-all shrink-0 mr-1 relative z-10 active:scale-95 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                >
                    <Power size={14} /> Stop
                </button>
            ) : (
                <button
                    onClick={() => handleSubmit()} disabled={!input.trim()}
                    className="w-11 h-11 md:w-12 md:h-12 bg-grok-success rounded-full flex items-center justify-center hover:bg-grok-success/90 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all disabled:opacity-20 disabled:grayscale shrink-0 mr-1 relative z-10 active:scale-95"
                >
                    <ArrowUp size={22} className="text-white" />
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
