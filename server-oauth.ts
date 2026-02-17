import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Buffer } from 'buffer';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  path: '/socket.io',
  transports: ['websocket', 'polling']
});

// Configuration
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

// OAuth 2.1 Configuration
const OAUTH_CONFIG = {
  // In production, these should come from environment variables
  authorizationServer: process.env.AUTHORIZATION_SERVER || 'https://auth.ourcompany.com',
  resourceUrl: process.env.RESOURCE_URL || 'http://localhost:3000',
  supportedScopes: ['files:read', 'files:write', 'chat:read', 'chat:write', 'ssh:execute'],
};

// JWKS Client for token validation
const jwksClientInstance = jwksClient({
  jwksUri: `${OAUTH_CONFIG.authorizationServer}/.well-known/jwks.json`,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
});

// Token verification middleware
const verifyOAuthToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      jsonrpc: '2.0',
      id: 1,
      result: {
        content: [{ type: 'text', text: 'Authentication required.' }],
        _meta: {
          'mcp/www_authenticate': [
            `'Bearer resource_metadata="${OAUTH_CONFIG.resourceUrl}/.well-known/oauth-protected-resource", error="invalid_token"'`
          ]
        }
      },
      isError: true
    });
  }

  const token = authHeader.substring(7);

  try {
    // Verify JWT token
    const decodedToken = jwt.decode(token, { complete: true });
    
    if (!decodedToken) {
      throw new Error('Invalid token format');
    }

    // Get signing key
    const key = await jwksClientInstance.getSigningKey(decodedToken.header.kid);
    const signingKey = key.getPublicKey();

    // Verify token
    const verified = jwt.verify(token, signingKey, {
      issuer: OAUTH_CONFIG.authorizationServer,
      audience: OAUTH_CONFIG.resourceUrl,
    });

    // Check scopes
    const requiredScopes = getRequiredScopesForEndpoint(req.path, req.method);
    const tokenPayload = verified as any; // Type assertion for custom claims
    const tokenScopes = tokenPayload.scope ? tokenPayload.scope.split(' ') : [];
    
    const hasRequiredScopes = requiredScopes.every(scope => tokenScopes.includes(scope));
    
    if (!hasRequiredScopes) {
      return res.status(403).json({
        jsonrpc: '2.0',
        id: 1,
        result: {
          content: [{ type: 'text', text: 'Insufficient permissions.' }],
          _meta: {
            'mcp/www_authenticate': [
              `'Bearer resource_metadata="${OAUTH_CONFIG.resourceUrl}/.well-known/oauth-protected-resource", error="insufficient_scope"'`
            ]
          }
        },
        isError: true
      });
    }

    // Attach user info to request
    req.user = verified;
    req.scopes = tokenScopes;
    next();
  } catch (error) {
    return res.status(401).json({
      jsonrpc: '2.0',
      id: 1,
      result: {
        content: [{ type: 'text', text: 'Invalid or expired token.' }],
        _meta: {
          'mcp/www_authenticate': [
            `'Bearer resource_metadata="${OAUTH_CONFIG.resourceUrl}/.well-known/oauth-protected-resource", error="invalid_token"'`
          ]
        }
      },
      isError: true
    });
  }
};

// Helper function to determine required scopes for endpoints
function getRequiredScopesForEndpoint(path, method) {
  const scopeMap = {
    'GET:/api/files': ['files:read'],
    'POST:/api/files': ['files:write'],
    'PUT:/api/files': ['files:write'],
    'DELETE:/api/files': ['files:write'],
    'GET:/api/chat': ['chat:read'],
    'POST:/api/chat': ['chat:write'],
    'POST:/api/ssh': ['ssh:execute'],
  };
  
  return scopeMap[`${method}:${path}`] || [];
}

// Protected Resource Metadata Endpoint
app.get('/.well-known/oauth-protected-resource', (req, res) => {
  res.json({
    resource: OAUTH_CONFIG.resourceUrl,
    authorization_servers: [OAUTH_CONFIG.authorizationServer],
    scopes_supported: OAUTH_CONFIG.supportedScopes,
    resource_documentation: `${OAUTH_CONFIG.resourceUrl}/docs`,
  });
});

// Authorization Server Metadata Endpoint (if hosting own auth server)
app.get('/.well-known/oauth-authorization-server', (req, res) => {
  res.json({
    issuer: OAUTH_CONFIG.authorizationServer,
    authorization_endpoint: `${OAUTH_CONFIG.authorizationServer}/auth`,
    token_endpoint: `${OAUTH_CONFIG.authorizationServer}/token`,
    registration_endpoint: `${OAUTH_CONFIG.authorizationServer}/register`,
    jwks_uri: `${OAUTH_CONFIG.authorizationServer}/.well-known/jwks.json`,
    scopes_supported: OAUTH_CONFIG.supportedScopes,
    code_challenge_methods_supported: ['S256'],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
  });
});

// OIDC Discovery Endpoint
app.get('/.well-known/openid-configuration', (req, res) => {
  res.json({
    issuer: OAUTH_CONFIG.authorizationServer,
    authorization_endpoint: `${OAUTH_CONFIG.authorizationServer}/auth`,
    token_endpoint: `${OAUTH_CONFIG.authorizationServer}/token`,
    jwks_uri: `${OAUTH_CONFIG.authorizationServer}/.well-known/jwks.json`,
    userinfo_endpoint: `${OAUTH_CONFIG.authorizationServer}/userinfo`,
    registration_endpoint: `${OAUTH_CONFIG.authorizationServer}/register`,
    scopes_supported: OAUTH_CONFIG.supportedScopes,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
  });
});

// Dynamic Client Registration Endpoint
app.post('/register', express.json(), (req, res) => {
  const { client_name, redirect_uris, grant_types, response_types, scope } = req.body;
  
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

  // Store client info (in production, use database)
  const clientInfo = {
    client_id: clientId,
    client_secret: clientSecret,
    client_name,
    redirect_uris,
    grant_types: grant_types || ['authorization_code'],
    response_types: response_types || ['code'],
    scope: scope || OAUTH_CONFIG.supportedScopes.join(' '),
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_secret_expires_at: null, // No expiration for now
  };

  // In production, store in database
  console.log('Registered client:', clientInfo);

  res.status(201).json(clientInfo);
});

// Protected API endpoints with OAuth verification
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// MCP Tools with security schemes
const mcpTools = [
  {
    name: 'public_search',
    title: 'Public Search',
    description: 'Search public data without authentication.',
    securitySchemes: [{ type: 'noauth' }],
    handler: async ({ input }) => {
      return { content: [{ type: 'text', text: `Public search results for: ${input.query}` }] };
    }
  },
  {
    name: 'private_files_read',
    title: 'Read Private Files',
    description: 'Read user-specific files.',
    securitySchemes: [{ type: 'oauth2', scopes: ['files:read'] }],
    handler: async ({ input }, req) => {
      return { content: [{ type: 'text', text: `Reading private file: ${input.path} for user: ${req.user.sub}` }] };
    }
  },
  {
    name: 'private_files_write',
    title: 'Write Private Files',
    description: 'Write user-specific files.',
    securitySchemes: [{ type: 'oauth2', scopes: ['files:write'] }],
    handler: async ({ input }, req) => {
      return { content: [{ type: 'text', text: `Writing to private file: ${input.path} for user: ${req.user.sub}` }] };
    }
  },
  {
    name: 'ssh_execute',
    title: 'Execute SSH Command',
    description: 'Execute SSH commands on behalf of user.',
    securitySchemes: [{ type: 'oauth2', scopes: ['ssh:execute'] }],
    handler: async ({ input }, req) => {
      return { content: [{ type: 'text', text: `Executing SSH command: ${input.command} for user: ${req.user.sub}` }] };
    }
  }
];

// MCP JSON-RPC endpoint
app.post('/mcp', verifyOAuthToken, async (req, res) => {
  const { method, params, id } = req.body;
  
  if (method === 'tools/list') {
    const tools = mcpTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          path: { type: 'string' },
          command: { type: 'string' }
        },
        required: ['query']
      }
    }));
    
    return res.json({
      jsonrpc: '2.0',
      id,
      result: { tools }
    });
  }
  
  if (method === 'tools/call') {
    const { name, arguments: args } = params;
    const tool = mcpTools.find(t => t.name === name);
    
    if (!tool) {
      return res.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: 'Tool not found' }
      });
    }
    
    try {
      const result = await tool.handler({ input: args }, req);
      return res.json({
        jsonrpc: '2.0',
        id,
        result
      });
    } catch (error) {
      return res.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32603, message: error.message }
      });
    }
  }
  
  res.json({
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: 'Method not found' }
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

// Socket.IO for existing functionality
const agentSessions = new Map();

io.on('connection', (socket) => {
  let shellClient: any;
  
  socket.on('agent:connect', (config: any) => {
    // Existing SSH connection logic
    const { host, port, username, password, privateKey } = config;
    
    if (agentSessions.has(socket.id)) {
      const existing = agentSessions.get(socket.id);
      clearTimeout(existing.timeout);
      existing.client.end();
      agentSessions.delete(socket.id);
    }
    
    // ... rest of existing SSH logic
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

httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`> OmniChat Neural Hub with OAuth 2.1 listening on http://0.0.0.0:${PORT}`);
  console.log(`> OAuth Protected Resource: ${OAUTH_CONFIG.resourceUrl}/.well-known/oauth-protected-resource`);
  console.log(`> Authorization Server: ${OAUTH_CONFIG.authorizationServer}`);
});
