"""
Core API routes for AI Browser Testing Agent Backend

Handles basic endpoints, health checks, and testing interfaces.
"""

import logging
import time
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse

from ..models import (
    MessageResponse, 
    TestResponse, 
    HealthCheckResponse, 
    StatisticsResponse
)
from ..services.streaming_service import streaming_service

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=dict)
async def root():
    """Root endpoint with service information"""
    logger.info("Root endpoint accessed")
    return {
        "message": "AI Browser Testing Agent API is running!", 
        "version": "1.0.0"
    }

@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint"""
    logger.info("Health check endpoint accessed")
    return HealthCheckResponse(
        status="healthy", 
        service="ai-browser-testing-agent-api",
        timestamp=datetime.now().isoformat(),
        version="1.0.0",
        llm_enabled=False  # Will be updated by main app
    )

@router.get("/api/message", response_model=MessageResponse)
async def get_message():
    """Message endpoint for testing"""
    logger.info("Message endpoint accessed")
    return MessageResponse(
        message="Hello from FastAPI backend!",
        status="success",
        timestamp=datetime.now().isoformat()
    )

@router.get("/api/test", response_model=TestResponse)
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

@router.get("/api/stream")
async def stream_endpoint():
    """Task 1.2 streaming endpoint for real-time data"""
    logger.info("Streaming endpoint accessed for Task 1.2")
    
    return StreamingResponse(
        streaming_service.generate_stream_data(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Headers": "*",
        }
    )

@router.get("/api/stream/simple")
async def simple_stream_endpoint():
    """Simple streaming endpoint for basic testing"""
    logger.info("Simple streaming endpoint accessed")
    
    return StreamingResponse(
        streaming_service.generate_simple_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Headers": "*",
        }
    )

@router.get("/api/stats", response_model=StatisticsResponse)
async def get_stats():
    """Get current system statistics"""
    logger.info("Statistics endpoint accessed")
    
    stats = {
        "system_status": "operational",
        "active_streams": "simulated",  # In real implementation, track active streams
        "uptime": datetime.now().isoformat(),
        "version": "1.0.0",
        "task": "1.2 - Streaming Response Implementation"
    }
    
    return StatisticsResponse(
        message="System statistics retrieved successfully",
        status="success",
        timestamp=datetime.now().isoformat(),
        data=stats
    )
