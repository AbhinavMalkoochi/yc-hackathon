from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import logging
from datetime import datetime
from typing import Dict, Any

from backend.config import config
from backend.services.health_checker import health_checker, HealthStatus
from backend.routers.admin import router as admin_router

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="YC Agent API", 
    version="1.0.0",
    description="AI Browser Testing Orchestrator Backend API",
    debug=config.debug
)

# Enable CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(admin_router)

class MessageResponse(BaseModel):
    message: str
    status: str
    timestamp: str

class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: str
    details: Dict[str, Any] = {}

class ServiceHealthResponse(BaseModel):
    service: str
    status: str
    message: str
    response_time_ms: float = None
    last_checked: str
    details: Dict[str, Any] = {}
    error: str = None

@app.get("/")
async def root():
    """Root endpoint returning basic server information."""
    return {
        "message": "YC Agent API is running!",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "debug": config.debug
    }

@app.get("/api/message", response_model=MessageResponse)
async def get_message():
    """Basic message endpoint for testing connectivity."""
    return MessageResponse(
        message="Hello from FastAPI backend!",
        status="success",
        timestamp=datetime.now().isoformat()
    )

@app.get("/health", response_model=HealthResponse)
async def basic_health_check():
    """Basic health check for the FastAPI server itself."""
    return HealthResponse(
        status="healthy",
        service="fastapi-backend",
        timestamp=datetime.now().isoformat(),
        details={
            "version": "1.0.0",
            "debug": config.debug,
            "uptime": "running"
        }
    )

@app.get("/api/health/openai", response_model=ServiceHealthResponse)
async def check_openai_health():
    """Test OpenAI API connection and functionality."""
    try:
        health = await health_checker.check_openai_health()
        return ServiceHealthResponse(
            service=health.service,
            status=health.status.value,
            message=health.message,
            response_time_ms=health.response_time_ms,
            last_checked=health.last_checked.isoformat(),
            details=health.details or {},
            error=health.error
        )
    except Exception as e:
        logger.error(f"OpenAI health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@app.get("/api/health/browser-use-cloud", response_model=ServiceHealthResponse)
async def check_browser_use_health():
    """Test Browser Use Cloud API connection."""
    try:
        health = await health_checker.check_browser_use_health()
        return ServiceHealthResponse(
            service=health.service,
            status=health.status.value,
            message=health.message,
            response_time_ms=health.response_time_ms,
            last_checked=health.last_checked.isoformat(),
            details=health.details or {},
            error=health.error
        )
    except Exception as e:
        logger.error(f"Browser Use Cloud health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@app.get("/api/health/convex", response_model=ServiceHealthResponse)
async def check_convex_health():
    """Test Convex database connection."""
    try:
        health = await health_checker.check_convex_health()
        return ServiceHealthResponse(
            service=health.service,
            status=health.status.value,
            message=health.message,
            response_time_ms=health.response_time_ms,
            last_checked=health.last_checked.isoformat(),
            details=health.details or {},
            error=health.error
        )
    except Exception as e:
        logger.error(f"Convex health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@app.get("/api/health/all")
async def check_all_services_health():
    """Comprehensive health check for all external services."""
    try:
        overall_health = await health_checker.get_overall_health_status()
        
        # Set appropriate HTTP status code based on overall health
        if overall_health["overall_status"] == HealthStatus.UNHEALTHY:
            status_code = 503  # Service Unavailable
        elif overall_health["overall_status"] == HealthStatus.DEGRADED:
            status_code = 206  # Partial Content
        else:
            status_code = 200  # OK
        
        # Log health check summary
        logger.info(f"Overall health check: {overall_health['overall_status']} - {overall_health['overall_message']}")
        
        return overall_health
        
    except Exception as e:
        logger.error(f"Comprehensive health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@app.get("/api/config/status")
async def get_configuration_status():
    """Get configuration validation status and environment info."""
    try:
        env_status = {
            "openai_configured": bool(config.openai.api_key),
            "browser_use_configured": bool(config.browser_use.api_key),
            "convex_configured": bool(config.convex.deployment_url),
            "debug_mode": config.debug,
            "log_level": config.log_level,
            "cors_origins": config.cors_origins,
            "health_check_interval": config.health_check_interval,
            "websocket_config": {
                "host": config.websocket.host,
                "port": config.websocket.port,
                "max_connections": config.websocket.max_connections
            }
        }
        
        # Count configured services
        configured_services = sum([
            env_status["openai_configured"],
            env_status["browser_use_configured"], 
            env_status["convex_configured"]
        ])
        
        return {
            "status": "configured" if configured_services >= 2 else "incomplete",
            "configured_services": configured_services,
            "total_services": 3,
            "timestamp": datetime.now().isoformat(),
            "environment": env_status,
            "warnings": [
                "OpenAI API key not configured" if not env_status["openai_configured"] else None,
                "Browser Use API key not configured" if not env_status["browser_use_configured"] else None,
                "Convex deployment URL not configured" if not env_status["convex_configured"] else None
            ]
        }
        
    except Exception as e:
        logger.error(f"Configuration status check failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Configuration check failed: {str(e)}")

if __name__ == "__main__":
    logger.info("Starting YC Agent FastAPI server...")
    logger.info(f"Debug mode: {config.debug}")
    logger.info(f"CORS origins: {config.cors_origins}")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level=config.log_level.lower(),
        reload=config.debug
    )

