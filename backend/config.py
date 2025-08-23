"""
Configuration management for the YC Agent Backend.
Handles environment variables and provides configuration validation.
"""

import os
from typing import Optional
from pydantic import BaseModel, Field, validator
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class OpenAIConfig(BaseModel):
    """OpenAI API configuration."""
    api_key: str = Field(..., description="OpenAI API key")
    model: str = Field(default="gpt-4", description="Default OpenAI model")
    max_tokens: int = Field(default=1000, description="Maximum tokens per request")
    temperature: float = Field(default=0.7, description="Model temperature")
    
    @validator('api_key')
    def validate_api_key(cls, v):
        if not v or not v.startswith('sk-'):
            raise ValueError('Invalid OpenAI API key format')
        return v

class BrowserUseConfig(BaseModel):
    """Browser Use Cloud configuration."""
    api_key: Optional[str] = Field(None, description="Browser Use Cloud API key")
    base_url: str = Field(default="https://api.browser-use.com/api/v1", description="Browser Use API base URL")
    timeout: int = Field(default=30, description="Request timeout in seconds")
    max_sessions: int = Field(default=5, description="Maximum concurrent browser sessions")
    
    @validator('api_key')
    def validate_api_key(cls, v):
        if v and not v.strip():
            raise ValueError('Browser Use API key cannot be empty')
        return v

class ConvexConfig(BaseModel):
    """Convex database configuration."""
    deployment_url: str = Field(..., description="Convex deployment URL")
    
    @validator('deployment_url')
    def validate_deployment_url(cls, v):
        if not v or not v.startswith('https://'):
            raise ValueError('Invalid Convex deployment URL')
        return v

class WebSocketConfig(BaseModel):
    """WebSocket configuration."""
    host: str = Field(default="localhost", description="WebSocket host")
    port: int = Field(default=8001, description="WebSocket port")
    max_connections: int = Field(default=100, description="Maximum WebSocket connections")

class DatabaseConfig(BaseModel):
    """Database configuration for health monitoring."""
    connection_timeout: int = Field(default=5, description="Database connection timeout")
    query_timeout: int = Field(default=10, description="Database query timeout")

class AppConfig(BaseModel):
    """Main application configuration."""
    # FastAPI settings
    debug: bool = Field(default=False, description="Debug mode")
    cors_origins: list[str] = Field(default=["http://localhost:3000"], description="CORS allowed origins")
    
    # External service configurations
    openai: OpenAIConfig
    browser_use: BrowserUseConfig
    convex: ConvexConfig
    websocket: WebSocketConfig
    database: DatabaseConfig
    
    # Health check settings
    health_check_interval: int = Field(default=30, description="Health check interval in seconds")
    health_check_timeout: int = Field(default=10, description="Health check timeout in seconds")
    
    # Logging
    log_level: str = Field(default="INFO", description="Logging level")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

def load_config() -> AppConfig:
    """Load and validate application configuration from environment variables."""
    try:
        # Create configuration from environment variables
        config_data = {
            "debug": os.getenv("DEBUG", "false").lower() == "true",
            "cors_origins": [
                origin.strip() 
                for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
            ],
            "openai": {
                "api_key": os.getenv("OPENAI_API_KEY", ""),
                "model": os.getenv("OPENAI_MODEL", "gpt-4"),
                "max_tokens": int(os.getenv("OPENAI_MAX_TOKENS", "1000")),
                "temperature": float(os.getenv("OPENAI_TEMPERATURE", "0.7")),
            },
            "browser_use": {
                "api_key": os.getenv("BROWSER_USE_API_KEY"),
                "base_url": os.getenv("BROWSER_USE_BASE_URL", "https://api.browser-use.com/api/v1"),
                "timeout": int(os.getenv("BROWSER_USE_TIMEOUT", "30")),
                "max_sessions": int(os.getenv("BROWSER_USE_MAX_SESSIONS", "5")),
            },
            "convex": {
                "deployment_url": os.getenv("CONVEX_URL", ""),
            },
            "websocket": {
                "host": os.getenv("WEBSOCKET_HOST", "localhost"),
                "port": int(os.getenv("WEBSOCKET_PORT", "8001")),
                "max_connections": int(os.getenv("WEBSOCKET_MAX_CONNECTIONS", "100")),
            },
            "database": {
                "connection_timeout": int(os.getenv("DB_CONNECTION_TIMEOUT", "5")),
                "query_timeout": int(os.getenv("DB_QUERY_TIMEOUT", "10")),
            },
            "health_check_interval": int(os.getenv("HEALTH_CHECK_INTERVAL", "30")),
            "health_check_timeout": int(os.getenv("HEALTH_CHECK_TIMEOUT", "10")),
            "log_level": os.getenv("LOG_LEVEL", "INFO").upper(),
        }
        
        return AppConfig(**config_data)
    
    except Exception as e:
        raise ValueError(f"Configuration validation failed: {str(e)}")

def get_config() -> AppConfig:
    """Get the application configuration singleton."""
    if not hasattr(get_config, '_config'):
        get_config._config = load_config()
    return get_config._config

# Create global config instance
config = get_config()

# Export commonly used configuration values
OPENAI_API_KEY = config.openai.api_key
BROWSER_USE_API_KEY = config.browser_use.api_key
CONVEX_URL = config.convex.deployment_url
DEBUG = config.debug
