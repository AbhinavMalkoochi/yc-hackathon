"""
Configuration module for AI Browser Testing Agent Backend

Centralizes all environment variables, API keys, and configuration settings.
"""

import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    """Application settings and configuration"""
    
    # API Configuration
    API_TITLE = "AI Browser Testing Agent API"
    API_VERSION = "1.0.0"
    API_HOST = "0.0.0.0"
    API_PORT = 8000
    
    # CORS Configuration
    CORS_ORIGINS = ["http://localhost:3000"]
    CORS_CREDENTIALS = True
    CORS_METHODS = ["*"]
    CORS_HEADERS = ["*"]
    
    # Logging Configuration
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_FILE = 'backend.log'
    
    # API Keys
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "")
    BROWSER_USE_API_KEY: Optional[str] = os.getenv("BROWSER_USE_API_KEY", "")
    
    # LLM Configuration
    GEMINI_MODEL = "gemini-2.0-flash-001"
    DEFAULT_FLOW_COUNT = 5
    
    # Browser Configuration
    DEFAULT_BROWSER_HEADLESS = True
    DEFAULT_BROWSER_VIEWPORT = {'width': 1280, 'height': 720}
    
    # Streaming Configuration
    STREAM_UPDATE_INTERVAL = 2  # seconds
    MAX_STREAM_MESSAGES = 50
    
    # Task Configuration
    BROWSER_USE_API_BASE_URL = "https://api.browser-use.com/api/v1"
    
    @classmethod
    def is_gemini_enabled(cls) -> bool:
        """Check if Gemini LLM is available"""
        return bool(cls.GEMINI_API_KEY)
    
    @classmethod
    def is_browser_use_enabled(cls) -> bool:
        """Check if Browser Use Cloud is available"""
        return bool(cls.BROWSER_USE_API_KEY)
    
    @classmethod
    def get_cors_config(cls) -> dict:
        """Get CORS configuration dictionary"""
        return {
            "allow_origins": cls.CORS_ORIGINS,
            "allow_credentials": cls.CORS_CREDENTIALS,
            "allow_methods": cls.CORS_METHODS,
            "allow_headers": cls.CORS_HEADERS,
        }

# Global settings instance
settings = Settings()
