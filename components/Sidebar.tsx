
import React from 'react';
import { AppView, User } from '../types';
import { MessageSquare, Terminal as TerminalIcon, Settings, Plus, Bot, Command, PanelLeft, X } from 'lucide-react';

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
  isMobileOpen: boolean;
  onMobileClose: () => void;
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
  user,
  isMobileOpen,
  onMobileClose
}) => {
  const sidebarClasses = `
    fixed inset-y-0 left-0 z-[100] glass-panel transition-all duration-500 ease-in-out
    md:static md:translate-x-0 ${isCollapsed ? 'md:w-20' : 'md:w-64'}
    ${isMobileOpen ? 'translate-x-0 w-[85%] sm:w-72 shadow-[0_0_100px_rgba(0,0,0,1)]' : '-translate-x-full md:translate-x-0'}
  `;

  const NavButton = ({ 
    active, 
    onClick, 
    icon: Icon, 
    label, 
    colorClass = "text-white", 
    activeBg = "bg-white/10 border-white/10 shadow-lg",
    idleText = "text-grok-muted"
  }: { 
    active: boolean, 
    onClick: () => void, 
    icon: any, 
    label: string, 
    colorClass?: string,
    activeBg?: string,
    idleText?: string
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-2 rounded-2xl transition-all group/btn ${isCollapsed && !isMobileOpen ? 'justify-center' : ''}`}
    >
      <div className={`w-11 h-11 flex items-center justify-center rounded-xl border transition-all shrink-0 ${active ? `${activeBg} ${colorClass}` : `border-transparent ${idleText} group-hover/btn:bg-white/5 group-hover/btn:text-white`}`}>
        <Icon size={20} />
      </div>
      {(!isCollapsed || isMobileOpen) && (
        <span className={`text-[14px] font-bold transition-colors ${active ? colorClass : `${idleText} group-hover/btn:text-white`}`}>
          {label}
        </span>
      )}
    </button>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-md z-[95] md:hidden transition-opacity duration-500 ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onMobileClose}
      />

      <aside className={sidebarClasses}>
        <div className="flex items-center justify-between p-6 mb-2">
          <div className={`flex items-center gap-3 ${isCollapsed && !isMobileOpen ? 'md:justify-center' : ''}`}>
            <div className="w-10 h-10 bg-grok-accent rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(29,155,240,0.4)] transition-transform hover:scale-105">
              <Command size={22} className="text-white" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col">
                <h1 className="font-bold text-lg text-white leading-none tracking-tight">Omni</h1>
                <span className="text-[8px] text-grok-accent font-black tracking-[0.2em] uppercase mt-1">Matrix v3</span>
              </div>
            )}
          </div>
          <button onClick={onMobileClose} className="md:hidden p-2 text-grok-muted hover:text-white transition-colors">
            <X size={20} />
          </button>
          <button 
            onClick={() => onToggleCollapse(!isCollapsed)}
            className="hidden md:flex absolute -right-3.5 top-8 p-1.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-grok-muted hover:text-white transition-all z-50 hover:border-grok-accent/50 group"
          >
            <PanelLeft size={14} className={`${isCollapsed ? 'rotate-180' : ''} transition-transform duration-500`} />
          </button>
        </div>

        <div className="px-4 py-2 mb-4">
          <button
            onClick={onNewChat}
            className={`w-full flex items-center gap-3 bg-white text-black rounded-full font-black text-[13px] tracking-tight transition-all hover:bg-white/90 active:scale-95 shadow-[0_4px_20px_rgba(255,255,255,0.2)] ${isCollapsed && !isMobileOpen ? 'md:justify-center md:h-12 md:w-12 md:p-0' : 'px-5 py-3.5'}`}
          >
            <Plus size={20} />
            {(!isCollapsed || isMobileOpen) && <span>New Session</span>}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
          <NavButton 
            active={currentView === AppView.CHAT}
            onClick={() => onSelectView(AppView.CHAT)}
            icon={MessageSquare}
            label="Neural Chat"
          />
          <NavButton 
            active={currentView === AppView.TERMINAL}
            onClick={() => onSelectView(AppView.TERMINAL)}
            icon={TerminalIcon}
            label="Terminal Grid"
          />
          <NavButton 
            active={currentView === AppView.AGENT}
            onClick={() => onSelectView(AppView.AGENT)}
            icon={Bot}
            label="Agent Engine"
            colorClass="text-grok-success"
            activeBg="bg-grok-success/10 border-grok-success/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
            idleText="text-grok-muted"
          />
        </nav>

        <div className="p-4 border-t border-white/5 space-y-4">
          {user && (
            <div className={`p-2 bg-white/5 rounded-2xl border border-white/5 group/user hover:border-grok-accent/30 transition-all cursor-default overflow-hidden relative ${isCollapsed && !isMobileOpen ? 'flex justify-center' : ''}`}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-grok-accent/10 blur-xl opacity-0 group-hover/user:opacity-100 transition-opacity"></div>
              <div className="flex items-center gap-3 relative z-10">
                <img src={user.image || ''} alt={user.name || ''} className="w-10 h-10 rounded-full border-2 border-white/10 transition-transform group-hover/user:scale-105" />
                {(!isCollapsed || isMobileOpen) && (
                  <div className="min-w-0">
                    <p className="text-[9px] text-[#71717a] font-black uppercase tracking-widest mb-0.5">Operator</p>
                    <p className="text-sm font-bold text-white truncate">{user.name}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <button 
            onClick={onOpenSettings}
            className={`w-full flex items-center gap-4 p-2 text-grok-muted hover:text-white transition-all rounded-2xl group/settings ${isCollapsed && !isMobileOpen ? 'justify-center' : ''}`}
          >
            <div className="w-11 h-11 flex items-center justify-center rounded-xl border border-transparent transition-all group-hover/settings:bg-white/5">
              <Settings size={20} />
            </div>
            {(!isCollapsed || isMobileOpen) && <span className="text-[14px] font-bold">Settings</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
