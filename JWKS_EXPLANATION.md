# JWKS (JSON Web Key Set) Explanation

## 🔑 **What is JWKS?**

**JWKS** stands for **JSON Web Key Set** - it's a standardized endpoint that exposes the public keys used to verify JWT (JSON Web Token) signatures.

## 🎯 **Purpose in OAuth 2.1**

### **The Problem:**
When ChatGPT sends a JWT token to your app, how do you verify it's authentic and not tampered with?

### **The Solution:**
1. **Auth0 signs JWT tokens** with its **private key**
2. **Auth0 publishes the corresponding public key** at `/.well-known/jwks.json`
3. **Your app fetches the public key** to verify the token signature

## 🔄 **How It Works in Your OAuth Flow**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   ChatGPT       │    │   Auth0          │    │   Your App      │
│   (Client)      │    │   (Auth Server)  │    │   (Resource)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. Request JWT token   │                       │
         ├──────────────────────►│                       │
         │                       │ 2. Sign with private  │
         │                       │    key                │
         │                       │                       │
         │ 3. Return JWT token   │                       │
         │◄──────────────────────├──────────────────────►│
         │                       │                       │
         │ 4. Send JWT token     │                       │
         ├──────────────────────────────────────────────►│
         │                       │                       │
         │                       │ 5. Fetch public key   │
         │                       │    from JWKS endpoint │
         │                       │◄──────────────────────│
         │                       │                       │
         │                       │ 6. Verify signature   │
         │                       │    with public key    │
         │                       │                       │
         │ 7. Allow/Deny access  │                       │
         │◄──────────────────────────────────────────────│
```

## 📋 **What's Inside JWKS.json?**

A typical JWKS response looks like this:

```json
{
  "keys": [
    {
      "kty": "RSA",
      "kid": "Rz...pQ",  // Key ID - identifies which key to use
      "use": "sig",      // Usage - "sig" for signature
      "n": "0vx7agoebG...", // Modulus - part of RSA public key
      "e": "AQAB",       // Exponent - always "AQAB" for RSA
      "alg": "RS256"     // Algorithm - RSA with SHA-256
    }
  ]
}
```

### **Field Explanations:**
- **kty**: Key type (usually "RSA")
- **kid**: Key ID - tells you which key was used to sign the token
- **use**: Key usage ("sig" for signature verification)
- **n**: RSA modulus (public key component)
- **e**: RSA exponent (always "AQAB")
- **alg**: Algorithm (RS256 for OAuth 2.1)

## 🔍 **How Your App Uses JWKS**

### **In Your Server Code:**

```typescript
// 1. Fetch JWKS from Auth0
const jwksUri = 'https://your-tenant.auth0.com/.well-known/jwks.json';
const jwksResponse = await fetch(jwksUri);
const jwks = await jwksResponse.json();

// 2. Get the key ID from JWT header
const decodedToken = jwt.decode(token, { complete: true });
const keyId = decodedToken.header.kid;

// 3. Find the matching key in JWKS
const signingKey = jwks.keys.find(key => key.kid === keyId);

// 4. Convert to public key format
const publicKey = jwkToPem(signingKey);

// 5. Verify the JWT signature
const verified = jwt.verify(token, publicKey, {
  issuer: 'https://your-tenant.auth0.com',
  audience: 'http://localhost:3000'
});
```

## 🌐 **Real JWKS Examples**

### **Auth0 JWKS URL:**
```
https://your-tenant-name.auth0.com/.well-known/jwks.json
```

### **Google JWKS URL:**
```
https://www.googleapis.com/oauth2/v3/certs
```

### **Microsoft JWKS URL:**
```
https://login.microsoftonline.com/common/discovery/v2.0/keys
```

## 🔧 **JWKS in Your Implementation**

### **Your Current Setup:**
```typescript
// In server-prod.ts
const jwksClientInstance = jwksClient({
  jwksUri: `${OAUTH_CONFIG.authorizationServer}/.well-known/jwks.json`,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
});

// Automatic key fetching and caching
const key = await jwksClientInstance.getSigningKey(decodedToken.header.kid);
const signingKey = key.getPublicKey();
```

### **Environment Variable:**
```env
OAUTH_JWKS_URI=https://your-tenant-name.auth0.com/.well-known/jwks.json
```

## ⚡ **Performance & Caching**

### **Why Caching Matters:**
- JWKS keys don't change frequently
- Network requests are expensive
- High-volume apps need fast verification

### **Built-in Optimizations:**
- **jwks-rsa library** automatically caches keys
- **Rate limiting** prevents abuse
- **Key rotation** handled gracefully

## 🔒 **Security Benefits**

### **1. Asymmetric Cryptography**
- Private key signs tokens (never shared)
- Public key verifies signatures (publicly available)
- No secret key exchange needed

### **2. Key Rotation Support**
- Multiple keys can be published
- Old keys phased out gracefully
- New keys added without downtime

### **3. Standardized Security**
- RFC 7517 compliant
- Industry-wide adoption
- Interoperable with any OAuth client

## 🚨 **Common Issues & Solutions**

### **Issue**: "Invalid signature"
**Cause**: Using wrong public key or JWKS not accessible
**Solution**: Verify JWKS URL is correct and accessible

### **Issue**: "kid not found"
**Cause**: Key ID mismatch between token and JWKS
**Solution**: Check if Auth0 has rotated keys recently

### **Issue**: "Network error"
**Cause**: JWKS endpoint not reachable
**Solution**: Check network connectivity and URL

## 🧪 **Testing JWKS**

### **Test Your Auth0 JWKS:**
```bash
# Replace with your Auth0 tenant
curl https://your-tenant.auth0.com/.well-known/jwks.json
```

### **Expected Response:**
```json
{
  "keys": [
    {
      "alg": "RS256",
      "kty": "RSA",
      "use": "sig",
      "kid": "abc123def456...",
      "n": "long_base64_string...",
      "e": "AQAB"
    }
  ]
}
```

---

**Bottom Line**: JWKS is the **public key directory** that allows your app to verify JWT tokens from Auth0, ensuring secure OAuth 2.1 integration with ChatGPT! 🔐
