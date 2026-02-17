# Auth0 Credentials Checklist

## 🔑 **Required Information from Auth0**

### 1. **Auth0 Domain**
- **Where to find**: Auth0 Dashboard → Applications → Applications → Your App → Settings → Basic Information
- **Format**: `your-tenant-name.auth0.com`
- **Example**: `omnichat-prod.auth0.com`

### 2. **Client ID**
- **Where to find**: Auth0 Dashboard → Applications → Applications → Your App → Settings → Basic Information
- **Format**: String of alphanumeric characters
- **Example**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

### 3. **Client Secret**
- **Where to find**: Auth0 Dashboard → Applications → Applications → Your App → Settings → Basic Information → "Client Secret" tab
- **Format**: Long string of random characters
- **Example**: `xYz123AbC456dEf789GhI012jKlMnoPqR345sTuVwXyZ`

### 4. **Management API Token**
- **Where to find**: 
  1. Auth0 Dashboard → Applications → Applications → APIs
  2. Click "Auth0 Management API"
  3. Go to "Machine to Machine" tab
  4. Find your application and authorize it
  5. Click "Create & Authorize"
  6. Copy the token
- **Required permissions**: `create:clients`, `read:clients`
- **Format**: JWT token (long string with dots)

## 📝 **How to Update Your .env File**

Replace the placeholder values in `/home/ubuntu/work/.env`:

```env
# OAuth 2.1 Configuration for ChatGPT Integration
AUTHORIZATION_SERVER=https://YOUR-TENANT-NAME.auth0.com
RESOURCE_URL=http://localhost:3000
OAUTH_CLIENT_ID=YOUR_CLIENT_ID_HERE
OAUTH_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
OAUTH_JWKS_URI=https://YOUR-TENANT-NAME.auth0.com/.well-known/jwks.json
AUTH0_MANAGEMENT_API_TOKEN=YOUR_MANAGEMENT_API_TOKEN_HERE
```

## 🚀 **Quick Steps to Get Your Credentials**

### Step 1: Get Auth0 Domain
1. Login to Auth0 Dashboard
2. Go to Applications → Applications
3. Click on your OAuth application
4. Copy the "Domain" from Basic Information

### Step 2: Get Client ID & Secret
1. In the same application settings
2. Copy "Client ID"
3. Go to "Client Secret" tab
4. Click "Show" and copy the secret

### Step 3: Get Management API Token
1. Go to Applications → APIs
2. Click "Auth0 Management API"
3. Go to "Machine to Machine" tab
4. Find your application and click the arrow to expand
5. Select permissions: `create:clients`, `read:clients`
6. Click "Update"
7. Go back to Applications → Applications → Your App
8. Go to "Settings" → "Advanced Settings" → "Grant Types"
9. Ensure "Client Credentials" is enabled
10. Go to "Machine to Machine Applications" in your app
11. Copy the token or generate a new one

## ⚡ **Once You Have the Credentials**

1. **Update the .env file** with your actual Auth0 values
2. **Run**: `./deploy` to restart with new configuration
3. **Test**: We'll verify the OAuth endpoints work with Auth0

## 🔧 **Test Commands (After Update)**

```bash
# Test protected resource metadata
curl http://localhost:3000/.well-known/oauth-protected-resource

# Test authorization server metadata (should point to your Auth0)
curl http://localhost:3000/.well-known/oauth-authorization-server

# Test dynamic client registration via Auth0
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "ChatGPT Integration Test",
    "redirect_uris": ["https://chatgpt.com/connector_platform_oauth_redirect"]
  }'
```

## 🎯 **Next Steps After Credentials**

1. ✅ Update .env with Auth0 credentials
2. ✅ Deploy and test endpoints
3. ✅ Verify dynamic client registration works
4. 🔄 Register with ChatGPT Apps Platform
5. 🔄 Test full ChatGPT integration

---

**Ready? Get your Auth0 credentials and let me know when you've updated the .env file!** 🚀
