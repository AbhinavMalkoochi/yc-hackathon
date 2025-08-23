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
# See docs/setup.md for detailed configuration

# 4. Start development
npm run dev
```

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

## 🚀 Live Features

Access the main application and comprehensive monitoring:

- 🏠 **Main Application**: `/` - Flow generation, editing, and browser session management
- 📊 **Session Logs**: `/logs/[taskId]` - Comprehensive logs page with live preview, network logs, and execution steps
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
3. **Progressive Testing**: Each development task has its own dedicated test interface
4. **AI-First Design**: Built from the ground up for LLM integration and intelligent automation
5. **Functional Backend**: Clean, stateless FastAPI functions without classes or complexity

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Convex React Hooks
- **Backend**: FastAPI, Python, Pydantic, OpenAI API, Uvicorn
- **Database**: Convex (real-time, serverless, integrated)
- **Development**: TypeScript, ESLint, Hot Reload, Interactive Testing

## 📈 Current Status

**Ready for Production**: Complete AI-powered browser testing platform with flow generation, editing, parallel execution, and comprehensive monitoring.

**Current Status**: All major features implemented and ready for testing. Platform supports end-to-end browser automation workflow.

---

**Quick Links**: [Tasks](./tasks.md) | [Backend Docs](./docs/fastapi-backend.md) | [Frontend Docs](./docs/nextjs-frontend.md) | [Database Docs](./docs/convex-database.md)
