# OmniChat Application Stack Overview

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend        │    │   Auth Layer    │
│   (React SPA)   │◄──►│   (Express)      │◄──►│   (OAuth 2.1)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Vite Build    │    │   Socket.IO      │    │   Auth0         │
│   (TypeScript)  │    │   (Real-time)    │    │   (JWT)         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🎯 **Frontend Stack**

### **Core Framework & Build**
- **React 19.0.0** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Vite 5.4.0** - Fast build tool and dev server
- **TailwindCSS 3.4.1** - Utility-first CSS framework

### **UI Components & Styling**
- **Lucide React 0.454.0** - Modern icon library
- **Custom Glass UI** - Neumorphic/glass morphism design
- **Responsive Design** - Mobile-first approach
- **Dark Theme** - Grok-inspired dark interface

### **State Management & Data Flow**
- **React Hooks** - useState, useEffect, useCallback
- **Context API** - Global state management
- **Socket.IO Client 4.8.0** - Real-time communication

### **Terminal & SSH Interface**
- **xterm 5.3.0** - Terminal emulator
- **@xterm/addon-fit** - Terminal fitting
- **@xterm/addon-web-links** - Clickable links in terminal

## 🚀 **Backend Stack**

### **Core Server**
- **Node.js** - JavaScript runtime
- **Express 4.21.0** - Web framework
- **TypeScript** - Type-safe backend development
- **tsx 4.19.0** - TypeScript execution

### **Real-time Communication**
- **Socket.IO 4.8.0** - WebSocket server
- **SSH2 1.16.0** - SSH client connections
- **Agent Sessions** - Multi-user SSH management

### **Authentication & Security**
- **OAuth 2.1** - ChatGPT Apps SDK integration
- **JWT (jsonwebtoken 9.0.2)** - Token validation
- **JWKS-RSA 3.1.0** - Public key verification
- **Auth0 Integration** - Authorization server

### **Database & Storage**
- **Prisma** - ORM and database toolkit
- **SQLite** - Default file-based database
- **PostgreSQL Support** - Production database option

## 🔐 **Authentication Architecture**

### **Multi-Provider Support**
- **Gemini API** - API key authentication (`.env`)
- **OpenAI GPT** - HTTP Basic Auth (username/password)
- **xAI Grok** - HTTP Basic Auth (username/password)
- **GitHub Copilot** - OAuth Device Flow
- **ChatGPT Apps SDK** - OAuth 2.1 (Auth0)
- **Local AI** - No authentication required

### **OAuth 2.1 Implementation**
- **Dynamic Client Registration** - Auth0 Management API
- **PKCE with S256** - Secure code exchange
- **JWT Token Validation** - JWKS verification
- **Scope-based Authorization** - Granular permissions

## 🤖 **AI Services Integration**

### **Google Gemini**
- **@google/genai 1.2.0** - Official Gemini SDK
- **Multiple Models** - gemini-3-pro-preview, gemini-3-flash-preview
- **Tool Definitions** - SSH operations, file management
- **Intelligence Modes** - Different reasoning levels

### **OpenAI Integration**
- **HTTP Basic Auth** - Custom service implementation
- **GPT-4o, o1-preview** - Latest models
- **Connection Testing** - Credential validation
- **Secure Storage** - LocalStorage encryption

### **xAI Grok**
- **HTTP Basic Auth** - Custom service implementation
- **Grok-3** - Latest model
- **Real-time Integration** - Chat capabilities

## 🐳 **Deployment & Infrastructure**

### **Containerization**
- **Docker** - Application containerization
- **Docker Compose** - Multi-container orchestration
- **Multi-stage Builds** - Optimized image sizes
- **Production Configuration** - Environment-based builds

### **Deployment Script**
- **Automated Deploy** - `./deploy` command
- **Health Checks** - Application readiness verification
- **Environment Setup** - Automatic .env handling
- **Database Initialization** - Prisma migrations

### **Environment Management**
- **Development** - Hot reload with Vite
- **Production** - Optimized builds with Express
- **Environment Variables** - Secure configuration
- **SSL/HTTPS Ready** - Production security

## 📊 **Data Flow Architecture**

```
User Input → React App → Socket.IO → Express Server → AI Services
    ↓              ↓            ↓              ↓              ↓
  Terminal → SSH Client → Agent Session → Remote Server → Command Output
    ↓              ↓            ↓              ↓              ↓
  Response ← Socket.IO ← Express ← AI Processing ← SSH Response
```

## 🔧 **Development Tools**

### **Code Quality**
- **ESLint** - Code linting
- **TypeScript** - Static type checking
- **Prettier** - Code formatting
- **Git Hooks** - Pre-commit validation

### **Build System**
- **Vite** - Fast development server
- **TailwindCSS** - CSS compilation
- **PostCSS** - CSS processing
- **Asset Optimization** - Bundle optimization

## 🌐 **Network & Communication**

### **API Endpoints**
- **RESTful APIs** - Standard HTTP methods
- **WebSocket** - Real-time bidirectional communication
- **OAuth 2.1 Endpoints** - ChatGPT Apps SDK integration
- **MCP Protocol** - Model Context Protocol support

### **Security Layers**
- **CORS** - Cross-origin resource sharing
- **JWT Validation** - Token verification
- **Rate Limiting** - Request throttling
- **Input Validation** - Security sanitization

## 📱 **User Experience**

### **Interface Design**
- **Glass Morphism UI** - Modern translucent design
- **Responsive Layout** - Mobile and desktop optimized
- **Dark Theme** - Eye-friendly interface
- **Real-time Updates** - Live terminal output

### **Feature Set**
- **Multi-Provider Chat** - Switch between AI providers
- **SSH Terminal Access** - Remote server management
- **File Management** - Upload/download capabilities
- **Agent Sessions** - Persistent connections

## 🚀 **Performance Optimizations**

### **Frontend**
- **Code Splitting** - Lazy loading components
- **Virtual Scrolling** - Efficient list rendering
- **Image Optimization** - Responsive images
- **Bundle Analysis** - Size optimization

### **Backend**
- **Connection Pooling** - Database efficiency
- **Caching Strategies** - Response optimization
- **Compression** - Gzip middleware
- **Health Monitoring** - Application metrics

## 🔮 **Technology Rationale**

### **Why React 19?**
- Latest features and optimizations
- Better concurrent rendering
- Improved developer experience

### **Why TypeScript?**
- Type safety across the stack
- Better IDE support
- Reduced runtime errors

### **Why OAuth 2.1?**
- ChatGPT Apps SDK requirement
- Modern security standards
- Dynamic client registration

### **Why Docker?**
- Consistent deployment environment
- Easy scaling and management
- Development parity

---

**This stack provides a modern, secure, and scalable foundation for AI-powered applications with multi-provider support and enterprise-grade authentication.** 🎯
