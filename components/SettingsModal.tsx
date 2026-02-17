
import React, { useState } from 'react';
import { AIProviderId, ProviderInfo } from '../types';
import { 
  X, Settings, CheckCircle2, ShieldCheck, LogOut, 
  ArrowRight, Fingerprint, Lock, Shield, 
  Sparkles, Bot, ShieldAlert, Cpu, Terminal, ChevronDown, Activity
} from 'lucide-react';

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
  const [isProviderSelectorOpen, setIsProviderSelectorOpen] = useState(false);
  
  const activeProvider = providers.find(p => p.id === activeProviderId) || providers[0];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md md:p-6 animate-in fade-in duration-300">
      <div className="glass-panel border-white/10 w-full h-full md:h-auto md:max-w-2xl md:rounded-[3rem] overflow-hidden shadow-[0_0_150px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-500 flex flex-col">
        {/* Header */}
        <div className="p-8 md:p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.03] shrink-0">
          <div className="flex items-center gap-5">
            <div className="p-3.5 bg-white/5 text-white rounded-[1.5rem] border border-white/10 shadow-lg">
              <Settings size={24} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tighter text-white leading-none">SYSTEM CORE</h2>
              <p className="text-[10px] text-[#71717a] uppercase tracking-[0.3em] font-black mt-1.5">HEIFI Matrix Configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full text-grok-muted hover:text-white transition-all active:scale-90">
            <X size={26} />
          </button>
        </div>

        <div className="flex-1 p-8 md:p-10 space-y-10 overflow-y-auto custom-scrollbar">
          {/* Provider Selector - Compact Version */}
          <section>
            <div className="flex items-center justify-between mb-5 px-1">
              <h3 className="text-[10px] font-black text-[#71717a] uppercase tracking-[0.3em]">Neural Reasoning Engine</h3>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse"></div>
                <span className="text-[9px] text-white/60 font-black uppercase tracking-widest">Link Secure</span>
              </div>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsProviderSelectorOpen(!isProviderSelectorOpen)}
                className="w-full p-6 glass-card rounded-[2rem] border border-white/10 flex items-center justify-between hover:bg-white/[0.05] transition-all group active:scale-[0.99]"
              >
                <div className="flex items-center gap-5">
                  <span className="text-3xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform">
                    {activeProvider.icon}
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-black text-white uppercase tracking-tight">{activeProvider.name}</p>
                    <p className="text-[11px] text-[#71717a] font-medium">{activeProvider.description}</p>
                  </div>
                </div>
                <ChevronDown size={20} className={`text-[#71717a] transition-transform duration-300 ${isProviderSelectorOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProviderSelectorOpen && (
                <div className="absolute top-full left-0 w-full mt-3 z-20 glass-panel rounded-[2rem] border border-white/10 p-3 shadow-2xl animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 gap-2">
                    {providers.map((provider) => (
                      <button 
                        key={provider.id}
                        onClick={() => {
                          onSelectProvider(provider.id);
                          setIsProviderSelectorOpen(false);
                        }}
                        className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                          activeProviderId === provider.id 
                            ? 'bg-white/5 border border-white/10' 
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-xl">{provider.icon}</span>
                          <div className="text-left">
                            <p className={`text-xs font-black uppercase tracking-tight ${activeProviderId === provider.id ? 'text-white' : 'text-[#71717a]'}`}>
                              {provider.name}
                            </p>
                            <p className="text-[9px] text-[#71717a] font-medium">
                              {provider.isConnected ? 'Bridge Active' : 'Disconnected'}
                            </p>
                          </div>
                        </div>
                        {provider.isConnected && <CheckCircle2 size={14} className="text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Agent Configuration - Expanded */}
          <section>
            <div className="flex items-center justify-between mb-5 px-1">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                <Bot size={14} /> Agent Matrix Control
              </h3>
            </div>
            
            <div className="p-6 glass-card rounded-[2.5rem] border border-white/5 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 blur-3xl -z-10"></div>
                
                {/* Safety Level */}
                <div>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <label className="text-[11px] font-black text-white uppercase tracking-widest">Protocol Safety Level</label>
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${
                          agentSafetyLevel === 'low' ? 'bg-grok-error/20 text-grok-error' : 
                          agentSafetyLevel === 'medium' ? 'bg-white/10 text-white' : 
                          'bg-grok-success/20 text-grok-success'
                        }`}>
                            {agentSafetyLevel} RISK TOLERANCE
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {['low', 'medium', 'high'].map(level => (
                            <button 
                                key={level} 
                                onClick={() => onSetAgentSafetyLevel(level as any)}
                                className={`py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                  agentSafetyLevel === level 
                                    ? 'bg-white/10 border-white/20 text-white shadow-xl scale-[1.02]' 
                                    : 'border-transparent text-[#71717a] hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-[11px] font-black text-white uppercase tracking-widest px-1">Autonomous Enforcements</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 bg-[#111111] rounded-[2rem] border border-[#27272a] shadow-inner group flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                    <ShieldAlert size={20} className="text-white opacity-40" />
                                </div>
                                <div>
                                    <p className="text-[12px] font-bold text-white uppercase tracking-tight">HITL Required</p>
                                    <p className="text-[9px] text-[#71717a] font-medium leading-tight">Manual Auth on Tools</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => onSetAgentAlwaysAsk(!agentAlwaysAsk)}
                                className={`w-12 h-6 rounded-full transition-all relative ${agentAlwaysAsk ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-[#27272a]'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 ${agentAlwaysAsk ? 'bg-black' : 'bg-white'} rounded-full transition-all shadow-md ${agentAlwaysAsk ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="p-5 bg-[#111111] rounded-[2rem] border border-[#27272a] shadow-inner flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                    <Activity size={20} className="text-white opacity-40" />
                                </div>
                                <div>
                                    <p className="text-[12px] font-bold text-white uppercase tracking-tight">Max Loops</p>
                                    <p className="text-[9px] text-[#71717a] font-medium leading-tight">Loop Limit Threshold</p>
                                </div>
                            </div>
                            <input 
                                type="number" 
                                defaultValue={30} 
                                className="w-12 bg-black border border-[#27272a] rounded-lg py-1 px-2 text-center text-xs font-black text-white focus:border-white outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                     <label className="text-[11px] font-black text-white uppercase tracking-widest px-1">Subsystem Permissions</label>
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                         {[
                             { name: 'Terminal', icon: Terminal, active: true },
                             { name: 'Files', icon: Shield, active: true },
                             { name: 'Search', icon: Sparkles, active: false },
                             { name: 'Compute', icon: Cpu, active: true }
                         ].map(tool => (
                             <div key={tool.name} className="flex flex-col items-center gap-3 p-4 bg-[#111111] rounded-2xl border border-[#27272a] group hover:border-white/10 transition-all">
                                 <div className={`p-3 rounded-xl ${tool.active ? 'bg-white/10' : 'bg-white/5 opacity-40'}`}>
                                    <tool.icon size={18} className={tool.active ? 'text-white' : 'text-[#71717a]'} />
                                 </div>
                                 <span className={`text-[9px] font-black uppercase tracking-widest ${tool.active ? 'text-white' : 'text-[#71717a]'}`}>{tool.name}</span>
                             </div>
                         ))}
                     </div>
                </div>

                <button className="w-full py-5 bg-white text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:brightness-110 transition-all shadow-xl active:scale-[0.98] text-[13px] shadow-white/5">
                    Commit Policy Changes
                </button>
            </div>
          </section>

          {/* Session Termination */}
          <section>
            <h3 className="text-[10px] font-black text-[#71717a] uppercase tracking-[0.3em] mb-5 px-1">Security Perimeter</h3>
            <div className="p-6 glass-card rounded-[2.5rem] flex flex-col sm:flex-row items-center justify-between gap-6 hover:bg-white/[0.05] transition-all group overflow-hidden relative">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 blur-3xl -z-10"></div>
              <div className="flex items-center gap-5 w-full sm:w-auto">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 transition-transform">
                  <Fingerprint size={28} className="text-[#71717a]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-black text-white mb-1 tracking-tight">Operator Profile</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-grok-muted font-black uppercase tracking-widest">Auth: 256-bit AES</span>
                  </div>
                </div>
              </div>
              <button onClick={onLogout} className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg">
                <LogOut size={16} /> Close Socket
              </button>
            </div>
          </section>

          {/* Infrastructure Info */}
          <section className="bg-white/[0.03] rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group">
             <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-white/5 blur-[80px] group-hover:bg-white/10 transition-all duration-1000"></div>
             <div className="flex items-start gap-5 relative z-10">
                <Shield size={24} className="text-white opacity-40 shrink-0 mt-1" />
                <div>
                   <h4 className="font-black text-white text-[15px] mb-2 uppercase tracking-tight">Z-TRUST BRIDGE ACTIVE</h4>
                   <p className="text-[13px] text-[#71717a] leading-relaxed font-medium opacity-80">
                     HEIFI handles credentials in ephemeral isolated memory segments. Your secret fragments never cross the neural link to the backbone AI clusters.
                   </p>
                </div>
             </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-8 md:p-10 bg-black/60 backdrop-blur-xl border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5 text-[10px] font-black text-[#71717a] uppercase tracking-widest opacity-60">
               <Lock size={14} className="text-white opacity-40" /> Encrypted
            </div>
            <div className="flex items-center gap-2.5 text-[10px] font-black text-[#71717a] uppercase tracking-widest opacity-60">
               <ArrowRight size={14} className="text-white opacity-40" /> Matrix-V3
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Sparkles size={14} className="text-[#71717a] animate-pulse" />
            <p className="text-[10px] font-mono text-[#71717a] uppercase tracking-tighter">HEIFI_v1.0.0-PRO</p>
          </div>
        </div>
      </div>
    </div>
  );
};
