# 🌌 OmniChat: Unified AI & SSH Autonomous Agent

OmniChat is a high-performance, enterprise-grade interface that bridges the gap between Large Language Models and infrastructure management. Built with **Next.js 15**, **Socket.io**, and the **Gemini 3 API**, it transforms a standard chat interface into an autonomous DevOps companion.

![OmniChat Banner](https://img.shields.io/badge/OmniChat-Autonomous_DevOps-blue?style=for-the-badge&logo=google-gemini)

## 🚀 Key Features

### 🤖 Autonomous Agent Mode
Toggle **Agent Mode** to give the AI reasoning capabilities over your infrastructure. Using a sophisticated tool-calling loop, the agent can:
- **SSH Connectivity**: Securely connect to remote VPS or Bare Metal.
- **File System Operations**: Read, write, and list directories for code analysis.
- **Command Execution**: Run git ops, deployment scripts, or system audits.
- **Safety First**: Human-in-the-loop (HITL) approval for destructive commands.

### 🔐 Unified AI Connectors
One interface to rule them all. Switch between:
- **Gemini 2.5/3 Pro**: The core reasoning engine for autonomous tasks.
- **GitHub Copilot / Grok**: Integrated via OAuth 2.0 Device Flow.
- **OpenAI**: Native support for GPT-4o and O1-preview.

### 💻 Integrated Cloud Terminal
A full-featured **Xterm.js** terminal bridge.
- Encrypted SSH tunnel via backend Node.js proxy.
- Low-latency input/output streaming.
- Supports Private Key (RSA/Ed25519) and Password auth.

## 🏗️ Technical Architecture

- **Frontend**: React 19 + Tailwind CSS + Lucide Icons.
- **Backend**: Custom Node.js Server (Next.js custom server) for real-time Socket.io handling.
- **Engine**: Google Gemini 3 (Pro Preview) for advanced tool-calling and long-context reasoning.
- **Communication**: WebSockets for terminal streams and tool execution status.

## 🛠️ Quick Start (Development)

1. **Clone & Install**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Create a `.env` file in the root:
   ```env
   API_KEY=your_gemini_api_key
   ```

3. **Run Dev Server**:
   ```bash
   npm run dev
   ```

## 🚢 1-Click Deployment (Production)

### Option 1: Docker (Recommended)
OmniChat is fully containerized. To deploy to any cloud provider with Docker support:

```bash
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual Production Build
```bash
npm run build
npm start
```

## 🛡️ Security Policy

- **Ephemeral Sessions**: SSH credentials and AI session tokens are held strictly in memory.
- **Backend Proxy**: Your browser never communicates directly with your remote servers via SSH; all traffic is proxied through an encrypted backend tunnel.
- **HITL Verification**: Critical agent actions require explicit user approval (Approve/Reject) to prevent unintended infrastructure changes.

## 📝 License

OmniChat is open-source software licensed under the MIT License.
