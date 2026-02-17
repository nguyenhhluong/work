
import React from 'react';
import { AIProviderId, ProviderInfo } from '../types';
import { X, Settings, Github, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';

interface SettingsModalProps {
  providers: ProviderInfo[];
  activeProviderId: AIProviderId;
  onSelectProvider: (id: AIProviderId) => void;
  onLogin: (id: AIProviderId) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  providers,
  activeProviderId,
  onSelectProvider,
  onLogin,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-white/10">
        <div className="p-6 border-b border-slate-800/50 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/10 text-blue-500 rounded-xl">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">System Settings</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Preferences & Authentication</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <section>
            <div className="flex items-center gap-2 mb-4 px-1">
              <Cpu size={14} className="text-blue-500" />
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Model Orchestration</h3>
            </div>
            <div className="space-y-3">
              {providers.map((provider) => (
                <div 
                  key={provider.id}
                  onClick={() => onSelectProvider(provider.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                    activeProviderId === provider.id 
                      ? 'bg-blue-600/10 border-blue-600/50 shadow-[0_0_20px_rgba(37,99,235,0.1)]' 
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {activeProviderId === provider.id && (
                    <div className="absolute top-0 right-0 p-2 text-blue-500 animate-in fade-in slide-in-from-top-1">
                      <CheckCircle2 size={16} />
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl grayscale group-hover:grayscale-0 transition-all transform group-hover:scale-110 duration-300">
                        {provider.icon}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-100">{provider.name}</p>
                        <p className="text-[11px] text-slate-500 leading-tight pr-4">{provider.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-800/30">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${provider.isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {provider.isConnected ? 'Verified Identity' : 'Auth Required'}
                      </span>
                    </div>
                    
                    {!provider.isConnected ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onLogin(provider.id);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-blue-400 rounded-lg transition-colors border border-slate-700"
                      >
                        <Github size={14} /> Device Flow
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <ShieldCheck size={14} /> Active Session
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-6 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800/50 text-center">
          <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-3">
            <span>OAuth 2.0</span>
            <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
            <span>AES-256</span>
            <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
            <span>TLS 1.3</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed max-w-sm mx-auto">
            OmniChat uses secure ephemeral sessions. Your API keys and tokens are never persisted in plain text on our servers.
          </p>
        </div>
      </div>
    </div>
  );
};
