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

// OAuth 2.1 Protected Resource Metadata Endpoint
app.get('/.well-known/oauth-protected-resource', (req, res) => {
  res.json({
    resource: process.env.RESOURCE_URL || 'http://localhost:3000',
    authorization_servers: [process.env.AUTHORIZATION_SERVER || 'https://auth.ourcompany.com'],
    scopes_supported: ['files:read', 'files:write', 'chat:read', 'chat:write', 'ssh:execute'],
    resource_documentation: `${process.env.RESOURCE_URL || 'http://localhost:3000'}/docs`,
  });
});

// OAuth 2.1 Authorization Server Metadata Endpoint
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

// OIDC Discovery Endpoint
app.get('/.well-known/openid-configuration', (req, res) => {
  const authServer = process.env.AUTHORIZATION_SERVER || 'https://auth.ourcompany.com';
  res.json({
    issuer: authServer,
    authorization_endpoint: `${authServer}/auth`,
    token_endpoint: `${authServer}/token`,
    jwks_uri: `${authServer}/.well-known/jwks.json`,
    userinfo_endpoint: `${authServer}/userinfo`,
    registration_endpoint: `${authServer}/register`,
    scopes_supported: ['files:read', 'files:write', 'chat:read', 'chat:write', 'ssh:execute'],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
  });
});

// Dynamic Client Registration Endpoint using Auth0 Management API
app.post('/register', express.json(), async (req, res) => {
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

  try {
    // Use Auth0 Management API to create client
    const auth0Domain = process.env.AUTHORIZATION_SERVER || 'https://your-tenant.auth0.com';
    const managementToken = process.env.AUTH0_MANAGEMENT_API_TOKEN;
    
    if (!managementToken) {
      // Fallback to local client registration if no management token
      const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const clientSecret = Buffer.from(`${clientId}:${Date.now()}`).toString('base64');

      const clientInfo = {
        client_id: clientId,
        client_secret: clientSecret,
        client_name,
        redirect_uris,
        grant_types: grant_types || ['authorization_code'],
        response_types: response_types || ['code'],
        scope: scope || 'files:read files:write chat:read chat:write ssh:execute',
        client_id_issued_at: Math.floor(Date.now() / 1000),
        client_secret_expires_at: null,
      };

      console.log('Registered OAuth client locally:', clientInfo);
      return res.status(201).json(clientInfo);
    }

    const auth0Response = await fetch(`https://${auth0Domain}/api/v2/clients`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: client_name,
        app_type: 'regular_web',
        callbacks: redirect_uris,
        grant_types: grant_types || ['authorization_code'],
        oidc_conformant: true,
        jwt_configuration: {
          alg: 'RS256',
          lifetime_in_seconds: 3600
        },
        token_endpoint_auth_method: 'client_secret_post'
      })
    });
    
    if (!auth0Response.ok) {
      const error = await auth0Response.text();
      console.error('Auth0 client creation failed:', error);
      throw new Error('Failed to create Auth0 client');
    }
    
    const auth0Client = await auth0Response.json();
    
    // Map Auth0 response to OAuth 2.1 format
    const clientInfo = {
      client_id: auth0Client.client_id,
      client_secret: auth0Client.client_secret || 'generated_by_auth0',
      client_name: auth0Client.name,
      redirect_uris: auth0Client.callbacks,
      grant_types: auth0Client.grant_types,
      response_types: ['code'],
      scope: scope || 'files:read files:write chat:read chat:write ssh:execute',
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_secret_expires_at: null,
      token_endpoint_auth_method: auth0Client.token_endpoint_auth_method
    };

    console.log('Registered OAuth client via Auth0:', clientInfo);
    res.status(201).json(clientInfo);
    
  } catch (error) {
    console.error('Client registration error:', error);
    res.status(400).json({
      error: 'invalid_client_metadata',
      error_description: 'Failed to register client with authorization server'
    });
  }
});

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

const PORT = Number(process.env.PORT) || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`> OmniChat Neural Hub v3 listening on http://0.0.0.0:${PORT}`);
});
