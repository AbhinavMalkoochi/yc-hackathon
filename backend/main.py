from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import logging
import time
from datetime import datetime
from typing import Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('backend.log')
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Browser Testing Agent API", version="1.0.0")

# Logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    correlation_id = f"req_{int(start_time * 1000)}"
    
    logger.info(f"[{correlation_id}] Request started: {request.method} {request.url}")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(f"[{correlation_id}] Request completed: {response.status_code} in {process_time:.4f}s")
    
    response.headers["X-Correlation-ID"] = correlation_id
    response.headers["X-Process-Time"] = str(process_time)
    
    return response

# Enable CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MessageResponse(BaseModel):
    message: str
    status: str
    timestamp: str

class TestResponse(BaseModel):
    message: str
    status: str
    timestamp: str
    correlation_id: str
    test_data: Dict[str, Any]

@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "AI Browser Testing Agent API is running!", "version": "1.0.0"}

@app.get("/api/message", response_model=MessageResponse)
async def get_message():
    logger.info("Message endpoint accessed")
    return MessageResponse(
        message="Hello from FastAPI backend!",
        status="success",
        timestamp=datetime.now().isoformat()
    )

@app.get("/api/test", response_model=TestResponse)
async def test_endpoint(request: Request):
    """Test endpoint for Task 1.1 - Basic FastAPI-Next.js Integration Test"""
    correlation_id = request.headers.get("X-Correlation-ID", "unknown")
    
    logger.info(f"[{correlation_id}] Test endpoint accessed for Task 1.1")
    
    test_data = {
        "frontend_backend_connection": "successful",
        "logging_system": "operational",
        "timestamp_server": datetime.now().isoformat(),
        "request_method": request.method,
        "request_url": str(request.url),
        "user_agent": request.headers.get("user-agent", "unknown"),
        "task": "1.1 - Basic FastAPI-Next.js Integration Test"
    }
    
    logger.info(f"[{correlation_id}] Test data prepared: {test_data}")
    
    response = TestResponse(
        message="Task 1.1 test endpoint working correctly!",
        status="success",
        timestamp=datetime.now().isoformat(),
        correlation_id=correlation_id,
        test_data=test_data
    )
    
    logger.info(f"[{correlation_id}] Test endpoint response prepared successfully")
    return response

@app.get("/health")
async def health_check():
    logger.info("Health check endpoint accessed")
    return {
        "status": "healthy", 
        "service": "ai-browser-testing-agent-api",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

