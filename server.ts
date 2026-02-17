import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { Client as SshClient } from 'ssh2';
import next from 'next';
import { Buffer } from 'node:buffer'; // Import Buffer for modern Node envs

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const SESSION_INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handler(req, res);
  });

  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: { origin: '*' }
  });

  // Fixed type for timeout to avoid NodeJS.Timeout vs number conflict
  const sessions = new Map<string, { client: SshClient, timeout: ReturnType<typeof setTimeout> }>();

  const resetInactivityTimeout = (socketId: string) => {
    const session = sessions.get(socketId);
    if (session) {
      clearTimeout(session.timeout);
      const newTimeout = setTimeout(() => {
        console.log(`> Session ${socketId} timed out due to inactivity.`);
        session.client.end();
        sessions.delete(socketId);
      }, SESSION_INACTIVITY_TIMEOUT);
      session.timeout = newTimeout;
    }
  };

  const sshNamespace = io.of('/ssh');

  sshNamespace.on('connection', (socket) => {
    
    // --- Tool-based commands for Agent ---
    socket.on('agent-ssh-connect', (config: any, callback: any) => {
      const client = new SshClient();
      client.on('ready', () => {
        const timeout = setTimeout(() => {
          console.log(`> Session ${socket.id} timed out due to inactivity.`);
          client.end();
          sessions.delete(socket.id);
        }, SESSION_INACTIVITY_TIMEOUT);

        sessions.set(socket.id, { client, timeout });
        callback({ success: true, message: 'Connected to ' + config.host });
      });
      client.on('error', (err) => callback({ success: false, error: err.message }));
      
      try {
        client.connect({
          host: config.host,
          port: config.port || 22,
          username: config.username,
          password: config.password,
          privateKey: config.privateKey ? Buffer.from(config.privateKey) : undefined,
          readyTimeout: 10000,
        });
      } catch (e: any) {
        callback({ success: false, error: e.message });
      }
    });

    socket.on('agent-ssh-exec', ({ command }: { command: string }, callback: any) => {
      const session = sessions.get(socket.id);
      if (!session) return callback({ error: 'No SSH session active. Connect first.' });

      resetInactivityTimeout(socket.id);
      session.client.exec(command, (err, stream) => {
        if (err) return callback({ error: err.message });
        let out = '';
        let stderr = '';
        stream.on('data', (d: Buffer) => out += d.toString());
        stream.stderr.on('data', (d: Buffer) => stderr += d.toString());
        stream.on('close', () => callback({ output: out, stderr }));
      });
    });

    socket.on('agent-ssh-read', ({ path }: { path: string }, callback: any) => {
      const session = sessions.get(socket.id);
      if (!session) return callback({ error: 'No SSH session active.' });

      resetInactivityTimeout(socket.id);
      session.client.exec(`cat "${path}"`, (err, stream) => {
        if (err) return callback({ error: err.message });
        let content = '';
        stream.on('data', (d: Buffer) => content += d.toString());
        stream.on('close', () => callback({ content }));
      });
    });

    socket.on('agent-ssh-write', ({ path, content }: { path: string, content: string }, callback: any) => {
      const session = sessions.get(socket.id);
      if (!session) return callback({ error: 'No SSH session active.' });

      resetInactivityTimeout(socket.id);
      const b64 = Buffer.from(content).toString('base64');
      session.client.exec(`echo "${b64}" | base64 -d > "${path}"`, (err, stream) => {
        if (err) return callback({ error: err.message });
        stream.on('close', () => callback({ success: true }));
      });
    });

    socket.on('agent-ssh-disconnect', (callback: any) => {
      const session = sessions.get(socket.id);
      if (session) {
        clearTimeout(session.timeout);
        session.client.end();
        sessions.delete(socket.id);
        if (callback) callback({ success: true, message: 'Disconnected successfully' });
      } else if (callback) {
        callback({ success: false, error: 'No active session found' });
      }
    });

    // --- Interactive Shell (Legacy/Terminal View) ---
    let shellSsh: SshClient | null = null;
    socket.on('connect-ssh', (config: any) => {
      shellSsh = new SshClient();
      shellSsh.on('ready', () => {
        socket.emit('status', 'connected');
        const { cols = 80, rows = 24 } = socket.handshake.query;
        shellSsh!.shell({ cols: Number(cols), rows: Number(rows), term: 'xterm-256color' }, (err, stream) => {
          if (err) return socket.emit('error', 'Shell error: ' + err.message);
          stream.on('data', (chunk: Buffer) => socket.emit('output', chunk.toString('utf8')));
          socket.on('input', (data: string) => stream.write(data));
          socket.on('resize', ({ cols, rows }: { cols: number; rows: number }) => stream.setWindow(rows, cols, 0, 0));
          stream.on('close', () => {
            socket.emit('disconnected');
            socket.disconnect();
          });
        });
      });
      shellSsh.on('error', (err) => socket.emit('error', 'Auth/Conn Error: ' + err.message));
      try {
        shellSsh.connect({ ...config, privateKey: config.privateKey ? Buffer.from(config.privateKey) : undefined, readyTimeout: 15000 });
      } catch (e: any) { socket.emit('error', 'Connect failed: ' + e.message); }
    });

    socket.on('disconnect', () => {
      const session = sessions.get(socket.id);
      if (session) {
        clearTimeout(session.timeout);
        session.client.end();
        sessions.delete(socket.id);
      }
      if (shellSsh) shellSsh.end();
    });
  });

  httpServer.listen(port, () => {
    console.log(`> OmniChat Ready on http://${hostname}:${port}`);
  });
});