"""
Admin API router for database management.
Provides endpoints for CRUD operations on all database entities.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
import requests
import json
import logging

from backend.config import config

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Pydantic models for request/response
class TestRunCreate(BaseModel):
    name: str = Field(..., description="Name of the test run")
    description: Optional[str] = Field(None, description="Description of the test run")
    prompt: str = Field(..., description="Original prompt for the test run")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

class TestRunResponse(BaseModel):
    _id: str
    _creationTime: float
    name: str
    description: Optional[str]
    status: str
    prompt: str
    totalFlows: int
    completedFlows: int
    failedFlows: int
    startedAt: Optional[float]
    completedAt: Optional[float]
    metadata: Optional[Dict[str, Any]]

class FlowCreate(BaseModel):
    testRunId: str = Field(..., description="ID of the test run")
    name: str = Field(..., description="Name of the flow")
    description: str = Field(..., description="Description of the flow")
    instructions: str = Field(..., description="Execution instructions")
    order: int = Field(..., description="Order in the test run")
    estimatedDurationMinutes: Optional[int] = Field(None, description="Estimated duration")
    successCriteria: Optional[List[str]] = Field(None, description="Success criteria")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

class SampleDataRequest(BaseModel):
    testRuns: int = Field(default=3, description="Number of test runs to create")
    flowsPerRun: int = Field(default=2, description="Number of flows per test run")

# Helper function to make Convex API calls
async def call_convex_function(function_name: str, args: Dict[str, Any]) -> Any:
    """Call a Convex function via HTTP API."""
    try:
        url = f"{config.convex.deployment_url}/api/query"
        if function_name.startswith("create") or function_name.startswith("update") or function_name.startswith("remove"):
            url = f"{config.convex.deployment_url}/api/mutation"
        
        payload = {
            "path": function_name,
            "args": [args] if args else []
        }
        
        headers = {
            "Content-Type": "application/json",
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        
        result = response.json()
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result.get("value")
        
    except requests.RequestException as e:
        logger.error(f"Convex API call failed: {str(e)}")
        raise HTTPException(status_code=503, detail=f"Database connection failed: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in Convex call: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@router.get("/test-runs", response_model=List[TestRunResponse])
async def list_test_runs(
    limit: int = Query(default=20, le=100, description="Maximum number of test runs to return"),
    status: Optional[str] = Query(None, description="Filter by status")
):
    """List all test runs with optional filtering."""
    try:
        # For simplicity, we'll use a basic pagination approach
        args = {
            "paginationOpts": {
                "numItems": limit,
                "cursor": None
            }
        }
        
        if status:
            args["status"] = status
            
        result = await call_convex_function("testRuns:list", args)
        
        if result and "page" in result:
            return result["page"]
        return []
        
    except Exception as e:
        logger.error(f"Failed to list test runs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list test runs: {str(e)}")

@router.post("/test-runs", response_model=Dict[str, str])
async def create_test_run(test_run: TestRunCreate):
    """Create a new test run."""
    try:
        args = {
            "name": test_run.name,
            "prompt": test_run.prompt,
        }
        
        if test_run.description:
            args["description"] = test_run.description
            
        if test_run.metadata:
            args["metadata"] = test_run.metadata
            
        test_run_id = await call_convex_function("testRuns:create", args)
        
        return {"testRunId": test_run_id}
        
    except Exception as e:
        logger.error(f"Failed to create test run: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create test run: {str(e)}")

@router.get("/test-runs/{test_run_id}")
async def get_test_run(test_run_id: str):
    """Get a specific test run by ID."""
    try:
        args = {"testRunId": test_run_id}
        result = await call_convex_function("testRuns:get", args)
        
        if not result:
            raise HTTPException(status_code=404, detail="Test run not found")
            
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get test run: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get test run: {str(e)}")

@router.get("/flows/{test_run_id}")
async def list_flows_for_test_run(test_run_id: str):
    """List all flows for a specific test run."""
    try:
        args = {"testRunId": test_run_id}
        result = await call_convex_function("flows:listByTestRun", args)
        
        return result or []
        
    except Exception as e:
        logger.error(f"Failed to list flows: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list flows: {str(e)}")

@router.post("/flows", response_model=Dict[str, str])
async def create_flow(flow: FlowCreate):
    """Create a new flow."""
    try:
        args = {
            "testRunId": flow.testRunId,
            "name": flow.name,
            "description": flow.description,
            "instructions": flow.instructions,
            "order": flow.order,
        }
        
        if flow.estimatedDurationMinutes:
            args["estimatedDurationMinutes"] = flow.estimatedDurationMinutes
            
        if flow.successCriteria:
            args["successCriteria"] = flow.successCriteria
            
        if flow.metadata:
            args["metadata"] = flow.metadata
            
        flow_id = await call_convex_function("flows:create", args)
        
        return {"flowId": flow_id}
        
    except Exception as e:
        logger.error(f"Failed to create flow: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create flow: {str(e)}")

@router.post("/sample-data")
async def create_sample_data(request: SampleDataRequest):
    """Create sample data for testing the application."""
    try:
        created_data = {
            "testRuns": [],
            "flows": []
        }
        
        # Sample test run templates
        test_run_templates = [
            {
                "name": "E-commerce Checkout Flow",
                "description": "Test the complete checkout process on an e-commerce site",
                "prompt": "Test adding items to cart, proceeding to checkout, filling payment info, and completing purchase",
                "metadata": {
                    "priority": "high",
                    "tags": ["e-commerce", "checkout", "payment"],
                    "environment": "staging"
                }
            },
            {
                "name": "User Registration & Login",
                "description": "Test user authentication flows",
                "prompt": "Test user registration with email verification and subsequent login",
                "metadata": {
                    "priority": "normal",
                    "tags": ["auth", "registration", "login"],
                    "environment": "development"
                }
            },
            {
                "name": "Search & Navigation",
                "description": "Test search functionality and site navigation",
                "prompt": "Test search bar functionality, filters, and navigation between pages",
                "metadata": {
                    "priority": "low",
                    "tags": ["search", "navigation", "ui"],
                    "environment": "staging"
                }
            }
        ]
        
        # Create test runs
        for i in range(min(request.testRuns, len(test_run_templates))):
            template = test_run_templates[i]
            
            test_run_id = await call_convex_function("testRuns:create", {
                "name": template["name"],
                "description": template["description"],
                "prompt": template["prompt"],
                "metadata": template["metadata"]
            })
            
            created_data["testRuns"].append({
                "id": test_run_id,
                "name": template["name"]
            })
            
            # Create flows for this test run
            flow_templates = [
                {
                    "name": f"Flow 1 for {template['name']}",
                    "description": f"First testing scenario for {template['name']}",
                    "instructions": f"Navigate to the main page and perform the primary action for {template['name']}",
                    "metadata": {
                        "difficulty": "easy",
                        "category": "primary",
                        "expectedSteps": 5
                    }
                },
                {
                    "name": f"Flow 2 for {template['name']}",
                    "description": f"Secondary testing scenario for {template['name']}",
                    "instructions": f"Test edge cases and error handling for {template['name']}",
                    "metadata": {
                        "difficulty": "medium",
                        "category": "edge-case",
                        "expectedSteps": 8
                    }
                }
            ]
            
            for j in range(min(request.flowsPerRun, len(flow_templates))):
                flow_template = flow_templates[j]
                
                flow_id = await call_convex_function("flows:create", {
                    "testRunId": test_run_id,
                    "name": flow_template["name"],
                    "description": flow_template["description"],
                    "instructions": flow_template["instructions"],
                    "order": j + 1,
                    "estimatedDurationMinutes": 5 + (j * 3),
                    "successCriteria": [
                        "Page loads successfully",
                        "No console errors",
                        "Expected elements are present"
                    ],
                    "metadata": flow_template["metadata"]
                })
                
                created_data["flows"].append({
                    "id": flow_id,
                    "name": flow_template["name"],
                    "testRunId": test_run_id
                })
        
        return {
            "message": f"Created {len(created_data['testRuns'])} test runs and {len(created_data['flows'])} flows",
            "data": created_data
        }
        
    except Exception as e:
        logger.error(f"Failed to create sample data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create sample data: {str(e)}")

@router.get("/stats")
async def get_admin_stats():
    """Get comprehensive statistics for the admin dashboard."""
    try:
        # Get test run stats
        test_run_stats = await call_convex_function("testRuns:getStats", {})
        
        return {
            "testRuns": test_run_stats,
            "timestamp": datetime.now().isoformat(),
            "convexUrl": config.convex.deployment_url,
        }
        
    except Exception as e:
        logger.error(f"Failed to get admin stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get admin stats: {str(e)}")

@router.delete("/test-runs/{test_run_id}")
async def delete_test_run(test_run_id: str):
    """Delete a test run and all its related data."""
    try:
        await call_convex_function("testRuns:remove", {"testRunId": test_run_id})
        
        return {"message": "Test run deleted successfully"}
        
    except Exception as e:
        logger.error(f"Failed to delete test run: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete test run: {str(e)}")

@router.delete("/flows/{flow_id}")
async def delete_flow(flow_id: str):
    """Delete a specific flow."""
    try:
        await call_convex_function("flows:remove", {"flowId": flow_id})
        
        return {"message": "Flow deleted successfully"}
        
    except Exception as e:
        logger.error(f"Failed to delete flow: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete flow: {str(e)}")
