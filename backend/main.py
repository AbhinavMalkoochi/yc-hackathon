from fastapi import FastAPI, Request, HTTPException
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
import re

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

# Gemini client setup
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

# Browser Use Cloud client setup
BROWSER_USE_API_KEY = os.getenv("BROWSER_USE_API_KEY", "")
if not BROWSER_USE_API_KEY:
    logger.warning("BROWSER_USE_API_KEY not provided, Browser Use Cloud features will be disabled")

# Enable CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== CREDENTIALS SYSTEM ====================

# In-memory credentials storage (in production, use a secure database)
CREDENTIALS_STORE: Dict[str, Dict[str, str]] = {}

def add_credentials(domain: str, credentials: Dict[str, str]):
    """Add credentials for a specific domain"""
    # Normalize domain (remove protocol, add wildcard for subdomains)
    normalized_domain = domain.replace('https://', '').replace('http://', '')
    if not normalized_domain.startswith('*.'):
        normalized_domain = f"*.{normalized_domain}"
    
    CREDENTIALS_STORE[normalized_domain] = credentials
    logger.info(f"Added credentials for domain: {normalized_domain}")

def get_credentials_for_domain(domain: str) -> Optional[Dict[str, str]]:
    """Get credentials for a specific domain"""
    # Remove protocol from input domain
    clean_domain = domain.replace('https://', '').replace('http://', '')
    
    for pattern, creds in CREDENTIALS_STORE.items():
        if pattern.startswith('*.'):
            # Handle wildcard subdomain matching
            base_domain = pattern[2:]  # Remove '*.' prefix
            if clean_domain.endswith(base_domain):
                return creds
        elif pattern == clean_domain:
            return creds
    
    return None

def enhance_prompt_with_credentials(prompt: str, website_url: str) -> str:
    """Enhance the prompt with credentials if available for the website"""
    if not website_url:
        return prompt
    
    credentials = get_credentials_for_domain(website_url)
    if not credentials:
        return prompt
    
    # Create credential placeholders for the LLM
    credential_placeholders = []
    for key, value in credentials.items():
        # Use x_ prefix as recommended by Browser Use docs
        placeholder = f"x_{key}"
        credential_placeholders.append(f"{placeholder}: {value}")
    
    # Add credentials section to the prompt
    enhanced_prompt = f"""{prompt}

CREDENTIALS AVAILABLE FOR {website_url}:
{chr(10).join(credential_placeholders)}

IMPORTANT: Use these credentials when needed for authentication or form filling. The LLM will see placeholder names (x_username, x_password) but never the actual values. When the model wants to use credentials, it outputs the placeholder name and the system automatically substitutes the real value."""
    
    return enhanced_prompt

# Initialize with some example credentials (remove in production)
add_credentials("example.com", {
    "username": "demo@example.com",
    "password": "demo123456"
})

add_credentials("test.com", {
    "email": "test@test.com",
    "password": "testpass123"
})

# ==================== DATA MODELS ====================

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

class ParallelBrowserFlowRequest(BaseModel):
    flows: List[str]  # List of natural language task descriptions

class BrowserCloudTaskResponse(BaseModel):
    task_id: str
    session_id: str
    live_url: Optional[str] = None
    status: str

class ParallelBrowserFlowResponse(BaseModel):
    batch_id: str
    tasks: List[BrowserCloudTaskResponse]
    total_tasks: int

# Credentials management models
class AddCredentialsRequest(BaseModel):
    domain: str
    credentials: Dict[str, str]

class CredentialsResponse(BaseModel):
    message: str
    status: str
    domain: str
    credentials_count: int
    timestamp: str

class ListCredentialsResponse(BaseModel):
    message: str
    status: str
    domains: List[str]
    total_domains: int
    timestamp: str

# ==================== CORE ENDPOINTS ====================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "AI Browser Testing Agent API is running!", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check with service status"""
    return {
        "status": "healthy", 
        "service": "ai-browser-testing-agent-api",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "llm_enabled": gemini_client is not None,
        "browser_use_enabled": bool(BROWSER_USE_API_KEY),
        "credentials_enabled": True
    }

# ==================== CREDENTIALS MANAGEMENT ====================

@app.post("/api/credentials/add", response_model=CredentialsResponse)
async def add_credentials_endpoint(request: AddCredentialsRequest):
    """Add credentials for a specific domain"""
    try:
        add_credentials(request.domain, request.credentials)
        
        return CredentialsResponse(
            message=f"Credentials added successfully for {request.domain}",
            status="success",
            domain=request.domain,
            credentials_count=len(request.credentials),
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"Failed to add credentials: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to add credentials: {str(e)}")

@app.get("/api/credentials/list", response_model=ListCredentialsResponse)
async def list_credentials():
    """List all domains with stored credentials"""
    try:
        domains = list(CREDENTIALS_STORE.keys())
        
        return ListCredentialsResponse(
            message="Credentials retrieved successfully",
            status="success",
            domains=domains,
            total_domains=len(domains),
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"Failed to list credentials: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list credentials: {str(e)}")

@app.delete("/api/credentials/{domain}")
async def remove_credentials(domain: str):
    """Remove credentials for a specific domain"""
    try:
        normalized_domain = domain.replace('https://', '').replace('http://', '')
        if not normalized_domain.startswith('*.'):
            normalized_domain = f"*.{normalized_domain}"
        
        if normalized_domain in CREDENTIALS_STORE:
            del CREDENTIALS_STORE[normalized_domain]
            return {
                "message": f"Credentials removed for {domain}",
                "status": "success",
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=404, detail=f"No credentials found for domain: {domain}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to remove credentials: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to remove credentials: {str(e)}")

# ==================== AI FLOW GENERATION ====================

def create_flow_generation_prompt(user_prompt: str, website_url: Optional[str] = None, num_flows: int = 5) -> str:
    """Create a well-structured prompt for LLM to generate testing flows"""
    
    # Enhance prompt with credentials if available
    enhanced_prompt = enhance_prompt_with_credentials(user_prompt, website_url or "")
    
    base_prompt = f"""You are an expert QA automation engineer. Generate {num_flows} comprehensive test flows for browser automation testing.

USER REQUEST: {enhanced_prompt}

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
- User authentication flows (use available credentials when mentioned)
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
        system_prompt = create_flow_generation_prompt(prompt, website_url, num_flows)
        full_prompt = f"""You are an expert QA automation engineer. Generate test flows as valid JSON.

{system_prompt}"""
        
        # Call Gemini API asynchronously
        response = await gemini_client.aio.models.generate_content(
            model='gemini-2.0-flash-001',
            contents=full_prompt
        )
        
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

# ==================== BROWSER USE CLOUD INTEGRATION ====================

@app.post("/api/browser-cloud/parallel-flows", response_model=ParallelBrowserFlowResponse)
async def create_parallel_browser_flows(request: ParallelBrowserFlowRequest):
    """Create multiple browser tasks in parallel"""
    logger.info(f"Creating {len(request.flows)} parallel Browser Use Cloud tasks")
    
    if not BROWSER_USE_API_KEY:
        raise HTTPException(
            status_code=503, 
            detail="Browser Use Cloud API key not configured. Please check BROWSER_USE_API_KEY."
        )
    
    try:
        import requests
        import uuid
        
        batch_id = str(uuid.uuid4())
        
        async def create_single_task(flow: str) -> BrowserCloudTaskResponse:
            """Create a single browser task"""
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
        
        # Create all tasks in parallel
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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)