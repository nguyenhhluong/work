
import React, { useState, useEffect } from 'react';
import { AIProviderId, ProviderInfo, LocalProviderConfig } from '../types';
import { LocalAiService } from '../services/localAiService';
import { 
  X, Settings, CheckCircle2, ShieldCheck, LogOut, 
  ArrowRight, Fingerprint, Lock, Shield, 
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
      <div className="w-full h-full md:max-w-6xl md:h-[95vh] bg-transparent flex flex-col animate-in zoom-in-95 duration-500 overflow-hidden relative">
        
        {/* Header Block matching reference */}
        <div className="px-8 md:px-20 py-16 flex flex-col items-center shrink-0 text-center relative">
          <div className="flex items-center gap-10 mb-8">
            <div className="w-16 h-16 bg-[#0a0a0a] border border-white/10 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.05)]">
              <Settings size={32} className="text-white" />
            </div>
            <h2 className="text-5xl font-black tracking-tighter text-white uppercase leading-none">Core Control</h2>
            <button 
                onClick={onClose} 
                className="w-14 h-14 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-all active:scale-90 border border-white/10 shadow-lg"
            >
                <X size={28} />
            </button>
          </div>
          <p className="text-[12px] text-[#71717a] uppercase tracking-[0.6em] font-black opacity-60">
            Nexus v3.4 // System Policy & Protocol Configuration
          </p>
        </div>

        {/* Spacious Layout with Section Dividers */}
        <div className="flex-1 overflow-y-auto px-8 md:px-20 pb-24 custom-scrollbar space-y-20">
          
          {/* Intelligence Selection */}
          <section className="bg-[#0a0a0a]/40 border border-[#1a1a1a] rounded-[3.5rem] p-12 md:p-16 relative overflow-hidden group shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-4 mb-14 opacity-40">
              <Zap size={18} />
              <h3 className="text-[12px] font-black uppercase tracking-[0.5em]">Intelligence Matrix</h3>
            </div>
            <div className="relative">
              <button 
                onClick={() => setIsProviderSelectorOpen(!isProviderSelectorOpen)}
                className="w-full p-12 bg-white/[0.02] rounded-[2.5rem] border border-white/5 flex items-center justify-between hover:bg-white/[0.05] transition-all group/btn shadow-inner"
              >
                <div className="flex items-center gap-10">
                  <span className="text-6xl filter drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">{activeProvider.icon}</span>
                  <div className="text-left">
                    <p className="text-3xl font-black text-white tracking-tight uppercase">{activeProvider.name}</p>
                    <p className="text-lg text-[#71717a] font-medium mt-2 leading-relaxed max-w-lg">{activeProvider.description}</p>
                  </div>
                </div>
                <ChevronDown size={36} className={`text-[#3f3f46] transition-transform duration-500 ${isProviderSelectorOpen ? 'rotate-180 text-white' : ''}`} />
              </button>
              {isProviderSelectorOpen && (
                <div className="absolute top-full left-0 w-full mt-6 z-50 bg-[#050505] rounded-[3rem] border border-white/10 p-8 shadow-[0_60px_120px_rgba(0,0,0,1)] animate-in slide-in-from-top-6 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {providers.map((provider) => (
                      <button 
                        key={provider.id}
                        onClick={() => { onSelectProvider(provider.id); setIsProviderSelectorOpen(false); }}
                        className={`flex items-center justify-between p-8 rounded-[2rem] transition-all ${activeProviderId === provider.id ? 'bg-white/10 border border-white/10 shadow-lg' : 'hover:bg-white/5 border border-transparent opacity-40 hover:opacity-100'}`}
                      >
                        <div className="flex items-center gap-8">
                          <span className="text-4xl">{provider.icon}</span>
                          <div className="text-left">
                            <p className="text-base font-black text-white uppercase tracking-wider">{provider.name}</p>
                            <p className="text-[11px] text-[#71717a] font-bold mt-1 uppercase tracking-widest">{provider.isConnected ? 'Bridge Active' : 'Disconnected'}</p>
                          </div>
                        </div>
                        {provider.isConnected && <CheckCircle2 size={24} className="text-[#1d9bf0]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Agent Protocol Matrix */}
          <section className="bg-[#0a0a0a]/40 border border-[#1a1a1a] rounded-[3.5rem] p-12 md:p-16 relative overflow-hidden group shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-4 mb-16 opacity-40">
              <Bot size={22} className="text-[#1d9bf0]" />
              <h3 className="text-[12px] font-black uppercase tracking-[0.5em]">Agent Logic Core</h3>
            </div>
            <div className="space-y-20">
              <div className="space-y-12">
                <div className="flex items-center justify-between px-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-2xl font-black text-white uppercase tracking-tight">Safety Perimeter</label>
                    <p className="text-[12px] text-[#71717a] font-black uppercase tracking-[0.4em] opacity-40">Boundary Protocol Threshold</p>
                  </div>
                  <span className={`text-[13px] font-black uppercase px-8 py-4 rounded-2xl border transition-all ${agentSafetyLevel === 'low' ? 'border-red-500/20 bg-red-500/5 text-red-400' : agentSafetyLevel === 'medium' ? 'border-white/10 bg-white/5 text-white' : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'}`}>
                    {agentSafetyLevel} Threshold
                  </span>
                </div>
                <div className="relative px-6">
                  <input type="range" min="0" max="100" value={getSafetyValue()} onChange={handleSafetyChange} className="w-full h-4 bg-[#111] rounded-full appearance-none cursor-pointer accent-[#1d9bf0] hover:bg-[#151515] transition-colors" />
                  <div className="flex justify-between mt-10 text-[12px] font-black text-[#3f3f46] uppercase tracking-[0.5em] px-2">
                    <span>Low Risk</span>
                    <span>Standard Matrix</span>
                    <span>High Guardrails</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="p-12 bg-white/[0.01] rounded-[3rem] border border-white/5 flex items-center justify-between hover:border-white/10 transition-all shadow-inner">
                  <div className="flex items-center gap-8 text-left">
                    <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 transition-transform group-hover:scale-110">
                        <ShieldAlert size={32} className="text-[#1d9bf0]" />
                    </div>
                    <div>
                        <p className="text-xl font-black text-white uppercase tracking-tight">Manual Auth</p>
                        <p className="text-[12px] text-[#52525b] font-bold mt-2 uppercase tracking-widest">Enforce Operator Handshake</p>
                    </div>
                  </div>
                  <button onClick={() => onSetAgentAlwaysAsk(!agentAlwaysAsk)} className={`w-20 h-10 rounded-full transition-all relative p-1 ${agentAlwaysAsk ? 'bg-[#1d9bf0] shadow-[0_0_40px_rgba(29,155,240,0.3)]' : 'bg-[#222]'}`}>
                    <div className={`w-8 h-8 bg-white rounded-full transition-all shadow-xl ${agentAlwaysAsk ? 'translate-x-10' : 'translate-x-0'}`} />
                  </button>
                </div>
                <div className="p-12 bg-white/[0.01] rounded-[3rem] border border-white/5 flex items-center justify-between shadow-inner">
                  <div className="flex items-center gap-8 text-left">
                    <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                        <Activity size={32} className="text-[#3f3f46]" />
                    </div>
                    <div>
                        <p className="text-xl font-black text-white uppercase tracking-tight">Cycle Limit</p>
                        <p className="text-[12px] text-[#52525b] font-bold mt-2 uppercase tracking-widest">Max Recursive Depth</p>
                    </div>
                  </div>
                  <input type="number" defaultValue={30} className="w-28 bg-black/60 border border-white/10 rounded-2xl py-6 px-4 text-center text-2xl font-black text-white focus:border-[#1d9bf0] outline-none transition-all" />
                </div>
              </div>
              <button className="w-full py-10 bg-[#1d9bf0] text-white font-black uppercase tracking-[0.6em] rounded-[3rem] hover:bg-[#1d9bf0]/90 transition-all shadow-[0_20px_60px_rgba(29,155,240,0.4)] active:scale-[0.98] text-xl flex items-center justify-center gap-8">
                  <ShieldCheck size={32} /> Commit System Policy
              </button>
            </div>
          </section>

          {/* Danger Perimeter - Precisely matching reference image */}
          <section className="bg-[#0a0a0a]/40 border border-red-500/20 rounded-[3.5rem] p-12 md:p-16 relative overflow-hidden group shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-4 mb-16 opacity-40">
              <Shield size={18} className="text-red-500/60" />
              <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-red-500/80">Danger Perimeter</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
              {/* Operator ID card */}
              <div className="flex items-center gap-10 p-12 bg-[#050505] rounded-[3rem] border border-white/5 shadow-2xl group-hover:border-white/10 transition-colors">
                <div className="w-20 h-20 rounded-3xl bg-white/[0.03] flex items-center justify-center border border-white/10 shadow-inner">
                  <Fingerprint size={44} className="text-[#3f3f46]" />
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase">Operator ID</h3>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                    <p className="text-[12px] text-[#52525b] font-black uppercase tracking-[0.3em]">Verified // RSA_4096</p>
                  </div>
                </div>
              </div>
              {/* Terminate button card */}
              <button 
                onClick={onLogout} 
                className="w-full h-full p-12 bg-red-500/[0.02] text-red-500 border border-red-500/30 rounded-[3rem] text-[15px] font-black uppercase tracking-[0.5em] hover:bg-red-500/10 hover:text-white transition-all flex items-center justify-center gap-8 active:scale-95 shadow-[0_20px_60px_rgba(239,68,68,0.1)] group/logout"
              >
                <LogOut size={32} className="group-hover/logout:-translate-x-2 transition-transform duration-500" /> 
                <span className="leading-tight text-center">Terminate Node Access</span>
              </button>
            </div>
            {/* Zero Knowledge card */}
            <div className="p-14 bg-white/[0.01] rounded-[3rem] border border-white/5 relative overflow-hidden flex items-start gap-12 group-hover:bg-white/[0.02] transition-colors">
                <Lock size={40} className="text-[#3f3f46] shrink-0 mt-2" />
                <div className="max-w-4xl text-left">
                   <h4 className="font-black text-white text-2xl uppercase tracking-tight mb-6">Zero-Knowledge Neural Bridge</h4>
                   <p className="text-xl text-[#71717a] leading-relaxed font-medium opacity-80">
                     HEIFI operates on an ephemeral logic layer. All memory fragments, SSH socket paths, and reasoning traces are purged instantly from local silicon upon node termination. No residual data persists outside the encrypted enclave.
                   </p>
                </div>
            </div>
          </section>

        </div>

        {/* Expansive Footer matching reference image exactly */}
        <div className="px-20 py-14 bg-black/80 backdrop-blur-3xl border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-12 shrink-0 relative z-50">
          <div className="flex items-center gap-20">
            <div className="flex items-center gap-4 text-[13px] font-black text-[#3f3f46] uppercase tracking-[0.5em] group cursor-default">
               <ShieldCheck size={22} className="text-[#52525b] group-hover:text-emerald-500 transition-colors" /> 
               <span className="group-hover:text-white/60 transition-colors">E2E_Crypto_Active</span>
            </div>
            <div className="flex items-center gap-4 text-[13px] font-black text-[#3f3f46] uppercase tracking-[0.5em] group cursor-default">
               <Key size={22} className="text-[#52525b] group-hover:text-[#1d9bf0] transition-colors" /> 
               <span className="group-hover:text-white/60 transition-colors">Matrix_Enclave_v3</span>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <Sparkles size={24} className="text-[#1d9bf0] animate-pulse" />
            <p className="text-[13px] font-black text-[#52525b] tracking-[0.6em] uppercase flex items-center gap-3">
              <span>HEIFI_OS</span>
              <span className="opacity-40">//</span>
              <span>1.4.0-Stable</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
