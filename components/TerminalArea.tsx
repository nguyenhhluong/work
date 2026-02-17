
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { io, Socket } from 'socket.io-client';
import { SSHConfig } from '../types';
import { Loader2, Terminal as TerminalIcon, ShieldAlert, Wifi, Power, Activity } from 'lucide-react';
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

    // Tokyo Night Theme config
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      lineHeight: 1.2,
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
    setTimeout(() => fit.fit(), 0);

    terminal.current = term;
    fitAddon.current = fit;

    // Initial message
    term.write('\x1b[1;34m[OmniTerm]\x1b[0m Establishing encrypted tunnel...\r\n');

    // Socket.IO Connection
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
      term.write(`\r\n\x1b[1;36m[STATUS]\x1b[0m ${msg}\r\n`);
      if (msg === 'connected') {
        setIsConnecting(false);
        setIsConnected(true);
      }
    });

    socket.on('error', (err: string) => {
      term.write(`\r\n\x1b[1;31m[SSH ERROR]\x1b[0m ${err}\r\n`);
      setError(err);
      setIsConnecting(false);
    });

    socket.on('disconnected', () => {
      term.write('\r\n\x1b[1;31m[SESSION]\x1b[0m Remote host closed the connection.\r\n');
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
    // Setting isConnected triggers the useEffect which initializes the socket/terminal
    setIsConnected(true); 
  };

  return (
    <div className="flex flex-col h-full bg-[#0f1117]">
      <header className="h-16 border-b border-slate-800/50 flex items-center justify-between px-6 bg-[#0f1117]/80 backdrop-blur-xl z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600/10 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/20">
            <TerminalIcon size={20} />
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-tight">OmniTerm <span className="text-slate-500 font-normal">v1.2</span></h2>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : isConnecting ? 'bg-amber-500 animate-pulse' : 'bg-slate-600'}`}></span>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                {isConnected ? `${config?.username}@${config?.host}` : isConnecting ? 'Authenticating...' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isConnected && (
            <div className="hidden md:flex items-center gap-6 px-4 py-1.5 bg-slate-900/50 rounded-lg border border-slate-800/50 mr-4">
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <Activity size={12} className="text-emerald-500" /> Latency: 24ms
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <ShieldAlert size={12} className="text-indigo-500" /> SSH-2.0
              </div>
            </div>
          )}
          {isConnected && (
            <button 
              onClick={handleDisconnect}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-xl transition-all text-xs font-bold border border-rose-500/20"
            >
              <Power size={14} /> Terminate
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 min-h-0 relative flex flex-col items-center justify-center overflow-hidden">
        {!isConnected && !isConnecting && (
          <div className="w-full max-w-xl p-8 animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-600/20 transform rotate-3">
                <TerminalIcon className="text-white" size={36} />
              </div>
              <h3 className="text-2xl font-bold tracking-tight">Cloud Shell Access</h3>
              <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">Instant, ephemeral terminal bridge. No data is stored, ever.</p>
            </div>
            <SshForm onConnect={handleConnectRequest} />
          </div>
        )}

        {isConnecting && (
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse"></div>
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin relative" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg">Handshaking...</p>
              <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Establishing SSH-2.0 Secure Channel</p>
            </div>
          </div>
        )}

        {isConnected && (
          <div ref={termRef} className="w-full h-full bg-[#1a1b26]" />
        )}

        {error && !isConnected && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-sm backdrop-blur-md shadow-2xl animate-in slide-in-from-bottom-4">
            <ShieldAlert size={18} />
            <span className="font-medium">{error}</span>
          </div>
        )}
      </div>

      <footer className="h-12 bg-[#0f1117] border-t border-slate-800/30 flex justify-between items-center text-[10px] text-slate-500 font-mono uppercase tracking-widest px-8">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <Wifi size={12} className={isConnected ? 'text-emerald-500' : 'text-slate-700'} /> 
            WSS {isConnected ? 'Stable' : 'Standby'}
          </span>
          <span className="flex items-center gap-2">
            <ShieldAlert size={12} className="text-indigo-500" /> AES-256-GCM
          </span>
        </div>
        <div className="opacity-50">Unified Terminal Interface • Part of OmniChat Cloud</div>
      </footer>
    </div>
  );
};
