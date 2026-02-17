
import React from 'react';
import { AIProviderId, ProviderInfo } from '../types';
import { X, Settings, CheckCircle2, ShieldCheck, Cpu, Database, LogOut, ShieldAlert } from 'lucide-react';

interface SettingsModalProps {
  providers: ProviderInfo[];
  activeProviderId: AIProviderId;
  onSelectProvider: (id: AIProviderId) => void;
  onLogout: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  providers,
  activeProviderId,
  onSelectProvider,
  onLogout,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6 animate-in fade-in duration-300">
      <div className="bg-grok-card border border-grok-border w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="p-8 border-b border-grok-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-grok-accent/10 text-grok-accent rounded-2xl border border-grok-accent/20">
              <Settings size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white leading-none">Settings</h2>
              <p className="text-[10px] text-grok-muted uppercase tracking-[0.2em] font-black mt-1">Protocol • Identity • Network</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-grok-muted hover:text-white transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-10 overflow-y-auto max-h-[60vh] custom-scrollbar">
          <section>
            <h3 className="text-[10px] font-black text-grok-muted uppercase tracking-[0.2em] mb-6 px-1">Active Reasoning Engine</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map((provider) => (
                <div 
                  key={provider.id}
                  onClick={() => onSelectProvider(provider.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative group ${
                    activeProviderId === provider.id 
                      ? 'bg-grok-accent/5 border-grok-accent shadow-xl shadow-grok-accent/5' 
                      : 'bg-black border-grok-border/50 hover:border-grok-border hover:bg-white/5'
                  }`}
                >
                  {activeProviderId === provider.id && (
                    <div className="absolute top-4 right-4 text-grok-accent">
                      <CheckCircle2 size={16} />
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{provider.icon}</span>
                    <p className="font-bold text-sm text-white">{provider.name}</p>
                  </div>
                  <p className="text-[11px] text-grok-muted leading-relaxed font-medium">{provider.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white/5 rounded-2xl p-6 border border-grok-border">
             <div className="flex items-start gap-4">
                <ShieldCheck size={20} className="text-grok-success shrink-0 mt-1" />
                <div>
                   <h4 className="font-bold text-white text-sm mb-1">Neural Encryption</h4>
                   <p className="text-xs text-grok-muted leading-relaxed">
                     OmniChat implements high-volatility ephemeral storage. Your SSH keys and terminal history reside strictly within encrypted memory (RAM) and are purged upon sign-out.
                   </p>
                </div>
             </div>
          </section>
        </div>

        <div className="p-8 bg-black border-t border-grok-border flex items-center justify-between">
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-6 py-3 bg-grok-error/10 text-grok-error hover:bg-grok-error/20 border border-grok-error/20 rounded-xl text-xs font-bold transition-all"
          >
            <LogOut size={16} /> Disconnect Account
          </button>
          <div className="flex items-center gap-4 text-[9px] font-black text-grok-muted uppercase tracking-widest opacity-40">
            <span className="flex items-center gap-1.5">TLS 1.3</span>
            <span className="flex items-center gap-1.5">AES-256</span>
          </div>
        </div>
      </div>
    </div>
  );
};
