"""
Streaming Service for AI Browser Testing Agent Backend

Handles Server-Sent Events (SSE) for real-time data streaming.
"""

import json
import asyncio
import logging
from datetime import datetime
from typing import AsyncGenerator

from ..config import settings

logger = logging.getLogger(__name__)

class StreamingService:
    """Service for handling real-time data streaming"""
    
    @staticmethod
    async def generate_stream_data() -> AsyncGenerator[str, None]:
        """Generate real-time streaming data for Task 1.2 testing"""
        counter = 0
        start_time = datetime.now()
        
        # Send initial connection message
        initial_data = {
            'type': 'connection_established',
            'message': 'Task 1.2 streaming endpoint connected successfully!',
            'timestamp': datetime.now().isoformat(),
            'stream_id': f'stream_{int(datetime.now().timestamp())}',
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
            await asyncio.sleep(settings.STREAM_UPDATE_INTERVAL)
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
            
            # Stop after max messages for demo purposes
            if counter >= settings.MAX_STREAM_MESSAGES:
                final_data = {
                    "type": "stream_complete",
                    "message": "Streaming demo completed",
                    "timestamp": datetime.now().isoformat(),
                    "total_messages": counter,
                    "duration_seconds": int((datetime.now() - start_time).total_seconds())
                }
                yield f"data: {json.dumps(final_data)}\n\n"
                break
    
    @staticmethod
    async def generate_simple_stream() -> AsyncGenerator[str, None]:
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
    
    @staticmethod
    async def generate_browser_task_stream(task_id: str) -> AsyncGenerator[str, None]:
        """Generate streaming data for browser task monitoring"""
        import requests
        
        previous_steps_count = 0
        task_completed = False
        
        while not task_completed:
            try:
                # Get current task status from Browser Use Cloud
                api_url = f"{settings.BROWSER_USE_API_BASE_URL}/task/{task_id}"
                headers = {
                    "Authorization": f"Bearer {settings.BROWSER_USE_API_KEY}",
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

# Global streaming service instance
streaming_service = StreamingService()
