# Localhost Auth0 Setup Guide

## 🏠 **Configure Auth0 for Local Development**

Perfect! Auth0 works great with localhost. Here's how to configure it properly for your OmniChat app.

## 🔧 **Step 1: Update Auth0 Application URIs**

Go to your **Auth0 Dashboard** → **Applications** → **Your OAuth App** → **Settings** → **Application URIs**

### **For Development (Port 3000):**
```
Allowed Callback URLs: http://localhost:3000
Allowed Logout URLs: http://localhost:3000
Allowed Web Origins: http://localhost:3000
```

### **For Vite Development (Port 5173):**
```
Allowed Callback URLs: http://localhost:5173
Allowed Logout URLs: http://localhost:5173
Allowed Web Origins: http://localhost:5173
```

### **For Both Ports (Recommended):**
```
Allowed Callback URLs: http://localhost:3000, http://localhost:5173
Allowed Logout URLs: http://localhost:3000, http://localhost:5173
Allowed Web Origins: http://localhost:3000, http://localhost:5173
```

### **Don't Forget ChatGPT URLs:**
```
Allowed Callback URLs: http://localhost:3000, http://localhost:5173, https://chatgpt.com/connector_platform_oauth_redirect, https://platform.openai.com/apps-manage/oauth
Allowed Logout URLs: http://localhost:3000, http://localhost:5173
Allowed Web Origins: http://localhost:3000, http://localhost:5173
```

## 🔒 **Step 2: Optional HTTPS Setup**

If you want HTTPS locally (recommended for testing Auth0 features):

### **Install SSL Plugin:**
```bash
npm install @vitejs/plugin-basic-ssl --save-dev
```

### **Update vite.config.ts:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    https: true, // Now serves over https://localhost:5173
    port: 5173
  }
});
```

### **Update Auth0 URLs for HTTPS:**
```
Allowed Callback URLs: https://localhost:5173
Allowed Logout URLs: https://localhost:5173
Allowed Web Origins: https://localhost:5173
```

## 📋 **Step 3: Environment Variables Setup**

Create a `.env.local` file (this won't be committed to git):

```env
# Auth0 Configuration for Vite
VITE_AUTH0_DOMAIN=your-tenant-name.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id_here
VITE_AUTH0_AUDIENCE=https://your-tenant-name.auth0.com/api/v2/
```

## 🚀 **Step 4: Update index.tsx**

Your index.tsx should now look like this:

```typescript
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';
import './index.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error("Could not find root element to mount to");
}
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: 'files:read files:write chat:read chat:write ssh:execute openid profile email'
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);
```

## 🧪 **Step 5: Test the Setup**

### **Start Development Server:**
```bash
npm run dev
```

### **Test URLs:**
- **HTTP**: http://localhost:5173
- **HTTPS (if SSL enabled)**: https://localhost:5173

### **Expected Flow:**
1. Visit your app
2. Click "Sign In" 
3. Redirect to Auth0 login page
4. After login, redirect back to your app
5. User should be authenticated

## 🔧 **Troubleshooting**

### **Issue: "Callback URL mismatch"**
**Solution**: Make sure your exact URL (including port) is in "Allowed Callback URLs"

### **Issue: "CORS error"**
**Solution**: Add your origin to "Allowed Web Origins"

### **Issue: "Invalid audience"**
**Solution**: Check that `VITE_AUTH0_AUDIENCE` matches your API identifier

### **Issue: Environment variables not working**
**Solution**: 
1. Ensure `.env.local` is in your project root
2. Restart your dev server after changing env vars
3. Check that variables start with `VITE_`

## 🎯 **Next Steps**

1. **Configure Auth0 Application URIs** ← **You're here**
2. **Create Auth components** (Navbar, Login button)
3. **Integrate with Socket.IO**
4. **Test full authentication flow**

## 📝 **Quick Copy-Paste for Auth0 Settings**

### **Application URIs (HTTP):**
```
Allowed Callback URLs: http://localhost:3000, http://localhost:5173, https://chatgpt.com/connector_platform_oauth_redirect, https://platform.openai.com/apps-manage/oauth
Allowed Logout URLs: http://localhost:3000, http://localhost:5173
Allowed Web Origins: http://localhost:3000, http://localhost:5173
```

### **Application URIs (HTTPS with SSL):**
```
Allowed Callback URLs: https://localhost:5173, https://chatgpt.com/connector_platform_oauth_redirect, https://platform.openai.com/apps-manage/oauth
Allowed Logout URLs: https://localhost:5173
Allowed Web Origins: https://localhost:5173
```

---

**Ready? Update your Auth0 Application URIs now and let me know when you're ready to create the Auth components!** 🚀
