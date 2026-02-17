# Auth0 Application URIs Configuration

## 🎯 **Critical Setup Step - Application URIs**

This is where most OAuth setups fail. Here are the **exact URLs** you need to configure in your Auth0 application settings.

## 📍 **Where to Find These Settings**

1. Go to **Auth0 Dashboard**
2. Navigate to **Applications** → **Applications**
3. Click on your OAuth application
4. Go to **Settings** tab
5. Scroll down to **"Application URIs"** section

## 🔗 **Required URLs for ChatGPT Integration**

### **Allowed Callback URLs**
```
https://chatgpt.com/connector_platform_oauth_redirect
https://platform.openai.com/apps-manage/oauth
http://localhost:3000/callback
http://localhost:3000
```

### **Allowed Logout URLs**
```
http://localhost:3000
https://your-production-domain.com
```

### **Allowed Web Origins**
```
http://localhost:3000
https://your-production-domain.com
```

## 📝 **Step-by-Step Instructions**

### 1. **Allowed Callback URLs**
Copy and paste these URLs exactly:

```
https://chatgpt.com/connector_platform_oauth_redirect
https://platform.openai.com/apps-manage/oauth
http://localhost:3000/callback
http://localhost:3000
```

**Why these URLs?**
- `https://chatgpt.com/connector_platform_oauth_redirect` - **Required** for ChatGPT Apps SDK
- `https://platform.openai.com/apps-manage/oauth` - **Required** for ChatGPT app management
- `http://localhost:3000/callback` - For local development testing
- `http://localhost:3000` - Fallback for local development

### 2. **Allowed Logout URLs**
```
http://localhost:3000
https://your-production-domain.com
```

### 3. **Allowed Web Origins**
```
http://localhost:3000
https://your-production-domain.com
```

## ⚠️ **Common Mistakes to Avoid**

### ❌ **Don't forget the ChatGPT URLs**
Many people only add `http://localhost:3000` and forget the ChatGPT-specific URLs.

### ❌ **Don't use trailing slashes**
- ✅ Correct: `http://localhost:3000`
- ❌ Wrong: `http://localhost:3000/`

### ❌ **Don't miss HTTPS for production URLs**
- ✅ Correct: `https://chatgpt.com/connector_platform_oauth_redirect`
- ❌ Wrong: `http://chatgpt.com/connector_platform_oauth_redirect`

### ❌ **Don't forget web origins**
CORS errors happen when Allowed Web Origins are missing.

## 🧪 **Test Your Configuration**

After setting up the URLs, test them:

### Test 1: Basic OAuth Flow
```bash
# This should work without CORS errors
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "ChatGPT Integration Test",
    "redirect_uris": ["https://chatgpt.com/connector_platform_oauth_redirect"]
  }'
```

### Test 2: Metadata Endpoints
```bash
# These should return proper JSON
curl http://localhost:3000/.well-known/oauth-protected-resource
curl http://localhost:3000/.well-known/oauth-authorization-server
```

## 🚀 **After Configuring URIs**

1. **Scroll down** and click **"Save Changes"**
2. **Wait 30 seconds** for Auth0 to propagate changes
3. **Test the endpoints** to verify everything works
4. **Update your .env** with Auth0 credentials
5. **Run `./deploy`** to restart with new configuration

## 🔧 **Troubleshooting**

### Error: "redirect_uri is not allowed"
**Solution**: Make sure the exact redirect URI is in "Allowed Callback URLs"

### Error: "CORS policy error"
**Solution**: Add the origin to "Allowed Web Origins"

### Error: "Invalid client metadata"
**Solution**: Check all required fields are present in registration request

## 📋 **Complete Configuration Checklist**

- [ ] Allowed Callback URLs configured with all 4 URLs
- [ ] Allowed Logout URLs configured
- [ ] Allowed Web Origins configured
- [ ] Changes saved in Auth0
- [ ] Waited 30 seconds for propagation
- [ ] Tested registration endpoint
- [ ] Updated .env with credentials
- [ ] Deployed with `./deploy`

---

**Once you've configured these URLs, let me know and we'll test the integration!** 🎯

The most important URLs are the ChatGPT ones - without them, the integration won't work with ChatGPT's Apps SDK.
