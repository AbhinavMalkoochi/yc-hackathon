# AI Browser Testing Agent

> **Intelligent browser automation powered by AI** - Generate, edit, and execute browser tests using natural language descriptions.

## 🏗️ Architecture Overview

**Modern Full-Stack with Frontend-First Database:**

- **Frontend**: Next.js 14 + Convex (real-time database with React hooks)
- **Backend**: FastAPI (functional endpoints for LLM, streaming, external services)
- **Database**: Convex runs directly in frontend components
- **AI**: OpenAI GPT-3.5-turbo for intelligent flow generation
- **Browser Automation**: Browser Use library integration (upcoming)

**Core Principles:**

- **Frontend-First Database**: Convex operates directly in React with real-time subscriptions
- **Functional Backend**: FastAPI provides stateless services, no database logic
- **Clean Separation**: Data persistence in frontend, external APIs in backend

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install
pip install -r backend/requirements.txt

# 2. Setup Convex
npx convex dev

# 3. Configure environment variables
# See environment setup section below

# 4. Start development
npm run dev
```

## 🔧 Environment Setup

### Frontend (.env.local)

Create a `.env.local` file in the root directory:

```bash
# Required: Convex database connection URL
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url_here

# Required: FastAPI backend URL
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000

# Optional: Clerk authentication
CLERK_JWT_ISSUER_DOMAIN=your_clerk_jwt_issuer_domain_here
```

### Backend (.env)

Create a `.env` file in the `backend/` directory:

```bash
# Required: Google Gemini API key for LLM features
GEMINI_API_KEY=your_gemini_api_key_here

# Required: Browser Use Cloud API key for browser automation
BROWSER_USE_API_KEY=your_browser_use_api_key_here

# Optional: Enhanced logging
LOG_LEVEL=INFO
```

### How to Get API Keys:

1. **GEMINI_API_KEY**: [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **BROWSER_USE_API_KEY**: [Browser Use Cloud](https://browseruse.com/)
3. **NEXT_PUBLIC_CONVEX_URL**: Run `npx convex dev` for local development

## 📋 Development Progress

**✅ Phase 1 Complete**: Foundation & Real-time Infrastructure

- Task 1.1: FastAPI-Next.js Integration & Testing
- Task 1.2: Streaming Communication (Server-Sent Events)
- Task 1.3: Convex Database Integration & Real-time Sync

**✅ Phase 2 Complete**: Flow Generation & Management

- Task 2.1: LLM Integration for Flow Generation ✅
- Task 2.2: Flow Editing & Management Interface ✅
- Task 2.3: Flow Approval & Execution Preparation ✅

**✅ Phase 3 Complete**: Browser Use Integration & Parallel Sessions

- Task 3.1-3.11: Complete Browser Use Cloud integration ✅
- Task 3.12: Unified Dashboard UI with Apple liquid glass theme ✅

## 🚀 Live Features

**Unified Dashboard Interface:**

- 🎨 **Apple Liquid Glass Theme**: Beautiful, minimalistic design with backdrop-blur effects
- 📊 **Session Overview**: Real-time statistics and session information
- 🔄 **Flow Management**: Create, edit, approve, and execute test flows
- 👁️ **Live Browser Sessions**: Embedded live browser viewports with real-time streaming
- 📱 **Responsive Design**: Optimized for all screen sizes with smooth animations

**Core Functionality:**

- 🏠 **Main Application**: `/` - Unified dashboard for complete workflow management
- 📊 **Session Logs**: `/logs/[taskId]` - Comprehensive logs page with live preview
- 🧪 **Testing**: `/test` - Backend integration testing (when needed)

## 📚 Documentation

**Architecture & Components:**

- [FastAPI Backend](./docs/fastapi-backend.md) - API endpoints, LLM integration, streaming
- [Next.js Frontend](./docs/nextjs-frontend.md) - React components, test interfaces, real-time UI
- [Convex Database](./docs/convex-database.md) - Schema, functions, React integration

**Development:**

- [Task Roadmap](./tasks.md) - Detailed development roadmap with granular tasks
- [API Reference](http://localhost:8000/docs) - Interactive FastAPI documentation (when running)

## 🔄 What's Different

This isn't your typical full-stack template:

1. **Frontend-First Database**: Convex runs directly in React components, not through API calls
2. **Real-time Everything**: Live updates, streaming, and instant feedback across all interfaces
3. **Unified Interface**: Single dashboard combining all functionality for seamless developer experience
4. **AI-First Design**: Built from the ground up for LLM integration and intelligent automation
5. **Functional Backend**: Clean, stateless FastAPI functions without classes or complexity
6. **Apple Liquid Glass Theme**: Beautiful, modern UI with backdrop-blur and smooth animations

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Convex React Hooks, Framer Motion
- **Backend**: FastAPI, Python, Pydantic, Google Gemini API, Uvicorn
- **Database**: Convex (real-time, serverless, integrated)
- **Development**: TypeScript, ESLint, Hot Reload, Interactive Testing

## 📈 Current Status

**Ready for Production**: Complete AI-powered browser testing platform with unified interface, flow generation, editing, parallel execution, and comprehensive monitoring.

**Current Status**: All major features implemented with beautiful, unified UI. Platform supports end-to-end browser automation workflow with Apple liquid glass design aesthetic.

---

**Quick Links**: [Tasks](./tasks.md) | [Backend Docs](./docs/fastapi-backend.md) | [Frontend Docs](./docs/nextjs-frontend.md) | [Database Docs](./docs/convex-database.md)
