
import React, { useState } from 'react';
import { SSHConfig } from '../types';
import { User, Lock, Key, Globe, Shield, Terminal } from 'lucide-react';

interface SshFormProps {
  onConnect: (config: SSHConfig) => void;
}

export const SshForm: React.FC<SshFormProps> = ({ onConnect }) => {
  const [formData, setFormData] = useState<SSHConfig>({ host: '', port: 22, username: '', password: '' });
  const [useKey, setUseKey] = useState(false);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onConnect(formData); }} className="space-y-6 glass-panel p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group/form">
      <div className="absolute top-0 right-0 w-32 h-32 bg-grok-accent/5 blur-3xl opacity-50"></div>
      
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <div className="sm:col-span-4 space-y-2">
          <label className="text-[10px] font-black text-[#71717a] uppercase tracking-widest ml-1">Destination Gateway</label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717a]/40" size={16} />
            <input
              type="text" required placeholder="Hostname or IP" value={formData.host}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-white focus:ring-1 focus:ring-[#1d9bf0] outline-none transition-all placeholder:text-[#71717a]/30"
            />
          </div>
        </div>
        <div className="sm:col-span-1 space-y-2">
          <label className="text-[10px] font-black text-[#71717a] uppercase tracking-widest ml-1">Port</label>
          <input
            type="number" required value={formData.port}
            onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 text-sm font-black text-white focus:ring-1 focus:ring-[#1d9bf0] outline-none transition-all"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-[#71717a] uppercase tracking-widest ml-1">Operator Identifier</label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717a]/40" size={16} />
          <input
            type="text" required placeholder="User-ID" value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-white focus:ring-1 focus:ring-[#1d9bf0] outline-none transition-all placeholder:text-[#71717a]/40"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <label className="text-[10px] font-black text-[#71717a] uppercase tracking-widest">Secret Fragment</label>
          <button type="button" onClick={() => setUseKey(!useKey)} className="text-[9px] text-grok-accent hover:text-white font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 px-3 py-1 glass-card rounded-lg">
            <Shield size={10} /> {useKey ? 'Password' : 'RSA Key'}
          </button>
        </div>
        
        <div className="relative">
          {useKey ? (
            <div className="relative">
              <Key className="absolute left-4 top-4 text-[#71717a]/40" size={16} />
              <textarea
                required placeholder="-----BEGIN RSA PRIVATE KEY-----" value={formData.privateKey}
                onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-[12px] font-mono text-grok-success focus:ring-1 focus:ring-[#1d9bf0] outline-none transition-all h-32 resize-none placeholder:text-[#71717a]/20 custom-scrollbar"
              />
            </div>
          ) : (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717a]/40" size={16} />
              <input
                type="password" required placeholder="Secret Key" value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-white focus:ring-1 focus:ring-[#1d9bf0] outline-none transition-all placeholder:text-[#71717a]/40"
              />
            </div>
          )}
        </div>
      </div>

      <button type="submit" className="w-full py-5 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-white/90 transition-all shadow-2xl mt-4 flex items-center justify-center gap-3 active:scale-[0.98] text-[13px]">
        <Terminal size={18} /> Establish Secure Bridge
      </button>
    </form>
  );
};
