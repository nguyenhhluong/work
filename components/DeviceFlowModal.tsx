
import React, { useState, useEffect } from 'react';
import { DeviceFlowResponse } from '../types';
import { ExternalLink, Copy, CheckCircle2, ShieldCheck, Timer } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-600/20">
            <ShieldCheck className="text-blue-500 w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Device Login</h2>
          <p className="text-slate-400 text-sm mb-8">
            Please enter this code on your other device to authenticate.
          </p>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 mb-8 relative group">
            <span className="text-4xl font-mono font-bold tracking-[0.2em] text-blue-400">
              {data.user_code}
            </span>
            <button 
              onClick={handleCopy}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              {copied ? <CheckCircle2 className="text-green-500" size={20} /> : <Copy className="text-slate-500" size={20} />}
            </button>
          </div>

          <div className="space-y-4">
            <a 
              href={data.verification_uri} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
            >
              Open Browser <ExternalLink size={18} />
            </a>
            
            <button 
              onClick={onComplete}
              className="w-full py-4 bg-slate-800 text-slate-100 font-bold rounded-2xl hover:bg-slate-700 transition-all border border-slate-700"
            >
              I've entered the code
            </button>
          </div>
        </div>

        <div className="bg-slate-950/50 p-4 border-t border-slate-800 flex items-center justify-between px-8">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-mono">
            <Timer size={14} />
            <span>Expires in {minutes}:{seconds.toString().padStart(2, '0')}</span>
          </div>
          <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            Cancel Authorization
          </button>
        </div>
      </div>
    </div>
  );
};
