# YC Agent - AI Browser Testing Orchestrator

A comprehensive AI-powered browser testing platform that orchestrates automated testing flows using OpenAI and Browser Use Cloud.

## 🏗️ Architecture Overview

This full-stack application consists of three tightly integrated components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │────│   FastAPI       │────│   Convex        │
│   Frontend      │    │   Backend       │    │   Database      │
│                 │    │                 │    │                 │
│ • Admin UI      │    │ • Health Checks │    │ • Real-time     │
│ • Dashboard     │    │ • Admin Routes  │    │   Sync          │
│ • Real-time     │    │ • Service Mgmt  │    │ • Type-safe     │
│   Updates       │    │ • API Gateway   │    │   Schema        │
│ • TypeScript    │    │ • Python/uv     │    │ • Edge Functions│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 Tech Stack

### Frontend (Next.js 15)

- **Framework**: Next.js with App Router and Server Components
- **Styling**: Tailwind CSS 4 with dark mode support
- **Authentication**: Clerk integration for user management
- **Type Safety**: TypeScript with Zod validation
- **Real-time**: Convex subscriptions for live data updates
- **Icons**: Lucide React for consistent iconography

### Backend (FastAPI)

- **Framework**: FastAPI with async/await support
- **Dependency Management**: uv for fast Python package management
- **API Documentation**: Auto-generated OpenAPI/Swagger docs
- **Health Monitoring**: Comprehensive service health checks
- **Admin Interface**: RESTful admin endpoints for data management

### Database (Convex)

- **Type**: Real-time database with TypeScript SDK
- **Schema**: Strongly typed schema with validation
- **Functions**: Server-side functions for complex operations
- **Subscriptions**: Real-time data synchronization
- **Authentication**: Integrated with Clerk

## 🚀 Development Status

### ✅ Completed Vertical Slices

#### 1. Environment Setup with Testing Dashboard

- **Health monitoring** for all external services (OpenAI, Browser Use Cloud, Convex)
- **Real-time service status** indicators with color coding
- **Configuration validation** and detailed error reporting
- **Environment variable** management with validation

#### 2. Database Schema with Admin Interface

- **Complete database schema** (Test Runs, Flows, Browser Sessions, Events, Execution Steps)
- **Comprehensive admin dashboard** with full CRUD operations
- **Real-time data synchronization** with Convex
- **Sample data generation** for testing and development
- **Professional UI components** with sorting, filtering, and search

### 🔄 In Progress

#### 3. OpenAI Flow Generation with Live Testing

- OpenAI GPT-4 integration for test flow generation
- Live testing interface with prompt templates
- Flow validation and editing capabilities

### 📋 Upcoming Features

- Browser Use Cloud integration with session management
- Real-time browser session orchestration
- WebSocket communication for live updates
- Live viewport streaming
- Multi-session browser grid
- Complete workflow automation

## 🛠️ Quick Start

### Prerequisites

- **Node.js** 18+ with npm
- **Python** 3.11+
- **Git** for version control

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd yc-agent
npm install
```

### 2. Backend Setup (FastAPI with uv)

```bash
cd backend

# Install uv (recommended for faster dependency management)
pip install uv

# Install all dependencies
uv sync

# Alternative: using pip
pip install -r requirements.txt
```

### 3. Environment Configuration

```bash
# Copy environment template
cp env.example .env

# Edit .env with your API keys and configuration
# Required: OPENAI_API_KEY, CONVEX_DEPLOYMENT_URL
```

### 4. Database Setup (Convex)

```bash
# Install Convex CLI (if not already installed)
npm install -g convex

# Deploy Convex functions and schema
npx convex deploy
```

### 5. Run the Application

```bash
# Start all services (frontend, Convex, FastAPI)
npm run dev
```

This starts:

- **Next.js frontend** at `http://localhost:3000`
- **Convex backend** (real-time database)
- **FastAPI server** at `http://localhost:8000`

### 6. Verify Installation

1. **Health Dashboard**: Visit `http://localhost:3000` to see service health monitoring
2. **Admin Dashboard**: Use the admin interface to create and manage test data
3. **API Documentation**: Visit `http://localhost:8000/docs` for interactive API docs
4. **Convex Dashboard**: Check real-time data at your Convex dashboard URL

## 📂 Project Structure

```
yc-agent/
├── README.md                    # This file
├── frontend/README.md          # Frontend-specific documentation
├── backend/README.md           # Backend-specific documentation
├──
├── app/                        # Next.js app directory
│   ├── page.tsx               # Main dashboard page
│   └── layout.tsx             # App layout and providers
├──
├── components/                 # React components
│   ├── HealthDashboard.tsx    # Service health monitoring
│   ├── AdminDashboard.tsx     # Database admin interface
│   ├── DataTable.tsx          # Reusable data table component
│   └── FastApiTest.tsx        # API connection testing
├──
├── lib/                       # Frontend utilities
│   └── api.ts                 # API client with error handling
├──
├── convex/                    # Convex backend
│   ├── schema.ts              # Database schema definition
│   ├── testRuns.ts           # Test run CRUD operations
│   ├── flows.ts              # Flow management functions
│   ├── browserSessions.ts    # Session management
│   └── sessionEvents.ts      # Event logging
├──
├── backend/                   # FastAPI backend
│   ├── main.py               # FastAPI application entry point
│   ├── config.py             # Environment configuration
│   ├── pyproject.toml        # uv dependency management
│   ├── requirements.txt      # pip fallback dependencies
│   ├── services/             # Business logic services
│   │   └── health_checker.py # Service health monitoring
│   └── routers/              # API route modules
│       └── admin.py          # Admin API endpoints
└──
└── tasks.md                   # Development task breakdown
```

## 🔧 Development Commands

### Frontend Development

```bash
# Start frontend only
npm run dev:frontend

# Build for production
npm run build

# Run linting
npm run lint
```

### Backend Development

```bash
cd backend

# Run with uv (recommended)
uv run python main.py

# Run with pip
python main.py

# Install new dependencies
uv add package-name

# Update dependencies
uv sync
```

### Convex Development

```bash
# Deploy schema and functions
npx convex deploy

# Start Convex dev server
npm run dev:backend

# Open Convex dashboard
npx convex dashboard
```

## 🧪 Testing

### Health Dashboard Testing

1. Visit `http://localhost:3000`
2. Check the Health Dashboard section
3. Verify all services show "healthy" status
4. Test individual service connections

### Admin Dashboard Testing

1. Navigate to the Admin Dashboard tab
2. Click "Create Sample Data" to generate test data
3. Verify CRUD operations work correctly
4. Test data filtering and search functionality

### API Testing

1. Visit `http://localhost:8000/docs` for interactive API documentation
2. Test admin endpoints with sample data
3. Verify health check endpoints return correct status

## 🌐 API Endpoints

### Health Monitoring

- `GET /api/health/all` - Check all services
- `GET /api/health/openai` - OpenAI API status
- `GET /api/health/convex` - Convex database status
- `GET /api/health/browser-use-cloud` - Browser Use Cloud status

### Admin Operations

- `GET /api/admin/test-runs` - List test runs
- `POST /api/admin/test-runs` - Create test run
- `GET /api/admin/flows/{test_run_id}` - List flows for test run
- `POST /api/admin/sample-data` - Generate sample data
- `GET /api/admin/stats` - System statistics

## 🔍 Monitoring and Debugging

### Real-time Monitoring

- **Health Dashboard**: Live service status with color-coded indicators
- **Admin Dashboard**: Real-time data updates using Convex subscriptions
- **API Logs**: Detailed logging in development mode
- **Error Tracking**: Comprehensive error messages with stack traces

### Development Tools

- **Hot Reload**: All components support hot reloading during development
- **Type Safety**: End-to-end TypeScript for catching errors early
- **API Documentation**: Auto-generated interactive docs
- **Sample Data**: One-click test data generation

## 🚀 Deployment

### Frontend (Vercel)

```bash
npm run build
# Deploy to Vercel or your preferred platform
```

### Backend (Docker/Cloud)

```bash
cd backend
# Build Docker image or deploy to cloud provider
```

### Database (Convex Cloud)

Convex automatically deploys to the cloud. Configure production deployment URL in your environment variables.

## 🤝 Contributing

1. Check `tasks.md` for current development priorities
2. Follow the vertical slice development approach
3. Ensure all features have corresponding tests
4. Update documentation for any new features

## 📄 License

[Add your license information here]

## 🆘 Support

For issues and support:

1. Check the health dashboard for service status
2. Review logs in the development console
3. Consult the API documentation at `/docs`
4. Check individual component README files for detailed information

---

**Last Updated**: 2025-01-25
**Version**: 2.0.0 (Post Vertical Slice 2)
