# Backend - YC Agent AI Browser Testing Orchestrator

This is the FastAPI backend server that provides REST API endpoints, health monitoring, and admin operations for the AI Browser Testing Orchestrator.

## 🏗️ Architecture

### Technology Stack

- **Framework**: FastAPI with async/await support
- **Language**: Python 3.11+ with type hints
- **Dependency Management**: uv (recommended) or pip
- **Validation**: Pydantic v2 for request/response models
- **Documentation**: Auto-generated OpenAPI/Swagger docs
- **Configuration**: python-dotenv for environment management
- **HTTP Client**: aiohttp for external API calls

### Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── config.py               # Environment configuration
├── pyproject.toml          # uv dependency management
├── requirements.txt        # pip fallback dependencies
├── README.md              # This file
├──
├── services/              # Business logic services
│   ├── __init__.py
│   └── health_checker.py  # Service health monitoring
├──
├── routers/               # API route modules
│   ├── __init__.py
│   └── admin.py          # Admin API endpoints
└──
└── .venv/                 # Virtual environment (created by uv)
```

## 🚀 Getting Started

### Prerequisites

- Python 3.11 or higher
- uv (recommended) or pip
- Access to external services (OpenAI, Convex, Browser Use Cloud)

### Installation

#### Option 1: Using uv (Recommended)

```bash
cd backend

# Install uv if not already installed
pip install uv

# Create virtual environment and install dependencies
uv sync

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On Unix/macOS:
source .venv/bin/activate
```

#### Option 2: Using pip

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On Unix/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Environment Configuration

```bash
# Copy environment template from project root
cp ../env.example .env

# Edit .env with your configuration
# Required variables:
OPENAI_API_KEY=sk-your-openai-api-key-here
CONVEX_DEPLOYMENT_URL=https://your-convex-deployment.convex.cloud
BROWSER_USE_CLOUD_API_KEY=your-browser-use-cloud-key-here
```

### Running the Server

#### Development Mode

```bash
# Using uv (recommended)
uv run python main.py

# Using pip
python main.py

# Alternative: using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The server will start at `http://localhost:8000`

#### Production Mode

```bash
# Using uvicorn with production settings
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 📋 API Endpoints

### Health Monitoring

#### `GET /api/health/all`

**Purpose**: Check health of all external services

**Response**:

```json
{
  "overall_status": "healthy",
  "overall_message": "All services are healthy",
  "timestamp": "2025-01-25T10:30:00Z",
  "services": {
    "openai": {
      "service": "openai",
      "status": "healthy",
      "message": "OpenAI API is accessible",
      "response_time_ms": 234,
      "last_checked": "2025-01-25T10:30:00Z"
    }
  }
}
```

#### `GET /api/health/openai`

**Purpose**: Test OpenAI API connection

**Response**:

```json
{
  "service": "openai",
  "status": "healthy",
  "message": "OpenAI API is accessible",
  "response_time_ms": 234,
  "last_checked": "2025-01-25T10:30:00Z",
  "details": {
    "api_key_configured": true,
    "model_available": true
  }
}
```

#### `GET /api/health/convex`

**Purpose**: Test Convex database connection

#### `GET /api/health/browser-use-cloud`

**Purpose**: Test Browser Use Cloud API connection

#### `GET /api/health/config`

**Purpose**: Validate environment configuration

### Admin Operations

#### `GET /api/admin/test-runs`

**Purpose**: List all test runs with pagination

**Query Parameters**:

- `limit` (int): Maximum number of results (default: 20, max: 100)
- `status` (string): Filter by status (optional)

**Response**:

```json
[
  {
    "_id": "test-run-id",
    "_creationTime": 1706176200000,
    "name": "E-commerce Checkout Flow",
    "description": "Test the complete checkout process",
    "status": "completed",
    "prompt": "Test adding items to cart...",
    "totalFlows": 3,
    "completedFlows": 3,
    "failedFlows": 0,
    "startedAt": 1706176200000,
    "completedAt": 1706176800000,
    "metadata": {
      "priority": "high",
      "tags": ["e-commerce", "checkout"],
      "environment": "staging"
    }
  }
]
```

#### `POST /api/admin/test-runs`

**Purpose**: Create a new test run

**Request Body**:

```json
{
  "name": "New Test Run",
  "description": "Description of the test run",
  "prompt": "Detailed testing instructions",
  "metadata": {
    "priority": "normal",
    "tags": ["tag1", "tag2"],
    "environment": "development"
  }
}
```

#### `GET /api/admin/flows/{test_run_id}`

**Purpose**: List flows for a specific test run

#### `POST /api/admin/sample-data`

**Purpose**: Generate sample data for testing

**Request Body**:

```json
{
  "testRuns": 3,
  "flowsPerRun": 2
}
```

#### `GET /api/admin/stats`

**Purpose**: Get comprehensive system statistics

### Basic API

#### `GET /`

**Purpose**: Root endpoint with basic server information

#### `GET /api/message`

**Purpose**: Test endpoint for basic connectivity

## 🔧 Core Components

### Configuration Management (`config.py`)

**Purpose**: Centralized configuration with validation

**Features**:

- Environment variable loading with python-dotenv
- Pydantic models for type-safe configuration
- Validation for API keys and URLs
- Development/production mode detection

**Configuration Classes**:

```python
class OpenAIConfig(BaseModel):
    api_key: str
    model: str = "gpt-4"
    max_tokens: int = 1000
    temperature: float = 0.7

class BrowserUseConfig(BaseModel):
    api_key: Optional[str] = None
    base_url: str = "https://api.browseruse.com"
    timeout: int = 30

class ConvexConfig(BaseModel):
    deployment_url: str
    timeout: int = 10
```

**Usage**:

```python
from backend.config import config

# Access configuration
openai_client = OpenAI(api_key=config.openai.api_key)
```

### Health Checker Service (`services/health_checker.py`)

**Purpose**: Monitor external service health

**Features**:

- Async health checks for all external services
- Response time measurement
- Detailed error reporting
- Service-specific validation
- Configurable timeouts

**Health Status Types**:

```python
class HealthStatus(str, Enum):
    HEALTHY = "healthy"
    UNHEALTHY = "unhealthy"
    DEGRADED = "degraded"
    UNKNOWN = "unknown"
```

**Usage**:

```python
from backend.services.health_checker import health_checker

# Check all services
health_results = await health_checker.check_all_services()

# Check specific service
openai_health = await health_checker.check_openai()
```

### Admin Router (`routers/admin.py`)

**Purpose**: Admin API endpoints for database management

**Features**:

- Convex HTTP API integration
- Pydantic request/response models
- Comprehensive error handling
- Sample data generation
- Statistics and reporting

**Key Functions**:

```python
async def call_convex_function(function_name: str, args: Dict[str, Any]) -> Any:
    """Call a Convex function via HTTP API."""

async def create_sample_data(request: SampleDataRequest):
    """Create sample data for testing."""
```

## 🛠️ Development

### Adding New Dependencies

#### Using uv (Recommended)

```bash
# Add a new dependency
uv add package-name

# Add development dependency
uv add --dev package-name

# Update dependencies
uv sync

# Remove dependency
uv remove package-name
```

#### Using pip

```bash
# Install and add to requirements.txt
pip install package-name
pip freeze > requirements.txt
```

### Creating New Endpoints

1. **Create Router Module**:

```python
# routers/new_feature.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/new-feature", tags=["new-feature"])

class NewRequest(BaseModel):
    name: str
    value: int

@router.post("/endpoint")
async def new_endpoint(request: NewRequest):
    # Implementation
    return {"result": "success"}
```

2. **Register Router**:

```python
# main.py
from backend.routers.new_feature import router as new_feature_router

app.include_router(new_feature_router)
```

3. **Add Tests**:

```python
# tests/test_new_feature.py
def test_new_endpoint():
    # Test implementation
    pass
```

### Environment Variables

**Required Variables**:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4  # optional
OPENAI_MAX_TOKENS=1000  # optional

# Convex Configuration
CONVEX_DEPLOYMENT_URL=https://your-deployment.convex.cloud

# Browser Use Cloud Configuration (optional)
BROWSER_USE_CLOUD_API_KEY=your-key-here
BROWSER_USE_CLOUD_BASE_URL=https://api.browseruse.com  # optional

# Server Configuration
DEBUG=true  # development mode
LOG_LEVEL=INFO  # logging level
CORS_ORIGINS=http://localhost:3000  # comma-separated list
```

**Optional Variables**:

```bash
# Service Timeouts
OPENAI_TIMEOUT=30
CONVEX_TIMEOUT=10
BROWSER_USE_CLOUD_TIMEOUT=30

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=60
```

## 🧪 Testing

### Manual Testing

1. **Health Endpoints**:

```bash
# Test all services
curl http://localhost:8000/api/health/all

# Test specific service
curl http://localhost:8000/api/health/openai
```

2. **Admin Endpoints**:

```bash
# List test runs
curl http://localhost:8000/api/admin/test-runs

# Create sample data
curl -X POST http://localhost:8000/api/admin/sample-data \
  -H "Content-Type: application/json" \
  -d '{"testRuns": 3, "flowsPerRun": 2}'
```

### Interactive API Documentation

Visit `http://localhost:8000/docs` for:

- Interactive API testing
- Request/response schemas
- Authentication testing
- Example requests

### Health Dashboard Testing

1. Start the backend server
2. Visit the frontend health dashboard
3. Verify all services show correct status
4. Test individual service connections

## 🔍 Debugging

### Logging Configuration

```python
# main.py
import logging

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)
```

### Debug Mode

```bash
# Enable debug mode
export DEBUG=true

# Increase log level
export LOG_LEVEL=DEBUG
```

### Common Issues

1. **Environment Variables Not Loading**:
   - Verify `.env` file exists in backend directory
   - Check file permissions
   - Ensure no syntax errors in `.env`

2. **External Service Connection Failures**:
   - Verify API keys are correct
   - Check network connectivity
   - Review timeout settings

3. **CORS Issues**:
   - Verify `CORS_ORIGINS` includes frontend URL
   - Check if frontend is running on expected port

### Performance Monitoring

```python
# Add timing middleware
import time
from fastapi import Request

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response
```

## 🚀 Deployment

### Docker Deployment

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Production Configuration

```bash
# Production environment variables
DEBUG=false
LOG_LEVEL=INFO
CORS_ORIGINS=https://your-frontend-domain.com

# Use production API endpoints
OPENAI_API_KEY=sk-live-key-here
CONVEX_DEPLOYMENT_URL=https://prod-deployment.convex.cloud
```

### Health Checks

```bash
# Container health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/api/health/all || exit 1
```

## 📊 Performance

### Optimization Strategies

1. **Async Operations**: All I/O operations use async/await
2. **Connection Pooling**: HTTP clients reuse connections
3. **Caching**: Response caching for expensive operations
4. **Rate Limiting**: Prevent abuse and manage load

### Monitoring

```python
# Add performance monitoring
import psutil
from fastapi import Request

@app.get("/api/system/stats")
async def system_stats():
    return {
        "cpu_percent": psutil.cpu_percent(),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_percent": psutil.disk_usage('/').percent
    }
```

## 🔒 Security

### Security Features

1. **Input Validation**: Pydantic models validate all inputs
2. **CORS Configuration**: Controlled cross-origin access
3. **Rate Limiting**: Prevent abuse (planned)
4. **Error Handling**: No sensitive data in error responses

### Security Best Practices

```python
# Hide sensitive data in responses
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    if config.debug:
        return {"error": str(exc), "type": type(exc).__name__}
    else:
        return {"error": "Internal server error"}
```

## 🤝 Contributing

### Code Style

- Follow PEP 8 formatting
- Use type hints for all functions
- Document all public functions with docstrings
- Keep functions focused and small

### Pull Request Process

1. Create feature branch
2. Add comprehensive tests
3. Update documentation
4. Ensure all health checks pass
5. Submit pull request

---

**Last Updated**: 2025-01-25
**Backend Version**: 2.0.0 (Post Vertical Slice 2)
