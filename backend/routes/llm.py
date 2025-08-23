"""
LLM API routes for AI Browser Testing Agent Backend

Handles LLM-powered test flow generation endpoints.
"""

import logging
import time
from datetime import datetime
from fastapi import APIRouter, HTTPException

from ..models import GenerateFlowsRequest, GenerateFlowsResponse
from ..services.llm_service import llm_service

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/api/generate-flows", response_model=GenerateFlowsResponse)
async def generate_flows(request: GenerateFlowsRequest):
    """Generate test flows using LLM based on user prompt"""
    start_time = time.time()
    
    if not llm_service.is_available():
        return GenerateFlowsResponse(
            flows=[],
            message="LLM service not available. Please set GEMINI_API_KEY environment variable.",
            status="error",
            timestamp=datetime.now().isoformat()
        )
    
    try:
        logger.info(f"Generating flows for prompt: {request.prompt[:100]}...")
        
        # Generate flows using LLM
        flows = await llm_service.generate_flows(
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
