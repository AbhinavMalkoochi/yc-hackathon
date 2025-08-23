# FastAPI Backend Documentation

## Overview

The FastAPI backend provides a clean, functional API layer for AI-powered browser testing. It follows a modular architecture with clear separation of concerns, handling LLM integration, streaming responses, and serving as the bridge between the frontend and external services.

## 🏗️ Architecture

### Modular Structure

```
backend/
├── config.py              # Configuration and environment variables
├── models.py              # Pydantic data models and schemas
├── main.py                # Main FastAPI application entry point
├── browser_service.py     # Local browser automation service
├── services/              # Business logic services
│   ├── llm_service.py     # Google Gemini LLM integration
│   ├── streaming_service.py # Server-Sent Events handling
│   └── browser_use_cloud_service.py # Browser Use Cloud API
├── routes/                # API endpoint definitions
│   ├── core.py            # Basic endpoints and health checks
│   ├── llm.py             # LLM flow generation endpoints
│   └── browser.py         # Browser automation endpoints
└── requirements.txt       # Python dependencies
```

### Architecture Principles

- **Functional Programming**: Uses functions, not classes for endpoints
- **Stateless Design**: No database connections or persistent state in backend
- **External Service Integration**: Handles Google Gemini LLM calls and Browser Use integration
- **Real-time Streaming**: Provides Server-Sent Events for live updates
- **Modular Services**: Clear separation of business logic into dedicated service modules

## 🔧 Configuration

### Environment Variables

```bash
# Required for LLM features
GEMINI_API_KEY=your_gemini_api_key_here

# Required for Browser Use Cloud
BROWSER_USE_API_KEY=your_browser_use_api_key_here

# Optional for enhanced logging
LOG_LEVEL=INFO
```

### Configuration Module (`config.py`)

Centralizes all environment variables and settings:

- API configuration (title, version, host, port)
- CORS settings
- Logging configuration
- API keys and service availability checks
- Browser and streaming configuration

## 📊 Data Models

### Models Module (`models.py`)

Centralizes all Pydantic models and data structures:

#### Basic Response Models

- `MessageResponse`: Basic message responses
- `TestResponse`: Test endpoint responses
- `HealthCheckResponse`: Health check responses

#### LLM Flow Generation Models

- `GenerateFlowsRequest`: Flow generation requests
- `TestFlow`: Individual test flow structure
- `GenerateFlowsResponse`: Flow generation responses

#### Browser Session Models

- `BrowserSessionRequest`: Session creation requests
- `BrowserNavigateRequest`: Navigation requests
- `BrowserClickRequest`: Element clicking requests
- `BrowserTypeRequest`: Text input requests

#### Streaming Models

- `StreamData`: Base streaming data structure
- `ConnectionEstablishedData`: Connection establishment events
- `PeriodicUpdateData`: Periodic streaming updates
- `StatusUpdateData`: Status update events

## 🚀 Core Features

### ✅ **LLM Integration (Task 2.1)**

- **Google Gemini 2.0 Flash**: Intelligent flow generation from natural language
- **Advanced Prompt Engineering**: Structured prompts for browser testing scenarios
- **Async Processing**: Non-blocking LLM API calls with proper error handling
- **JSON Response Parsing**: Robust parsing and validation of LLM outputs

**Service**: `services/llm_service.py`

- Handles all Gemini API interactions
- Manages prompt creation and response parsing
- Provides service availability checks

### ✅ **Streaming Responses (Task 1.2)**

- **Server-Sent Events**: Real-time unidirectional data streaming
- **Multiple Endpoints**: `/api/stream` and `/api/stream/simple` for different use cases
- **Auto-reconnection**: Client-side automatic reconnection on connection loss
- **Live Statistics**: Real-time system statistics and performance metrics

**Service**: `services/streaming_service.py`

- Manages all streaming data generation
- Handles different stream types (periodic, status, data updates)
- Provides browser task monitoring streams

### ✅ **Core API Endpoints (Task 1.1)**

- **Health Monitoring**: `/health` - Service status and feature availability
- **Testing Endpoints**: `/api/test`, `/api/message` - Development testing interfaces
- **CORS Support**: Cross-origin requests for frontend integration

**Routes**: `routes/core.py`

- Basic endpoints and health checks
- Streaming endpoints
- System statistics

## 🔌 API Endpoints

### Health & Status (`routes/core.py`)

- `GET /` - Root endpoint with service information
- `GET /health` - Service health check with feature status
- `GET /api/test` - Basic functionality test endpoint
- `POST /api/message` - Message processing test endpoint
- `GET /api/stats` - System statistics and performance metrics

### Streaming Endpoints (`routes/core.py`)

- `GET /api/stream` - Advanced streaming with JSON messages and system stats
- `GET /api/stream/simple` - Simple text streaming for basic testing

### LLM Flow Generation (`routes/llm.py`)

- `POST /api/generate-flows` - Generate test flows from natural language prompts

### Browser Automation (`routes/browser.py`)

#### Local Browser Automation

- `POST /api/browser/session/create` - Create browser session
- `POST /api/browser/session/navigate` - Navigate to URL
- `POST /api/browser/session/click` - Click element
- `POST /api/browser/session/type` - Type text
- `GET /api/browser/session/{id}/info` - Get page information
- `GET /api/browser/session/{id}/status` - Get session status
- `GET /api/browser/session/{id}/logs` - Get session logs
- `DELETE /api/browser/session/{id}` - Close session
- `GET /api/browser/sessions` - List active sessions

#### Browser Use Cloud

- `POST /api/browser-cloud/create-task` - Create remote browser task
- `GET /api/browser-cloud/task/{id}` - Get task status
- `POST /api/browser-cloud/parallel-flows` - Create parallel tasks
- `GET /api/browser-cloud/task/{id}/stream` - Stream task logs

## 🏗️ Service Modules

### LLM Service (`services/llm_service.py`)

- **Purpose**: Handles Google Gemini API interactions
- **Features**:
  - Automatic client initialization
  - Prompt engineering for test flows
  - Response parsing and validation
  - Error handling and logging

### Streaming Service (`services/streaming_service.py`)

- **Purpose**: Manages Server-Sent Events streaming
- **Features**:
  - Real-time data generation
  - Multiple stream types
  - Browser task monitoring
  - Configurable update intervals

### Browser Use Cloud Service (`services/browser_use_cloud_service.py`)

- **Purpose**: Manages Browser Use Cloud API interactions
- **Features**:
  - Task creation and management
  - Status monitoring
  - Parallel flow execution
  - Real-time task streaming

## 🔄 Middleware

### Logging Middleware

- **Request Correlation**: Unique correlation IDs for request tracking
- **Performance Monitoring**: Request timing and response metrics
- **Structured Logging**: Consistent log format across all endpoints

### CORS Middleware

- **Frontend Integration**: Allows requests from Next.js frontend
- **Configurable Origins**: Environment-based CORS configuration
- **Security**: Proper CORS headers for cross-origin requests

## 📝 Dependencies

```txt
fastapi==0.115.6
uvicorn[standard]==0.34.0
pydantic==2.10.4
google-genai==0.3.0
python-dotenv==1.0.0
requests==2.31.0
```

## 🚀 Running the Backend

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Start development server
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📚 API Documentation

- **Interactive Docs**: `http://localhost:8000/docs` (Swagger UI)
- **ReDoc**: `http://localhost:8000/redoc` (Alternative documentation)

## 🔍 Development Workflow

1. **Configuration**: Set environment variables in `.env` file
2. **Service Development**: Add business logic to appropriate service module
3. **Route Definition**: Define endpoints in relevant route module
4. **Model Updates**: Add new data models to `models.py`
5. **Testing**: Use interactive API documentation for endpoint testing

## 🎯 Next Implementation Steps

**Phase 2 Remaining**:

- Task 2.2: Flow Editing & Management Interface
- Task 2.3: Flow Approval & Execution Preparation

**Phase 3**: Browser Use Integration & Parallel Sessions

- Task 3.1: Browser Use library setup and testing ✅
- Task 3.2: Browser agent integration for flow execution
- Task 3.3: Parallel browser session management
- Task 3.4: Real-time browser session streaming

## 📝 Notes

- **No Database Logic**: All database operations are handled by Convex in the Next.js frontend
- **Functional Style**: Endpoints use functions, not classes, for simplicity and maintainability
- **Error Handling**: Comprehensive error handling with detailed logging and user-friendly responses
- **Modular Design**: Clear separation of concerns with dedicated service and route modules
