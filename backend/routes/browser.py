"""
Browser API routes for AI Browser Testing Agent Backend

Handles local browser automation and Browser Use Cloud endpoints.
"""

import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from ..models import (
    BrowserSessionRequest, BrowserNavigateRequest, BrowserClickRequest, 
    BrowserTypeRequest, BrowserCloudTaskRequest, BrowserCloudTaskResponse,
    ParallelBrowserFlowRequest, ParallelBrowserFlowResponse
)
from ..services.browser_use_cloud_service import browser_use_cloud_service
from ..browser_service import browser_manager, test_browser_basic_functionality

logger = logging.getLogger(__name__)
router = APIRouter()

# ==================== LOCAL BROWSER AUTOMATION ENDPOINTS ====================

@router.post("/api/browser/test")
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

@router.post("/api/browser/session/create")
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

@router.post("/api/browser/session/navigate")
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

@router.post("/api/browser/session/click")
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

@router.post("/api/browser/session/type")
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

@router.get("/api/browser/session/{session_id}/info")
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

@router.get("/api/browser/session/{session_id}/status")
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

@router.get("/api/browser/session/{session_id}/logs")
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

@router.delete("/api/browser/session/{session_id}")
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

@router.get("/api/browser/sessions")
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

# ==================== BROWSER USE CLOUD ENDPOINTS ====================

@router.post("/api/browser-cloud/create-task", response_model=BrowserCloudTaskResponse)
async def create_browser_cloud_task(request: BrowserCloudTaskRequest):
    """Create a single browser task using Browser Use Cloud API"""
    logger.info(f"Creating Browser Use Cloud task: {request.task[:100]}...")
    
    if not browser_use_cloud_service.is_available():
        raise HTTPException(
            status_code=503, 
            detail="Browser Use Cloud API key not configured. Please check BROWSER_USE_API_KEY."
        )
    
    try:
        result = await browser_use_cloud_service.create_task(
            task=request.task,
            start_url=request.start_url
        )
        return result
        
    except Exception as e:
        logger.error(f"Failed to create Browser Use Cloud task: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Task creation failed: {str(e)}")

@router.get("/api/browser-cloud/task/{task_id}")
async def get_browser_cloud_task_status(task_id: str):
    """Get task status and details from Browser Use Cloud"""
    logger.info(f"Getting Browser Use Cloud task status: {task_id}")
    
    if not browser_use_cloud_service.is_available():
        raise HTTPException(
            status_code=503, 
            detail="Browser Use Cloud API key not configured. Please check BROWSER_USE_API_KEY."
        )
    
    try:
        result = await browser_use_cloud_service.get_task_status(task_id)
        return result
        
    except Exception as e:
        logger.error(f"Failed to get Browser Use Cloud task status: {str(e)}")
        raise HTTPException(status_code=404, detail=f"Task not found or error: {str(e)}")

@router.post("/api/browser-cloud/parallel-flows", response_model=ParallelBrowserFlowResponse)
async def create_parallel_browser_flows(request: ParallelBrowserFlowRequest):
    """Create multiple browser tasks in parallel"""
    logger.info(f"Creating {len(request.flows)} parallel Browser Use Cloud tasks")
    
    if not browser_use_cloud_service.is_available():
        raise HTTPException(
            status_code=503, 
            detail="Browser Use Cloud API key not configured. Please check BROWSER_USE_API_KEY."
        )
    
    try:
        result = await browser_use_cloud_service.create_parallel_flows(request.flows)
        return result
        
    except Exception as e:
        logger.error(f"Failed to create parallel Browser Use Cloud tasks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Parallel task creation failed: {str(e)}")

@router.get("/api/browser-cloud/task/{task_id}/stream")
async def stream_browser_task_logs(task_id: str):
    """Stream real-time task logs and status updates"""
    if not browser_use_cloud_service.is_available():
        raise HTTPException(
            status_code=503, 
            detail="Browser Use Cloud API key not configured. Please check BROWSER_USE_API_KEY."
        )
    
    async def generate_task_stream():
        """Generate Server-Sent Events stream for task monitoring"""
        async for data in browser_use_cloud_service.monitor_task_stream(task_id):
            yield f"data: {data.json()}\n\n"
    
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
