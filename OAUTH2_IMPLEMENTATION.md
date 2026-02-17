# OAuth 2.1 Implementation for ChatGPT Integration

## Overview

This document outlines the implementation of OAuth 2.1 authentication for ChatGPT Apps SDK integration in the OmniChat application.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   ChatGPT       │    │  Authorization   │    │   OmniChat      │
│   (Client)      │◄──►│     Server       │◄──►│   (Resource)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Implementation Status

### ✅ Completed

1. **Protected Resource Metadata Endpoint**
   - `GET /.well-known/oauth-protected-resource`
   - Returns resource info and supported scopes

2. **Authorization Server Metadata**
   - `GET /.well-known/oauth-authorization-server`
   - `GET /.well-known/openid-configuration`
   - OAuth 2.1 and OIDC discovery endpoints

3. **Dynamic Client Registration**
   - `POST /register`
   - Validates redirect URIs
   - Generates client credentials

4. **Token Verification Middleware**
   - JWT signature validation
   - Scope-based authorization
   - Proper error responses with WWW-Authenticate headers

5. **MCP Tools with Security Schemes**
   - Public tools (no auth)
   - Protected tools (OAuth 2.1 with scopes)

### 🚧 Next Steps

#### 1. Set Up Authorization Server

**Option A: Use Auth0**
```bash
# Create Auth0 tenant
# Configure OAuth 2.1 settings
# Set up dynamic client registration
# Configure JWKS endpoint
```

**Option B: Use Stytch**
```bash
# Create Stytch project
# Configure OAuth 2.1
# Set up PKCE support
# Configure token validation
```

**Option C: Self-Hosted Authorization Server**
- Use `server-oauth.ts` as starting point
- Implement user authentication
- Set up proper JWKS rotation
- Configure database for client storage

#### 2. Update Environment Variables

```env
# Production OAuth 2.1 Configuration
AUTHORIZATION_SERVER=https://your-auth-server.com
RESOURCE_URL=https://your-app.com
OAUTH_CLIENT_ID=your_production_client_id
OAUTH_CLIENT_SECRET=your_production_client_secret
OAUTH_JWKS_URI=https://your-auth-server.com/.well-known/jwks.json
```

#### 3. Deploy Authorization Server

```bash
# Deploy auth server separately
# Configure SSL certificates
# Set up proper CORS
# Monitor and log auth flows
```

#### 4. Test with ChatGPT

1. **Register your app with ChatGPT**
2. **Test OAuth flow**
3. **Verify token validation**
4. **Test MCP tools with scopes**

## Configuration

### Scopes

| Scope | Description | Required For |
|-------|-------------|---------------|
| `files:read` | Read user files | File access tools |
| `files:write` | Write user files | File creation tools |
| `chat:read` | Read chat history | Chat analysis tools |
| `chat:write` | Write chat messages | Chat generation tools |
| `ssh:execute` | Execute SSH commands | Remote access tools |

### Security Schemes

```typescript
// Public tool (no authentication)
{
  name: 'public_search',
  securitySchemes: [{ type: 'noauth' }]
}

// Protected tool (OAuth 2.1)
{
  name: 'private_files_read',
  securitySchemes: [{ 
    type: 'oauth2', 
    scopes: ['files:read'] 
  }]
}
```

## API Endpoints

### OAuth 2.1 Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/.well-known/oauth-protected-resource` | Protected resource metadata |
| GET | `/.well-known/oauth-authorization-server` | Auth server metadata |
| GET | `/.well-known/openid-configuration` | OIDC discovery |
| POST | `/register` | Dynamic client registration |

### MCP Endpoints

| Method | Endpoint | Authentication |
|--------|----------|----------------|
| POST | `/mcp` | OAuth 2.1 Bearer Token |

## Error Handling

### 401 Unauthorized Response
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{ "type": "text", "text": "Authentication required." }],
    "_meta": {
      "mcp/www_authenticate": [
        "'Bearer resource_metadata=\"https://your-app.com/.well-known/oauth-protected-resource\", error=\"invalid_token\"'"
      ]
    }
  },
  "isError": true
}
```

### 403 Insufficient Scope
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{ "type": "text", "text": "Insufficient permissions." }],
    "_meta": {
      "mcp/www_authenticate": [
        "'Bearer resource_metadata=\"https://your-app.com/.well-known/oauth-protected-resource\", error=\"insufficient_scope\"'"
      ]
    }
  },
  "isError": true
}
```

## Security Considerations

1. **Token Validation**
   - Always verify JWT signature
   - Check issuer and audience
   - Validate expiration time
   - Verify required scopes

2. **Redirect URI Validation**
   - Only allow ChatGPT redirect URIs
   - Validate localhost for development
   - Use HTTPS in production

3. **Client Registration**
   - Rate limit registration attempts
   - Validate client metadata
   - Store secrets securely

4. **CORS Configuration**
```typescript
app.use(cors({
  origin: ['https://chatgpt.com', 'https://platform.openai.com'],
  credentials: true
}));
```

## Testing

### Development Testing
```bash
# Test protected resource metadata
curl http://localhost:3000/.well-known/oauth-protected-resource

# Test auth server metadata
curl http://localhost:3000/.well-known/oauth-authorization-server

# Test client registration
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Test Client",
    "redirect_uris": ["http://localhost:3000/callback"],
    "grant_types": ["authorization_code"],
    "response_types": ["code"]
  }'
```

### MCP Tool Testing
```bash
# Test public tool (no auth)
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "public_search",
      "arguments": {"query": "test"}
    }
  }'

# Test protected tool (with auth)
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <valid_jwt>" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "private_files_read",
      "arguments": {"path": "/test"}
    }
  }'
```

## Deployment

### Production Deployment Checklist

- [ ] Set up SSL certificates
- [ ] Configure production auth server
- [ ] Update environment variables
- [ ] Set up monitoring and logging
- [ ] Test with ChatGPT Apps SDK
- [ ] Configure rate limiting
- [ ] Set up backup and recovery

### Docker Configuration
```dockerfile
# Add OAuth dependencies
RUN npm install jsonwebtoken jwks-rsa

# Copy OAuth server
COPY server-oauth.ts ./

# Update start script
CMD ["npm", "run", "start:oauth"]
```

## Resources

- [OpenAI Apps SDK Documentation](https://platform.openai.com/docs/apps-sdk)
- [OAuth 2.1 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-01)
- [MCP Authorization Specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)
- [Auth0 ChatGPT Integration Guide](https://auth0.com/blog/chatgpt-apps-sdk-integration)

## Timeline

**Phase 1 (Week 1):** Set up authorization server
**Phase 2 (Week 2):** Implement OAuth flow
**Phase 3 (Week 3):** Test with ChatGPT
**Phase 4 (Week 4):** Production deployment

## Support

For questions about this implementation:
1. Check the OpenAI Apps SDK documentation
2. Review the MCP specification
3. Test with the provided examples
4. Monitor logs for debugging information
