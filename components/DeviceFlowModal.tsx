
import React, { useState, useEffect } from 'react';
import { DeviceFlowResponse } from '../types';
import { ExternalLink, Copy, CheckCircle2, Timer, Github, Loader2, X } from 'lucide-react';

interface DeviceFlowModalProps {
  data: DeviceFlowResponse; onClose: () => void; onComplete: () => void;
}

export const DeviceFlowModal: React.FC<DeviceFlowModalProps> = ({ data, onClose, onComplete }) => {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(data.expires_in);

  useEffect(() => {
    const timer = setInterval(() => setCountdown(prev => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.user_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 backdrop-blur-xl md:p-6 animate-in fade-in duration-300">
      <div className="glass-panel border-white/10 w-full h-full md:h-auto md:max-w-md md:rounded-[3rem] overflow-hidden shadow-[0_0_150px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-500 flex flex-col">
        <div className="md:hidden flex justify-end p-6 bg-white/[0.03]">
           <button onClick={onClose} className="p-2 text-[#71717a] active:scale-90"><X size={28}/></button>
        </div>
        
        <div className="flex-1 p-10 md:p-12 text-center flex flex-col justify-center">
          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-10 relative overflow-hidden group shadow-2xl">
            <div className="absolute inset-0 bg-grok-accent/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Github className="text-white w-10 h-10 relative z-10" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tighter">EXTERNAL SYNC</h2>
          <p className="text-[#71717a] text-[14px] leading-relaxed mb-10 font-bold uppercase tracking-widest opacity-80">
            Establish authorization loop via device-ID sequence.
          </p>

          <div className="bg-black/40 border border-white/10 rounded-[2.5rem] p-8 md:p-10 mb-10 relative group shadow-inner">
            <div className="absolute inset-0 bg-[#1d9bf0]/5 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="text-4xl md:text-5xl font-mono font-black tracking-[0.25em] text-[#1d9bf0] drop-shadow-[0_0_20px_rgba(29,155,240,0.5)]">
              {data.user_code}
            </span>
            <button onClick={handleCopy} className="absolute right-4 top-1/2 -translate-y-1/2 p-3.5 glass-card rounded-2xl text-grok-muted hover:text-white transition-all active:scale-90 shadow-lg">
              {copied ? <CheckCircle2 className="text-grok-success" size={20} /> : <Copy size={20} />}
            </button>
          </div>

          <div className="space-y-6">
            <a 
              href={data.verification_uri} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-4 py-5 bg-white text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-white/90 transition-all shadow-2xl active:scale-[0.98] text-[14px]"
            >
              Verify Portal <ExternalLink size={18} />
            </a>
            
            <div className="flex items-center justify-center gap-3 text-[#71717a]">
                <Loader2 size={16} className="animate-spin text-grok-accent" />
                <span className="text-[11px] font-black uppercase tracking-[0.3em] animate-pulse">NEGOTIATING TOKEN...</span>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.02] p-8 border-t border-white/5 flex items-center justify-between px-10 shrink-0">
          <div className="flex items-center gap-3 text-[#71717a] text-[11px] font-black uppercase tracking-widest">
            <Timer size={16} className="text-grok-accent" />
            <span>EXPIRES: {minutes}:{seconds.toString().padStart(2, '0')}</span>
          </div>
          <button onClick={onClose} className="text-[11px] font-black uppercase tracking-widest text-[#71717a] hover:text-grok-error transition-colors active:scale-90">
            Abort Bridge
          </button>
        </div>
      </div>
    </div>
  );
};
