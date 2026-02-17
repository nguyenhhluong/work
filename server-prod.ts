import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Client as SshClient } from 'ssh2';
import { Buffer } from 'buffer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  path: '/socket.io',
  transports: ['websocket', 'polling']
});

const agentSessions = new Map();

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

const SESSION_INACTIVITY_TIMEOUT = 30 * 60 * 1000;
const GITHUB_CLIENT_ID = '01ab8ac9400c4e429b23';

app.post('/api/auth/github/start', async (req, res) => {
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
});

app.post('/api/auth/github/poll', async (req, res) => {
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
      res.end(JSON.stringify({ error: 'Auth polling failed' }));
    }
  });
});

io.on('connection', (socket) => {
  let shellClient: any;
  
  socket.on('agent:connect', (config: any) => {
    const { host, port, username, password, privateKey } = config;
    
    if (agentSessions.has(socket.id)) {
      const existing = agentSessions.get(socket.id);
      clearTimeout(existing.timeout);
      existing.client.end();
      agentSessions.delete(socket.id);
    }
    
    const client = new SshClient();
    
    const sessionTimeout = setTimeout(() => {
      socket.emit('error', 'Session timeout - no activity for 30 minutes');
      client.end();
    }, SESSION_INACTIVITY_TIMEOUT);
    
    agentSessions.set(socket.id, { client, timeout: sessionTimeout });
    
    client.on('ready', () => {
      client.shell({ term: 'xterm-256color' }, (err, stream) => {
        if (err) {
          socket.emit('error', 'Shell failed: ' + err.message);
          return;
        }
        
        stream.on('data', (data: Buffer) => {
          socket.emit('terminal:data', data.toString('utf-8'));
        });
        
        stream.on('close', () => {
          client.end();
        });
        
        socket.on('terminal:write', (data: string) => {
          stream.write(data);
        });
        
        socket.on('disconnect', () => {
          stream.end();
        });
      });
    });
    
    client.on('error', (err) => socket.emit('error', err.message));
    
    try {
      client.connect({ 
        host, 
        port: parseInt(port) || 22,
        username, 
        password,
        privateKey: privateKey ? Buffer.from(privateKey) : undefined, 
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

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`> OmniChat Neural Hub v3 listening on http://0.0.0.0:${PORT}`);
});
