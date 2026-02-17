
import React, { useState, useEffect } from 'react';
import { DeviceFlowResponse } from '../types';
import { ExternalLink, Copy, CheckCircle2, ShieldCheck, Timer, Github } from 'lucide-react';

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-tokyo-dark/95 backdrop-blur-xl p-6 animate-in fade-in duration-300">
      <div className="bg-tokyo-bg border border-tokyo-border/50 w-full max-w-md rounded-[3rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-500">
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-tokyo-accent/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-tokyo-accent/20 relative">
            <div className="absolute inset-0 bg-tokyo-accent/10 blur-2xl animate-pulse"></div>
            <Github className="text-tokyo-accent w-10 h-10 relative" />
          </div>
          
          <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Identity Handshake</h2>
          <p className="text-tokyo-muted text-[14px] leading-relaxed mb-10 font-medium opacity-80">
            Enter the authorized sequence on your primary device to secure the bridge.
          </p>

          <div className="bg-tokyo-card/50 border border-tokyo-border/30 rounded-[2rem] p-8 mb-10 relative group hover:border-tokyo-accent/50 transition-colors shadow-inner">
            <span className="text-5xl font-mono font-black tracking-[0.25em] text-tokyo-accent filter drop-shadow-[0_0_15px_rgba(122,162,247,0.3)]">
              {data.user_code}
            </span>
            <button 
              onClick={handleCopy}
              className="absolute right-5 top-1/2 -translate-y-1/2 p-3 bg-tokyo-bg border border-tokyo-border/50 hover:bg-tokyo-card rounded-xl transition-all shadow-xl"
            >
              {copied ? <CheckCircle2 className="text-tokyo-green" size={20} /> : <Copy className="text-tokyo-muted" size={20} />}
            </button>
          </div>

          <div className="space-y-4">
            <a 
              href={data.verification_uri} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 py-5 bg-tokyo-accent text-tokyo-bg font-black rounded-2xl hover:bg-tokyo-accent/90 transition-all shadow-xl shadow-tokyo-accent/20"
            >
              Secure Portal Login <ExternalLink size={20} />
            </a>
            
            <button 
              onClick={onComplete}
              className="w-full py-5 bg-tokyo-card/60 text-white font-black rounded-2xl hover:bg-tokyo-border/40 transition-all border border-tokyo-border/30"
            >
              Confirm Authorization
            </button>
          </div>
        </div>

        <div className="bg-tokyo-dark/50 p-6 border-t border-tokyo-border/30 flex items-center justify-between px-10">
          <div className="flex items-center gap-2.5 text-tokyo-muted text-[11px] font-black uppercase tracking-widest">
            <Timer size={16} className="text-tokyo-purple" />
            <span>Entropy Timeout: {minutes}:{seconds.toString().padStart(2, '0')}</span>
          </div>
          <button onClick={onClose} className="text-[11px] font-black uppercase tracking-widest text-tokyo-muted hover:text-tokyo-red transition-colors">
            Abort Bridge
          </button>
        </div>
      </div>
    </div>
  );
};
