from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from dotenv import load_dotenv

from schemas import PromptRequest
from jarvis import Jarvis
from db.upload_api import router as upload_router
from db.memory_api import router as memory_router


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

app.include_router(upload_router)   # exposes POST /upload/files
app.include_router(memory_router)

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
    data = request.prompt_str
    return StreamingResponse(jarvis.chat(data))


""" @app.post("/tools/{tool_name}")
async def execute_tool(tool_name: str, request: ToolExecutionRequest):
    "Execute n8n workflow tools - placeholder for Ignatius's implementation"
    try:
        # TODO: Iggy will implement the actual n8n tool integrations
        return {
            "success": True,
            "message": f"Tool '{tool_name}' execution placeholder for Iggy",
            "tool": tool_name,
            "parameters": request.parameters
        }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) """

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)