# How to Get Your API Keys and Authentication

## 1. Gemini API Key (Required)

**Where to get it:**
- Go to: https://aistudio.google.com/app/apikey
- Sign in with your Google account
- Click "Create API Key"
- Copy the generated key

**How to use:**
- Replace `your_gemini_api_key_here` in your `.env` file with the actual key

## 2. OpenAI HTTP Authentication (Optional)

**What it is:** Username and password authentication for OpenAI API

**How to get credentials:**
- OpenAI typically uses API keys, not HTTP auth
- For HTTP auth, you may need:
  - Username: Your OpenAI account email or organization ID
  - Password: Your OpenAI API key or special auth token
- Check your OpenAI dashboard for authentication options

**How to use in app:**
1. Click on "OpenAI GPT" in the Neural Enclave
2. Enter your username when prompted
3. Enter your password when prompted
4. The app will test the connection and save credentials

## 3. Grok (xAI) HTTP Authentication (Optional)

**What it is:** Username and password authentication for xAI's Grok API

**How to get credentials:**
- Go to: https://console.x.ai/
- Sign up or sign in to your xAI account
- Navigate to API settings
- Get your API credentials (username/password or API key)

**How to use in app:**
1. Click on "xAI Grok" in the Neural Enclave
2. Enter your username when prompted
3. Enter your password when prompted
4. The app will test the connection and save credentials

## 4. JWT Secret (Required for User Registration)

**What it is:** A secret string used to sign JWT tokens for user authentication

**How to generate one:**
```bash
# Option 1: Using openssl (recommended)
openssl rand -base64 32

# Option 2: Using node
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator
# Visit: https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
```

**How to use:**
- Replace `your_jwt_secret_key_here` in your `.env` file with the generated secret

## 5. Database Configuration (Optional - using SQLite by default)

**Current setup:** Your app uses SQLite by default (file-based database)
- `DATABASE_URL="file:./prisma/data/dev.db"` - This works automatically

**If you want PostgreSQL instead:**
- Install PostgreSQL locally or use a cloud service
- Set these values in `.env`:
  - `DB_HOST=localhost` (or your database host)
  - `DB_PORT=5432` (default PostgreSQL port)
  - `DB_USER=postgres` (your PostgreSQL username)
  - `DB_PASSWORD=your_actual_password` (your PostgreSQL password)
  - `DB_NAME=omnichat` (database name)

## Quick Setup Commands

```bash
# 1. Get Gemini API Key
# Visit: https://aistudio.google.com/app/apikey

# 2. Generate JWT Secret
openssl rand -base64 32

# 3. Update your .env file
nano .env
```

## Environment File Template

After getting your keys, your `.env` should look like:

```env
GEMINI_API_KEY=AIzaSyD...your_actual_gemini_key
DATABASE_URL="file:./prisma/data/dev.db"
NODE_ENV=production
JWT_SECRET=your_generated_jwt_secret_here
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_db_password_here
DB_NAME=omnichat
```

## Authentication Methods Summary

- **Gemini**: API key in `.env` file
- **OpenAI**: HTTP auth (username/password) via app UI
- **Grok**: HTTP auth (username/password) via app UI  
- **Copilot**: OAuth device flow via app UI
- **Local**: No authentication needed

## Security Notes

- **Never commit your `.env` file to git**
- **Keep your API keys and secrets private**
- **Use different secrets for development and production**
- **Rotate your secrets periodically**
- **HTTP credentials are stored in browser localStorage (consider encryption for production)**
