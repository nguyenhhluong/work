
import React from 'react';
import { AIProviderId, ProviderInfo } from '../types';
import { X, Settings, CheckCircle2, ShieldCheck, LogOut, ArrowRight, Link, Fingerprint, Lock, Shield, Sparkles, Bot, ShieldAlert, Cpu, Terminal } from 'lucide-react';

interface SettingsModalProps {
  providers: ProviderInfo[]; 
  activeProviderId: AIProviderId; 
  onSelectProvider: (id: AIProviderId) => void; 
  onLogout: () => void; 
  onClose: () => void;
  agentSafetyLevel: 'low' | 'medium' | 'high';
  onSetAgentSafetyLevel: (level: 'low' | 'medium' | 'high') => void;
  agentAlwaysAsk: boolean;
  onSetAgentAlwaysAsk: (ask: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    providers, activeProviderId, onSelectProvider, onLogout, onClose,
    agentSafetyLevel, onSetAgentSafetyLevel, agentAlwaysAsk, onSetAgentAlwaysAsk
}) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md md:p-6 animate-in fade-in duration-300">
      <div className="glass-panel border-white/10 w-full h-full md:h-auto md:max-w-2xl md:rounded-[3rem] overflow-hidden shadow-[0_0_150px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-500 flex flex-col">
        <div className="p-8 md:p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.03] shrink-0">
          <div className="flex items-center gap-5">
            <div className="p-3.5 bg-grok-accent/10 text-grok-accent rounded-[1.5rem] border border-white/10 shadow-lg">
              <Settings size={24} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tighter text-white leading-none">SYSTEM CORE</h2>
              <p className="text-[10px] text-[#71717a] uppercase tracking-[0.3em] font-black mt-1.5">Omni Matrix Configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full text-grok-muted hover:text-white transition-all active:scale-90">
            <X size={26} />
          </button>
        </div>

        <div className="flex-1 p-8 md:p-10 space-y-12 overflow-y-auto custom-scrollbar">
          <section>
            <h3 className="text-[10px] font-black text-[#71717a] uppercase tracking-[0.3em] mb-5 px-1">OPERATOR SESSION</h3>
            <div className="p-6 glass-card rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-6 hover:bg-white/[0.05] transition-all group overflow-hidden relative">
              <div className="absolute top-0 left-0 w-32 h-32 bg-grok-success/5 blur-3xl"></div>
              <div className="flex items-center gap-5 w-full sm:w-auto relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-grok-success/10 flex items-center justify-center border border-white/10 shadow-inner">
                  <Fingerprint size={28} className="text-grok-success" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[16px] font-black text-white mb-1 tracking-tight">Active Identity Token</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-grok-success font-black uppercase tracking-widest flex items-center gap-1.5">
                      <ShieldCheck size={12} /> SECURE Handshake
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={onLogout} className="w-full sm:w-auto px-6 py-3.5 bg-grok-error/10 text-grok-error border border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-grok-error/20 transition-all flex items-center justify-center gap-2 active:scale-95">
                <LogOut size={16} /> Termination
              </button>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-5 px-1">
              <h3 className="text-[10px] font-black text-grok-success uppercase tracking-[0.3em] flex items-center gap-2">
                <Bot size={14} /> AGENT ENGINE CONFIGURATION
              </h3>
            </div>
            <div className="space-y-4">
                <div className="p-6 glass-card rounded-[2rem] border border-white/5 space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-[11px] font-black text-white uppercase tracking-widest">Protocol Safety Level</label>
                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${agentSafetyLevel === 'low' ? 'bg-grok-error/20 text-grok-error' : agentSafetyLevel === 'medium' ? 'bg-grok-accent/20 text-grok-accent' : 'bg-grok-success/20 text-grok-success'}`}>
                                {agentSafetyLevel} RISK
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {['low', 'medium', 'high'].map(level => (
                                <button 
                                    key={level} 
                                    onClick={() => onSetAgentSafetyLevel(level as any)}
                                    className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${agentSafetyLevel === level ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-[#71717a] hover:text-white'}`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <ShieldAlert size={18} className="text-grok-accent" />
                            <div>
                                <p className="text-xs font-bold text-white uppercase tracking-tight">HITL Enforcement</p>
                                <p className="text-[10px] text-[#71717a] font-medium">Always require confirmation before tool execution</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => onSetAgentAlwaysAsk(!agentAlwaysAsk)}
                            className={`w-12 h-6 rounded-full transition-all relative ${agentAlwaysAsk ? 'bg-grok-accent' : 'bg-[#27272a]'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${agentAlwaysAsk ? 'right-1' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="space-y-3 pt-2">
                         <label className="text-[11px] font-black text-white uppercase tracking-widest">Authorized toolsets</label>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                             {[
                                 // Fix: Added missing Terminal import from lucide-react above
                                 { name: 'Terminal Grid', icon: Terminal, active: true },
                                 { name: 'File Enclave', icon: Shield, active: true },
                                 { name: 'Web Oracle', icon: Sparkles, active: false },
                                 { name: 'Compute Nexus', icon: Cpu, active: true }
                             ].map(tool => (
                                 <div key={tool.name} className="flex items-center justify-between p-3 glass-card rounded-xl opacity-80">
                                     <div className="flex items-center gap-3">
                                         <tool.icon size={14} className={tool.active ? 'text-grok-success' : 'text-[#71717a]'} />
                                         <span className="text-[11px] font-bold text-white uppercase tracking-tight">{tool.name}</span>
                                     </div>
                                     <div className={`w-1.5 h-1.5 rounded-full ${tool.active ? 'bg-grok-success shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-[#71717a]'}`} />
                                 </div>
                             ))}
                         </div>
                    </div>

                    <button className="w-full py-4 bg-grok-accent text-white font-black uppercase tracking-widest rounded-2xl hover:brightness-110 transition-all shadow-xl active:scale-[0.98] text-[12px]">
                        Save Agent Preferences
                    </button>
                </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6 px-1">
              <h3 className="text-[10px] font-black text-[#71717a] uppercase tracking-[0.3em]">NEURAL ENGINE LINKS</h3>
              <div className="flex items-center gap-2 opacity-40">
                <Link size={12} className="text-[#71717a]" />
                <span className="text-[10px] text-[#71717a] font-black uppercase tracking-widest">BRIDGE STATUS: ACTIVE</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {providers.map((provider) => (
                <div 
                  key={provider.id} onClick={() => onSelectProvider(provider.id)}
                  className={`p-6 rounded-[2rem] border transition-all cursor-pointer relative group flex flex-col justify-between min-h-[160px] ${
                    activeProviderId === provider.id ? 'bg-grok-accent/10 border-[#1d9bf0]/40 shadow-[0_0_30px_rgba(29,155,240,0.2)]' : 'bg-black/40 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <span className="text-3xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">{provider.icon}</span>
                        <p className="font-black text-[15px] text-white tracking-tight uppercase">{provider.name}</p>
                    </div>
                    {provider.isConnected ? <CheckCircle2 size={18} className="text-grok-success" /> : <span className="text-[9px] font-black text-[#71717a] uppercase tracking-widest border border-white/10 px-2 py-0.5 rounded-lg">IDLE</span>}
                  </div>
                  <p className="text-[12px] text-[#71717a] leading-relaxed font-medium mb-4 pr-4">{provider.description}</p>
                  {activeProviderId === provider.id && (
                    <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[9px] text-grok-accent font-black uppercase tracking-[0.2em]">ROUTING PRIMARY</span>
                        <ArrowRight size={14} className="text-grok-accent animate-pulse" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white/[0.03] rounded-[2rem] p-8 border border-white/5 relative overflow-hidden group">
             <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-grok-accent/5 blur-[80px] group-hover:bg-grok-accent/10 transition-all duration-1000"></div>
             <div className="flex items-start gap-5 relative z-10">
                <Shield size={24} className="text-grok-accent shrink-0 mt-1" />
                <div>
                   <h4 className="font-black text-white text-[15px] mb-2 uppercase tracking-tight">ISOLATION PROTOCOL ACTIVE</h4>
                   <p className="text-[13px] text-[#71717a] leading-relaxed font-medium opacity-80">
                     Omni Matrix 3 uses zero-trust credential handling. Provider sessions are isolated within encrypted local fragments, ensuring the matrix backbone remains blind to your private keys.
                   </p>
                </div>
             </div>
          </section>
        </div>

        <div className="p-8 md:p-10 bg-black/60 backdrop-blur-xl border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5 text-[10px] font-black text-[#71717a] uppercase tracking-widest opacity-60">
               <Lock size={14} className="text-grok-success" /> AES-GCM 256
            </div>
            <div className="flex items-center gap-2.5 text-[10px] font-black text-[#71717a] uppercase tracking-widest opacity-60">
               <Fingerprint size={14} className="text-grok-accent" /> NEURAL-SYNC
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Sparkles size={14} className="text-[#71717a] animate-pulse" />
            <p className="text-[10px] font-mono text-[#71717a] uppercase tracking-tighter">omnicore_backbone_v3.2.0-PRO</p>
          </div>
        </div>
      </div>
    </div>
  );
};
