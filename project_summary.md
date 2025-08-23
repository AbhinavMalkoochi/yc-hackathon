# YC Agent - Project Summary

## Overview

This project is a full-stack application that combines Convex, Next.js, Clerk authentication, and now includes a FastAPI backend for additional REST API functionality.

## Architecture

### Frontend

- **Framework**: Next.js 15.2.3 with React 19
- **Styling**: Tailwind CSS 4
- **Authentication**: Clerk integration
- **Type Safety**: TypeScript with Zod validation
- **State Management**: Convex React client + direct API calls

### Backend Services

1. **Convex Backend**
   - Real-time database and server functions
   - Handles user authentication state
   - Located in `/convex` directory

2. **FastAPI Backend** (New)
   - REST API endpoints
   - Located in `/backend` directory
   - Runs on port 8000
   - CORS enabled for frontend connection
   - Auto-generated API documentation

### Key Components

#### API Abstraction Layer (`/lib/api.ts`)

- Centralized API client for FastAPI backend
- Type-safe with Zod schema validation
- Error handling with custom `ApiError` class
- Exported functions:
  - `getMessage()` - Gets message from `/api/message`
  - `checkHealth()` - Health check endpoint

#### FastAPI Test Component (`/components/FastApiTest.tsx`)

- UI component for testing FastAPI connection
- Includes buttons for message retrieval and health checks
- Error handling and loading states
- Integrated into main page for easy testing

### API Endpoints (FastAPI)

- `GET /` - Root endpoint
- `GET /api/message` - Returns a message with timestamp
- `GET /health` - Health check endpoint
- `GET /docs` - Swagger UI documentation
- `GET /redoc` - ReDoc documentation

### Development Workflow

- `npm run dev` - Runs all services (Next.js, Convex, FastAPI)
- `npm run dev:frontend` - Frontend only
- `npm run dev:backend` - Convex only
- `npm run dev:fastapi` - FastAPI only

### Dependencies Added

- **zod**: Runtime type validation
- **FastAPI backend dependencies** (in `backend/requirements.txt`):
  - fastapi==0.115.6
  - uvicorn[standard]==0.34.0
  - pydantic==2.10.4

### File Structure Changes

```
/
├── backend/                 # New FastAPI backend
│   ├── main.py             # FastAPI application
│   ├── requirements.txt    # Python dependencies
│   └── README.md          # Backend documentation
├── lib/                    # New API utilities
│   └── api.ts             # FastAPI client abstraction
├── components/
│   └── FastApiTest.tsx    # New test component
└── package.json           # Updated with new scripts and dependencies
```

### Testing

The main page now includes a FastAPI connection test section that allows users to:

1. Test the connection to the FastAPI backend
2. Retrieve messages from the API
3. Check the health status of the backend

This provides immediate feedback on whether the FastAPI server is running and accessible from the frontend.

### Next Steps

- The FastAPI backend is ready for additional endpoints
- The API abstraction layer can be extended with more functions
- Type-safe API calls are enforced through Zod schemas
- CORS is properly configured for development

