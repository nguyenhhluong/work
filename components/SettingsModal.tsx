
import React, { useState, useEffect } from 'react';
import { AIProviderId, ProviderInfo, LocalProviderConfig } from '../types';
import { LocalAiService } from '../services/localAiService';
import { 
  X, Settings, CheckCircle2, ShieldCheck, LogOut, 
  Fingerprint, Lock, Shield, 
  Sparkles, Bot, ShieldAlert, Cpu, Terminal, ChevronDown, Activity, Globe, RefreshCw,
  Zap, Database, HardDrive, Key
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
  localConfig: LocalProviderConfig;
  onSetLocalConfig: (config: LocalProviderConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    providers, activeProviderId, onSelectProvider, onLogout, onClose,
    agentSafetyLevel, onSetAgentSafetyLevel, agentAlwaysAsk, onSetAgentAlwaysAsk,
    localConfig, onSetLocalConfig
}) => {
  const [isProviderSelectorOpen, setIsProviderSelectorOpen] = useState(false);
  const [localModels, setLocalModels] = useState<string[]>([]);
  const [isRefreshingModels, setIsRefreshingModels] = useState(false);
  
  const activeProvider = providers.find(p => p.id === activeProviderId) || providers[0];

  const handleRefreshModels = async () => {
    setIsRefreshingModels(true);
    try {
      const models = await LocalAiService.fetchModels(localConfig.baseUrl);
      setLocalModels(models);
      if (models.length > 0 && !models.includes(localConfig.model)) {
        onSetLocalConfig({ ...localConfig, model: models[0] });
      }
    } catch (e) {
      console.error("Failed to fetch local models");
    } finally {
      setIsRefreshingModels(false);
    }
  };

  useEffect(() => {
    if (activeProviderId === AIProviderId.LOCAL) {
      handleRefreshModels();
    }
  }, [localConfig.baseUrl]);

  const getSafetyValue = () => {
    if (agentSafetyLevel === 'low') return 0;
    if (agentSafetyLevel === 'medium') return 50;
    return 100;
  };

  const handleSafetyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (val < 33) onSetAgentSafetyLevel('low');
    else if (val < 66) onSetAgentSafetyLevel('medium');
    else onSetAgentSafetyLevel('high');
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/98 backdrop-blur-3xl md:p-12 animate-in fade-in duration-500">
      <div className="w-full h-full md:max-w-4xl md:h-[92vh] bg-transparent flex flex-col animate-in zoom-in-95 duration-500 overflow-hidden relative">
        
        {/* Immersive Header */}
        <div className="px-8 md:px-12 py-12 flex flex-col items-center shrink-0 text-center relative border-b border-white/5">
          <div className="flex items-center gap-8 mb-6">
            <div className="w-14 h-14 bg-[#0a0a0a] border border-white/10 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.05)]">
              <Settings size={28} className="text-white" />
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-white uppercase leading-none">Core Control</h2>
            <button 
                onClick={onClose} 
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-all active:scale-90 border border-white/10 shadow-lg"
            >
                <X size={24} />
            </button>
          </div>
          <p className="text-[10px] text-[#71717a] uppercase tracking-[0.5em] font-black opacity-50">
            Nexus v3.4 // Global Node Protocol
          </p>
        </div>

        {/* Scrollable Command Center */}
        <div className="flex-1 overflow-y-auto px-8 md:px-12 py-12 custom-scrollbar space-y-16">
          
          {/* Intelligence Interface Section */}
          <section className="bg-[#0a0a0a]/60 border border-[#1a1a1a] rounded-[3rem] p-12 relative overflow-hidden group shadow-2xl">
            <div className="flex items-center gap-4 mb-10 opacity-30">
              <Zap size={16} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Intelligence Matrix</h3>
            </div>
            <div className="relative">
              <button 
                onClick={() => setIsProviderSelectorOpen(!isProviderSelectorOpen)}
                className="w-full p-10 bg-white/[0.02] rounded-[2rem] border border-white/5 flex items-center justify-between hover:bg-white/[0.04] transition-all group/btn"
              >
                <div className="flex items-center gap-8">
                  <span className="text-5xl drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">{activeProvider.icon}</span>
                  <div className="text-left">
                    <p className="text-2xl font-black text-white uppercase">{activeProvider.name}</p>
                    <p className="text-[14px] text-[#71717a] font-medium mt-1 leading-relaxed max-w-md">{activeProvider.description}</p>
                  </div>
                </div>
                <ChevronDown size={28} className={`text-[#3f3f46] transition-transform duration-500 ${isProviderSelectorOpen ? 'rotate-180 text-white' : ''}`} />
              </button>
              {isProviderSelectorOpen && (
                <div className="absolute top-full left-0 w-full mt-4 z-50 bg-[#050505] rounded-[2.5rem] border border-white/10 p-6 shadow-2xl animate-in slide-in-from-top-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {providers.map((provider) => (
                      <button 
                        key={provider.id}
                        onClick={() => { onSelectProvider(provider.id); setIsProviderSelectorOpen(false); }}
                        className={`flex items-center justify-between p-6 rounded-[1.5rem] transition-all ${activeProviderId === provider.id ? 'bg-white/10 border border-white/10' : 'hover:bg-white/5 border border-transparent opacity-40 hover:opacity-100'}`}
                      >
                        <div className="flex items-center gap-6">
                          <span className="text-3xl">{provider.icon}</span>
                          <div className="text-left">
                            <p className="text-sm font-black text-white uppercase">{provider.name}</p>
                            <p className="text-[10px] text-[#71717a] font-bold mt-1 uppercase tracking-widest">{provider.isConnected ? 'Bridge Ready' : 'Standby'}</p>
                          </div>
                        </div>
                        {provider.isConnected && <CheckCircle2 size={20} className="text-[#1d9bf0]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Logic & Safety Section */}
          <section className="bg-[#0a0a0a]/60 border border-[#1a1a1a] rounded-[3rem] p-12 relative overflow-hidden group shadow-2xl">
            <div className="flex items-center gap-4 mb-12 opacity-30">
              <Bot size={20} className="text-[#1d9bf0]" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Autonomous Protocol</h3>
            </div>
            
            <div className="space-y-16">
              <div className="space-y-8">
                <div className="flex items-center justify-between px-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xl font-black text-white uppercase">Safety Level</label>
                    <p className="text-[11px] text-[#71717a] font-black uppercase opacity-40">Boundary Constraint</p>
                  </div>
                  <span className={`text-[11px] font-black uppercase px-6 py-3 rounded-xl border ${agentSafetyLevel === 'low' ? 'border-red-500/20 text-red-400' : agentSafetyLevel === 'medium' ? 'border-white/10 text-white' : 'border-emerald-500/20 text-emerald-400'}`}>
                    {agentSafetyLevel} Risk
                  </span>
                </div>
                <div className="px-2">
                  <input type="range" min="0" max="100" value={getSafetyValue()} onChange={handleSafetyChange} className="w-full h-3 bg-[#111] rounded-full appearance-none cursor-pointer accent-[#1d9bf0]" />
                  <div className="flex justify-between mt-6 text-[10px] font-black text-[#3f3f46] uppercase tracking-[0.3em]">
                    <span>Expansive</span>
                    <span>Standard</span>
                    <span>Restricted</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-10 bg-white/[0.01] rounded-[2.5rem] border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <ShieldAlert size={28} className="text-[#1d9bf0]" />
                    <div className="text-left">
                      <p className="text-lg font-black text-white uppercase">Manual Auth</p>
                      <p className="text-[11px] text-[#52525b] font-bold mt-1 uppercase">Operator Handshake</p>
                    </div>
                  </div>
                  <button onClick={() => onSetAgentAlwaysAsk(!agentAlwaysAsk)} className={`w-16 h-8 rounded-full transition-all relative p-1 ${agentAlwaysAsk ? 'bg-[#1d9bf0]' : 'bg-[#222]'}`}>
                    <div className={`w-6 h-6 bg-white rounded-full transition-all shadow-xl ${agentAlwaysAsk ? 'translate-x-8' : 'translate-x-0'}`} />
                  </button>
                </div>
                <div className="p-10 bg-white/[0.01] rounded-[2.5rem] border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <Activity size={28} className="text-[#3f3f46]" />
                    <div className="text-left">
                      <p className="text-lg font-black text-white uppercase">Recursion</p>
                      <p className="text-[11px] text-[#52525b] font-bold mt-1 uppercase">Cycle Threshold</p>
                    </div>
                  </div>
                  <input type="number" defaultValue={30} className="w-20 bg-black/60 border border-white/10 rounded-xl py-4 text-center text-xl font-black text-white" />
                </div>
              </div>
            </div>
          </section>

          {/* Danger Perimeter Section */}
          <section className="bg-[#0a0a0a]/60 border border-red-500/20 rounded-[3rem] p-12 relative overflow-hidden group shadow-[0_30px_100px_rgba(239,68,68,0.05)]">
            <div className="flex items-center gap-4 mb-12 opacity-30">
              <Shield size={16} className="text-red-500" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500">Security Perimeter</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="flex items-center gap-8 p-10 bg-[#050505] rounded-[2.5rem] border border-white/5 transition-all group-hover:border-white/10">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.02] flex items-center justify-center border border-white/10">
                  <Fingerprint size={32} className="text-[#3f3f46]" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-black text-white tracking-tight uppercase">Identity</h3>
                  <div className="flex items-center gap-2 mt-2 opacity-60">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] text-[#52525b] font-black uppercase tracking-widest">Active Operator</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={onLogout} 
                className="w-full h-full p-10 bg-red-500/[0.03] text-red-500 border border-red-500/30 rounded-[2.5rem] text-[13px] font-black uppercase tracking-[0.4em] hover:bg-red-500/20 hover:text-white transition-all flex items-center justify-center gap-6 active:scale-95 shadow-xl group/logout hover:animate-pulse"
              >
                <LogOut size={28} className="transition-transform group-hover/logout:-translate-x-2" /> 
                Terminate Access
              </button>
            </div>

            <div className="p-10 bg-white/[0.01] rounded-[2.5rem] border border-white/5 flex items-start gap-10">
                <Lock size={32} className="text-[#3f3f46] shrink-0 mt-1" />
                <div className="text-left">
                   <h4 className="font-black text-white text-lg uppercase mb-3">Ephemeral Logic Policy</h4>
                   <p className="text-[14px] text-[#71717a] leading-relaxed opacity-80">
                     Upon termination, all memory traces, SSH sockets, and local logical fragments are purged from the silicon layer. No persistent metadata survives the handshake break.
                   </p>
                </div>
            </div>
          </section>
        </div>

        {/* Global Footer */}
        <div className="px-12 py-10 bg-black/80 backdrop-blur-3xl border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-8 shrink-0 relative z-50">
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-3 text-[11px] font-black text-[#3f3f46] uppercase tracking-[0.3em]">
               <ShieldCheck size={18} /> E2E_CRYPTO
            </div>
            <div className="flex items-center gap-3 text-[11px] font-black text-[#3f3f46] uppercase tracking-[0.3em]">
               <Key size={18} /> ENCLAVE_v3
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Sparkles size={20} className="text-[#1d9bf0] animate-pulse" />
            <p className="text-[11px] font-black text-[#3f3f46] tracking-[0.4em] uppercase">
              HEIFI_SYSTEM // 1.4.0-STABLE
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
