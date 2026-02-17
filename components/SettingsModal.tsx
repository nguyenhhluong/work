
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-2xl md:p-6 animate-in fade-in duration-300">
      {/* Modal Container: Clamped dimensions for desktop integration */}
      <div className="w-full h-full md:w-[min(920px,calc(100vw-48px))] md:h-[85vh] md:max-h-[850px] glass-panel border-white/10 md:rounded-[2.5rem] bg-black/40 flex flex-col animate-in zoom-in-95 duration-400 overflow-hidden relative shadow-[0_0_120px_rgba(0,0,0,1)]">
        
        {/* Condensed Header */}
        <div className="px-6 md:px-8 py-6 flex items-center justify-between shrink-0 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <Settings size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white uppercase leading-none">Core Control</h2>
              <p className="text-[9px] text-[#71717a] uppercase tracking-[0.4em] font-bold mt-1.5 opacity-60">Nexus v3.4 // Global Node Protocol</p>
            </div>
          </div>
          <button 
              onClick={onClose} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-all active:scale-90 border border-white/10"
          >
              <X size={20} />
          </button>
        </div>

        {/* Scrollable Body: Tightened spacing and card padding */}
        <div className="flex-1 overflow-y-auto px-6 md:px-8 py-8 custom-scrollbar space-y-10">
          
          {/* Section: Intelligence Matrix */}
          <section className="bg-white/[0.01] border border-white/5 rounded-[2rem] p-6 md:p-8 relative overflow-hidden group shadow-lg transition-all hover:border-white/10">
            <div className="flex items-center gap-3 mb-8 opacity-40">
              <Zap size={14} className="text-[#1d9bf0]" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Intelligence Matrix</h3>
            </div>
            <div className="relative">
              <button 
                onClick={() => setIsProviderSelectorOpen(!isProviderSelectorOpen)}
                className="w-full p-6 bg-white/[0.02] rounded-[1.5rem] border border-white/5 flex items-center justify-between hover:bg-white/[0.04] transition-all group/btn"
              >
                <div className="flex items-center gap-6">
                  <span className="text-4xl drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">{activeProvider.icon}</span>
                  <div className="text-left">
                    <p className="text-lg font-black text-white uppercase tracking-tight">{activeProvider.name}</p>
                    <p className="text-xs text-[#71717a] font-medium mt-1 leading-relaxed max-w-sm">{activeProvider.description}</p>
                  </div>
                </div>
                <ChevronDown size={24} className={`text-[#3f3f46] transition-transform duration-500 ${isProviderSelectorOpen ? 'rotate-180 text-white' : ''}`} />
              </button>
              {isProviderSelectorOpen && (
                <div className="absolute top-full left-0 w-full mt-3 z-50 bg-[#0a0a0a] rounded-[2rem] border border-white/10 p-4 shadow-2xl animate-in slide-in-from-top-3 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {providers.map((provider) => (
                      <button 
                        key={provider.id}
                        onClick={() => { onSelectProvider(provider.id); setIsProviderSelectorOpen(false); }}
                        className={`flex items-center justify-between p-4 rounded-2xl transition-all ${activeProviderId === provider.id ? 'bg-white/10 border border-white/10' : 'hover:bg-white/5 border border-transparent opacity-40 hover:opacity-100'}`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{provider.icon}</span>
                          <div className="text-left">
                            <p className="text-[13px] font-black text-white uppercase">{provider.name}</p>
                            <p className="text-[9px] text-[#71717a] font-bold mt-0.5 uppercase tracking-widest">{provider.isConnected ? 'Active' : 'Standby'}</p>
                          </div>
                        </div>
                        {provider.isConnected && <CheckCircle2 size={16} className="text-[#1d9bf0]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section: Autonomous Protocol */}
          <section className="bg-white/[0.01] border border-white/5 rounded-[2rem] p-6 md:p-8 relative overflow-hidden group shadow-lg transition-all hover:border-white/10">
            <div className="flex items-center gap-3 mb-10 opacity-40">
              <Bot size={16} className="text-[#1d9bf0]" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Autonomous Protocol</h3>
            </div>
            
            <div className="space-y-12">
              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <div className="flex flex-col gap-1">
                    <label className="text-lg font-black text-white uppercase tracking-tight">Safety Perimeter</label>
                    <p className="text-[9px] text-[#71717a] font-black uppercase tracking-[0.2em] opacity-40">Boundary Constraint Logic</p>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-5 py-2 rounded-xl border transition-all ${agentSafetyLevel === 'low' ? 'border-red-500/20 bg-red-500/5 text-red-400' : agentSafetyLevel === 'medium' ? 'border-white/10 bg-white/5 text-white' : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'}`}>
                    {agentSafetyLevel} Threshold
                  </span>
                </div>
                <div className="px-1">
                  <input type="range" min="0" max="100" value={getSafetyValue()} onChange={handleSafetyChange} className="w-full h-3 bg-[#111] rounded-full appearance-none cursor-pointer accent-[#1d9bf0] hover:bg-[#151515] transition-colors" />
                  <div className="flex justify-between mt-5 text-[9px] font-black text-[#3f3f46] uppercase tracking-[0.3em]">
                    <span>Expansive</span>
                    <span>Standard Matrix</span>
                    <span>Restricted</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 bg-white/[0.01] border border-white/5 rounded-[1.5rem] flex items-center justify-between shadow-inner">
                  <div className="flex items-center gap-5">
                    <ShieldAlert size={24} className="text-[#1d9bf0]" />
                    <div className="text-left">
                      <p className="text-sm font-black text-white uppercase tracking-tight">Manual Auth</p>
                      <p className="text-[10px] text-[#52525b] font-bold mt-1 uppercase">Enforce Handshake</p>
                    </div>
                  </div>
                  <button onClick={() => onSetAgentAlwaysAsk(!agentAlwaysAsk)} className={`w-14 h-7 rounded-full transition-all relative p-1 ${agentAlwaysAsk ? 'bg-[#1d9bf0]' : 'bg-[#222]'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full transition-all shadow-xl ${agentAlwaysAsk ? 'translate-x-7' : 'translate-x-0'}`} />
                  </button>
                </div>
                <div className="p-6 bg-white/[0.01] border border-white/5 rounded-[1.5rem] flex items-center justify-between shadow-inner">
                  <div className="flex items-center gap-5 text-left">
                    <Activity size={24} className="text-[#3f3f46]" />
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-tight">Cycle Limit</p>
                      <p className="text-[10px] text-[#52525b] font-bold mt-1 uppercase tracking-widest">Recursive Max</p>
                    </div>
                  </div>
                  <input type="number" defaultValue={30} className="w-16 bg-black/60 border border-white/10 rounded-xl py-3 px-2 text-center text-lg font-black text-white focus:border-[#1d9bf0] outline-none transition-all" />
                </div>
              </div>
            </div>
          </section>

          {/* Section: Danger Perimeter */}
          <section className="bg-white/[0.01] border border-red-500/20 rounded-[2rem] p-6 md:p-8 relative overflow-hidden group shadow-lg transition-all hover:border-red-500/40">
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/[0.02] blur-[80px] pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-10 opacity-40">
              <Shield size={14} className="text-red-500" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500">Danger Perimeter</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div className="flex items-center gap-6 p-6 bg-black/40 rounded-[1.5rem] border border-white/5">
                <div className="w-14 h-14 rounded-xl bg-white/[0.03] flex items-center justify-center border border-white/10 shadow-inner">
                  <Fingerprint size={28} className="text-[#3f3f46]" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-black text-white tracking-tight uppercase">Identity</h3>
                  <div className="flex items-center gap-2 mt-1 opacity-60">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                    <span className="text-[9px] text-[#52525b] font-black uppercase tracking-widest">Verified</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={onLogout} 
                className="w-full h-full p-6 bg-red-500/[0.05] text-red-500 border border-red-500/30 rounded-[1.5rem] text-[12px] font-black uppercase tracking-[0.3em] hover:bg-red-500/20 hover:text-white transition-all flex items-center justify-center gap-6 active:scale-95 group/logout animate-glow-pulse"
              >
                <LogOut size={24} className="transition-transform group-hover/logout:-translate-x-2 duration-400" /> 
                TERMINATE NODE
              </button>
            </div>

            <div className="p-8 bg-white/[0.01] border border-white/5 rounded-[1.5rem] flex items-start gap-8 shadow-inner">
                <Lock size={28} className="text-[#3f3f46] shrink-0 mt-1" />
                <div className="text-left">
                   <h4 className="font-black text-white text-base uppercase tracking-tight mb-2">Neural Data Purge</h4>
                   <p className="text-[13px] text-[#71717a] leading-relaxed font-medium opacity-80">
                     Termination purges all session artifacts, ephemeral logic weights, and socket paths from the silicon layer. No residue survives.
                   </p>
                </div>
            </div>
          </section>

        </div>

        {/* Global Modal Footer: Spacious and stabilized */}
        <div className="px-6 md:px-8 py-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0 bg-white/[0.01]">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2.5 text-[10px] font-black text-[#3f3f46] uppercase tracking-[0.3em] group cursor-default">
               <ShieldCheck size={16} className="text-[#52525b] group-hover:text-emerald-500 transition-colors" /> 
               <span className="group-hover:text-white/40 transition-colors">E2E_CRYPTO</span>
            </div>
            <div className="flex items-center gap-2.5 text-[10px] font-black text-[#3f3f46] uppercase tracking-[0.3em] group cursor-default">
               <Key size={16} className="text-[#52525b] group-hover:text-[#1d9bf0] transition-colors" /> 
               <span className="group-hover:text-white/40 transition-colors">ENCLAVE_v3</span>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <Sparkles size={18} className="text-[#1d9bf0] animate-pulse" />
            <p className="text-[10px] font-black text-[#52525b] tracking-[0.5em] uppercase flex items-center gap-2">
              <span>HEIFI_OS</span>
              <span className="opacity-20">//</span>
              <span>1.4.0-STABLE</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
