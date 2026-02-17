
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { Client as SshClient } from 'ssh2';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

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

  // Agent Tool Sessions (managed per socket)
  const sessions = new Map<string, SshClient>();

  const sshNamespace = io.of('/ssh');

  sshNamespace.on('connection', (socket) => {
    
    // --- Tool-based commands for Agent ---
    socket.on('agent-ssh-connect', (config: any, callback: any) => {
      const client = new SshClient();
      client.on('ready', () => {
        sessions.set(socket.id, client);
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
      const client = sessions.get(socket.id);
      if (!client) return callback({ error: 'No SSH session active. Connect first.' });

      client.exec(command, (err, stream) => {
        if (err) return callback({ error: err.message });
        let out = '';
        let stderr = '';
        stream.on('data', (d: Buffer) => out += d.toString());
        stream.stderr.on('data', (d: Buffer) => stderr += d.toString());
        stream.on('close', () => callback({ output: out, stderr }));
      });
    });

    socket.on('agent-ssh-read', ({ path }: { path: string }, callback: any) => {
      const client = sessions.get(socket.id);
      if (!client) return callback({ error: 'No SSH session active.' });

      client.exec(`cat "${path}"`, (err, stream) => {
        if (err) return callback({ error: err.message });
        let content = '';
        stream.on('data', (d: Buffer) => content += d.toString());
        stream.on('close', () => callback({ content }));
      });
    });

    socket.on('agent-ssh-write', ({ path, content }: { path: string, content: string }, callback: any) => {
      const client = sessions.get(socket.id);
      if (!client) return callback({ error: 'No SSH session active.' });

      // Using base64 to avoid shell escaping issues with complex content
      const b64 = Buffer.from(content).toString('base64');
      client.exec(`echo "${b64}" | base64 -d > "${path}"`, (err, stream) => {
        if (err) return callback({ error: err.message });
        stream.on('close', () => callback({ success: true }));
      });
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
      const client = sessions.get(socket.id);
      if (client) { client.end(); sessions.delete(socket.id); }
      if (shellSsh) shellSsh.end();
    });
  });

  httpServer.listen(port, () => {
    console.log(`> OmniChat Ready on http://${hostname}:${port}`);
  });
});
