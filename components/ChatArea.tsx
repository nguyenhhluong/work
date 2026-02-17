
import React, { useState, useRef, useEffect, memo } from 'react';
import { Message, ProviderInfo, ToolCall } from '../types';
import { IntelligenceMode } from '../services/geminiService';
import { Send, User, Bot, Sparkles, Loader2, Terminal, Check, X, ShieldAlert, Cpu, Copy, Hash, ShieldCheck, Zap, Brain, PanelRight, ArrowUp } from 'lucide-react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

interface ChatAreaProps {
  provider: ProviderInfo;
  messages: Message[];
  onSendMessage: (text: string) => void;
  isTyping: boolean;
  isAgentMode: boolean;
  intelligenceMode: IntelligenceMode;
  onSetIntelligenceMode: (mode: IntelligenceMode) => void;
  onToggleRightSidebar: () => void;
  isRightSidebarOpen: boolean;
  onApproveTool?: (messageId: string, toolCallId: string) => void;
  onRejectTool?: (messageId: string, toolCallId: string) => void;
}

const ToolCallCard: React.FC<{ tool: ToolCall, onApprove?: () => void, onReject?: () => void }> = ({ tool, onApprove, onReject }) => {
  return (
    <div className={`mt-4 border rounded-2xl overflow-hidden bg-grok-card border-grok-border animate-slide-up`}>
      <div className="px-5 py-3 border-b border-grok-border flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-grok-muted" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-grok-muted">Action Required</p>
        </div>
        {tool.status === 'executing' && <Loader2 size={14} className="animate-spin text-grok-accent" />}
      </div>
      <div className="p-5 space-y-4">
        <pre className="text-[12px] font-mono p-4 bg-black rounded-xl border border-grok-border overflow-x-auto text-grok-foreground">
          {tool.name === 'ssh_exec' ? tool.args.command : `${tool.name}(${JSON.stringify(tool.args)})`}
        </pre>
        {tool.status === 'pending' && (
          <div className="flex gap-2">
            <button onClick={onApprove} className="flex-1 py-2.5 bg-grok-accent text-white rounded-xl text-xs font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2">
              <Check size={16} /> Run Command
            </button>
            <button onClick={onReject} className="px-4 py-2.5 bg-grok-secondary text-grok-muted rounded-xl hover:text-white transition-all">
              <X size={16} />
            </button>
          </div>
        )}
        {tool.result && (
          <div className="mt-4 animate-fade-in">
            <p className="text-[10px] font-bold text-grok-muted uppercase mb-2">Output</p>
            <pre className="text-[11px] font-mono p-4 bg-black rounded-xl border border-grok-border max-h-40 overflow-y-auto text-grok-success">
              {tool.result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

const MessageItem = memo(({ msg, onApprove, onReject }: { msg: Message, onApprove?: (id: string) => void, onReject?: (id: string) => void }) => (
  <div className={`flex gap-5 py-8 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
    <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-grok-accent' : 'bg-grok-secondary border border-grok-border'}`}>
        {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-grok-accent/10 border border-grok-accent/20' : ''}`}>
           <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
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
  intelligenceMode,
  onSetIntelligenceMode,
  onToggleRightSidebar,
  isRightSidebarOpen,
  onApproveTool,
  onRejectTool
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

  useEffect(() => {
    if (!isTyping) {
        textareaRef.current?.focus();
    }
  }, [isTyping]);

  return (
    <div className="flex flex-col h-full bg-grok-bg relative">
      <header className="h-14 border-b border-grok-border flex items-center justify-between px-6 bg-grok-bg/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-sm text-white">{isAgentMode ? 'Omni Agent' : provider.name}</h2>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-grok-secondary rounded-full border border-grok-border">
             <div className="w-1.5 h-1.5 bg-grok-success rounded-full"></div>
             <span className="text-[10px] text-grok-muted font-bold uppercase tracking-widest">{intelligenceMode}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-grok-card border border-grok-border rounded-full p-0.5">
            {['fast', 'balanced', 'deep'].map((mode) => (
              <button 
                key={mode}
                onClick={() => onSetIntelligenceMode(mode as IntelligenceMode)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${intelligenceMode === mode ? 'bg-grok-accent text-white' : 'text-grok-muted hover:text-white'}`}
              >
                {mode}
              </button>
            ))}
          </div>
          <button onClick={onToggleRightSidebar} className={`p-2 rounded-full transition-all ${isRightSidebarOpen ? 'text-grok-accent bg-grok-accent/10' : 'text-grok-muted hover:text-white'}`}>
            <PanelRight size={18} />
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        <Virtuoso
          ref={virtuosoRef}
          data={messages}
          className="h-full custom-scrollbar"
          initialTopMostItemIndex={messages.length - 1}
          followOutput="auto"
          alignToBottom={true}
          itemContent={(index, msg) => (
            <div className="px-6 max-w-4xl mx-auto">
              <MessageItem 
                msg={msg} 
                onApprove={(toolId) => onApproveTool?.(msg.id, toolId)}
                onReject={(toolId) => onRejectTool?.(msg.id, toolId)}
              />
            </div>
          )}
          components={{
            Header: () => <div className="h-8" />,
            Footer: () => (
              <div className="px-6 pb-20 max-w-4xl mx-auto">
                {isTyping && (
                  <div className="flex gap-4 py-8 animate-fade-in">
                    <div className="w-8 h-8 rounded-full bg-grok-secondary border border-grok-border flex items-center justify-center">
                        <Loader2 size={14} className="animate-spin text-grok-accent" />
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  </div>
                )}
              </div>
            )
          }}
        />
      </div>

      <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-grok-bg via-grok-bg to-transparent pt-10">
        <div className="max-w-3xl mx-auto relative">
          <div className="bg-grok-card border border-grok-border rounded-[2rem] p-2 flex items-center gap-3 shadow-2xl transition-all focus-within:border-grok-accent focus-within:ring-1 focus-within:ring-grok-accent/30">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="What can I help with?"
              className="flex-1 bg-transparent border-none py-4 px-6 text-[15px] text-white focus:outline-none placeholder:text-grok-muted resize-none min-h-[56px] max-h-48"
            />
            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim()}
              className="w-10 h-10 bg-grok-accent rounded-full flex items-center justify-center hover:brightness-110 transition-all disabled:opacity-30 disabled:grayscale shrink-0 mr-1"
            >
              <ArrowUp size={20} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
