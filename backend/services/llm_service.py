"""
LLM Service for AI Browser Testing Agent Backend

Handles Google Gemini API interactions for test flow generation.
"""

import json
import logging
from typing import List, Optional
from datetime import datetime
from google import genai

from ..config import settings
from ..models import TestFlow

logger = logging.getLogger(__name__)

class LLMService:
    """Service for LLM interactions using Google Gemini"""
    
    def __init__(self):
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Gemini client if API key is available"""
        if settings.is_gemini_enabled():
            try:
                self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
                logger.info("Gemini client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini client: {e}")
                self.client = None
        else:
            logger.warning("GEMINI_API_KEY not provided, LLM features will be disabled")
    
    def is_available(self) -> bool:
        """Check if LLM service is available"""
        return self.client is not None
    
    def create_flow_generation_prompt(
        self, 
        user_prompt: str, 
        website_url: Optional[str] = None, 
        num_flows: int = 5
    ) -> str:
        """Create a natural language prompt for LLM to generate testing flows"""
        
        base_prompt = f"""You are a friendly QA expert helping create browser tests. Generate {num_flows} practical test flows.

USER REQUEST: {user_prompt}

{f"WEBSITE: {website_url}" if website_url else ""}

Create {num_flows} different test scenarios that cover real user behavior and important functionality.

For each test flow, provide:
- name: Clear, descriptive test name (under 50 characters)
- description: What this test validates (under 100 characters)
- instructions: Conversational, natural instructions as if talking to a human assistant

Write instructions like you're giving directions to a helpful person:
- Use casual, friendly language
- Be specific but not overly technical
- Focus on user goals, not technical implementation
- Include what to look for and verify

Example good instruction: "Hey, can you go to the homepage and try logging in with a test account? After you sign in, make sure you can see the main dashboard and that your profile shows up correctly."

Return ONLY valid JSON:
[
  {{
    "name": "User Login Flow",
    "description": "Verify login process and dashboard access",
    "instructions": "Please visit the homepage, look for the login or sign in button, and try logging in with valid credentials. Once you're logged in, check that the dashboard loads properly and shows the user's information."
  }}
]

Focus on realistic user journeys:
- Account access and authentication
- Core feature usage and navigation
- Form submissions and data entry
- Search, filtering, and content discovery
- Error handling and edge cases
- Mobile responsiveness (if applicable)

Make instructions sound natural and conversational, like you're asking a colleague to help test the site."""
        
        return base_prompt
    
    async def generate_flows(
        self, 
        prompt: str, 
        website_url: Optional[str] = None, 
        num_flows: int = 5
    ) -> List[TestFlow]:
        """Generate test flows using Gemini API"""
        if not self.is_available():
            raise ValueError("LLM service not available")
        
        try:
            # Create the prompt
            system_prompt = self.create_flow_generation_prompt(prompt, website_url, num_flows)
            
            # Combine system and user prompts for Gemini
            full_prompt = f"""You are an expert QA automation engineer. Generate test flows as valid JSON.

{system_prompt}"""
            
            # Call Gemini API asynchronously
            response = await self.client.aio.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=full_prompt
            )
            
            # Extract and parse response
            content = response.text
            if not content:
                raise ValueError("Empty response from Gemini")
                
            content = content.strip()
            
            # Clean the response (remove markdown code blocks if present)
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            
            # Parse JSON response
            flows_data = json.loads(content.strip())
            
            # Validate that flows_data is a list
            if not isinstance(flows_data, list):
                raise ValueError("Expected JSON array from LLM response")
            
            # Convert to TestFlow objects
            flows = []
            for flow_data in flows_data:
                if not isinstance(flow_data, dict):
                    continue
                if all(key in flow_data for key in ["name", "description", "instructions"]):
                    flows.append(TestFlow(
                        name=flow_data["name"],
                        description=flow_data["description"], 
                        instructions=flow_data["instructions"]
                    ))
            
            if not flows:
                raise ValueError("No valid flows generated from LLM response")
            
            logger.info(f"Successfully generated {len(flows)} flows from LLM")
            return flows
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}")
            logger.error(f"Raw response: {content if 'content' in locals() else 'No content'}")
            raise ValueError("LLM returned invalid JSON response")
        except Exception as e:
            logger.error(f"Error generating flows with LLM: {e}")
            raise

# Global LLM service instance
llm_service = LLMService()
