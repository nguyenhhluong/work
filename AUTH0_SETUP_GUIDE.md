# Auth0 Setup Guide for OAuth 2.1 Integration

## Step 1: Create Auth0 Account

1. **Sign up for Auth0**
   - Go to: https://auth0.com/signup
   - Choose the free plan (sufficient for development)
   - Sign up with Google, GitHub, or email

2. **Create a new tenant**
   - Name: `omnichat-prod` (or your preferred name)
   - Region: Choose closest to your users

## Step 2: Configure OAuth 2.1 Settings

### 2.1 Create Application
1. Go to **Applications** → **Applications**
2. Click **"Create Application"**
3. Choose **"Regular Web Application"**
4. Name: `OmniChat OAuth 2.1`
5. Click **"Create"**

### 2.2 Configure Application Settings
In the application settings:

**Basic Information:**
- Name: `OmniChat OAuth 2.1`
- Description: `OAuth 2.1 authorization server for ChatGPT integration`

**Application URIs:**
- **Allowed Callback URLs:**
  ```
  https://chatgpt.com/connector_platform_oauth_redirect
  https://platform.openai.com/apps-manage/oauth
  http://localhost:3000/callback
  ```
- **Allowed Logout URLs:**
  ```
  http://localhost:3000
  https://your-production-domain.com
  ```
- **Allowed Web Origins:**
  ```
  http://localhost:3000
  https://your-production-domain.com
  ```

### 2.3 Enable Advanced Settings
1. Go to **"Advanced Settings"** → **"OAuth"**
2. **JSONWebToken Signature Algorithm**: `RS256`
3. **OIDC Conformant**: Enabled
4. **Refresh Token**: Enabled (if needed)

## Step 3: Create API for Scopes

1. Go to **Applications** → **APIs**
2. Click **"Create API"**
3. **Name**: `OmniChat API`
4. **Identifier**: `https://omnichat.com/api`
5. **Signing Algorithm**: `RS256`
6. Click **"Create"**

### 3.1 Configure Scopes
Add the following scopes:

| Scope | Description |
|-------|-------------|
| `files:read` | Read user files |
| `files:write` | Write user files |
| `chat:read` | Read chat history |
| `chat:write` | Write chat messages |
| `ssh:execute` | Execute SSH commands |

## Step 4: Get Your Auth0 Credentials

From your application settings, you'll need:

**Domain:**
```
your-tenant-name.auth0.com
```

**Client ID:**
```
(From Application Settings)
```

**Client Secret:**
```
(From Application Settings → Basic)
```

**Management API Token:**
1. Go to **Applications** → **Applications** → **APIs**
2. Click **"Auth0 Management API"**
3. Go to **"Machine to Machine"** tab
4. Authorize your application
5. Get the token for dynamic client registration

## Step 5: Update Environment Variables

Update your `.env` file with Auth0 credentials:

```env
# OAuth 2.1 Configuration for ChatGPT Integration
AUTHORIZATION_SERVER=https://your-tenant-name.auth0.com
RESOURCE_URL=http://localhost:3000
OAUTH_CLIENT_ID=your_auth0_client_id
OAUTH_CLIENT_SECRET=your_auth0_client_secret
OAUTH_JWKS_URI=https://your-tenant-name.auth0.com/.well-known/jwks.json
AUTH0_MANAGEMENT_API_TOKEN=your_management_api_token
```

## Step 6: Test the Setup

### 6.1 Test Metadata Endpoints
```bash
# Test protected resource metadata
curl http://localhost:3000/.well-known/oauth-protected-resource

# Test authorization server metadata (should now point to Auth0)
curl http://localhost:3000/.well-known/oauth-authorization-server
```

### 6.2 Test Dynamic Client Registration
```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "ChatGPT Integration",
    "redirect_uris": ["https://chatgpt.com/connector_platform_oauth_redirect"],
    "grant_types": ["authorization_code"],
    "response_types": ["code"]
  }'
```

## Step 7: Configure Auth0 for Dynamic Client Registration

### 7.1 Enable Dynamic Client Registration
Auth0 doesn't natively support dynamic client registration in the free tier. We'll need to implement a custom solution:

1. **Option A**: Use Auth0's Management API for client registration
2. **Option B**: Implement a simple client registry in your app
3. **Option C**: Use a different auth provider (Stytch supports this natively)

### 7.2 Management API Approach
Update the `/register` endpoint to use Auth0's Management API:

```typescript
// In server-prod.ts, update the register endpoint
app.post('/register', express.json(), async (req, res) => {
  const { client_name, redirect_uris } = req.body;
  
  try {
    // Use Auth0 Management API to create client
    const auth0Response = await fetch(`https://${process.env.AUTHORIZATION_SERVER}/api/v2/clients`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AUTH0_MANAGEMENT_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: client_name,
        app_type: 'regular_web',
        callbacks: redirect_uris,
        grant_types: ['authorization_code'],
        oidc_conformant: true,
        jwt_configuration: {
          alg: 'RS256'
        }
      })
    });
    
    const client = await auth0Response.json();
    res.json({
      client_id: client.client_id,
      client_secret: 'generated_by_auth0',
      client_name: client.name,
      redirect_uris: client.callbacks,
      // ... other fields
    });
  } catch (error) {
    res.status(400).json({ error: 'Failed to register client' });
  }
});
```

## Step 8: Alternative - Stytch Setup

If Auth0's limitations are problematic, Stytch is a great alternative:

1. **Sign up**: https://stytch.com/
2. **OAuth 2.1**: Native support for dynamic client registration
3. **PKCE**: Built-in support
4. **Free tier**: More generous for development

## Step 9: Production Considerations

### Security
- [ ] Enable HTTPS in production
- [ ] Configure proper CORS
- [ ] Set up rate limiting
- [ ] Monitor auth flows

### Performance
- [ ] Cache JWKS keys
- [ ] Implement token refresh
- [ ] Set up monitoring

### Compliance
- [ ] GDPR compliance
- [ ] Data retention policies
- [ ] Audit logging

## Next Steps After Auth0 Setup

1. **Deploy with Auth0 configuration**
2. **Test OAuth flow end-to-end**
3. **Register with ChatGPT Apps Platform**
4. **Test ChatGPT integration**

## Troubleshooting

### Common Issues

**CORS Errors:**
```bash
# Add CORS middleware to server-prod.ts
app.use(cors({
  origin: ['https://chatgpt.com', 'https://platform.openai.com'],
  credentials: true
}));
```

**Token Validation Errors:**
- Check JWKS URI is accessible
- Verify token issuer matches Auth0 domain
- Ensure audience is set correctly

**Client Registration Fails:**
- Verify Management API token has correct permissions
- Check redirect URIs are allowed
- Ensure Auth0 tenant is active

## Support Resources

- [Auth0 Documentation](https://auth0.com/docs)
- [OAuth 2.1 Spec](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-01)
- [ChatGPT Apps SDK](https://platform.openai.com/docs/apps-sdk)

---

**Ready to proceed? Start with Step 1 and let me know when you need help with any step!**
