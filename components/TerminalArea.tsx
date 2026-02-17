
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { io, Socket } from 'socket.io-client';
import { SSHConfig } from '../types';
import { Loader2, Terminal as TerminalIcon, ShieldAlert, Wifi, Power, Activity, Lock, Hash } from 'lucide-react';
import { SshForm } from './SshForm';

export const TerminalArea: React.FC = () => {
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

    // Grok High-Contrast Theme
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      lineHeight: 1.4,
      fontFamily: '"Geist Mono", monospace',
      theme: {
        background: '#000000',
        foreground: '#ffffff',
        cursor: '#1d9bf0',
        selectionBackground: '#1d9bf033',
        black: '#000000',
        red: '#ef4444',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#8b5cf6',
        cyan: '#06b6d4',
        white: '#ffffff',
        brightBlack: '#71717a',
        brightRed: '#ef4444',
        brightGreen: '#10b981',
        brightYellow: '#f59e0b',
        brightBlue: '#3b82f6',
        brightMagenta: '#8b5cf6',
        brightCyan: '#06b6d4',
        brightWhite: '#ffffff',
      },
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());

    term.open(termRef.current);
    
    // Initial fit
    setTimeout(() => fit.fit(), 50);

    terminal.current = term;
    fitAddon.current = fit;

    term.write('\x1b[1;34m[OmniTerm]\x1b[0m Synchronizing encrypted neural bridge...\r\n');

    const socket = io('/ssh', {
      path: '/socket.io',
      transports: ['websocket'],
      query: {
        cols: term.cols,
        rows: term.rows
      }
    });

    socketRef.current = socket;
    socket.emit('connect-ssh', config);

    socket.on('output', (data: string) => {
      term.write(data);
    });

    socket.on('status', (msg: string) => {
      term.write(`\r\n\x1b[1;36m[SYSTEM]\x1b[0m ${msg}\r\n`);
      if (msg === 'connected') {
        setIsConnecting(false);
        setIsConnected(true);
      }
    });

    socket.on('error', (err: string) => {
      term.write(`\r\n\x1b[1;31m[CRITICAL]\x1b[0m ${err}\r\n`);
      setError(err);
      setIsConnecting(false);
    });

    socket.on('disconnected', () => {
      term.write('\r\n\x1b[1;31m[BRIDGE]\x1b[0m Remote host terminated connection.\r\n');
      handleDisconnect();
    });

    term.onData((data) => {
      socket.emit('input', data);
    });

    term.onResize(({ cols, rows }) => {
      socket.emit('resize', { cols, rows });
    });

    const resizeObserver = new ResizeObserver(() => {
      fit.fit();
    });
    resizeObserver.observe(termRef.current);

    return () => {
      resizeObserver.disconnect();
      term.dispose();
      socket.disconnect();
    };
  }, [isConnected, config, handleDisconnect]);

  const handleConnectRequest = (newConfig: SSHConfig) => {
    setError(null);
    setIsConnecting(true);
    setConfig(newConfig);
    setIsConnected(true); 
  };

  return (
    <div className="flex flex-col h-full bg-black">
      <header className="h-14 border-b border-grok-border flex items-center justify-between px-6 bg-black/80 backdrop-blur-xl z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <TerminalIcon size={18} className="text-grok-muted" />
          <div>
            <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm tracking-tight text-white">OmniTerminal</h2>
                <span className="px-1.5 py-0.5 bg-grok-secondary text-grok-muted text-[8px] font-black rounded border border-grok-border uppercase">v3.2 LTS</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isConnected && (
            <div className="hidden lg:flex items-center gap-6 px-4 py-1.5 bg-grok-secondary rounded-full border border-grok-border">
              <div className="flex items-center gap-2 text-[10px] text-grok-muted font-bold uppercase tracking-widest">
                <Activity size={12} className="text-grok-success" /> 14ms
              </div>
              <div className="flex items-center gap-2 text-[10px] text-grok-muted font-bold uppercase tracking-widest">
                <Lock size={12} className="text-grok-accent" /> AES-256
              </div>
            </div>
          )}
          {isConnected && (
            <button 
              onClick={handleDisconnect}
              className="flex items-center gap-2 px-4 py-1.5 bg-grok-error/10 text-grok-error hover:bg-grok-error/20 rounded-full transition-all text-[10px] font-black uppercase border border-grok-error/20"
            >
              <Power size={14} /> Kill Session
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 min-h-0 relative flex flex-col items-center justify-center overflow-hidden bg-black">
        {!isConnected && !isConnecting && (
          <div className="w-full max-w-xl p-6 animate-in fade-in slide-up duration-700">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-grok-accent/10 border border-grok-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <TerminalIcon className="text-grok-accent" size={32} />
              </div>
              <h3 className="text-2xl font-black tracking-tight text-white mb-2">Remote Execution Grid</h3>
              <p className="text-grok-muted text-sm leading-relaxed max-w-sm mx-auto font-medium opacity-80">Establish a secure neural link to any remote node via encrypted SSH tunnel.</p>
            </div>
            <SshForm onConnect={handleConnectRequest} />
          </div>
        )}

        {isConnecting && (
          <div className="flex flex-col items-center gap-6 animate-pulse">
            <div className="w-16 h-16 bg-grok-card border border-grok-border rounded-2xl flex items-center justify-center shadow-2xl">
              <Loader2 className="w-8 h-8 text-grok-accent animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-white font-black text-lg tracking-tight">Cipher Exchange...</p>
              <p className="text-grok-muted text-[10px] uppercase tracking-widest font-bold mt-1">Negotiating RSA-4096 Protocol</p>
            </div>
          </div>
        )}

        {isConnected && (
          <div ref={termRef} className="w-full h-full p-2 bg-black" />
        )}

        {error && !isConnected && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-4 bg-grok-error/10 border border-grok-error/20 rounded-2xl text-grok-error text-xs font-bold backdrop-blur-2xl shadow-2xl">
            <ShieldAlert size={18} className="shrink-0" />
            <span>Connection Terminated: {error}</span>
          </div>
        )}
      </div>

      <footer className="h-10 bg-black border-t border-grok-border flex justify-between items-center text-[9px] text-grok-muted font-bold uppercase tracking-[0.25em] px-6">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-grok-success shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-grok-muted opacity-30'}`} />
            Neural Link: {isConnected ? 'Stable' : 'Offline'}
          </span>
          <span className="flex items-center gap-2 opacity-60">
            <Hash size={10} /> Local Port: 54932
          </span>
        </div>
        <div className="opacity-30 font-mono tracking-tighter lowercase">OmniCore Virtualized TTY Gateway</div>
      </footer>
    </div>
  );
};
