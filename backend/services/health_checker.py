"""
Health checker service for external dependencies.
Tests connectivity and functionality of OpenAI, Browser Use Cloud, and Convex.
"""

import asyncio
import aiohttp
import openai
from datetime import datetime
from typing import Dict, Any, Optional
from enum import Enum
from pydantic import BaseModel
import time
import logging

from backend.config import config

logger = logging.getLogger(__name__)

class HealthStatus(str, Enum):
    """Health status enumeration."""
    HEALTHY = "healthy"
    UNHEALTHY = "unhealthy" 
    DEGRADED = "degraded"
    UNKNOWN = "unknown"

class ServiceHealth(BaseModel):
    """Service health status model."""
    service: str
    status: HealthStatus
    message: str
    response_time_ms: Optional[float] = None
    last_checked: datetime
    details: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class HealthChecker:
    """Comprehensive health checker for all external services."""
    
    def __init__(self):
        self.openai_client = openai.OpenAI(api_key=config.openai.api_key) if config.openai.api_key else None
        self.session_timeout = aiohttp.ClientTimeout(total=config.health_check_timeout)
    
    async def check_openai_health(self) -> ServiceHealth:
        """Check OpenAI API health and connectivity."""
        start_time = time.time()
        
        try:
            if not self.openai_client:
                return ServiceHealth(
                    service="openai",
                    status=HealthStatus.UNHEALTHY,
                    message="OpenAI API key not configured",
                    last_checked=datetime.now(),
                    error="Missing API key"
                )
            
            # Test with a simple completion request
            response = await asyncio.to_thread(
                self.openai_client.chat.completions.create,
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=5
            )
            
            response_time = (time.time() - start_time) * 1000
            
            return ServiceHealth(
                service="openai",
                status=HealthStatus.HEALTHY,
                message="OpenAI API is accessible and responding",
                response_time_ms=response_time,
                last_checked=datetime.now(),
                details={
                    "model": response.model,
                    "usage": {
                        "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                        "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                        "total_tokens": response.usage.total_tokens if response.usage else 0
                    }
                }
            )
            
        except openai.AuthenticationError:
            return ServiceHealth(
                service="openai",
                status=HealthStatus.UNHEALTHY,
                message="OpenAI authentication failed",
                response_time_ms=(time.time() - start_time) * 1000,
                last_checked=datetime.now(),
                error="Invalid API key"
            )
        except openai.RateLimitError:
            return ServiceHealth(
                service="openai",
                status=HealthStatus.DEGRADED,
                message="OpenAI rate limit exceeded",
                response_time_ms=(time.time() - start_time) * 1000,
                last_checked=datetime.now(),
                error="Rate limit exceeded"
            )
        except Exception as e:
            return ServiceHealth(
                service="openai",
                status=HealthStatus.UNHEALTHY,
                message="OpenAI API request failed",
                response_time_ms=(time.time() - start_time) * 1000,
                last_checked=datetime.now(),
                error=str(e)
            )
    
    async def check_browser_use_health(self) -> ServiceHealth:
        """Check Browser Use Cloud API health and connectivity."""
        start_time = time.time()
        
        try:
            if not config.browser_use.api_key:
                return ServiceHealth(
                    service="browser-use-cloud",
                    status=HealthStatus.UNHEALTHY,
                    message="Browser Use Cloud API key not configured",
                    last_checked=datetime.now(),
                    error="Missing API key"
                )
            
            async with aiohttp.ClientSession(timeout=self.session_timeout) as session:
                headers = {
                    "Authorization": f"Bearer {config.browser_use.api_key}",
                    "Content-Type": "application/json"
                }
                
                # Test health endpoint or a simple API call
                async with session.get(
                    f"{config.browser_use.base_url}/ping",
                    headers=headers
                ) as response:
                    response_time = (time.time() - start_time) * 1000
                    
                    if response.status == 200:
                        return ServiceHealth(
                            service="browser-use-cloud",
                            status=HealthStatus.HEALTHY,
                            message="Browser Use Cloud API is accessible",
                            response_time_ms=response_time,
                            last_checked=datetime.now(),
                            details={
                                "status_code": response.status,
                                "base_url": config.browser_use.base_url
                            }
                        )
                    else:
                        return ServiceHealth(
                            service="browser-use-cloud",
                            status=HealthStatus.DEGRADED,
                            message=f"Browser Use Cloud API returned status {response.status}",
                            response_time_ms=response_time,
                            last_checked=datetime.now(),
                            error=f"HTTP {response.status}"
                        )
                        
        except asyncio.TimeoutError:
            return ServiceHealth(
                service="browser-use-cloud",
                status=HealthStatus.UNHEALTHY,
                message="Browser Use Cloud API request timed out",
                response_time_ms=(time.time() - start_time) * 1000,
                last_checked=datetime.now(),
                error="Request timeout"
            )
        except Exception as e:
            return ServiceHealth(
                service="browser-use-cloud",
                status=HealthStatus.UNHEALTHY,
                message="Browser Use Cloud API request failed",
                response_time_ms=(time.time() - start_time) * 1000,
                last_checked=datetime.now(),
                error=str(e)
            )
    
    async def check_convex_health(self) -> ServiceHealth:
        """Check Convex database health and connectivity."""
        start_time = time.time()
        
        try:
            if not config.convex.deployment_url:
                return ServiceHealth(
                    service="convex",
                    status=HealthStatus.UNHEALTHY,
                    message="Convex deployment URL not configured",
                    last_checked=datetime.now(),
                    error="Missing deployment URL"
                )
            
            async with aiohttp.ClientSession(timeout=self.session_timeout) as session:
                # Test Convex HTTP endpoint
                async with session.get(config.convex.deployment_url) as response:
                    response_time = (time.time() - start_time) * 1000
                    
                    if response.status == 200:
                        return ServiceHealth(
                            service="convex",
                            status=HealthStatus.HEALTHY,
                            message="Convex database is accessible",
                            response_time_ms=response_time,
                            last_checked=datetime.now(),
                            details={
                                "status_code": response.status,
                                "deployment_url": config.convex.deployment_url
                            }
                        )
                    else:
                        return ServiceHealth(
                            service="convex",
                            status=HealthStatus.DEGRADED,
                            message=f"Convex returned status {response.status}",
                            response_time_ms=response_time,
                            last_checked=datetime.now(),
                            error=f"HTTP {response.status}"
                        )
                        
        except asyncio.TimeoutError:
            return ServiceHealth(
                service="convex",
                status=HealthStatus.UNHEALTHY,
                message="Convex database request timed out",
                response_time_ms=(time.time() - start_time) * 1000,
                last_checked=datetime.now(),
                error="Request timeout"
            )
        except Exception as e:
            return ServiceHealth(
                service="convex",
                status=HealthStatus.UNHEALTHY,
                message="Convex database request failed",
                response_time_ms=(time.time() - start_time) * 1000,
                last_checked=datetime.now(),
                error=str(e)
            )
    
    async def check_fastapi_health(self) -> ServiceHealth:
        """Check FastAPI server internal health."""
        return ServiceHealth(
            service="fastapi",
            status=HealthStatus.HEALTHY,
            message="FastAPI server is running",
            response_time_ms=0.1,
            last_checked=datetime.now(),
            details={
                "version": "1.0.0",
                "debug": config.debug,
                "cors_origins": config.cors_origins
            }
        )
    
    async def check_all_services(self) -> Dict[str, ServiceHealth]:
        """Check health of all external services concurrently."""
        logger.info("Starting comprehensive health check for all services")
        
        # Run all health checks concurrently
        health_checks = await asyncio.gather(
            self.check_fastapi_health(),
            self.check_openai_health(),
            self.check_browser_use_health(),
            self.check_convex_health(),
            return_exceptions=True
        )
        
        results = {}
        service_names = ["fastapi", "openai", "browser-use-cloud", "convex"]
        
        for i, result in enumerate(health_checks):
            service_name = service_names[i]
            
            if isinstance(result, Exception):
                results[service_name] = ServiceHealth(
                    service=service_name,
                    status=HealthStatus.UNHEALTHY,
                    message=f"Health check failed with exception",
                    last_checked=datetime.now(),
                    error=str(result)
                )
            else:
                results[service_name] = result
        
        # Log summary
        healthy_services = sum(1 for health in results.values() if health.status == HealthStatus.HEALTHY)
        total_services = len(results)
        
        logger.info(f"Health check completed: {healthy_services}/{total_services} services healthy")
        
        return results
    
    async def get_overall_health_status(self) -> Dict[str, Any]:
        """Get overall system health status with summary."""
        service_health = await self.check_all_services()
        
        # Calculate overall status
        statuses = [health.status for health in service_health.values()]
        
        if all(status == HealthStatus.HEALTHY for status in statuses):
            overall_status = HealthStatus.HEALTHY
            overall_message = "All services are healthy"
        elif any(status == HealthStatus.UNHEALTHY for status in statuses):
            overall_status = HealthStatus.UNHEALTHY
            unhealthy_count = sum(1 for status in statuses if status == HealthStatus.UNHEALTHY)
            overall_message = f"{unhealthy_count} service(s) are unhealthy"
        elif any(status == HealthStatus.DEGRADED for status in statuses):
            overall_status = HealthStatus.DEGRADED
            degraded_count = sum(1 for status in statuses if status == HealthStatus.DEGRADED)
            overall_message = f"{degraded_count} service(s) are degraded"
        else:
            overall_status = HealthStatus.UNKNOWN
            overall_message = "Unable to determine overall health status"
        
        return {
            "overall_status": overall_status,
            "overall_message": overall_message,
            "timestamp": datetime.now().isoformat(),
            "services": {name: health.dict() for name, health in service_health.items()},
            "summary": {
                "total_services": len(service_health),
                "healthy": sum(1 for h in service_health.values() if h.status == HealthStatus.HEALTHY),
                "degraded": sum(1 for h in service_health.values() if h.status == HealthStatus.DEGRADED),
                "unhealthy": sum(1 for h in service_health.values() if h.status == HealthStatus.UNHEALTHY),
                "unknown": sum(1 for h in service_health.values() if h.status == HealthStatus.UNKNOWN)
            }
        }

# Create global health checker instance
health_checker = HealthChecker()
