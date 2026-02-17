import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { verifySocketToken, verifyHttpToken, checkJwksHealth } from './middleware/auth.middleware';

// Load environment variables
config({ path: '.env' });

// Extend Socket interface to include user information
declare module 'socket.io' {
  interface Socket {
    user?: any;
    userId?: string;
    userEmail?: string;
    userName?: string;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Socket.IO with authentication middleware
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

// Apply Socket.IO authentication middleware
io.use(verifySocketToken);

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.userName} (${socket.userId})`);
  
  // Send welcome message
  socket.emit('authenticated', {
    message: 'Successfully authenticated with Socket.IO',
    user: {
      sub: socket.userId,
      email: socket.userEmail,
      name: socket.userName
    },
    timestamp: new Date().toISOString()
  });

  // Handle agent connections (existing SSH functionality)
  socket.on('agent:connect', async (config) => {
    try {
      console.log(`🔗 Agent connection request from ${socket.userName}:`, config);
      
      // Your existing SSH connection logic here
      // For now, acknowledge the request
      socket.emit('agent:connected', {
        message: 'Agent connection initiated',
        userId: socket.userId,
        userName: socket.userName,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(`❌ Agent connection error for ${socket.userName}:`, error);
      socket.emit('error', {
        message: 'Failed to connect to agent',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle chat messages
  socket.on('chat:message', async (data) => {
    try {
      console.log(`💬 Chat message from ${socket.userName}:`, data);
      
      // Your existing chat logic here
      // Process with AI providers (Gemini, OpenAI, Grok, etc.)
      
      socket.emit('chat:response', {
        message: 'Response from AI service',
        userId: socket.userId,
        userName: socket.userName,
        timestamp: new Date().toISOString(),
        provider: 'gemini' // or other provider
      });
      
    } catch (error) {
      console.error(`❌ Chat message error for ${socket.userName}:`, error);
      socket.emit('error', {
        message: 'Failed to process chat message',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle file operations
  socket.on('file:read', async (filePath) => {
    try {
      console.log(`📁 File read request from ${socket.userName}: ${filePath}`);
      
      // Your existing file logic here
      socket.emit('file:response', {
        path: filePath,
        content: 'File content here',
        userId: socket.userId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      socket.emit('error', {
        message: 'Failed to read file',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle SSH commands
  socket.on('ssh:execute', async (command) => {
    try {
      console.log(`🖥️ SSH command from ${socket.userName}: ${command}`);
      
      // Your existing SSH logic here
      socket.emit('ssh:response', {
        command: command,
        output: 'Command output here',
        userId: socket.userId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      socket.emit('error', {
        message: 'Failed to execute SSH command',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`🔌 User disconnected: ${socket.userName} (${socket.userId}) - Reason: ${reason}`);
    
    // Clean up any resources for this user
    // Your existing cleanup logic here
  });

  // Error handling
  socket.on('error', (error) => {
    console.error(`❌ Socket error for ${socket.userName}:`, error);
  });
});

// Express middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Protected API endpoints with authentication
app.get('/api/user/profile', verifyHttpToken, (req, res) => {
  res.json({
    user: {
      sub: req.userId,
      email: req.userEmail,
      name: req.userName
    },
    timestamp: new Date().toISOString()
  });
});

// OAuth 2.1 endpoints (no authentication required)
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
    
    // Validate required fields
    if (!client_name || !redirect_uris || !Array.isArray(redirect_uris)) {
      return res.status(400).json({
        error: 'invalid_client_metadata',
        error_description: 'Missing required fields'
      });
    }

    // Validate redirect URIs
    const allowedRedirectUris = [
      'https://chatgpt.com/connector_platform_oauth_redirect',
      'https://platform.openai.com/apps-manage/oauth'
    ];

    const hasValidRedirectUri = redirect_uris.some(uri => 
      allowedRedirectUris.includes(uri) || uri.startsWith('http://localhost')
    );

    if (!hasValidRedirectUri) {
      return res.status(400).json({
        error: 'invalid_redirect_uri',
        error_description: 'Redirect URI not allowed'
      });
    }

    // Generate client credentials
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const clientSecret = Buffer.from(`${clientId}:${Date.now()}`).toString('base64');

    const clientInfo = {
      client_id: clientId,
      client_secret: clientSecret,
      client_name,
      redirect_uris,
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
app.get('/api/health', async (req, res) => {
  const jwksHealthy = await checkJwksHealth();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      jwks: jwksHealthy ? 'healthy' : 'unhealthy',
      socketio: 'healthy',
      auth: 'healthy'
    }
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

// Start server with health check
const PORT = Number(process.env.PORT) || 3002;

const startServer = async () => {
  // Check JWKS health before starting
  const jwksHealthy = await checkJwksHealth();
  
  if (!jwksHealthy) {
    console.error('❌ JWKS health check failed. Please check AUTH0_DOMAIN and network connectivity.');
    process.exit(1);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 OmniChat with Auth0 Socket.IO listening on http://0.0.0.0:${PORT}`);
    console.log(`🔐 Auth0 Domain: ${process.env.AUTH0_DOMAIN}`);
    console.log(`📡 Socket.IO path: /socket.io`);
    console.log(`🔑 JWKS URI: https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`);
    console.log(`👥 Audience: ${process.env.AUTH0_AUDIENCE}`);
  });
};

startServer().catch(console.error);
