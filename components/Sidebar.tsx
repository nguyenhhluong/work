
import React from 'react';
import { AppView, User } from '../types';
import { MessageSquare, Terminal as TerminalIcon, Settings, Plus, Bot, Command, PanelLeft } from 'lucide-react';

interface SidebarProps {
  currentView: AppView;
  isAgentMode: boolean;
  onToggleAgentMode: () => void;
  onSelectView: (view: AppView) => void;
  onOpenSettings: () => void;
  onNewChat: () => void;
  isCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
  user?: User;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  isAgentMode,
  onToggleAgentMode,
  onSelectView, 
  onOpenSettings,
  onNewChat,
  isCollapsed,
  onToggleCollapse,
  user
}) => {
  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-64'} bg-black border-r border-grok-border flex flex-col shrink-0 transition-all duration-200 z-50 relative group/sidebar`}>
      <button 
        onClick={() => onToggleCollapse(!isCollapsed)}
        className="absolute -right-4 top-4 p-1.5 bg-black border border-grok-border rounded-full text-grok-muted hover:text-white transition-all z-50 opacity-0 group-hover/sidebar:opacity-100"
      >
        <PanelLeft size={14} className={isCollapsed ? 'rotate-180' : ''} />
      </button>

      <div className={`p-6 flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-grok-accent rounded flex items-center justify-center shadow-[0_0_15px_rgba(29,155,240,0.3)]">
          <Command size={18} className="text-white" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col">
            <h1 className="font-bold text-lg text-white leading-none">Omni</h1>
            <span className="text-[8px] text-grok-accent font-black tracking-widest uppercase mt-1">Matrix v3</span>
          </div>
        )}
      </div>

      <div className="px-4 py-2">
        <button
          onClick={onNewChat}
          className={`w-full flex items-center gap-3 bg-white text-black rounded-full font-bold text-sm transition-all hover:opacity-90 active:scale-95 shadow-xl ${isCollapsed ? 'justify-center p-3' : 'px-4 py-2.5'}`}
        >
          <Plus size={18} />
          {!isCollapsed && <span>New Session</span>}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar mt-4">
        <button
          onClick={() => onSelectView(AppView.CHAT)}
          className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${currentView === AppView.CHAT ? 'bg-grok-secondary text-white' : 'text-grok-muted hover:bg-white/5 hover:text-white'} ${isCollapsed ? 'justify-center' : ''}`}
        >
          <MessageSquare size={18} />
          {!isCollapsed && <span className="text-sm font-medium">Neural Chat</span>}
        </button>
        <button
          onClick={() => onSelectView(AppView.TERMINAL)}
          className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${currentView === AppView.TERMINAL ? 'bg-grok-secondary text-white' : 'text-grok-muted hover:bg-white/5 hover:text-white'} ${isCollapsed ? 'justify-center' : ''}`}
        >
          <TerminalIcon size={18} />
          {!isCollapsed && <span className="text-sm font-medium">Terminal Grid</span>}
        </button>
        <button
          onClick={onToggleAgentMode}
          className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${isAgentMode ? 'text-grok-success' : 'text-grok-muted hover:bg-white/5 hover:text-white'} ${isCollapsed ? 'justify-center' : ''}`}
        >
          <Bot size={18} />
          {!isCollapsed && <span className="text-sm font-medium">Agent Engine</span>}
        </button>
      </nav>

      <div className="p-4 border-t border-grok-border space-y-2">
        {user && !isCollapsed && (
          <div className="p-3 bg-grok-secondary/50 rounded-2xl border border-grok-border mb-2 group/user hover:border-grok-accent/30 transition-all cursor-default">
            <div className="flex items-center gap-3">
              <img 
                src={user.image || 'https://github.com/github.png'} 
                alt={user.name || 'User'} 
                className="w-9 h-9 rounded-full border-2 border-grok-border group-hover/user:border-grok-accent/50 transition-all" 
              />
              <div className="min-w-0">
                <p className="text-[10px] text-grok-muted font-black uppercase tracking-widest mb-0.5 opacity-60">Welcome, Operator</p>
                <p className="text-sm font-bold text-white truncate">{user.name}</p>
              </div>
            </div>
          </div>
        )}
        {user && isCollapsed && (
          <div className="flex justify-center mb-2">
             <img src={user.image || ''} className="w-8 h-8 rounded-full border border-grok-border" alt="" />
          </div>
        )}
        <button 
          onClick={onOpenSettings}
          className={`w-full flex items-center gap-4 p-3 text-grok-muted hover:text-white transition-all rounded-xl hover:bg-white/5 ${isCollapsed ? 'justify-center' : ''}`}
        >
          <Settings size={18} />
          {!isCollapsed && <span className="text-sm font-medium">Core Settings</span>}
        </button>
      </div>
    </aside>
  );
};
