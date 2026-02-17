
import React, { useState } from 'react';
import { SSHConfig } from '../types';
import { Server, User, Lock, Key, Globe, ArrowRight } from 'lucide-react';

interface SshFormProps {
  onConnect: (config: SSHConfig) => void;
}

export const SshForm: React.FC<SshFormProps> = ({ onConnect }) => {
  const [formData, setFormData] = useState<SSHConfig>({
    host: '',
    port: 22,
    username: '',
    password: '',
  });
  const [useKey, setUseKey] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-slate-900/40 border border-slate-800/60 p-10 rounded-[2.5rem] backdrop-blur-2xl shadow-2xl relative overflow-hidden">
      {/* Decorative gradient flare */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 blur-[80px] rounded-full"></div>
      
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-3 space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Destination Host</label>
          <div className="relative group">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
              type="text"
              required
              placeholder="server.domain.com or IP"
              className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-700"
              value={formData.host}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
            />
          </div>
        </div>
        <div className="col-span-1 space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Port</label>
          <input
            type="number"
            required
            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/30 outline-none transition-all"
            value={formData.port}
            onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Remote User</label>
        <div className="relative group">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input
            type="text"
            required
            placeholder="root / admin / dev"
            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-700"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1 px-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Secret Vault</label>
          <button 
            type="button"
            onClick={() => setUseKey(!useKey)}
            className="text-[10px] text-blue-500 hover:text-blue-400 font-bold uppercase tracking-tighter"
          >
            {useKey ? 'Swap to Password' : 'Swap to SSH Key'}
          </button>
        </div>
        
        <div className="relative group">
          {useKey ? (
            <div className="relative">
              <Key className="absolute left-4 top-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
              <textarea
                required
                placeholder="Paste RSA/Ed25519 Private Key Content..."
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all h-32 font-mono resize-none placeholder:text-slate-700"
                value={formData.privateKey}
                onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
              />
            </div>
          ) : (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type="password"
                required
                placeholder="Remote Password"
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-700"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        className="group w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-[1.25rem] transition-all shadow-2xl shadow-blue-600/30 mt-4 flex items-center justify-center gap-3 active:scale-[0.98]"
      >
        <Server size={20} />
        Establish Bridge
        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
      </button>

      <div className="flex items-center justify-center gap-2 mt-4 opacity-50">
        <div className="h-px bg-slate-800 flex-1"></div>
        <span className="text-[8px] text-slate-500 uppercase tracking-widest">TLS 1.3 Encryption Active</span>
        <div className="h-px bg-slate-800 flex-1"></div>
      </div>
    </form>
  );
};
