
import React, { useState } from 'react';
import { SSHConfig } from '../types';
import { Server, User, Lock, Key, Globe, ArrowRight, Shield, Terminal } from 'lucide-react';

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
    <form onSubmit={handleSubmit} className="space-y-6 bg-grok-card border border-grok-border p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group/form">
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-4 space-y-2">
          <label className="text-[10px] font-bold text-grok-muted uppercase tracking-[0.2em] ml-1">Destination Gateway</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-grok-muted group-focus-within/form:text-grok-accent transition-colors z-10">
              <Globe size={16} />
            </div>
            <input
              type="text"
              required
              placeholder="Hostname or IP"
              className="w-full bg-black border border-grok-border rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium text-white focus:ring-1 focus:ring-grok-accent focus:border-grok-accent outline-none transition-all placeholder:text-grok-muted/40"
              value={formData.host}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
            />
          </div>
        </div>
        <div className="col-span-1 space-y-2">
          <label className="text-[10px] font-bold text-grok-muted uppercase tracking-[0.2em] ml-1">Port</label>
          <input
            type="number"
            required
            className="w-full bg-black border border-grok-border rounded-xl py-3.5 px-4 text-sm font-bold text-white focus:ring-1 focus:ring-grok-accent focus:border-grok-accent outline-none transition-all"
            value={formData.port}
            onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-grok-muted uppercase tracking-[0.2em] ml-1">Operator ID</label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-grok-muted group-focus-within/form:text-grok-accent transition-colors z-10">
            <User size={16} />
          </div>
          <input
            type="text"
            required
            placeholder="Username"
            className="w-full bg-black border border-grok-border rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium text-white focus:ring-1 focus:ring-grok-accent focus:border-grok-accent outline-none transition-all placeholder:text-grok-muted/40"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <label className="text-[10px] font-bold text-grok-muted uppercase tracking-[0.2em]">Authentication Secret</label>
          <button 
            type="button"
            onClick={() => setUseKey(!useKey)}
            className="text-[9px] text-grok-accent hover:text-white font-black uppercase tracking-widest transition-colors flex items-center gap-1.5"
          >
            <Shield size={10} /> {useKey ? 'Use Password' : 'Use RSA Key'}
          </button>
        </div>
        
        <div className="relative">
          {useKey ? (
            <div className="relative">
              <div className="absolute left-4 top-4 text-grok-muted group-focus-within/form:text-grok-accent transition-colors z-10">
                <Key size={16} />
              </div>
              <textarea
                required
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                className="w-full bg-black border border-grok-border rounded-xl py-4 pl-11 pr-4 text-[12px] font-mono text-grok-success focus:ring-1 focus:ring-grok-accent focus:border-grok-accent outline-none transition-all h-32 resize-none placeholder:text-grok-muted/30 custom-scrollbar"
                value={formData.privateKey}
                onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
              />
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-grok-muted group-focus-within/form:text-grok-accent transition-colors z-10">
                <Lock size={16} />
              </div>
              <input
                type="password"
                required
                placeholder="Password"
                className="w-full bg-black border border-grok-border rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium text-white focus:ring-1 focus:ring-grok-accent focus:border-grok-accent outline-none transition-all placeholder:text-grok-muted/40"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-4 bg-white text-black font-black rounded-xl hover:brightness-90 transition-all shadow-xl mt-4 flex items-center justify-center gap-3 active:scale-[0.98]"
      >
        <Terminal size={18} />
        Establish Secure Bridge
      </button>
    </form>
  );
};
