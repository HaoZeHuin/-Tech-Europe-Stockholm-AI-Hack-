from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import httpx
import os
import time
from dotenv import load_dotenv
from typing import Dict, Any, Optional
import asyncio
import json

# Import our shared contracts and prompts
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))

from shared.contracts import (
    ToolExecutionRequest, ToolExecutionResponse, ServiceResponse,
    ToolCategories
)
from shared.prompts import JARVIS_CORE_PERSONALITY, VOICE_INTERACTION_PROMPT, CHAT_INTERACTION_PROMPT

load_dotenv()

app = FastAPI(
    title="Jarvis Gateway Service",
    description="Main API gateway for Jarvis - routes requests to appropriate services",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service URLs
N8N_SERVICE_URL = os.getenv("N8N_SERVICE_URL", "http://localhost:8001")
RAG_SERVICE_URL = os.getenv("RAG_SERVICE_URL", "http://localhost:8002")

# =============================================================================
# HEALTH CHECK
# =============================================================================

@app.get("/api/health")
async def health_check():
    """Health check endpoint with service status"""
    services_status = {}
    
    # Check n8n service
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{N8N_SERVICE_URL}/health")
            services_status["n8n_service"] = "healthy" if response.status_code == 200 else "unhealthy"
    except:
        services_status["n8n_service"] = "unreachable"
    
    # Check RAG service
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{RAG_SERVICE_URL}/health")
            services_status["rag_service"] = "healthy" if response.status_code == 200 else "unhealthy"
    except:
        services_status["rag_service"] = "unreachable"
    
    return {
        "status": "healthy",
        "version": "1.0.0",
        "services": services_status,
        "environment": os.getenv("ENVIRONMENT", "development")
    }

# =============================================================================
# TOOL ROUTING
# =============================================================================

class ToolRouter:
    """Routes tool requests to appropriate services"""
    
    @staticmethod
    def get_service_for_tool(tool_name: str) -> str:
        """Determine which service should handle the tool"""
        if tool_name in ToolCategories.RAG_TOOLS:
            return "rag"
        elif tool_name in ToolCategories.N8N_WORKFLOWS:
            return "n8n"
        elif tool_name in ToolCategories.DIRECT:
            return "direct"
        else:
            raise ValueError(f"Unknown tool: {tool_name}")
    
    @staticmethod
    async def execute_direct_tool(tool_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute tools directly in the gateway"""
        if tool_name == "weather_lookup":
            return await ToolRouter._weather_lookup(parameters)
        elif tool_name == "maps_link":
            return await ToolRouter._maps_link(parameters)
        elif tool_name == "note_append":
            return await ToolRouter._note_append(parameters)
        else:
            raise ValueError(f"Unknown direct tool: {tool_name}")
    
    @staticmethod
    async def _weather_lookup(params: Dict[str, Any]) -> Dict[str, Any]:
        """Simple weather lookup implementation"""
        # This would integrate with a weather API
        location = params.get("location", "Unknown")
        include_forecast = params.get("include_forecast", False)
        
        # Mock response for now
        result = {
            "location": location,
            "current": {
                "temperature": 22.0,
                "condition": "Partly cloudy",
                "humidity": 65.0,
                "wind_speed": 8.5
            }
        }
        
        if include_forecast:
            result["forecast"] = [
                {"date": "2024-09-14", "high": 25.0, "low": 18.0, "condition": "Sunny"},
                {"date": "2024-09-15", "high": 23.0, "low": 16.0, "condition": "Cloudy"}
            ]
        
        return result
    
    @staticmethod
    async def _maps_link(params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate Google Maps link"""
        destination = params.get("destination", "")
        origin = params.get("origin", "")
        mode = params.get("mode", "driving")
        
        # Build Google Maps URL
        base_url = "https://www.google.com/maps/dir/"
        if origin:
            url = f"{base_url}{origin}/{destination}"
        else:
            url = f"{base_url}/{destination}"
        
        # Add travel mode
        mode_map = {
            "driving": "&dirflg=d",
            "walking": "&dirflg=w",
            "transit": "&dirflg=r",
            "bicycling": "&dirflg=b"
        }
        url += mode_map.get(mode, "&dirflg=d")
        
        return {
            "google_maps_url": url,
            "estimated_duration": "15 minutes",  # Mock data
            "estimated_distance": "5.2 km"
        }
    
    @staticmethod
    async def _note_append(params: Dict[str, Any]) -> Dict[str, Any]:
        """Append content to a note file"""
        path = params.get("path", "")
        markdown = params.get("markdown", "")
        section = params.get("section")
        
        # This would implement actual file writing
        # For now, return a mock response
        return {
            "success": True,
            "path": path,
            "bytes_written": len(markdown),
            "message": f"Successfully appended {len(markdown)} characters to {path}"
        }

@app.post("/api/tools/{tool_name}")
async def execute_tool(tool_name: str, request: ToolExecutionRequest):
    """Execute a tool by routing to appropriate service"""
    start_time = time.time()
    
    try:
        service = ToolRouter.get_service_for_tool(tool_name)
        
        if service == "direct":
            result = await ToolRouter.execute_direct_tool(tool_name, request.parameters)
            service_used = "direct"
            
        elif service == "rag":
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{RAG_SERVICE_URL}/tools/{tool_name}",
                    json=request.dict()
                )
                if response.status_code != 200:
                    raise HTTPException(status_code=response.status_code, detail="RAG service error")
                result = response.json()
                service_used = "rag"
                
        elif service == "n8n":
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{N8N_SERVICE_URL}/tools/{tool_name}",
                    json=request.dict()
                )
                if response.status_code != 200:
                    raise HTTPException(status_code=response.status_code, detail="n8n service error")
                result = response.json()
                service_used = "n8n"
        
        execution_time = int((time.time() - start_time) * 1000)
        
        return ToolExecutionResponse(
            success=True,
            result=result,
            execution_time_ms=execution_time,
            service_used=service_used
        )
        
    except Exception as e:
        execution_time = int((time.time() - start_time) * 1000)
        return ToolExecutionResponse(
            success=False,
            error=str(e),
            execution_time_ms=execution_time,
            service_used="gateway"
        )

# =============================================================================
# CHAT INTERFACE
# =============================================================================

from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str
    stream: bool = False
    conversation_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    response: str
    conversation_id: Optional[str] = None
    tools_used: Optional[list] = None
    execution_time_ms: int

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Main chat endpoint - integrates with OpenAI and tools"""
    start_time = time.time()
    
    try:
        # This would integrate with OpenAI API
        # For now, return a simple response
        response_text = f"I received your message: '{request.message}'. This is a placeholder response from the Python gateway."
        
        execution_time = int((time.time() - start_time) * 1000)
        
        if request.stream:
            # For streaming responses
            async def generate():
                words = response_text.split()
                for i, word in enumerate(words):
                    chunk = {
                        "delta": word + " ",
                        "conversation_id": request.conversation_id,
                        "done": i == len(words) - 1
                    }
                    yield f"data: {json.dumps(chunk)}\\n\\n"
                    await asyncio.sleep(0.1)  # Simulate streaming delay
            
            return StreamingResponse(generate(), media_type="text/plain")
        else:
            return ChatResponse(
                response=response_text,
                conversation_id=request.conversation_id,
                execution_time_ms=execution_time
            )
            
    except Exception as e:
        execution_time = int((time.time() - start_time) * 1000)
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

# =============================================================================
# SYSTEM PROMPTS ENDPOINT
# =============================================================================

@app.get("/api/prompts/{prompt_type}")
async def get_system_prompt(prompt_type: str):
    """Get system prompts for different interaction modes"""
    prompts = {
        "core": JARVIS_CORE_PERSONALITY,
        "voice": VOICE_INTERACTION_PROMPT,
        "chat": CHAT_INTERACTION_PROMPT
    }
    
    if prompt_type not in prompts:
        raise HTTPException(status_code=404, detail="Prompt type not found")
    
    return {"prompt": prompts[prompt_type]}

# =============================================================================
# ERROR HANDLING
# =============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "3001")),
        reload=True
    )
