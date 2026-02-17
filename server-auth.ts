import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import path from 'path';
import { fileURLToPath } from 'url';

// Extend Socket interface to include user information
declare module 'socket.io' {
  interface Socket {
    user?: any;
    userInfo?: any;
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
    credentials: true
  }
});

// JWT verification setup
const auth0Domain = process.env.AUTHORIZATION_SERVER || 'https://your-tenant.auth0.com';
const jwksClientInstance = jwksClient({
  jwksUri: `${auth0Domain}/.well-known/jwks.json`,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
});

// Socket.IO authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('No authentication token provided'));
    }

    // Verify JWT token
    const decodedToken = jwt.decode(token, { complete: true });
    
    if (!decodedToken) {
      return next(new Error('Invalid token format'));
    }

    // Get signing key
    const key = await jwksClientInstance.getSigningKey(decodedToken.header.kid);
    const signingKey = key.getPublicKey();

    // Verify token
    const verified = jwt.verify(token, signingKey, {
      issuer: auth0Domain,
      audience: process.env.VITE_AUTH0_AUDIENCE || `${auth0Domain}/api/v2/`,
    });

    // Attach user info to socket
    socket.user = verified;
    socket.userInfo = socket.handshake.auth.user;
    
    console.log(`Socket authenticated: ${verified.sub}`);
    next();
    
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
};

// Apply authentication middleware
io.use(authenticateSocket);

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`User ${socket.user.sub} connected via Socket.IO`);
  
  // Send welcome message
  socket.emit('authenticated', {
    message: 'Successfully authenticated with Socket.IO',
    user: {
      sub: socket.user.sub,
      email: socket.user.email,
      name: socket.user.name
    }
  });

  // Handle agent connections (existing SSH functionality)
  socket.on('agent:connect', async (config) => {
    try {
      // Your existing SSH connection logic here
      console.log(`Agent connection request from ${socket.user.sub}:`, config);
      
      // For now, just acknowledge the request
      socket.emit('agent:connected', {
        message: 'Agent connection initiated',
        userId: socket.user.sub
      });
      
    } catch (error) {
      socket.emit('error', {
        message: 'Failed to connect to agent',
        error: error.message
      });
    }
  });

  // Handle chat messages
  socket.on('chat:message', async (data) => {
    try {
      console.log(`Chat message from ${socket.user.sub}:`, data);
      
      // Process chat message with AI providers
      // Your existing chat logic here
      
      socket.emit('chat:response', {
        message: 'Response from AI',
        userId: socket.user.sub,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      socket.emit('error', {
        message: 'Failed to process chat message',
        error: error.message
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`User ${socket.user.sub} disconnected: ${reason}`);
    
    // Clean up any resources for this user
    // Your existing cleanup logic here
  });

  // Error handling
  socket.on('error', (error) => {
    console.error(`Socket error for user ${socket.user.sub}:`, error);
  });
});

// Express routes (existing OAuth endpoints)
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// OAuth 2.1 endpoints (existing implementation)
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
  // Your existing registration logic here
  res.json({
    client_id: 'demo_client_id',
    client_secret: 'demo_client_secret',
    message: 'Client registered successfully'
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

const PORT = Number(process.env.PORT) || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`> OmniChat with Auth0 Socket.IO listening on http://0.0.0.0:${PORT}`);
  console.log(`> Auth0 Domain: ${auth0Domain}`);
});
