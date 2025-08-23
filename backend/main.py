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
from dotenv import load_dotenv
from google import genai

# Load environment variables from .env file
load_dotenv()

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

# Note: Convex runs directly in Next.js frontend, not in FastAPI backend

# Gemini client setup (will be initialized if GEMINI_API_KEY is provided)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
gemini_client = None
if GEMINI_API_KEY:
    try:
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        logger.info("Gemini client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Gemini client: {e}")
        gemini_client = None
else:
    logger.warning("GEMINI_API_KEY not provided, LLM features will be disabled")
    logger.info("To set up Gemini: Set GEMINI_API_KEY environment variable")

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

# Note: Convex models are defined in Next.js frontend (TypeScript)

# LLM/Flow Generation models
class GenerateFlowsRequest(BaseModel):
    prompt: str
    website_url: Optional[str] = None
    num_flows: Optional[int] = 5

class TestFlow(BaseModel):
    name: str
    description: str
    instructions: str

class GenerateFlowsResponse(BaseModel):
    flows: List[TestFlow]
    message: str
    status: str
    timestamp: str
    generation_time: Optional[float] = None

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

        "llm_enabled": gemini_client is not None
    }

# ==================== LLM FLOW GENERATION ENDPOINTS ====================

def create_flow_generation_prompt(user_prompt: str, website_url: Optional[str] = None, num_flows: int = 5) -> str:
    """Create a well-structured prompt for LLM to generate testing flows"""
    
    base_prompt = f"""You are an expert QA automation engineer. Generate {num_flows} comprehensive test flows for browser automation testing.

USER REQUEST: {user_prompt}

{f"WEBSITE TO TEST: {website_url}" if website_url else ""}

Generate exactly {num_flows} test flows that cover different aspects of testing. Each flow should be:
1. Specific and actionable
2. Suitable for browser automation
3. Comprehensive enough to catch real issues
4. Focused on user-facing functionality

For each test flow, provide:
- name: A clear, descriptive name (max 50 characters)
- description: A brief explanation of what this flow tests (max 100 characters)  
- instructions: Detailed step-by-step instructions for browser automation (be specific about what to click, type, verify)

Return ONLY a valid JSON array with this exact structure:
[
  {{
    "name": "Test Flow Name",
    "description": "Brief description of what this tests",
    "instructions": "Step 1: Navigate to homepage. Step 2: Click login button. Step 3: Enter credentials. Step 4: Verify dashboard loads."
  }}
]

Focus on realistic, important test scenarios like:
- User authentication flows
- Core functionality testing  
- Navigation and UI interactions
- Form submissions and validations
- Error handling scenarios
- Mobile responsiveness (if applicable)

Make the instructions clear enough for an AI agent to execute them."""
    
    return base_prompt

async def generate_flows_with_llm(prompt: str, website_url: Optional[str] = None, num_flows: int = 5) -> List[TestFlow]:
    """Generate test flows using Gemini API"""
    if not gemini_client:
        raise ValueError("Gemini client not available")
    
    try:
        # Create the prompt
        system_prompt = create_flow_generation_prompt(prompt, website_url, num_flows)
        
        # Combine system and user prompts for Gemini
        full_prompt = f"""You are an expert QA automation engineer. Generate test flows as valid JSON.

{system_prompt}"""
        
        # Call Gemini API asynchronously
        response = await gemini_client.aio.models.generate_content(
            model='gemini-2.0-flash-001',
            contents=full_prompt
        )
        
        # Extract and parse response
        content = response.text
        if not content:
            raise ValueError("Empty response from Gemini")
            
        content = content.strip()
        
        # Clean the response (remove markdown code blocks if present)
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        
        # Parse JSON response
        flows_data = json.loads(content.strip())
        
        # Validate that flows_data is a list
        if not isinstance(flows_data, list):
            raise ValueError("Expected JSON array from LLM response")
        
        # Convert to TestFlow objects
        flows = []
        for flow_data in flows_data:
            if not isinstance(flow_data, dict):
                continue
            if all(key in flow_data for key in ["name", "description", "instructions"]):
                flows.append(TestFlow(
                    name=flow_data["name"],
                    description=flow_data["description"], 
                    instructions=flow_data["instructions"]
                ))
        
        if not flows:
            raise ValueError("No valid flows generated from LLM response")
        
        return flows
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response as JSON: {e}")
        logger.error(f"Raw response: {content if 'content' in locals() else 'No content'}")
        raise ValueError("LLM returned invalid JSON response")
    except Exception as e:
        logger.error(f"Error generating flows with LLM: {e}")
        raise

@app.post("/api/generate-flows", response_model=GenerateFlowsResponse)
async def generate_flows(request: GenerateFlowsRequest):
    """Generate test flows using LLM based on user prompt"""
    start_time = time.time()
    
    if not gemini_client:
        return GenerateFlowsResponse(
            flows=[],
            message="LLM service not available. Please set GEMINI_API_KEY environment variable.",
            status="error",
            timestamp=datetime.now().isoformat()
        )
    
    try:
        logger.info(f"Generating flows for prompt: {request.prompt[:100]}...")
        
        # Generate flows using LLM
        flows = await generate_flows_with_llm(
            prompt=request.prompt,
            website_url=request.website_url,
            num_flows=request.num_flows or 5
        )
        
        generation_time = round(time.time() - start_time, 2)
        
        logger.info(f"Successfully generated {len(flows)} flows in {generation_time}s")
        
        return GenerateFlowsResponse(
            flows=flows,
            message=f"Successfully generated {len(flows)} test flows",
            status="success",
            timestamp=datetime.now().isoformat(),
            generation_time=generation_time
        )
        
    except ValueError as e:
        logger.error(f"Validation error in flow generation: {e}")
        return GenerateFlowsResponse(
            flows=[],
            message=f"Flow generation failed: {str(e)}",
            status="error",
            timestamp=datetime.now().isoformat(),
            generation_time=round(time.time() - start_time, 2)
        )
    except Exception as e:
        logger.error(f"Unexpected error in flow generation: {e}")
        return GenerateFlowsResponse(
            flows=[],
            message=f"An unexpected error occurred: {str(e)}",
            status="error", 
            timestamp=datetime.now().isoformat(),
            generation_time=round(time.time() - start_time, 2)
        )

# Note: Convex database operations are handled directly in Next.js frontend

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