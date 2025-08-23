"""
Main FastAPI application for AI Browser Testing Agent Backend

This is the entry point that brings together all modules and services.
"""

import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from .config import settings
from .routes import core, llm, browser

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format=settings.LOG_FORMAT,
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(settings.LOG_FILE)
    ]
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION
)

# ==================== MIDDLEWARE ====================

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
    **settings.get_cors_config()
)

# ==================== ROUTE REGISTRATION ====================

# Include all route modules
app.include_router(core.router, tags=["core"])
app.include_router(llm.router, tags=["llm"])
app.include_router(browser.router, tags=["browser"])

# ==================== STARTUP EVENTS ====================

@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info("AI Browser Testing Agent API starting up...")
    logger.info(f"API Title: {settings.API_TITLE}")
    logger.info(f"API Version: {settings.API_VERSION}")
    logger.info(f"LLM Service: {'Enabled' if settings.is_gemini_enabled() else 'Disabled'}")
    logger.info(f"Browser Use Cloud: {'Enabled' if settings.is_browser_use_enabled() else 'Disabled'}")
    logger.info("Application startup completed successfully!")

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    logger.info("AI Browser Testing Agent API shutting down...")

# ==================== MAIN ENTRY POINT ====================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True
    )