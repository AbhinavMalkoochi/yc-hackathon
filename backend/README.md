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

- `GET /` - Root endpoint ✅
- `GET /api/message` - Test message endpoint ✅  
- `GET /health` - Health check endpoint ✅

### Next Implementation Steps (See tasks.md)
1. WebSocket endpoint for real-time communication
2. LLM service integration for flow generation
3. Browser Use library integration and session management
4. Parallel agent execution with real-time streaming

## API Documentation

Once the server is running, view automatic API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`