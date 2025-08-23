"""
Browser Use Service for AI Browser Testing Agent

This module provides browser automation capabilities using the Browser Use library.
It handles single browser sessions, basic automation actions, and session management.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
from pathlib import Path

try:
    from browser_use import Agent, BrowserSession, BrowserProfile
    from browser_use.llm import ChatOpenAI
    BROWSER_USE_AVAILABLE = True
except ImportError as e:
    BROWSER_USE_AVAILABLE = False
    Agent = None
    BrowserSession = None
    BrowserProfile = None
    ChatOpenAI = None
    print(f"Browser Use not available: {e}")

logger = logging.getLogger(__name__)

class BrowserManager:
    """Manages browser sessions and automation tasks"""
    
    def __init__(self):
        self.active_agents: Dict[str, Agent] = {}
        self.session_logs: Dict[str, List[Dict[str, Any]]] = {}
        
    async def create_session(self, session_id: str, headless: bool = True) -> Dict[str, Any]:
        """Create a new browser agent session"""
        if not BROWSER_USE_AVAILABLE:
            raise RuntimeError("Browser Use library is not available")
            
        try:
            # Create browser profile with basic settings
            browser_profile = BrowserProfile(
                headless=headless,
                viewport={'width': 1280, 'height': 720},
                user_data_dir=None,  # Ephemeral session
            )
            
            # Create an Agent with a simple task for session initialization
            agent = Agent(
                task="Initialize browser session and wait for commands",
                browser_profile=browser_profile
            )
            
            # Store agent
            self.active_agents[session_id] = agent
            self.session_logs[session_id] = []
            
            # Log session creation
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "action": "session_created",
                "session_id": session_id,
                "status": "success",
                "details": {
                    "headless": headless,
                    "viewport": browser_profile.viewport,
                }
            }
            self.session_logs[session_id].append(log_entry)
            
            logger.info(f"Browser agent session created: {session_id}")
            
            return {
                "session_id": session_id,
                "status": "created",
                "details": log_entry["details"]
            }
            
        except Exception as e:
            logger.error(f"Failed to create browser session {session_id}: {e}")
            raise RuntimeError(f"Failed to create browser session: {e}")
    
    async def navigate_to_url(self, session_id: str, url: str) -> Dict[str, Any]:
        """Navigate browser session to a specific URL"""
        if session_id not in self.active_agents:
            raise ValueError(f"Browser session {session_id} not found")
        
        try:
            agent = self.active_agents[session_id]
            
            # Create a new agent for navigation task
            navigation_agent = Agent(
                task=f"Navigate to {url} and wait for the page to load",
                browser_session=agent.browser_session
            )
            
            # Execute the navigation task
            result = await navigation_agent.run()
            
            # Try to get page info from the browser session if available
            current_url = url  # Default to target URL
            title = "Unknown"
            
            if hasattr(agent.browser_session, 'get_current_page_url'):
                try:
                    current_url = agent.browser_session.get_current_page_url()
                except:
                    pass
                    
            if hasattr(agent.browser_session, 'get_current_page_title'):
                try:
                    title = agent.browser_session.get_current_page_title()
                except:
                    pass
            
            # Log navigation
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "action": "navigate",
                "session_id": session_id,
                "status": "success",
                "details": {
                    "target_url": url,
                    "final_url": current_url,
                    "page_title": title,
                    "agent_result": str(result) if result else None
                }
            }
            self.session_logs[session_id].append(log_entry)
            
            logger.info(f"Navigation successful: {session_id} -> {url}")
            
            return {
                "session_id": session_id,
                "action": "navigate",
                "status": "success",
                "details": log_entry["details"]
            }
            
        except Exception as e:
            logger.error(f"Navigation failed for session {session_id}: {e}")
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "action": "navigate",
                "session_id": session_id,
                "status": "error",
                "error": str(e),
                "details": {"target_url": url}
            }
            self.session_logs[session_id].append(log_entry)
            raise RuntimeError(f"Navigation failed: {e}")
    
    async def click_element(self, session_id: str, selector: str) -> Dict[str, Any]:
        """Click an element on the page"""
        if session_id not in self.active_agents:
            raise ValueError(f"Browser session {session_id} not found")
        
        try:
            agent = self.active_agents[session_id]
            
            # Create a new agent for click task
            click_agent = Agent(
                task=f"Click on the element with selector '{selector}'",
                browser_session=agent.browser_session
            )
            
            # Execute the click task
            result = await click_agent.run()
            
            # Log click action
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "action": "click",
                "session_id": session_id,
                "status": "success",
                "details": {
                    "selector": selector,
                    "agent_result": str(result) if result else None
                }
            }
            self.session_logs[session_id].append(log_entry)
            
            logger.info(f"Click successful: {session_id} -> {selector}")
            
            return {
                "session_id": session_id,
                "action": "click",
                "status": "success",
                "details": log_entry["details"]
            }
            
        except Exception as e:
            logger.error(f"Click failed for session {session_id}: {e}")
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "action": "click",
                "session_id": session_id,
                "status": "error",
                "error": str(e),
                "details": {"selector": selector}
            }
            self.session_logs[session_id].append(log_entry)
            raise RuntimeError(f"Click failed: {e}")
    
    async def type_text(self, session_id: str, selector: str, text: str) -> Dict[str, Any]:
        """Type text into an input element"""
        if session_id not in self.active_agents:
            raise ValueError(f"Browser session {session_id} not found")
        
        try:
            agent = self.active_agents[session_id]
            
            # Create a new agent for typing task
            type_agent = Agent(
                task=f"Type the text '{text}' into the input field with selector '{selector}'",
                browser_session=agent.browser_session
            )
            
            # Execute the typing task
            result = await type_agent.run()
            
            # Log type action
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "action": "type",
                "session_id": session_id,
                "status": "success",
                "details": {
                    "selector": selector,
                    "text_length": len(text),
                    "text_preview": text[:50] + "..." if len(text) > 50 else text,
                    "agent_result": str(result) if result else None
                }
            }
            self.session_logs[session_id].append(log_entry)
            
            logger.info(f"Type successful: {session_id} -> {selector}")
            
            return {
                "session_id": session_id,
                "action": "type",
                "status": "success",
                "details": log_entry["details"]
            }
            
        except Exception as e:
            logger.error(f"Type failed for session {session_id}: {e}")
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "action": "type",
                "session_id": session_id,
                "status": "error",
                "error": str(e),
                "details": {"selector": selector}
            }
            self.session_logs[session_id].append(log_entry)
            raise RuntimeError(f"Type failed: {e}")
    
    async def get_page_info(self, session_id: str) -> Dict[str, Any]:
        """Get information about the current page"""
        if session_id not in self.active_agents:
            raise ValueError(f"Browser session {session_id} not found")
        
        try:
            agent = self.active_agents[session_id]
            
            # Try to get basic page info from browser session
            title = "Unknown"
            url = "Unknown"
            
            if hasattr(agent.browser_session, 'get_current_page_url'):
                try:
                    url = agent.browser_session.get_current_page_url()
                except:
                    pass
                    
            if hasattr(agent.browser_session, 'get_current_page_title'):
                try:
                    title = agent.browser_session.get_current_page_title()
                except:
                    pass
            
            details = {
                "title": title,
                "url": url,
                "browser_session_type": type(agent.browser_session).__name__,
                "available_methods": [m for m in dir(agent.browser_session) if not m.startswith('_')][:10]
            }
            
            # Log page info request
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "action": "get_page_info",
                "session_id": session_id,
                "status": "success",
                "details": details
            }
            self.session_logs[session_id].append(log_entry)
            
            logger.info(f"Page info retrieved: {session_id}")
            
            return {
                "session_id": session_id,
                "action": "get_page_info",
                "status": "success",
                "details": details
            }
            
        except Exception as e:
            logger.error(f"Get page info failed for session {session_id}: {e}")
            raise RuntimeError(f"Get page info failed: {e}")
    
    async def close_session(self, session_id: str) -> Dict[str, Any]:
        """Close and cleanup a browser session"""
        if session_id not in self.active_agents:
            raise ValueError(f"Browser session {session_id} not found")
        
        try:
            agent = self.active_agents[session_id]
            
            # Close the agent and its browser session
            if hasattr(agent, 'close') and callable(agent.close):
                await agent.close()
            
            # Remove from active agents
            del self.active_agents[session_id]
            
            # Log session closure
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "action": "session_closed",
                "session_id": session_id,
                "status": "success",
            }
            self.session_logs[session_id].append(log_entry)
            
            logger.info(f"Browser session closed: {session_id}")
            
            return {
                "session_id": session_id,
                "status": "closed",
                "total_actions": len(self.session_logs[session_id])
            }
            
        except Exception as e:
            logger.error(f"Failed to close browser session {session_id}: {e}")
            raise RuntimeError(f"Failed to close browser session: {e}")
    
    def get_session_logs(self, session_id: str) -> List[Dict[str, Any]]:
        """Get logs for a specific session"""
        return self.session_logs.get(session_id, [])
    
    def get_active_sessions(self) -> List[str]:
        """Get list of active session IDs"""
        return list(self.active_agents.keys())
    
    def get_session_status(self, session_id: str) -> Dict[str, Any]:
        """Get status of a specific session"""
        if session_id not in self.active_agents:
            return {"session_id": session_id, "status": "not_found"}
        
        logs = self.session_logs.get(session_id, [])
        return {
            "session_id": session_id,
            "status": "active",
            "total_actions": len(logs),
            "last_action": logs[-1] if logs else None,
            "created_at": logs[0]["timestamp"] if logs else None,
        }

# Global browser manager instance
browser_manager = BrowserManager()

async def test_browser_basic_functionality() -> Dict[str, Any]:
    """Test basic browser functionality"""
    try:
        session_id = f"test_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Create session
        result = await browser_manager.create_session(session_id, headless=True)
        
        # Navigate to a test page
        await browser_manager.navigate_to_url(session_id, "https://example.com")
        
        # Get page info
        page_info = await browser_manager.get_page_info(session_id)
        
        # Close session
        close_result = await browser_manager.close_session(session_id)
        
        return {
            "test": "basic_browser_functionality",
            "status": "success",
            "session_created": result,
            "page_info": page_info,
            "session_closed": close_result,
            "browser_use_available": BROWSER_USE_AVAILABLE
        }
        
    except Exception as e:
        logger.error(f"Browser test failed: {e}")
        return {
            "test": "basic_browser_functionality",
            "status": "error",
            "error": str(e),
            "browser_use_available": BROWSER_USE_AVAILABLE
        }
