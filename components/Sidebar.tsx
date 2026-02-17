
import React from 'react';
import { AIProviderId, AppView } from '../types';
import { MessageSquare, Terminal as TerminalIcon, Settings, Plus, Sparkles } from 'lucide-react';

interface SidebarProps {
  activeProviderId: AIProviderId;
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  onOpenSettings: () => void;
  onNewChat: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeProviderId, 
  currentView, 
  onSelectView, 
  onOpenSettings,
  onNewChat
}) => {
  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-xl shadow-blue-600/20 transform -rotate-3">O</div>
        <div>
          <h1 className="font-black text-xl tracking-tight leading-none text-white">OmniChat</h1>
          <p className="text-[9px] text-blue-500 font-bold uppercase tracking-[0.2em] mt-1">Unified Node</p>
        </div>
      </div>

      <div className="px-4 py-2">
        <button
          onClick={onNewChat}
          className="group w-full flex items-center justify-between px-4 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-blue-600/30 active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            New Conversation
          </div>
          <Sparkles size={14} className="opacity-50" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-8 mt-4 custom-scrollbar">
        {/* Workspace Section */}
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-3">Workspace</p>
          <div className="space-y-1.5">
            <button
              onClick={() => onSelectView(AppView.CHAT)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all relative group ${
                currentView === AppView.CHAT 
                  ? 'bg-blue-600/10 text-blue-400 ring-1 ring-blue-500/20' 
                  : 'text-slate-400 hover:bg-slate-800/50 border border-transparent hover:text-slate-200'
              }`}
            >
              <MessageSquare size={18} className={currentView === AppView.CHAT ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-300'} />
              <span className="text-sm font-semibold tracking-tight">AI Multi-Chat</span>
              {currentView === AppView.CHAT && (
                <div className="absolute left-0 w-1 h-4 bg-blue-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => onSelectView(AppView.TERMINAL)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all relative group ${
                currentView === AppView.TERMINAL 
                  ? 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/20' 
                  : 'text-slate-400 hover:bg-slate-800/50 border border-transparent hover:text-slate-200'
              }`}
            >
              <TerminalIcon size={18} className={currentView === AppView.TERMINAL ? 'text-indigo-500' : 'text-slate-500 group-hover:text-slate-300'} />
              <span className="text-sm font-semibold tracking-tight">Cloud Terminal</span>
              {currentView === AppView.TERMINAL && (
                <div className="absolute left-0 w-1 h-4 bg-indigo-500 rounded-full" />
              )}
            </button>
          </div>
        </div>
      </nav>

      <div className="p-4 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800/50">
        <div className="flex items-center justify-between px-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 group hover:border-blue-500/50 transition-colors">
              <User size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Local Operator</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">System Ready</p>
              </div>
            </div>
          </div>
        </div>
        
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl font-bold text-xs transition-all border border-slate-700/50 group"
        >
          <Settings size={14} className="group-hover:rotate-45 transition-transform" />
          Settings & Identity
        </button>
      </div>
    </aside>
  );
};

const User = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
