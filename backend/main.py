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
from fastapi import HTTPException
import os
from dotenv import load_dotenv
from google import genai
from browser_service import browser_manager, test_browser_basic_functionality
from browser_use_sdk import BrowserUse

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

# Browser Use Cloud client setup
BROWSER_USE_API_KEY = os.getenv("BROWSER_USE_API_KEY", "")
browser_use_client = None
if BROWSER_USE_API_KEY:
    try:
        from browser_use_sdk import BrowserUse
        browser_use_client = BrowserUse(api_key=BROWSER_USE_API_KEY)
        logger.info("Browser Use Cloud client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Browser Use Cloud client: {e}")
        browser_use_client = None
else:
    logger.warning("BROWSER_USE_API_KEY not provided, Browser Use Cloud features will be disabled")
    logger.info("To set up Browser Use Cloud: Set BROWSER_USE_API_KEY environment variable")

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
    """Create a natural language prompt for LLM to generate testing flows"""
    
    base_prompt = f"""You are an expert QA engineer. Generate {num_flows} test flows for browser automation.

USER REQUEST: {user_prompt}

{f"WEBSITE: {website_url}" if website_url else ""}

Create {num_flows} different test flows. Each flow should be practical and cover important user scenarios.

For each test flow, provide:
- name: Clear test name (under 50 characters)
- description: What this tests (under 100 characters)
- instructions: Natural language instructions for the AI agent (be conversational, not overly detailed)

Return ONLY valid JSON:
[
  {{
    "name": "Test Flow Name",
    "description": "Brief description",
    "instructions": "Go to the homepage, find the login button and sign in, then check that the dashboard appears"
  }}
]

Focus on key user journeys like:
- Login and authentication
- Main features and navigation
- Forms and user input
- Search and filtering
- Error scenarios

Write instructions in natural language that an AI agent can understand and execute."""
    
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

# ==================== BROWSER USE ENDPOINTS ====================

class BrowserSessionRequest(BaseModel):
    session_id: str
    headless: bool = True

class BrowserNavigateRequest(BaseModel):
    session_id: str
    url: str

class BrowserClickRequest(BaseModel):
    session_id: str
    selector: str

class BrowserTypeRequest(BaseModel):
    session_id: str
    selector: str
    text: str

# Browser Use Cloud request models
class BrowserCloudTaskRequest(BaseModel):
    task: str
    start_url: Optional[str] = "https://example.com"
    metadata: Optional[Dict[str, Any]] = None

class BrowserCloudTaskResponse(BaseModel):
    task_id: str
    session_id: str
    live_url: Optional[str] = None
    status: str

class ParallelBrowserFlowRequest(BaseModel):
    flows: List[str]  # List of natural language task descriptions
    metadata: Optional[Dict[str, Any]] = None

class ParallelBrowserFlowResponse(BaseModel):
    batch_id: str
    tasks: List[BrowserCloudTaskResponse]
    total_tasks: int

# Browser Use Cloud endpoints
@app.post("/api/browser-cloud/create-task", response_model=BrowserCloudTaskResponse)
async def create_browser_cloud_task(request: BrowserCloudTaskRequest):
    """Create a single browser task using Browser Use Cloud API"""
    logger.info(f"Creating Browser Use Cloud task: {request.task[:100]}...")
    
    if not BROWSER_USE_API_KEY:
        raise HTTPException(
            status_code=503, 
            detail="Browser Use Cloud API key not configured. Please check BROWSER_USE_API_KEY."
        )
    
    try:
        # Use direct API call to Browser Use Cloud
        import requests
        
        api_url = "https://api.browser-use.com/api/v1/run-task"
        headers = {
            "Authorization": f"Bearer {BROWSER_USE_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {"task": request.task}
        
        response = requests.post(api_url, headers=headers, json=payload)
        response.raise_for_status()
        
        task_data = response.json()
        task_id = task_data["id"]
        
        logger.info(f"Browser Use Cloud task created: {task_id}")
        
        # Browser Use Cloud doesn't return live_url in creation response
        # You need to get task details to retrieve it
        live_url = None
        session_id = task_id
        
        return BrowserCloudTaskResponse(
            task_id=task_id,
            session_id=session_id,
            live_url=live_url,
            status="started"
        )
        
    except Exception as e:
        logger.error(f"Failed to create Browser Use Cloud task: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Task creation failed: {str(e)}")

@app.get("/api/browser-cloud/task/{task_id}")
async def get_browser_cloud_task_status(task_id: str):
    """Get task status and details from Browser Use Cloud"""
    logger.info(f"Getting Browser Use Cloud task status: {task_id}")
    
    if not BROWSER_USE_API_KEY:
        raise HTTPException(
            status_code=503, 
            detail="Browser Use Cloud API key not configured. Please check BROWSER_USE_API_KEY."
        )
    
    try:
        import requests
        
        # Get task details using direct API call
        api_url = f"https://api.browser-use.com/api/v1/task/{task_id}"
        headers = {
            "Authorization": f"Bearer {BROWSER_USE_API_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(api_url, headers=headers)
        response.raise_for_status()
        
        task_data = response.json()
        
        return {
            "task_id": task_id,
            "session_id": task_data.get("session_id", task_id),
            "status": task_data.get("status", "unknown"),
            "is_success": task_data.get("is_success"),
            "live_url": task_data.get("live_url"),
            "started_at": task_data.get("started_at"),
            "finished_at": task_data.get("finished_at"),
            "steps_count": len(task_data.get("steps", [])),
            "done_output": task_data.get("output"),
            "steps": task_data.get("steps", [])
        }
        
    except Exception as e:
        logger.error(f"Failed to get Browser Use Cloud task status: {str(e)}")
        raise HTTPException(status_code=404, detail=f"Task not found or error: {str(e)}")

@app.post("/api/browser-cloud/parallel-flows", response_model=ParallelBrowserFlowResponse)
async def create_parallel_browser_flows(request: ParallelBrowserFlowRequest):
    """Create multiple browser tasks in parallel - inspired by project_summary.md example"""
    logger.info(f"Creating {len(request.flows)} parallel Browser Use Cloud tasks")
    
    if not BROWSER_USE_API_KEY:
        raise HTTPException(
            status_code=503, 
            detail="Browser Use Cloud API key not configured. Please check BROWSER_USE_API_KEY."
        )
    
    try:
        import requests
        import asyncio
        import uuid
        
        batch_id = str(uuid.uuid4())
        
        async def create_single_task(flow: str) -> BrowserCloudTaskResponse:
            """Create a single browser task - keep it simple like project_summary.md"""
            api_url = "https://api.browser-use.com/api/v1/run-task"
            headers = {
                "Authorization": f"Bearer {BROWSER_USE_API_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {"task": flow}
            
            # Use requests in thread pool for async behavior
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: requests.post(api_url, headers=headers, json=payload)
            )
            response.raise_for_status()
            
            task_data = response.json()
            task_id = task_data["id"]
            
            logger.info(f"Created Browser Use Cloud task: {task_id} for flow: {flow[:50]}...")
            
            return BrowserCloudTaskResponse(
                task_id=task_id,
                session_id=task_id,
                live_url=None,  # Will be available after task starts
                status="started"
            )
        
        # Create all tasks in parallel - just like project_summary.md example
        # await asyncio.gather(*[agent.run() for agent in agents])
        tasks = await asyncio.gather(*[create_single_task(flow) for flow in request.flows])
        
        logger.info(f"Successfully created {len(tasks)} parallel Browser Use Cloud tasks")
        
        return ParallelBrowserFlowResponse(
            batch_id=batch_id,
            tasks=tasks,
            total_tasks=len(tasks)
        )
        
    except Exception as e:
        logger.error(f"Failed to create parallel Browser Use Cloud tasks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Parallel task creation failed: {str(e)}")

@app.get("/api/browser-cloud/task/{task_id}/stream")
async def stream_browser_task_logs(task_id: str):
    """Stream real-time task logs and status updates"""
    if not BROWSER_USE_API_KEY:
        raise HTTPException(
            status_code=503, 
            detail="Browser Use Cloud API key not configured. Please check BROWSER_USE_API_KEY."
        )
    
    async def generate_task_stream():
        """Generate Server-Sent Events stream for task monitoring"""
        import requests
        import time
        
        previous_steps_count = 0
        task_completed = False
        
        while not task_completed:
            try:
                # Get current task status
                api_url = f"https://api.browser-use.com/api/v1/task/{task_id}"
                headers = {
                    "Authorization": f"Bearer {BROWSER_USE_API_KEY}",
                    "Content-Type": "application/json"
                }
                
                response = requests.get(api_url, headers=headers)
                response.raise_for_status()
                
                task_data = response.json()
                current_status = task_data.get("status", "unknown")
                current_steps = task_data.get("steps", [])
                
                # Stream new steps
                if len(current_steps) > previous_steps_count:
                    new_steps = current_steps[previous_steps_count:]
                    for step in new_steps:
                        step_data = {
                            "type": "step",
                            "task_id": task_id,
                            "step": step,
                            "timestamp": datetime.now().isoformat()
                        }
                        yield f"data: {json.dumps(step_data)}\n\n"
                    
                    previous_steps_count = len(current_steps)
                
                # Stream status updates
                status_data = {
                    "type": "status",
                    "task_id": task_id,
                    "status": current_status,
                    "live_url": task_data.get("live_url"),
                    "steps_count": len(current_steps),
                    "timestamp": datetime.now().isoformat()
                }
                yield f"data: {json.dumps(status_data)}\n\n"
                
                # Check if task is completed
                if current_status in ["finished", "failed", "stopped"]:
                    final_data = {
                        "type": "completion",
                        "task_id": task_id,
                        "status": current_status,
                        "output": task_data.get("output"),
                        "timestamp": datetime.now().isoformat()
                    }
                    yield f"data: {json.dumps(final_data)}\n\n"
                    task_completed = True
                    break
                
                await asyncio.sleep(2)  # Poll every 2 seconds
                
            except Exception as e:
                error_data = {
                    "type": "error",
                    "task_id": task_id,
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                }
                yield f"data: {json.dumps(error_data)}\n\n"
                break
    
    return StreamingResponse(
        generate_task_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.post("/api/browser/test")
async def test_browser_functionality():
    """Test basic browser functionality for Task 3.1"""
    logger.info("Browser functionality test endpoint accessed")
    
    try:
        result = await test_browser_basic_functionality()
        logger.info(f"Browser test completed: {result['status']}")
        return result
        
    except Exception as e:
        logger.error(f"Browser test failed: {e}")
        return {
            "test": "basic_browser_functionality",
            "status": "error", 
            "error": str(e),
            "browser_use_available": False
        }

@app.post("/api/browser/session/create")
async def create_browser_session(request: BrowserSessionRequest):
    """Create a new browser session"""
    logger.info(f"Creating browser session: {request.session_id}")
    
    try:
        result = await browser_manager.create_session(
            session_id=request.session_id,
            headless=request.headless
        )
        logger.info(f"Browser session created successfully: {request.session_id}")
        return result
        
    except Exception as e:
        logger.error(f"Failed to create browser session: {e}")
        return {
            "session_id": request.session_id,
            "status": "error",
            "error": str(e)
        }

@app.post("/api/browser/session/navigate")
async def navigate_browser(request: BrowserNavigateRequest):
    """Navigate browser to a URL"""
    logger.info(f"Navigating browser session {request.session_id} to {request.url}")
    
    try:
        result = await browser_manager.navigate_to_url(
            session_id=request.session_id,
            url=request.url
        )
        logger.info(f"Navigation successful: {request.session_id}")
        return result
        
    except Exception as e:
        logger.error(f"Navigation failed: {e}")
        return {
            "session_id": request.session_id,
            "action": "navigate",
            "status": "error",
            "error": str(e)
        }

@app.post("/api/browser/session/click")
async def click_element(request: BrowserClickRequest):
    """Click an element in the browser"""
    logger.info(f"Clicking element in session {request.session_id}: {request.selector}")
    
    try:
        result = await browser_manager.click_element(
            session_id=request.session_id,
            selector=request.selector
        )
        logger.info(f"Click successful: {request.session_id}")
        return result
        
    except Exception as e:
        logger.error(f"Click failed: {e}")
        return {
            "session_id": request.session_id,
            "action": "click",
            "status": "error",
            "error": str(e)
        }

@app.post("/api/browser/session/type")
async def type_text(request: BrowserTypeRequest):
    """Type text into an element"""
    logger.info(f"Typing text in session {request.session_id}: {request.selector}")
    
    try:
        result = await browser_manager.type_text(
            session_id=request.session_id,
            selector=request.selector,
            text=request.text
        )
        logger.info(f"Type successful: {request.session_id}")
        return result
        
    except Exception as e:
        logger.error(f"Type failed: {e}")
        return {
            "session_id": request.session_id,
            "action": "type",
            "status": "error",
            "error": str(e)
        }

@app.get("/api/browser/session/{session_id}/info")
async def get_page_info(session_id: str):
    """Get information about the current page"""
    logger.info(f"Getting page info for session: {session_id}")
    
    try:
        result = await browser_manager.get_page_info(session_id)
        logger.info(f"Page info retrieved: {session_id}")
        return result
        
    except Exception as e:
        logger.error(f"Get page info failed: {e}")
        return {
            "session_id": session_id,
            "action": "get_page_info",
            "status": "error",
            "error": str(e)
        }

@app.get("/api/browser/session/{session_id}/status")
async def get_session_status(session_id: str):
    """Get status of a browser session"""
    logger.info(f"Getting status for session: {session_id}")
    
    try:
        result = browser_manager.get_session_status(session_id)
        logger.info(f"Session status retrieved: {session_id}")
        return result
        
    except Exception as e:
        logger.error(f"Get session status failed: {e}")
        return {
            "session_id": session_id,
            "status": "error",
            "error": str(e)
        }

@app.get("/api/browser/session/{session_id}/logs")
async def get_session_logs(session_id: str):
    """Get logs for a browser session"""
    logger.info(f"Getting logs for session: {session_id}")
    
    try:
        logs = browser_manager.get_session_logs(session_id)
        logger.info(f"Session logs retrieved: {session_id} ({len(logs)} entries)")
        return {
            "session_id": session_id,
            "status": "success",
            "logs": logs,
            "total_logs": len(logs)
        }
        
    except Exception as e:
        logger.error(f"Get session logs failed: {e}")
        return {
            "session_id": session_id,
            "status": "error",
            "error": str(e)
        }

@app.delete("/api/browser/session/{session_id}")
async def close_browser_session(session_id: str):
    """Close and cleanup a browser session"""
    logger.info(f"Closing browser session: {session_id}")
    
    try:
        result = await browser_manager.close_session(session_id)
        logger.info(f"Browser session closed: {session_id}")
        return result
        
    except Exception as e:
        logger.error(f"Failed to close browser session: {e}")
        return {
            "session_id": session_id,
            "status": "error",
            "error": str(e)
        }

@app.get("/api/browser/sessions")
async def list_active_sessions():
    """List all active browser sessions"""
    logger.info("Listing active browser sessions")
    
    try:
        sessions = browser_manager.get_active_sessions()
        session_details = []
        
        for session_id in sessions:
            status = browser_manager.get_session_status(session_id)
            session_details.append(status)
        
        logger.info(f"Active sessions listed: {len(sessions)} sessions")
        return {
            "status": "success",
            "active_sessions": sessions,
            "session_details": session_details,
            "total_sessions": len(sessions)
        }
        
    except Exception as e:
        logger.error(f"Failed to list active sessions: {e}")
        return {
            "status": "error",
            "error": str(e)
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)