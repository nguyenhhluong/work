
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { io, Socket } from 'socket.io-client';
import { SSHConfig } from '../types';
import { Loader2, Terminal as TerminalIcon, ShieldAlert, Power, Activity, Menu } from 'lucide-react';
import { SshForm } from './SshForm';

interface TerminalAreaProps {
  onOpenMobileMenu: () => void;
}

export const TerminalArea: React.FC<TerminalAreaProps> = ({ onOpenMobileMenu }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<SSHConfig | null>(null);

  const termRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);

  const handleDisconnect = useCallback(() => {
    socketRef.current?.disconnect();
    terminal.current?.dispose();
    setIsConnected(false);
    setIsConnecting(false);
    setConfig(null);
  }, []);

  useEffect(() => {
    if (!isConnected || !config || !termRef.current) return;

    const term = new Terminal({
      cursorBlink: true, fontSize: 13, lineHeight: 1.6, fontFamily: '"Geist Mono", monospace',
      theme: { 
        background: 'transparent', 
        foreground: '#e4e4e7', 
        cursor: '#1d9bf0', 
        selectionBackground: 'rgba(29,155,240,0.3)', 
        black: '#000000', red: '#ef4444', green: '#10b981', yellow: '#f59e0b', blue: '#3b82f6', magenta: '#8b5cf6', cyan: '#06b6d4', white: '#ffffff' 
      }
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());
    term.open(termRef.current);
    
    // Initial fit sync
    setTimeout(() => fit.fit(), 100);
    
    terminal.current = term;
    fitAddon.current = fit;

    term.write('\x1b[1;34m[OmniTerm]\x1b[0m Synchronizing encrypted bridge...\r\n');

    const socket = io('/ssh', { 
      path: '/socket.io', 
      transports: ['websocket'], 
      query: { cols: term.cols, rows: term.rows } 
    });

    socketRef.current = socket;
    socket.emit('connect-ssh', config);

    socket.on('output', (data: string) => term.write(data));
    socket.on('status', (msg: string) => {
      term.write(`\r\n\x1b[1;36m[SYSTEM]\x1b[0m ${msg}\r\n`);
      if (msg === 'connected') { setIsConnecting(false); setIsConnected(true); }
    });
    
    socket.on('error', (err: string) => { 
      term.write(`\r\n\x1b[1;31m[CRITICAL]\x1b[0m ${err}\r\n`); 
      setError(err); 
      setIsConnecting(false); 
      setIsConnected(false);
    });

    socket.on('disconnected', () => { 
      term.write('\r\n\x1b[1;31m[BRIDGE]\x1b[0m Socket terminated.\r\n'); 
      handleDisconnect(); 
    });

    term.onData((data) => socket.emit('input', data));
    term.onResize(({ cols, rows }) => socket.emit('resize', { cols, rows }));

    const resizeObserver = new ResizeObserver(() => fit.fit());
    resizeObserver.observe(termRef.current);

    return () => { 
      resizeObserver.disconnect(); 
      term.dispose(); 
      socket.disconnect(); 
    };
  }, [isConnected, config, handleDisconnect]);

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-black/40 backdrop-blur-xl shrink-0 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={onOpenMobileMenu} className="md:hidden p-2.5 text-grok-muted hover:text-white transition-all active:scale-90">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-3">
              <TerminalIcon size={20} className="text-grok-accent hidden xs:block" />
              <h2 className="font-black text-xs tracking-[0.2em] text-white uppercase">Neural Grid</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isConnected && (
            <div className="hidden lg:flex items-center gap-6 px-5 py-2 glass-card rounded-full">
              <div className="flex items-center gap-2 text-[9px] text-white font-black uppercase tracking-widest">
                <Activity size={12} className="text-grok-success animate-pulse" /> LINK_STABLE
              </div>
            </div>
          )}
          {isConnected && (
            <button onClick={handleDisconnect} className="flex items-center gap-2 px-5 py-2.5 bg-grok-error/10 text-grok-error hover:bg-grok-error/20 rounded-full transition-all text-[9px] font-black uppercase tracking-widest border border-grok-error/20 active:scale-95 shadow-xl shadow-grok-error/10">
              <Power size={14} /> Termination
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 min-h-0 relative flex flex-col items-center justify-center overflow-hidden bg-transparent">
        {!isConnected && !isConnecting && (
          <div className="w-full max-w-xl p-6 md:p-8 animate-in fade-in slide-up duration-700 overflow-y-auto custom-scrollbar">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-grok-accent/10 border border-grok-accent/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl transition-transform hover:scale-110 duration-500">
                <TerminalIcon className="text-grok-accent" size={40} />
              </div>
              <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-white mb-3">Initialize Bridge</h3>
              <p className="text-[#71717a] text-[14px] leading-relaxed max-w-xs md:max-w-sm mx-auto font-medium opacity-80 uppercase tracking-widest">Establish isolated TTY stream via RSA-4096.</p>
            </div>
            <SshForm onConnect={(c) => { setError(null); setIsConnecting(true); setConfig(c); setIsConnected(true); }} />
          </div>
        )}

        {isConnecting && (
          <div className="flex flex-col items-center gap-8 animate-pulse px-6 text-center">
            <div className="w-20 h-20 glass-panel rounded-3xl flex items-center justify-center shadow-2xl">
              <Loader2 className="w-10 h-10 text-grok-accent animate-spin" />
            </div>
            <div>
              <p className="text-white font-black text-xl tracking-tighter uppercase mb-2">Syncing Matrix...</p>
              <p className="text-[#71717a] text-[9px] uppercase tracking-[0.3em] font-bold">NEGOTIATING HANDSHAKE</p>
            </div>
          </div>
        )}

        {isConnected && <div ref={termRef} className="w-full h-full p-4 md:p-6 bg-black/10 backdrop-blur-sm" />}

        {error && !isConnected && (
          <div className="absolute bottom-10 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto flex items-center gap-3 px-8 py-5 bg-grok-error/10 border border-grok-error/20 rounded-[2rem] text-grok-error text-[10px] font-black uppercase tracking-widest backdrop-blur-2xl shadow-2xl">
            <ShieldAlert size={18} className="shrink-0" />
            <span>Link Fault: {error}</span>
          </div>
        )}
      </div>

      <footer className="h-10 bg-black/40 backdrop-blur-xl border-t border-white/5 flex justify-between items-center text-[9px] text-[#71717a] font-black uppercase tracking-[0.3em] px-6 md:px-10 shrink-0">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-grok-success shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/10'}`} />
            {isConnected ? 'Sync Active' : 'Bridge Idle'}
          </span>
        </div>
        <div className="opacity-40 font-mono lowercase tracking-tighter">
            backbone_omniterm_v3.2.1
        </div>
      </footer>
    </div>
  );
};
