"""
Browser Use Cloud Service for AI Browser Testing Agent Backend

Handles Browser Use Cloud API interactions for remote browser automation.
"""

import asyncio
import logging
import uuid
from typing import List, Dict, Any
from datetime import datetime

import requests

from ..config import settings
from ..models import BrowserCloudTaskResponse, ParallelBrowserFlowResponse

logger = logging.getLogger(__name__)

class BrowserUseCloudService:
    """Service for Browser Use Cloud API interactions"""
    
    def __init__(self):
        self.api_base_url = settings.BROWSER_USE_API_BASE_URL
        self.api_key = settings.BROWSER_USE_API_KEY
        self._validate_configuration()
    
    def _validate_configuration(self):
        """Validate that Browser Use Cloud is properly configured"""
        if not settings.is_browser_use_enabled():
            logger.warning("BROWSER_USE_API_KEY not provided, Browser Use Cloud features will be disabled")
            logger.info("To set up Browser Use Cloud: Set BROWSER_USE_API_KEY environment variable")
    
    def is_available(self) -> bool:
        """Check if Browser Use Cloud service is available"""
        return bool(self.api_key)
    
    def _get_headers(self) -> Dict[str, str]:
        """Get standard headers for API requests"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    async def create_task(self, task: str, start_url: str = "https://example.com") -> BrowserCloudTaskResponse:
        """Create a single browser task using Browser Use Cloud API"""
        if not self.is_available():
            raise RuntimeError("Browser Use Cloud API key not configured")
        
        try:
            api_url = f"{self.api_base_url}/run-task"
            payload = {"task": task}
            
            # Use requests in thread pool for async behavior
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: requests.post(api_url, headers=self._get_headers(), json=payload)
            )
            response.raise_for_status()
            
            task_data = response.json()
            task_id = task_data["id"]
            
            logger.info(f"Browser Use Cloud task created: {task_id}")
            
            return BrowserCloudTaskResponse(
                task_id=task_id,
                session_id=task_id,
                live_url=None,  # Will be available after task starts
                status="started"
            )
            
        except Exception as e:
            logger.error(f"Failed to create Browser Use Cloud task: {str(e)}")
            raise RuntimeError(f"Task creation failed: {str(e)}")
    
    async def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """Get task status and details from Browser Use Cloud"""
        if not self.is_available():
            raise RuntimeError("Browser Use Cloud API key not configured")
        
        try:
            api_url = f"{self.api_base_url}/task/{task_id}"
            
            # Use requests in thread pool for async behavior
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: requests.get(api_url, headers=self._get_headers())
            )
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
            raise RuntimeError(f"Task not found or error: {str(e)}")
    
    async def create_parallel_flows(self, flows: List[str]) -> ParallelBrowserFlowResponse:
        """Create multiple browser tasks in parallel"""
        if not self.is_available():
            raise RuntimeError("Browser Use Cloud API key not configured")
        
        try:
            batch_id = str(uuid.uuid4())
            
            async def create_single_task(flow: str) -> BrowserCloudTaskResponse:
                """Create a single browser task"""
                return await self.create_task(flow)
            
            # Create all tasks in parallel
            tasks = await asyncio.gather(*[create_single_task(flow) for flow in flows])
            
            logger.info(f"Successfully created {len(tasks)} parallel Browser Use Cloud tasks")
            
            return ParallelBrowserFlowResponse(
                batch_id=batch_id,
                tasks=tasks,
                total_tasks=len(tasks)
            )
            
        except Exception as e:
            logger.error(f"Failed to create parallel Browser Use Cloud tasks: {str(e)}")
            raise RuntimeError(f"Parallel task creation failed: {str(e)}")
    
    async def monitor_task_stream(self, task_id: str):
        """Monitor a task and yield streaming updates"""
        if not self.is_available():
            raise RuntimeError("Browser Use Cloud API key not configured")
        
        previous_steps_count = 0
        task_completed = False
        
        while not task_completed:
            try:
                # Get current task status
                task_data = await self.get_task_status(task_id)
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
                        yield step_data
                    
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
                yield status_data
                
                # Check if task is completed
                if current_status in ["finished", "failed", "stopped"]:
                    final_data = {
                        "type": "completion",
                        "task_id": task_id,
                        "status": current_status,
                        "output": task_data.get("done_output"),
                        "timestamp": datetime.now().isoformat()
                    }
                    yield final_data
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
                yield error_data
                break

# Global Browser Use Cloud service instance
browser_use_cloud_service = BrowserUseCloudService()
