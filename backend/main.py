from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn
import logging
import time
import json
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
import os

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

# Convex client setup (will be initialized if CONVEX_URL is provided)
try:
    from convex import ConvexClient
    CONVEX_URL = os.getenv("CONVEX_URL", "")
    convex_client = ConvexClient(CONVEX_URL) if CONVEX_URL else None
    if convex_client:
        logger.info(f"Convex client initialized with URL: {CONVEX_URL}")
    else:
        logger.warning("CONVEX_URL not provided, Convex features will be disabled")
        logger.info("To set up Convex: 1) Run 'npx convex dev' 2) Set CONVEX_URL environment variable")
except ImportError:
    logger.warning("Convex client not available, install with: pip install convex")
    convex_client = None
except Exception as e:
    logger.error(f"Error initializing Convex client: {e}")
    convex_client = None

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
    allow_origins=["http://localhost:3000"],
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

# Convex-related models
class CreateTestSessionRequest(BaseModel):
    name: str
    prompt: str

class CreateTestFlowsRequest(BaseModel):
    session_id: str
    flows: List[Dict[str, str]]

class UpdateFlowApprovalRequest(BaseModel):
    flow_id: str
    approved: bool

class TestSessionResponse(BaseModel):
    session_id: str
    message: str
    status: str
    timestamp: str

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
        "version": "1.0.0",
        "convex_enabled": convex_client is not None
    }

# ==================== CONVEX DATABASE ENDPOINTS ====================

@app.post("/api/convex/test-session", response_model=TestSessionResponse)
async def create_test_session(request: CreateTestSessionRequest):
    """Create a new test session in Convex database"""
    if not convex_client:
        return TestSessionResponse(
            session_id="",
            message="Convex not available",
            status="error",
            timestamp=datetime.now().isoformat()
        )
    
    try:
        session_id = await convex_client.mutation("browserTesting:createTestSession", {
            "name": request.name,
            "prompt": request.prompt
        })
        
        logger.info(f"Created test session: {session_id}")
        
        return TestSessionResponse(
            session_id=str(session_id),
            message="Test session created successfully",
            status="success",
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"Error creating test session: {str(e)}")
        return TestSessionResponse(
            session_id="",
            message=f"Error creating test session: {str(e)}",
            status="error",
            timestamp=datetime.now().isoformat()
        )

@app.get("/api/convex/test-sessions")
async def list_test_sessions(limit: Optional[int] = 20):
    """Get list of test sessions from Convex database"""
    if not convex_client:
        return {"error": "Convex not available", "data": []}
    
    try:
        sessions = await convex_client.query("browserTesting:listTestSessions", {
            "limit": limit
        })
        
        logger.info(f"Retrieved {len(sessions)} test sessions")
        
        return {
            "message": "Test sessions retrieved successfully",
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "data": sessions
        }
    except Exception as e:
        logger.error(f"Error retrieving test sessions: {str(e)}")
        return {
            "error": f"Error retrieving test sessions: {str(e)}",
            "data": []
        }

@app.get("/api/convex/test-session/{session_id}")
async def get_test_session(session_id: str):
    """Get a specific test session with flows"""
    if not convex_client:
        return {"error": "Convex not available", "data": None}
    
    try:
        session = await convex_client.query("browserTesting:getTestSession", {
            "sessionId": session_id
        })
        
        logger.info(f"Retrieved test session: {session_id}")
        
        return {
            "message": "Test session retrieved successfully",
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "data": session
        }
    except Exception as e:
        logger.error(f"Error retrieving test session {session_id}: {str(e)}")
        return {
            "error": f"Error retrieving test session: {str(e)}",
            "data": None
        }

@app.post("/api/convex/test-flows")
async def create_test_flows(request: CreateTestFlowsRequest):
    """Create test flows for a session"""
    if not convex_client:
        return {"error": "Convex not available", "flow_ids": []}
    
    try:
        flow_ids = await convex_client.mutation("browserTesting:createTestFlows", {
            "sessionId": request.session_id,
            "flows": request.flows
        })
        
        logger.info(f"Created {len(flow_ids)} test flows for session {request.session_id}")
        
        return {
            "message": f"Created {len(flow_ids)} test flows successfully",
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "flow_ids": [str(fid) for fid in flow_ids]
        }
    except Exception as e:
        logger.error(f"Error creating test flows: {str(e)}")
        return {
            "error": f"Error creating test flows: {str(e)}",
            "flow_ids": []
        }

@app.put("/api/convex/flow-approval")
async def update_flow_approval(request: UpdateFlowApprovalRequest):
    """Update flow approval status"""
    if not convex_client:
        return {"error": "Convex not available"}
    
    try:
        flow_id = await convex_client.mutation("browserTesting:updateFlowApproval", {
            "flowId": request.flow_id,
            "approved": request.approved
        })
        
        action = "approved" if request.approved else "unapproved"
        logger.info(f"Flow {flow_id} {action}")
        
        return {
            "message": f"Flow {action} successfully",
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "flow_id": str(flow_id)
        }
    except Exception as e:
        logger.error(f"Error updating flow approval: {str(e)}")
        return {
            "error": f"Error updating flow approval: {str(e)}"
        }

@app.get("/api/convex/system-stats")
async def get_convex_system_stats():
    """Get system statistics from Convex"""
    if not convex_client:
        return {"error": "Convex not available", "data": None}
    
    try:
        stats = await convex_client.query("browserTesting:getSystemStats", {})
        
        logger.info("Retrieved system stats from Convex")
        
        return {
            "message": "System stats retrieved successfully",
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "data": stats
        }
    except Exception as e:
        logger.error(f"Error retrieving system stats: {str(e)}")
        return {
            "error": f"Error retrieving system stats: {str(e)}",
            "data": None
        }

# Streaming endpoint for Task 1.2
async def generate_stream_data():
    """Generate real-time streaming data for Task 1.2 testing"""
    counter = 0
    start_time = datetime.now()
    
    # Send initial connection message
    initial_data = {
        'type': 'connection_established',
        'message': 'Task 1.2 streaming endpoint connected successfully!',
        'timestamp': datetime.now().isoformat(),
        'stream_id': f'stream_{int(time.time())}',
        'task': '1.2',
        'features': [
            'Real-time unidirectional streaming',
            'JSON data format',
            'Automatic reconnection support',
            'Server-Sent Events (SSE)',
            'Lightweight and efficient'
        ]
    }
    yield f"data: {json.dumps(initial_data)}\n\n"
    
    while True:
        await asyncio.sleep(2)  # Send update every 2 seconds
        counter += 1
        
        # Generate different types of streaming data
        if counter % 3 == 0:
            data = {
                "type": "periodic_update",
                "message": f"Periodic streaming message #{counter}",
                "timestamp": datetime.now().isoformat(),
                "counter": counter,
                "uptime_seconds": int((datetime.now() - start_time).total_seconds())
            }
        elif counter % 5 == 0:
            data = {
                "type": "status_update",
                "message": "System status check",
                "timestamp": datetime.now().isoformat(),
                "status": "operational",
                "metrics": {
                    "messages_sent": counter,
                    "uptime": int((datetime.now() - start_time).total_seconds()),
                    "memory_usage": "12.5MB",
                    "cpu_usage": "3.2%"
                }
            }
        else:
            data = {
                "type": "data_update",
                "message": f"Streaming data point #{counter}",
                "timestamp": datetime.now().isoformat(),
                "counter": counter,
                "data": {
                    "value": counter * 2.5,
                    "category": "test_data",
                    "processed": True
                }
            }
        
        yield f"data: {json.dumps(data)}\n\n"
        
        # Stop after 50 messages for demo purposes
        if counter >= 50:
            final_data = {
                "type": "stream_complete",
                "message": "Streaming demo completed",
                "timestamp": datetime.now().isoformat(),
                "total_messages": counter,
                "duration_seconds": int((datetime.now() - start_time).total_seconds())
            }
            yield f"data: {json.dumps(final_data)}\n\n"
            break

@app.get("/api/stream")
async def stream_endpoint():
    """Task 1.2 streaming endpoint for real-time data"""
    logger.info("Streaming endpoint accessed for Task 1.2")
    
    return StreamingResponse(
        generate_stream_data(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Simple test streaming endpoint
async def generate_simple_stream():
    """Generate simple test streaming data"""
    for i in range(10):
        data = {
            "type": "simple_message",
            "message": f"Simple stream message {i + 1}",
            "timestamp": datetime.now().isoformat(),
            "index": i + 1
        }
        yield f"data: {json.dumps(data)}\n\n"
        await asyncio.sleep(1)
    
    # Send completion message
    final_data = {
        "type": "stream_complete",
        "message": "Simple stream completed",
        "timestamp": datetime.now().isoformat()
    }
    yield f"data: {json.dumps(final_data)}\n\n"

@app.get("/api/stream/simple")
async def simple_stream_endpoint():
    """Simple streaming endpoint for basic testing"""
    logger.info("Simple streaming endpoint accessed")
    
    return StreamingResponse(
        generate_simple_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Statistics endpoint (no longer WebSocket stats)
@app.get("/api/stats")
async def get_stats():
    """Get current system statistics"""
    logger.info("Statistics endpoint accessed")
    
    stats = {
        "system_status": "operational",
        "active_streams": "simulated", # In real implementation, track active streams
        "uptime": datetime.now().isoformat(),
        "version": "1.0.0",
        "task": "1.2 - Streaming Response Implementation"
    }
    
    return {
        "message": "System statistics retrieved successfully",
        "status": "success",
        "timestamp": datetime.now().isoformat(),
        "data": stats
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)