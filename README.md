# AI Browser Testing Agent - Simplified MVP

An AI-powered browser testing orchestrator that converts natural language prompts into automated website testing flows with real-time parallel browser execution.

## 🎯 MVP Core Functionality

**User Flow**:

1. User inputs natural language prompt (e.g., "Test the checkout flow on an e-commerce site")
2. AI generates 3-5 specific testing flows
3. User reviews/edits flows and approves them
4. System creates parallel browser sessions using Browser Use agents
5. Real-time streaming of browser execution with live logs and progress
6. Comprehensive results displayed after completion

## 🛠️ Technology Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python), WebSocket for real-time streaming
- **Database**: Convex (real-time database with built-in WebSocket support)
- **Browser Automation**: Browser Use Python library (parallel agent sessions)
- **AI**: LLM integration for flow generation from natural language
- **Real-time Communication**: WebSocket connections for live browser session streaming

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+
- OpenAI/Anthropic API key for LLM integration

### Installation

1. **Clone and install dependencies**:

```bash
npm install
cd backend && pip install -r requirements.txt
```

2. **Setup environment variables**:

```bash
# .env.local (for Next.js)
NEXT_PUBLIC_CONVEX_URL=your_convex_url
CONVEX_DEPLOYMENT=your_deployment

# backend/.env (for FastAPI)
OPENAI_API_KEY=your_openai_api_key
CONVEX_URL=your_convex_url
```

3. **Initialize Convex**:

```bash
npx convex dev
```

### Running the Application

**Full stack development**:

```bash
npm run dev
```

This starts:

- Next.js frontend on `http://localhost:3000`
- FastAPI backend on `http://localhost:8000`
- Convex development server

**Individual components**:

```bash
npm run dev:frontend    # Next.js only
npm run dev:fastapi     # FastAPI only
npx convex dev          # Convex only
```

### API Documentation

- FastAPI Swagger UI: `http://localhost:8000/docs`
- FastAPI ReDoc: `http://localhost:8000/redoc`

## 📋 Development Progress

**Current Status**: ✅ Task 1.1 Completed - Basic FastAPI-Next.js Integration Test

### Completed Features

- ✅ **Task 1.1**: Basic FastAPI-Next.js Integration with comprehensive logging
  - FastAPI `/api/test` endpoint with detailed response data
  - Next.js `/test` page with real-time testing interface
  - Comprehensive logging on both frontend and backend
  - Error handling and visual feedback
  - Request correlation IDs for tracing

### Live Testing

- 🧪 **Test Page**: `/test` - Interactive testing interface for backend integration
- 📊 **API Docs**: `http://localhost:8000/docs` - FastAPI automatic documentation
- 🔍 **Health Check**: `http://localhost:8000/health` - Service status monitoring

See [tasks.md](./tasks.md) for detailed development roadmap with granular, testable tasks.

## 🔄 What's Different from Standard Templates

**Removed for MVP Simplicity**:

- Authentication (Clerk integration removed)
- File upload systems
- Complex notification systems
- Data export functionality
- Web scraping features
- Over-engineered features

**Added for Browser Testing**:

- Browser Use Python library integration
- Parallel browser session management
- Real-time WebSocket streaming
- AI-powered flow generation
- Live browser execution monitoring

## Learn more

To learn more about developing your project with Convex, check out:

- The [Tour of Convex](https://docs.convex.dev/get-started) for a thorough introduction to Convex principles.
- The rest of [Convex docs](https://docs.convex.dev/) to learn about all Convex features.
- [Stack](https://stack.convex.dev/) for in-depth articles on advanced topics.

## Join the community

Join thousands of developers building full-stack apps with Convex:

- Join the [Convex Discord community](https://convex.dev/community) to get help in real-time.
- Follow [Convex on GitHub](https://github.com/get-convex/), star and contribute to the open-source implementation of Convex.
