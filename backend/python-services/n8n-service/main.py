from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from dotenv import load_dotenv

# Import shared contracts
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))
from shared.contracts import ToolExecutionRequest

from schemas import PromptRequest
from jarvis import Jarvis

load_dotenv()

app = FastAPI(
    title="Jarvis n8n Service",
    description="Python microservice for n8n workflow integration",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

jarvis = Jarvis()

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "n8n-service", 
        "version": "1.0.0"
    }

@app.post("/prompt")
async def prompt(request: PromptRequest):
    """Legacy endpoint - now proxies to Express Gateway for better architecture"""
    try:
        # Proxy to Express Gateway for unified chat handling
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{os.getenv('EXPRESS_GATEWAY_URL', 'http://localhost:3001')}/api/chat",
                json={
                    "message": request.prompt_str,
                    "stream": False
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                result = response.json()
                return {"response": result.get("response", "No response")}
            else:
                raise HTTPException(status_code=response.status_code, detail="Gateway request failed")
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

@app.post("/tools/{tool_name}")
async def execute_tool(tool_name: str, request: ToolExecutionRequest):
    """Execute n8n workflow tools - placeholder for Ignatius's implementation"""
    try:
        # TODO: Iggy will implement the actual n8n tool integrations
        return {
            "success": True,
            "message": f"Tool '{tool_name}' execution placeholder for Iggy",
            "tool": tool_name,
            "parameters": request.parameters
        }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)