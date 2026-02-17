
import React, { useState, useEffect } from 'react';
import { DeviceFlowResponse } from '../types';
import { ExternalLink, Copy, CheckCircle2, ShieldCheck, Timer, Github, Loader2 } from 'lucide-react';

interface DeviceFlowModalProps {
  data: DeviceFlowResponse;
  onClose: () => void;
  onComplete: () => void;
}

export const DeviceFlowModal: React.FC<DeviceFlowModalProps> = ({ data, onClose, onComplete }) => {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(data.expires_in);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-6 animate-in fade-in duration-300">
      <div className="bg-grok-card border border-grok-border w-full max-w-md rounded-[3rem] overflow-hidden shadow-[0_0_80px_rgba(29,155,240,0.15)] animate-in zoom-in-95 duration-500">
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-grok-accent/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-grok-accent/20 relative">
            <div className="absolute inset-0 bg-grok-accent/10 blur-2xl animate-pulse"></div>
            <Github className="text-grok-accent w-10 h-10 relative" />
          </div>
          
          <h2 className="text-3xl font-black text-white mb-3 tracking-tighter">Identity Handshake</h2>
          <p className="text-grok-muted text-[14px] leading-relaxed mb-10 font-medium opacity-80">
            Enter the authorized sequence on your verified GitHub account to secure the bridge.
          </p>

          <div className="bg-black border border-grok-border/50 rounded-[2rem] p-8 mb-10 relative group hover:border-grok-accent/50 transition-colors shadow-inner">
            <span className="text-5xl font-mono font-black tracking-[0.2em] text-grok-accent filter drop-shadow-[0_0_15px_rgba(29,155,240,0.4)]">
              {data.user_code}
            </span>
            <button 
              onClick={handleCopy}
              className="absolute right-5 top-1/2 -translate-y-1/2 p-3 bg-grok-secondary border border-grok-border rounded-xl transition-all shadow-xl hover:text-white text-grok-muted"
            >
              {copied ? <CheckCircle2 className="text-grok-success" size={20} /> : <Copy size={20} />}
            </button>
          </div>

          <div className="space-y-4">
            <a 
              href={data.verification_uri} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 py-5 bg-white text-black font-black rounded-2xl hover:brightness-90 transition-all shadow-xl"
            >
              Verify on Portal <ExternalLink size={20} />
            </a>
            
            <div className="flex items-center justify-center gap-3 py-4 text-grok-muted">
                <Loader2 size={16} className="animate-spin text-grok-accent" />
                <span className="text-xs font-bold uppercase tracking-widest animate-pulse">Waiting for Handshake...</span>
            </div>
          </div>
        </div>

        <div className="bg-black/50 p-6 border-t border-grok-border flex items-center justify-between px-10">
          <div className="flex items-center gap-2.5 text-grok-muted text-[11px] font-black uppercase tracking-widest">
            <Timer size={16} className="text-grok-accent" />
            <span>Entropy Timeout: {minutes}:{seconds.toString().padStart(2, '0')}</span>
          </div>
          <button onClick={onClose} className="text-[11px] font-black uppercase tracking-widest text-grok-muted hover:text-grok-error transition-colors">
            Abort
          </button>
        </div>
      </div>
    </div>
  );
};
