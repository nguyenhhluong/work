
import React from 'react';
import { AIProviderId, ProviderInfo } from '../types';
import { X, Settings, CheckCircle2, ShieldCheck, LogOut, Loader2, ArrowRight, Link, Fingerprint, Lock, Shield, Sparkles } from 'lucide-react';

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
      <div className="bg-grok-card border border-grok-border w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500">
        <div className="p-8 border-b border-grok-border flex items-center justify-between bg-black/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-grok-accent/10 text-grok-accent rounded-2xl border border-grok-accent/20">
              <Settings size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white leading-none">System Core</h2>
              <p className="text-[10px] text-grok-muted uppercase tracking-[0.2em] font-black mt-1">Configuration Node</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-grok-muted hover:text-white transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-10 overflow-y-auto max-h-[60vh] custom-scrollbar">
          {/* OmniChat App-Level Identity Section */}
          <section>
            <h3 className="text-[10px] font-black text-grok-muted uppercase tracking-[0.2em] mb-4 px-1">Primary App Identity</h3>
            <div className="p-6 bg-white/[0.03] rounded-3xl border border-grok-border flex items-center justify-between hover:bg-white/[0.05] transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-grok-success/10 flex items-center justify-center border border-grok-success/20 relative">
                  <Fingerprint size={24} className="text-grok-success" />
                  <div className="absolute inset-0 bg-grok-success/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-0.5">Operator Session</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-grok-success font-black uppercase tracking-widest flex items-center gap-1">
                      <ShieldCheck size={10} /> Handshake Verified
                    </span>
                    <span className="w-1 h-1 bg-grok-border rounded-full"></span>
                    <span className="text-[9px] text-grok-muted font-black uppercase tracking-widest">Nexus-V4</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onLogout}
                className="px-5 py-2.5 bg-grok-error/10 text-grok-error border border-grok-error/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-grok-error/20 transition-all flex items-center gap-2"
              >
                <LogOut size={14} /> Kill Identity
              </button>
            </div>
          </section>

          {/* AI Providers Section */}
          <section>
            <div className="flex items-center justify-between mb-6 px-1">
              <h3 className="text-[10px] font-black text-grok-muted uppercase tracking-[0.2em]">Neural Engine Links</h3>
              <div className="flex items-center gap-2 opacity-40">
                <Link size={10} className="text-grok-muted" />
                <span className="text-[9px] text-grok-muted font-black uppercase tracking-widest">Bridge Active</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map((provider) => (
                <div 
                  key={provider.id}
                  onClick={() => onSelectProvider(provider.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between min-h-[140px] ${
                    activeProviderId === provider.id 
                      ? 'bg-grok-accent/5 border-grok-accent shadow-[0_0_30px_rgba(29,155,240,0.1)]' 
                      : 'bg-black border-grok-border/50 hover:border-grok-border hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl group-hover:scale-110 transition-transform duration-500 drop-shadow-lg">{provider.icon}</span>
                        <p className="font-bold text-sm text-white">{provider.name}</p>
                    </div>
                    {provider.isConnected ? (
                        <div className="flex items-center gap-1.5 text-grok-success">
                            <CheckCircle2 size={14} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Linked</span>
                        </div>
                    ) : (
                        <div className="px-3 py-1 bg-grok-secondary rounded-lg border border-grok-border text-grok-muted text-[8px] font-black uppercase tracking-widest group-hover:text-grok-accent group-hover:border-grok-accent/50 transition-all">
                            Connect
                        </div>
                    )}
                  </div>
                  <p className="text-[11px] text-grok-muted leading-relaxed font-medium mb-4 pr-4">{provider.description}</p>
                  
                  {activeProviderId === provider.id && (
                    <div className="mt-auto pt-2 border-t border-grok-accent/10 flex items-center justify-between">
                        <span className="text-[8px] text-grok-accent font-black uppercase tracking-widest">Primary Routing Path</span>
                        <ArrowRight size={12} className="text-grok-accent animate-pulse" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Infrastructure Security Note */}
          <section className="bg-grok-accent/5 rounded-3xl p-6 border border-grok-accent/20 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-48 h-48 bg-grok-accent/10 blur-[60px] -mr-24 -mt-24 group-hover:bg-grok-accent/20 transition-all duration-1000"></div>
             <div className="flex items-start gap-4 relative z-10">
                <Shield size={20} className="text-grok-accent shrink-0 mt-1" />
                <div>
                   <h4 className="font-bold text-white text-sm mb-1">Grid Isolation Protocol</h4>
                   <p className="text-xs text-grok-muted leading-relaxed opacity-80">
                     OmniChat implements high-fidelity session isolation. App-level identity is independent of AI provider links. All provider tokens are stored within your local encrypted secure enclave and are never synchronized to external cloud storage.
                   </p>
                </div>
             </div>
          </section>
        </div>

        <div className="p-8 bg-black border-t border-grok-border flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[9px] font-black text-grok-muted uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
               <Lock size={12} className="text-grok-success" />
               AES-256 GCM
            </div>
            <div className="flex items-center gap-2 text-[9px] font-black text-grok-muted uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
               <Fingerprint size={12} className="text-grok-accent" />
               E2EE ACTIVE
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles size={12} className="text-grok-muted opacity-30" />
            <p className="text-[9px] font-mono text-grok-muted lowercase opacity-30">omnicore_node_gate_v3.2.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};
