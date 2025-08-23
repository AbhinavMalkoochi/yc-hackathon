"""
Data models for AI Browser Testing Agent Backend

Centralizes all Pydantic models, request/response schemas, and data structures.
"""

from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime

# ==================== BASIC RESPONSE MODELS ====================

class MessageResponse(BaseModel):
    """Basic message response model"""
    message: str
    status: str
    timestamp: str

class TestResponse(BaseModel):
    """Test endpoint response model"""
    message: str
    status: str
    timestamp: str
    correlation_id: str
    test_data: Dict[str, Any]

# ==================== LLM FLOW GENERATION MODELS ====================

class GenerateFlowsRequest(BaseModel):
    """Request model for LLM flow generation"""
    prompt: str
    website_url: Optional[str] = None
    num_flows: Optional[int] = 5

class TestFlow(BaseModel):
    """Individual test flow model"""
    name: str
    description: str
    instructions: str

class GenerateFlowsResponse(BaseModel):
    """Response model for LLM flow generation"""
    flows: List[TestFlow]
    message: str
    status: str
    timestamp: str
    generation_time: Optional[float] = None

# ==================== BROWSER SESSION MODELS ====================

class BrowserSessionRequest(BaseModel):
    """Request model for browser session creation"""
    session_id: str
    headless: bool = True

class BrowserNavigateRequest(BaseModel):
    """Request model for browser navigation"""
    session_id: str
    url: str

class BrowserClickRequest(BaseModel):
    """Request model for browser element clicking"""
    session_id: str
    selector: str

class BrowserTypeRequest(BaseModel):
    """Request model for browser text input"""
    session_id: str
    selector: str
    text: str

# ==================== BROWSER USE CLOUD MODELS ====================

class BrowserCloudTaskRequest(BaseModel):
    """Request model for Browser Use Cloud task creation"""
    task: str
    start_url: Optional[str] = "https://example.com"
    metadata: Optional[Dict[str, Any]] = None

class BrowserCloudTaskResponse(BaseModel):
    """Response model for Browser Use Cloud task"""
    task_id: str
    session_id: str
    live_url: Optional[str] = None
    status: str

class ParallelBrowserFlowRequest(BaseModel):
    """Request model for parallel browser flow execution"""
    flows: List[str]  # List of natural language task descriptions
    metadata: Optional[Dict[str, Any]] = None

class ParallelBrowserFlowResponse(BaseModel):
    """Response model for parallel browser flow execution"""
    batch_id: str
    tasks: List[BrowserCloudTaskResponse]
    total_tasks: int

# ==================== STREAMING MODELS ====================

class StreamData(BaseModel):
    """Base model for streaming data"""
    type: str
    message: str
    timestamp: str

class ConnectionEstablishedData(StreamData):
    """Connection established streaming data"""
    stream_id: str
    task: str
    features: List[str]

class PeriodicUpdateData(StreamData):
    """Periodic update streaming data"""
    counter: int
    uptime_seconds: int

class StatusUpdateData(StreamData):
    """Status update streaming data"""
    status: str
    metrics: Dict[str, Any]

class DataUpdateData(StreamData):
    """Data update streaming data"""
    counter: int
    data: Dict[str, Any]

class StreamCompleteData(StreamData):
    """Stream completion data"""
    total_messages: Optional[int] = None
    duration_seconds: Optional[int] = None

# ==================== BROWSER TASK STREAMING MODELS ====================

class BrowserTaskStepData(StreamData):
    """Browser task step streaming data"""
    task_id: str
    step: Dict[str, Any]

class BrowserTaskStatusData(StreamData):
    """Browser task status streaming data"""
    task_id: str
    status: str
    live_url: Optional[str] = None
    steps_count: int

class BrowserTaskCompletionData(StreamData):
    """Browser task completion streaming data"""
    task_id: str
    status: str
    output: Optional[Any] = None

class BrowserTaskErrorData(StreamData):
    """Browser task error streaming data"""
    task_id: str
    error: str

# ==================== UTILITY MODELS ====================

class HealthCheckResponse(BaseModel):
    """Health check response model"""
    status: str
    service: str
    timestamp: str
    version: str
    llm_enabled: bool

class StatisticsResponse(BaseModel):
    """Statistics response model"""
    message: str
    status: str
    timestamp: str
    data: Dict[str, Any]
