
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { Client as SshClient } from 'ssh2';
import next from 'next';
import { Buffer } from 'node:buffer';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const SESSION_INACTIVITY_TIMEOUT = 30 * 60 * 1000;
const GITHUB_CLIENT_ID = '01ab8ac9400c4e429b23'; 

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    // Auth endpoints for device flow
    if (req.url === '/api/auth/github/start' && req.method === 'POST') {
      try {
        const response = await fetch('https://github.com/login/device/code', {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, scope: 'read:user' })
        });
        const data = await response.json();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
        return;
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Auth failed to initialize' }));
        return;
      }
    }

    if (req.url === '/api/auth/github/poll' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const { device_code } = JSON.parse(body);
          const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: GITHUB_CLIENT_ID,
              device_code,
              grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
            })
          });
          const data = await response.json();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data));
        } catch (e) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Polling loop failed' }));
        }
      });
      return;
    }

    handler(req, res);
  });

  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: { origin: '*' }
  });

  // Keep-alive sessions for Agent Tooling
  const agentSessions = new Map<string, { client: SshClient, timeout: ReturnType<typeof setTimeout> }>();

  const resetAgentTimeout = (socketId: string) => {
    const session = agentSessions.get(socketId);
    if (session) {
      clearTimeout(session.timeout);
      const newTimeout = setTimeout(() => {
        session.client.end();
        agentSessions.delete(socketId);
      }, SESSION_INACTIVITY_TIMEOUT);
      session.timeout = newTimeout;
    }
  };

  const sshNamespace = io.of('/ssh');

  sshNamespace.on('connection', (socket) => {
    // 1. Agent Tooling Bridge
    socket.on('agent-ssh-connect', (config: any, callback: any) => {
      const client = new SshClient();
      client.on('ready', () => {
        const timeout = setTimeout(() => {
          client.end();
          agentSessions.delete(socket.id);
        }, SESSION_INACTIVITY_TIMEOUT);
        agentSessions.set(socket.id, { client, timeout });
        callback({ success: true, message: 'Neural Bridge established to ' + config.host });
      });
      client.on('error', (err) => callback({ success: false, error: err.message }));
      try {
        client.connect({
          host: config.host,
          port: config.port || 22,
          username: config.username,
          password: config.password,
          privateKey: config.privateKey ? Buffer.from(config.privateKey) : undefined,
          readyTimeout: 15000,
        });
      } catch (e: any) { callback({ success: false, error: e.message }); }
    });

    socket.on('agent-ssh-exec', ({ command }: { command: string }, callback: any) => {
      const session = agentSessions.get(socket.id);
      if (!session) return callback({ error: 'Target node disconnected. Re-initialize SSH.' });
      resetAgentTimeout(socket.id);
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
      const session = agentSessions.get(socket.id);
      if (!session) return callback({ error: 'Disconnected.' });
      resetAgentTimeout(socket.id);
      session.client.exec(`cat "${path}"`, (err, stream) => {
        if (err) return callback({ error: err.message });
        let content = '';
        let stderr = '';
        stream.on('data', (d: Buffer) => content += d.toString());
        stream.stderr.on('data', (d: Buffer) => stderr += d.toString());
        stream.on('close', () => callback({ content, error: stderr || null }));
      });
    });

    socket.on('agent-ssh-list-dir', ({ path }: { path: string }, callback: any) => {
      const session = agentSessions.get(socket.id);
      if (!session) return callback({ error: 'Disconnected.' });
      resetAgentTimeout(socket.id);
      const target = path || '.';
      session.client.exec(`ls -F "${target}"`, (err, stream) => {
        if (err) return callback({ error: err.message });
        let out = '';
        stream.on('data', (d: Buffer) => out += d.toString());
        stream.on('close', () => callback({ output: out }));
      });
    });

    socket.on('agent-ssh-write', ({ path, content }: { path: string, content: string }, callback: any) => {
      const session = agentSessions.get(socket.id);
      if (!session) return callback({ error: 'Disconnected.' });
      resetAgentTimeout(socket.id);
      const b64 = Buffer.from(content).toString('base64');
      session.client.exec(`echo "${b64}" | base64 -d > "${path}"`, (err, stream) => {
        if (err) return callback({ error: err.message });
        stream.on('close', () => callback({ success: true }));
      });
    });

    socket.on('agent-ssh-disconnect', (callback: any) => {
      const session = agentSessions.get(socket.id);
      if (session) {
        clearTimeout(session.timeout);
        session.client.end();
        agentSessions.delete(socket.id);
        if (callback) callback({ success: true });
      }
    });

    // 2. Interactive Shell Bridge
    let shellClient: SshClient | null = null;
    socket.on('connect-ssh', (config: any) => {
      shellClient = new SshClient();
      shellClient.on('ready', () => {
        socket.emit('status', 'connected');
        const { cols = 80, rows = 24 } = socket.handshake.query;
        shellClient!.shell({ 
          cols: Number(cols), 
          rows: Number(rows), 
          term: 'xterm-256color' 
        }, (err, stream) => {
          if (err) return socket.emit('error', 'Shell initiation fault: ' + err.message);
          
          stream.on('data', (chunk: Buffer) => socket.emit('output', chunk.toString('utf8')));
          socket.on('input', (data: string) => stream.write(data));
          socket.on('resize', ({ cols, rows }: { cols: number; rows: number }) => {
            stream.setWindow(rows, cols, 0, 0);
          });
          
          stream.on('close', () => {
            socket.emit('disconnected');
            socket.disconnect();
          });
        });
      });
      
      shellClient.on('error', (err) => socket.emit('error', err.message));
      
      try {
        shellClient.connect({ 
          ...config, 
          privateKey: config.privateKey ? Buffer.from(config.privateKey) : undefined, 
          readyTimeout: 20000 
        });
      } catch (e: any) { socket.emit('error', 'Handshake setup failed: ' + e.message); }
    });

    socket.on('disconnect', () => {
      const session = agentSessions.get(socket.id);
      if (session) {
        clearTimeout(session.timeout);
        session.client.end();
        agentSessions.delete(socket.id);
      }
      if (shellClient) shellClient.end();
    });
  });

  httpServer.listen(port, () => {
    console.log(`> OmniChat Neural Hub v3 listening on http://${hostname}:${port}`);
  });
});
