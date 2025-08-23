# FastAPI Backend - AI Browser Testing Agent

FastAPI backend server for the AI Browser Testing Agent with Browser Use integration for parallel browser automation.

## 🎯 Core Functionality

- **Flow Generation**: LLM integration for converting natural language prompts to testing flows
- **Browser Automation**: Browser Use agents for parallel browser session management
- **Real-time Streaming**: WebSocket connections for live browser execution updates
- **Convex Integration**: Real-time database operations for test runs and flows

## 🛠️ Technology Stack

- **FastAPI**: High-performance async web framework
- **Browser Use**: Python library for AI-powered browser automation
- **WebSockets**: Real-time bidirectional communication
- **AsyncIO**: Concurrent browser session management
- **Convex Python SDK**: Real-time database operations

## 🚀 Setup

### Prerequisites

- Python 3.9+
- OpenAI/Anthropic API key
- Convex deployment URL

### Installation

1. **Install dependencies**:

```bash
pip install -r requirements.txt
```

2. **Environment setup**:

```bash
# Create .env file
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key  # Alternative to OpenAI
CONVEX_URL=your_convex_deployment_url
```

3. **Run development server**:

```bash
uvicorn main:app --reload --port 8000
```

## 📡 API Endpoints

### Core Endpoints

- `GET /`: Root endpoint with welcome message
- `GET /health`: Health check with service status
- `WebSocket /ws`: Real-time browser session streaming

### Flow Management

- `POST /api/generate-flows`: Generate testing flows from natural language prompt
- `POST /api/execute-flows`: Execute approved flows with parallel browser sessions
- `GET /api/test-runs/{id}`: Get test run status and results

### Browser Automation

- `POST /api/browser/test`: Test single browser session
- `GET /api/browser/sessions`: Get active browser session status
- `POST /api/browser/stop/{session_id}`: Stop specific browser session

## 🔧 Browser Use Integration

### Parallel Browser Sessions

Based on the provided sample code, the system uses Browser Use for parallel agent execution:

```python
# Example: Parallel browser sessions with Browser Use
import asyncio
from browser_use.agent.service import Agent
from browser_use.browser.browser import Browser, BrowserConfig
from browser_use.browser.context import BrowserContextConfig

browser = Browser(
    config=BrowserConfig(
        disable_security=True,
        headless=False,
        new_context_config=BrowserContextConfig(
            save_recording_path='./tmp/recordings'
        ),
    )
)

# Create agents for each flow
agents = [
    Agent(task=flow_instruction, llm=llm, browser=browser)
    for flow_instruction in approved_flows
]

# Execute all flows in parallel
await asyncio.gather(*[agent.run() for agent in agents])
```

### Key Features

- **Concurrent Execution**: Multiple browser sessions run simultaneously
- **Agent-based**: Each flow executed by dedicated Browser Use agent
- **Real-time Streaming**: Live updates via WebSocket during execution
- **Session Isolation**: Each browser session operates independently
- **Error Handling**: Individual session failures don't affect others

## 📁 Project Structure

```
backend/
├── main.py                 # FastAPI application setup
├── requirements.txt        # Python dependencies
├── .env                   # Environment variables
├── routers/               # API route handlers
│   ├── flows.py          # Flow generation and management
│   ├── browser.py        # Browser automation endpoints
│   └── websocket.py      # WebSocket handlers
├── services/              # Business logic services
│   ├── llm_service.py    # LLM integration for flow generation
│   ├── browser_manager.py # Browser Use session management
│   ├── agent_service.py  # Browser agent orchestration
│   └── convex_service.py # Database operations
└── models/               # Pydantic models
    ├── flows.py         # Flow-related models
    ├── sessions.py      # Browser session models
    └── responses.py     # API response models
```

## 🧪 Testing Strategy

Each service includes comprehensive testing through frontend interfaces:

### Browser Service Testing

- Single browser session creation and control
- Parallel session management and resource limits
- Agent instruction processing and execution
- Real-time status updates and error handling

### Flow Service Testing

- LLM prompt processing and flow generation
- Flow validation and editing capabilities
- Execution preparation and approval workflow
- Results collection and analysis

### WebSocket Testing

- Real-time message broadcasting to multiple clients
- Session-specific data routing and filtering
- Connection resilience and automatic reconnection
- Message queuing during temporary disconnections

## 🔄 Development Workflow

1. **Start with single endpoint**: Test basic FastAPI-Next.js communication
2. **Add WebSocket**: Establish real-time connection before browser integration
3. **Integrate Browser Use**: Start with single session, then add parallel execution
4. **Stream real-time data**: Connect browser agent actions to WebSocket updates
5. **Add error handling**: Comprehensive error management with user feedback

## 📊 Performance Considerations

- **Session Limits**: Maximum 5 concurrent browser sessions for MVP
- **Resource Monitoring**: Memory and CPU usage tracking
- **Queue Management**: Request queuing when session limits reached
- **Cleanup Automation**: Automatic browser session cleanup and resource recovery

## 🐛 Troubleshooting

### Common Issues

- **Browser sessions hanging**: Implement session timeouts and health checks
- **Memory leaks**: Ensure proper browser session cleanup
- **WebSocket disconnections**: Add automatic reconnection with message replay
- **LLM API failures**: Implement retry logic with exponential backoff

### Debug Tools

- FastAPI automatic documentation: `http://localhost:8000/docs`
- WebSocket testing tools for real-time connection testing
- Browser Use agent logging for execution debugging
- Convex dashboard for database operation monitoring

## 📋 Current Status

### ✅ Completed Endpoints (Tasks 1.1 & 1.2)

#### HTTP Endpoints

- `GET /` - Root endpoint with version info
- `GET /api/message` - Test message endpoint with timestamps
- `GET /api/test` - Task 1.1 integration test endpoint with comprehensive data
- `GET /api/websocket-stats` - **NEW**: WebSocket connection statistics
- `GET /health` - Enhanced health check with service info and timestamps

#### Streaming Endpoints

- `GET /api/stream` - **NEW**: Real-time data streaming using Server-Sent Events (SSE)
- `GET /api/stream/simple` - **NEW**: Simple streaming endpoint for basic testing

#### Convex Database Endpoints

- `POST /api/convex/test-session` - **NEW**: Create new test session in Convex database
- `GET /api/convex/test-sessions` - **NEW**: List all test sessions with pagination
- `GET /api/convex/test-session/{session_id}` - **NEW**: Get specific test session with flows
- `POST /api/convex/test-flows` - **NEW**: Create test flows for a session
- `PUT /api/convex/flow-approval` - **NEW**: Update flow approval status
- `GET /api/convex/system-stats` - **NEW**: Get system statistics from Convex

### 🔧 Enhanced Features

#### Task 1.1 Features

- **Comprehensive Logging**: Request/response logging with correlation IDs
- **Request Middleware**: Automatic request timing and correlation tracking
- **Enhanced CORS**: Configured for Next.js frontend integration

#### Task 1.2 Features

- **Server-Sent Events (SSE)**: Real-time unidirectional streaming with `StreamingResponse`
- **Async Data Generation**: Background generators for continuous data streaming
- **JSON Message Format**: Structured event data with timestamps and metadata
- **Streaming Statistics**: Live system metrics and performance monitoring
- **Connection Lifecycle**: Automatic handling of client connections and disconnections
- **Error Resilience**: Robust error handling for streaming operations
- **Lightweight Protocol**: Efficient HTTP-based streaming without WebSocket overhead

#### Task 1.3 Features

- **Convex Integration**: Full database client integration with async operations
- **Database Schema**: Comprehensive schema for test sessions, flows, and browser tracking
- **CRUD Operations**: Complete Create, Read, Update, Delete functionality
- **Real-time Sync**: Live database operations with frontend synchronization
- **Error Handling**: Robust database error handling and transaction logging
- **Environment Config**: Flexible Convex URL configuration via environment variables

### 📊 Logging System

```python
# Example log output:
2024-01-XX 10:15:30 - __main__ - INFO - [req_1705475730123] Request started: GET /api/test
2024-01-XX 10:15:30 - __main__ - INFO - [req_1705475730123] Test endpoint accessed for Task 1.1
2024-01-XX 10:15:30 - __main__ - INFO - [req_1705475730123] Test data prepared: {...}
2024-01-XX 10:15:30 - __main__ - INFO - [req_1705475730123] Request completed: 200 in 0.0156s
```

### Next Implementation Steps (See tasks.md)

**Phase 1 Complete ✅**: Foundation & Real-time Infrastructure

- ✅ Task 1.1: Basic FastAPI-Next.js Integration
- ✅ Task 1.2: Streaming Response Real-time Communication
- ✅ Task 1.3: Convex Database Integration & Real-time Sync

**Phase 2 Next**: Flow Generation & Management

1. **Task 2.1**: LLM Integration for Flow Generation
2. **Task 2.2**: Flow Editing & Management Interface
3. **Task 2.3**: Browser Use library integration and session management
4. **Task 2.4**: Parallel agent execution with real-time streaming

## API Documentation

Once the server is running, view automatic API documentation at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
