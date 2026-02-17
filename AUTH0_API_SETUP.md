# 🚨 Critical Step: Create Auth0 API

## ⚠️ **Why This is Essential**

The **AUTH0_AUDIENCE** check in our JWT verification middleware will fail unless you register an API in Auth0. This is a **mandatory step** for the authentication to work.

## 🔧 **Step-by-Step Auth0 API Setup**

### **1. Go to Auth0 Dashboard**
1. Login to your Auth0 dashboard
2. Navigate to **Applications** → **APIs** in the left sidebar

### **2. Create New API**
1. Click **"+ Create API"** button
2. Fill in the details:
   - **Name**: `OmniChat API`
   - **Identifier**: `https://omnichat-api.com` (this doesn't need to be a real URL)
   - **Signing Algorithm**: `RS256` (default, recommended)

3. Click **"Create API"**

### **3. Configure API Settings**
After creating the API, you'll see these settings:

#### **Basic Information**
- **Name**: OmniChat API
- **Identifier**: `https://omnichat-api.com` ← **This is your AUDIENCE!**

#### **Token Settings**
- **Signing Algorithm**: RS256
- **Allow Offline Access**: Yes (for refresh tokens)

### **4. Copy Your API Identifier**
Copy the **Identifier** value - this is what you'll use as `AUTH0_AUDIENCE`:

```
https://omnichat-api.com
```

### **5. Authorize Your Application**
1. Go to **Applications** → **Applications**
2. Click on your OAuth application
3. Go to **"Machine to Machine"** tab
4. Find your "OmniChat API" in the list
5. Click the **arrow** to expand
6. **Select permissions** (you can select all for now):
   - `read:client_grants`
   - `create:client_grants`
   - `delete:client_grants`
   - `update:client_grants`
   - `read:clients`
   - `create:clients`
   - `delete:clients`
   - `update:clients`
7. Click **"Update"**

### **6. Update Your Environment Variables**

#### **For Development (.env.local):**
```env
VITE_AUTH0_DOMAIN=your-tenant-name.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id_here
VITE_AUTH0_AUDIENCE=https://my-api.com
```

#### **For Production (.env):**
```env
AUTH0_DOMAIN=your-tenant-name.auth0.com
AUTH0_CLIENT_ID=your_client_id_here
AUTH0_AUDIENCE=https://my-api.com
AUTHORIZATION_SERVER=https://your-tenant-name.auth0.com
```

## 🧪 **Test Your Setup**

### **1. Test JWKS Endpoint:**
```bash
curl https://your-tenant-name.auth0.com/.well-known/jwks.json
```

### **2. Test OAuth Endpoints:**
```bash
curl http://localhost:3000/.well-known/oauth-protected-resource
```

### **3. Test Health Check:**
```bash
curl http://localhost:3000/api/health
```

## ⚡ **Quick Checklist**

- [ ] Created API in Auth0 Dashboard
- [ ] Copied API Identifier (AUDIENCE)
- [ ] Authorized your application for the API
- [ ] Updated environment variables with AUDIENCE
- [ ] Restarted development server

## 🔍 **Troubleshooting**

### **Error: "Invalid audience"**
**Cause**: `AUTH0_AUDIENCE` doesn't match your API identifier
**Solution**: Copy the exact API identifier from Auth0 Dashboard

### **Error: "Token missing"**
**Cause**: Frontend not passing audience in Auth0Provider
**Solution**: Ensure `audience` is set in your Auth0Provider

### **Error: "JWKS health check failed"**
**Cause**: Wrong AUTH0_DOMAIN or network issues
**Solution**: Verify your Auth0 tenant name

## 🎯 **What This Enables**

With the API properly configured:

✅ **JWT tokens will have correct audience**
✅ **Socket.IO authentication will work**
✅ **HTTP API endpoints will be protected**
✅ **ChatGPT Apps SDK integration will function**

## 📋 **Environment Variables Summary**

Your final environment setup should look like:

### **Frontend (.env.local):**
```env
VITE_AUTH0_DOMAIN=your-tenant-name.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id_here
VITE_AUTH0_AUDIENCE=https://omnichat-api.com
```

### **Backend (.env):**
```env
AUTH0_DOMAIN=your-tenant-name.auth0.com
AUTH0_CLIENT_ID=your_client_id_here
AUTH0_AUDIENCE=https://omnichat-api.com
AUTHORIZATION_SERVER=https://your-tenant-name.auth0.com
RESOURCE_URL=http://localhost:3000
```

---

**🚨 This is the most critical step - without the API setup, your authentication will fail!**

Create your Auth0 API now and update your environment variables! 🔐
