
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { io, Socket } from 'socket.io-client';
import { SSHConfig } from '../types';
import { Loader2, Terminal as TerminalIcon, ShieldAlert, Wifi, Power, Activity, Lock } from 'lucide-react';
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

    // Tokyo Night xterm.js Theme
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      lineHeight: 1.3,
      fontFamily: '"Fira Code", monospace',
      theme: {
        background: '#1a1b26',
        foreground: '#c0caf5',
        cursor: '#c0caf5',
        selectionBackground: '#33467c',
        black: '#15161e',
        red: '#f7768e',
        green: '#9ece6a',
        yellow: '#e0af68',
        blue: '#7aa2f7',
        magenta: '#bb9af7',
        cyan: '#7dcfff',
        white: '#a9b1d6',
        brightBlack: '#414868',
        brightRed: '#f7768e',
        brightGreen: '#9ece6a',
        brightYellow: '#e0af68',
        brightBlue: '#7aa2f7',
        brightMagenta: '#bb9af7',
        brightCyan: '#7dcfff',
        brightWhite: '#c0caf5',
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

    term.write('\x1b[1;34m[OmniTerm]\x1b[0m Synchronizing encrypted bridge...\r\n');

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
    <div className="flex flex-col h-full bg-tokyo-dark">
      <header className="h-20 border-b border-tokyo-border/30 flex items-center justify-between px-8 bg-tokyo-bg/90 backdrop-blur-xl z-10">
        <div className="flex items-center gap-5">
          <div className="w-11 h-11 bg-tokyo-accent/10 text-tokyo-accent rounded-2xl flex items-center justify-center border border-tokyo-accent/20 shadow-lg shadow-tokyo-accent/5">
            <TerminalIcon size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
                <h2 className="font-bold text-[15px] tracking-tight text-white uppercase tracking-widest">OmniTerminal</h2>
                <div className="px-1.5 py-0.5 bg-tokyo-card text-tokyo-muted text-[8px] font-black rounded border border-tokyo-border/40 uppercase">v2.4 LTS</div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-tokyo-green animate-pulse shadow-[0_0_8px_rgba(158,206,106,0.6)]' : isConnecting ? 'bg-tokyo-yellow animate-pulse' : 'bg-tokyo-muted'}`}></span>
              <span className="text-[10px] text-tokyo-muted uppercase font-black tracking-widest">
                {isConnected ? `${config?.username}@${config?.host}` : isConnecting ? 'Negotiating Cipher...' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {isConnected && (
            <div className="hidden lg:flex items-center gap-8 px-5 py-2.5 bg-tokyo-bg/50 rounded-2xl border border-tokyo-border/30 mr-2">
              <div className="flex items-center gap-2 text-[10px] text-tokyo-muted font-black uppercase tracking-widest">
                <Activity size={14} className="text-tokyo-green" /> Ping: 18ms
              </div>
              <div className="flex items-center gap-2 text-[10px] text-tokyo-muted font-black uppercase tracking-widest">
                <Lock size={14} className="text-tokyo-accent" /> SSHv2 Ed25519
              </div>
            </div>
          )}
          {isConnected && (
            <button 
              onClick={handleDisconnect}
              className="flex items-center gap-2 px-5 py-2.5 bg-tokyo-red/10 text-tokyo-red hover:bg-tokyo-red/20 rounded-xl transition-all text-xs font-black border border-tokyo-red/20 shadow-lg shadow-tokyo-red/10"
            >
              <Power size={16} /> Close Terminal
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 min-h-0 relative flex flex-col items-center justify-center overflow-hidden bg-tokyo-bg">
        {!isConnected && !isConnecting && (
          <div className="w-full max-w-xl p-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="text-center mb-12">
              <div className="w-24 h-24 bg-gradient-to-tr from-tokyo-accent to-tokyo-purple rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-tokyo-accent/20 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <TerminalIcon className="text-tokyo-bg" size={40} />
              </div>
              <h3 className="text-3xl font-black tracking-tight text-white mb-3">Remote Execution</h3>
              <p className="text-tokyo-muted text-[15px] leading-relaxed max-w-sm mx-auto opacity-80 font-medium">Connect to any remote node via encrypted bridge. Perfect for system administration and rapid debugging.</p>
            </div>
            <SshForm onConnect={handleConnectRequest} />
          </div>
        )}

        {isConnecting && (
          <div className="flex flex-col items-center gap-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-tokyo-accent/20 blur-[60px] rounded-full animate-pulse-subtle"></div>
              <div className="w-20 h-20 bg-tokyo-card border border-tokyo-border/50 rounded-[2rem] flex items-center justify-center relative shadow-2xl">
                <Loader2 className="w-10 h-10 text-tokyo-accent animate-spin" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-white font-black text-xl tracking-tight">Securing Channel...</p>
              <p className="text-tokyo-muted text-[11px] uppercase tracking-[0.2em] font-bold">Establishing Ed25519 Key Exchange</p>
            </div>
          </div>
        )}

        {isConnected && (
          <div ref={termRef} className="w-full h-full p-4 bg-tokyo-bg" />
        )}

        {error && !isConnected && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-4 px-8 py-5 bg-tokyo-red/10 border border-tokyo-red/20 rounded-3xl text-tokyo-red text-sm font-bold backdrop-blur-2xl shadow-2xl animate-in slide-in-from-bottom-8">
            <ShieldAlert size={24} className="shrink-0" />
            <span>Connection Failed: {error}</span>
          </div>
        )}
      </div>

      <footer className="h-14 bg-tokyo-dark border-t border-tokyo-border/30 flex justify-between items-center text-[11px] text-tokyo-muted font-bold uppercase tracking-[0.25em] px-10">
        <div className="flex items-center gap-8">
          <span className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-tokyo-green shadow-[0_0_8px_rgba(158,206,106,0.4)]' : 'bg-tokyo-muted opacity-30'}`} />
            WS Tunnel: {isConnected ? 'Active' : 'Standby'}
          </span>
          <span className="flex items-center gap-2.5 text-tokyo-accent/60">
            <ShieldAlert size={14} /> TLS 1.3 | AES-256
          </span>
        </div>
        <div className="opacity-40 font-mono tracking-tighter lowercase">OmniTerm Protocol x74 // Secure Node Gateway</div>
      </footer>
    </div>
  );
};
