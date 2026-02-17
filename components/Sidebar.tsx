
import React from 'react';
import { AIProviderId, ProviderInfo, AppView } from '../types';
import { MessageSquare, Terminal as TerminalIcon, Settings, Github } from 'lucide-react';

interface SidebarProps {
  providers: ProviderInfo[];
  activeId: AIProviderId;
  currentView: AppView;
  onSelectProvider: (id: AIProviderId) => void;
  onSelectView: (view: AppView) => void;
  onLogin: (id: AIProviderId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  providers, 
  activeId, 
  currentView, 
  onSelectProvider, 
  onSelectView, 
  onLogin 
}) => {
  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-600/20">O</div>
        <h1 className="font-bold text-xl tracking-tight">OmniChat</h1>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Navigation Section */}
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">Navigation</p>
          <div className="space-y-1">
            <button
              onClick={() => onSelectView(AppView.CHAT)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                currentView === AppView.CHAT 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                  : 'text-slate-400 hover:bg-slate-800 border border-transparent'
              }`}
            >
              <MessageSquare size={18} />
              <span className="text-sm font-medium">Chat Assistant</span>
            </button>
            <button
              onClick={() => onSelectView(AppView.TERMINAL)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                currentView === AppView.TERMINAL 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                  : 'text-slate-400 hover:bg-slate-800 border border-transparent'
              }`}
            >
              <TerminalIcon size={18} />
              <span className="text-sm font-medium">SSH Terminal</span>
            </button>
          </div>
        </div>

        {/* AI Providers - Only show if in Chat View */}
        {currentView === AppView.CHAT && (
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">AI Providers</p>
            <div className="space-y-1">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => onSelectProvider(provider.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    activeId === provider.id 
                      ? 'bg-slate-800 text-slate-100 border border-slate-700' 
                      : 'text-slate-500 hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl grayscale-[0.5] group-hover:grayscale-0">{provider.icon}</span>
                    <div className="text-left">
                      <p className="text-sm font-medium">{provider.name}</p>
                    </div>
                  </div>
                  {!provider.isConnected && activeId === provider.id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {!providers.find(p => p.id === activeId)?.isConnected && currentView === AppView.CHAT && (
          <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <h3 className="text-sm font-semibold mb-2">Auth Required</h3>
            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              Connect to {providers.find(p => p.id === activeId)?.name} using GitHub Device Flow.
            </p>
            <button 
              onClick={() => onLogin(activeId)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-white text-slate-900 text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Github size={14} /> Connect GitHub
            </button>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold">GU</div>
            <div>
              <p className="text-xs font-medium text-slate-200">Guest User</p>
              <p className="text-[10px] text-slate-500 font-mono uppercase">V1.2.0-PRO</p>
            </div>
          </div>
          <button className="p-2 text-slate-500 hover:text-slate-300 transition-colors">
            <Settings size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
