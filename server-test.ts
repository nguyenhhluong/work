import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Socket.IO server (without Auth0 for testing)
const io = new Server(httpServer, {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://chatgpt.com',
      'https://platform.openai.com'
    ],
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Socket connection handling (without auth for testing)
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);
  
  // Send welcome message
  socket.emit('authenticated', {
    message: 'Connected to OmniChat test server',
    user: {
      sub: 'test-user',
      email: 'test@example.com',
      name: 'Test User'
    },
    timestamp: new Date().toISOString()
  });

  // Handle chat messages
  socket.on('chat:message', async (data) => {
    console.log(`💬 Chat message:`, data);
    
    socket.emit('chat:response', {
      message: 'Test response from OmniChat server',
      timestamp: new Date().toISOString(),
      provider: 'test'
    });
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`🔌 User disconnected: ${socket.id} - Reason: ${reason}`);
  });
});

// Express middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// OAuth 2.1 endpoints (for testing)
app.get('/.well-known/oauth-protected-resource', (req, res) => {
  res.json({
    resource: process.env.RESOURCE_URL || 'http://localhost:3000',
    authorization_servers: [process.env.AUTHORIZATION_SERVER || 'https://auth.ourcompany.com'],
    scopes_supported: ['files:read', 'files:write', 'chat:read', 'chat:write', 'ssh:execute'],
    resource_documentation: `${process.env.RESOURCE_URL || 'http://localhost:3000'}/docs`,
  });
});

app.get('/.well-known/oauth-authorization-server', (req, res) => {
  const authServer = process.env.AUTHORIZATION_SERVER || 'https://auth.ourcompany.com';
  res.json({
    issuer: authServer,
    authorization_endpoint: `${authServer}/auth`,
    token_endpoint: `${authServer}/token`,
    registration_endpoint: `${authServer}/register`,
    jwks_uri: `${authServer}/.well-known/jwks.json`,
    scopes_supported: ['files:read', 'files:write', 'chat:read', 'chat:write', 'ssh:execute'],
    code_challenge_methods_supported: ['S256'],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
  });
});

// Dynamic client registration
app.post('/register', express.json(), async (req, res) => {
  try {
    const { client_name, redirect_uris } = req.body;
    
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const clientSecret = Buffer.from(`${clientId}:${Date.now()}`).toString('base64');

    const clientInfo = {
      client_id: clientId,
      client_secret: clientSecret,
      client_name: client_name || 'Test Client',
      redirect_uris: redirect_uris || ['https://chatgpt.com/connector_platform_oauth_redirect'],
      grant_types: ['authorization_code'],
      response_types: ['code'],
      scope: 'files:read files:write chat:read chat:write ssh:execute',
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_secret_expires_at: null,
    };

    console.log('🔐 Registered OAuth client:', clientInfo);
    res.status(201).json(clientInfo);
    
  } catch (error) {
    console.error('❌ Client registration error:', error);
    res.status(400).json({
      error: 'invalid_client_metadata',
      error_description: 'Failed to register client'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      socketio: 'healthy',
      api: 'healthy',
      auth: 'test-mode'
    },
    message: 'Test server running - Auth0 integration ready'
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

// Start server
const PORT = Number(process.env.PORT) || 3001;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 OmniChat Test Server listening on http://0.0.0.0:${PORT}`);
  console.log(`📡 Socket.IO path: /socket.io`);
  console.log(`🔧 Test mode - Auth0 integration ready`);
  console.log(`📋 Next: Update your Auth0 credentials and restart with npm run start:auth`);
});
