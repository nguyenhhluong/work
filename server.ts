
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

  const sshNamespace = io.of('/ssh');

  sshNamespace.on('connection', (socket) => {
    let ssh: SshClient | null = null;

    socket.on('connect-ssh', (config: { 
      host: string; 
      port: number; 
      username: string; 
      password?: string; 
      privateKey?: string 
    }) => {
      ssh = new SshClient();

      ssh.on('ready', () => {
        socket.emit('status', 'connected');

        const { cols = 80, rows = 24 } = socket.handshake.query;

        ssh!.shell({
          cols: Number(cols),
          rows: Number(rows),
          term: 'xterm-256color'
        }, (err, stream) => {
          if (err) return socket.emit('error', 'Shell error: ' + err.message);

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

      ssh.on('error', (err) => socket.emit('error', 'Auth/Conn Error: ' + err.message));
      
      ssh.on('close', () => socket.emit('status', 'Connection closed.'));

      try {
        ssh.connect({
          host: config.host,
          port: config.port || 22,
          username: config.username,
          password: config.password,
          privateKey: config.privateKey ? Buffer.from(config.privateKey) : undefined,
          readyTimeout: 15000,
        });
      } catch (e: any) {
        socket.emit('error', 'Connect failed: ' + e.message);
      }
    });

    socket.on('disconnect', () => {
      if (ssh) {
        ssh.end();
        ssh = null;
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> OmniChat Ready on http://${hostname}:${port}`);
  });
});
