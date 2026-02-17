
import React, { useState } from 'react';
import { SSHConfig } from '../types';
import { Server, User, Lock, Key, Globe, ArrowRight, Shield } from 'lucide-react';

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
    <form onSubmit={handleSubmit} className="space-y-6 bg-tokyo-card/30 border border-tokyo-border/40 p-10 rounded-[2.5rem] backdrop-blur-3xl shadow-2xl relative overflow-hidden group/form">
      {/* Decorative gradient flare */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-tokyo-accent/10 blur-[100px] rounded-full transition-opacity group-focus-within/form:opacity-100 opacity-40"></div>
      
      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-3 space-y-2.5">
          <label className="text-[10px] font-black text-tokyo-muted uppercase tracking-[0.2em] ml-1">Destination Gateway</label>
          <div className="relative group/input">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-tokyo-muted group-focus-within/input:text-tokyo-accent transition-colors z-10">
              <Globe size={18} />
            </div>
            <input
              type="text"
              required
              placeholder="vps.acme.corp or IP"
              className="w-full bg-tokyo-bg/50 border border-tokyo-border/50 rounded-2xl py-4 pl-12 pr-4 text-[14px] font-medium text-white focus:ring-2 focus:ring-tokyo-accent/20 focus:border-tokyo-accent/50 outline-none transition-all placeholder:text-tokyo-muted/60"
              value={formData.host}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
            />
          </div>
        </div>
        <div className="col-span-1 space-y-2.5">
          <label className="text-[10px] font-black text-tokyo-muted uppercase tracking-[0.2em] ml-1">Port</label>
          <input
            type="number"
            required
            className="w-full bg-tokyo-bg/50 border border-tokyo-border/50 rounded-2xl py-4 px-4 text-[14px] font-bold text-white focus:ring-2 focus:ring-tokyo-accent/20 focus:border-tokyo-accent/50 outline-none transition-all"
            value={formData.port}
            onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-2.5">
        <label className="text-[10px] font-black text-tokyo-muted uppercase tracking-[0.2em] ml-1">SSH Identity</label>
        <div className="relative group/input">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-tokyo-muted group-focus-within/input:text-tokyo-accent transition-colors z-10">
            <User size={18} />
          </div>
          <input
            type="text"
            required
            placeholder="root / system-admin"
            className="w-full bg-tokyo-bg/50 border border-tokyo-border/50 rounded-2xl py-4 pl-12 pr-4 text-[14px] font-medium text-white focus:ring-2 focus:ring-tokyo-accent/20 focus:border-tokyo-accent/50 outline-none transition-all placeholder:text-tokyo-muted/60"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between mb-1 px-1">
          <label className="text-[10px] font-black text-tokyo-muted uppercase tracking-[0.2em]">Secret Credentials</label>
          <button 
            type="button"
            onClick={() => setUseKey(!useKey)}
            className="text-[10px] text-tokyo-accent hover:text-white font-black uppercase tracking-widest transition-colors flex items-center gap-1.5"
          >
            <Shield size={10} /> {useKey ? 'Use Password' : 'Use SSH Key'}
          </button>
        </div>
        
        <div className="relative group/input">
          {useKey ? (
            <div className="relative">
              <div className="absolute left-4 top-4 text-tokyo-muted group-focus-within/input:text-tokyo-accent transition-colors z-10">
                <Key size={18} />
              </div>
              <textarea
                required
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                className="w-full bg-tokyo-bg/50 border border-tokyo-border/50 rounded-2xl py-5 pl-12 pr-4 text-[13px] font-mono text-tokyo-green focus:ring-2 focus:ring-tokyo-accent/20 focus:border-tokyo-accent/50 outline-none transition-all h-40 resize-none placeholder:text-tokyo-muted/40 custom-scrollbar leading-relaxed"
                value={formData.privateKey}
                onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
              />
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-tokyo-muted group-focus-within/input:text-tokyo-accent transition-colors z-10">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                placeholder="Authentication Token or Password"
                className="w-full bg-tokyo-bg/50 border border-tokyo-border/50 rounded-2xl py-4 pl-12 pr-4 text-[14px] font-medium text-white focus:ring-2 focus:ring-tokyo-accent/20 focus:border-tokyo-accent/50 outline-none transition-all placeholder:text-tokyo-muted/60"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        className="group w-full py-5 bg-tokyo-accent hover:bg-tokyo-accent/90 text-tokyo-bg font-black rounded-[1.25rem] transition-all shadow-xl shadow-tokyo-accent/20 mt-6 flex items-center justify-center gap-4 active:scale-[0.98]"
      >
        <Server size={22} className="group-hover:scale-110 transition-transform" />
        Establish Secure Bridge
        <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-300" />
      </button>

      <div className="flex items-center justify-center gap-3 mt-4 opacity-30">
        <div className="h-px bg-tokyo-border flex-1"></div>
        <span className="text-[9px] text-tokyo-muted font-black uppercase tracking-[0.3em]">OmniConnect Protocol Security</span>
        <div className="h-px bg-tokyo-border flex-1"></div>
      </div>
    </form>
  );
};
