# FastAPI Backend Documentation

## Overview

The FastAPI backend provides a clean, functional API layer for AI-powered browser testing. It handles LLM integration, streaming responses, and serves as the bridge between the frontend and external services.

## Architecture Principles

- **Functional Programming**: Uses functions, not classes for endpoints
- **Stateless Design**: No database connections or persistent state in backend
- **External Service Integration**: Handles Google Gemini LLM calls and future Browser Use integration
- **Real-time Streaming**: Provides Server-Sent Events for live updates

## Core Features

### ✅ **LLM Integration (Task 2.1)**

- **Google Gemini 2.0 Flash**: Intelligent flow generation from natural language
- **Advanced Prompt Engineering**: Structured prompts for browser testing scenarios
- **Async Processing**: Non-blocking LLM API calls with proper error handling
- **JSON Response Parsing**: Robust parsing and validation of LLM outputs

### ✅ **Streaming Responses (Task 1.2)**

- **Server-Sent Events**: Real-time unidirectional data streaming
- **Multiple Endpoints**: `/api/stream` and `/api/stream/simple` for different use cases
- **Auto-reconnection**: Client-side automatic reconnection on connection loss
- **Live Statistics**: Real-time system statistics and performance metrics

### ✅ **Core API Endpoints (Task 1.1)**

- **Health Monitoring**: `/health` - Service status and feature availability
- **Testing Endpoints**: `/api/test`, `/api/message` - Development testing interfaces
- **CORS Support**: Cross-origin requests for frontend integration

## API Endpoints

### Health & Status

- `GET /` - Root endpoint with service information
- `GET /health` - Service health check with feature status
- `GET /api/test` - Basic functionality test endpoint
- `POST /api/message` - Message processing test endpoint
- `GET /api/stats` - System statistics and performance metrics

### Streaming Endpoints

- `GET /api/stream` - Advanced streaming with JSON messages and system stats
- `GET /api/stream/simple` - Simple text streaming for basic testing

### LLM Flow Generation

- `POST /api/generate-flows` - Generate test flows from natural language prompts

## Environment Configuration

```bash
# Required for LLM features
GEMINI_API_KEY=your_gemini_api_key_here

# Optional for enhanced logging
LOG_LEVEL=INFO
```

## Dependencies

```txt
fastapi==0.115.6
uvicorn[standard]==0.34.0
pydantic==2.10.4
openai==1.58.1
```

## Running the Backend

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Start development server
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

- **Interactive Docs**: `http://localhost:8000/docs` (Swagger UI)
- **ReDoc**: `http://localhost:8000/redoc` (Alternative documentation)

## Next Implementation Steps

**Phase 2 Remaining**:

- Task 2.2: Flow Editing & Management Interface
- Task 2.3: Flow Approval & Execution Preparation

**Phase 3**: Browser Use Integration & Parallel Sessions

- Task 3.1: Browser Use library setup and testing
- Task 3.2: Browser agent integration for flow execution
- Task 3.3: Parallel browser session management
- Task 3.4: Real-time browser session streaming

## Notes

- **No Database Logic**: All database operations are handled by Convex in the Next.js frontend
- **Functional Style**: Endpoints use functions, not classes, for simplicity and maintainability
- **Error Handling**: Comprehensive error handling with detailed logging and user-friendly responses
