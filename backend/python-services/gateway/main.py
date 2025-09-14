import asyncio
import base64
import json
import logging
import struct
from contextlib import asynccontextmanager
from typing import TYPE_CHECKING, Any
import shutil
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing_extensions import assert_never
import httpx
import os
from dotenv import load_dotenv
from pathlib import Path

# Import OpenAI Agents SDK components
try:
    from agents.realtime import RealtimeRunner, RealtimeSession, RealtimeSessionEvent
    from agents.realtime.config import RealtimeUserInputMessage
    from agents.realtime.model_inputs import RealtimeModelSendRawMessage
    AGENTS_SDK_AVAILABLE = True
except ImportError:
    AGENTS_SDK_AVAILABLE = False
    print("OpenAI Agents SDK not available. Please install with: pip install openai-agents")

# Import our agent configuration
if TYPE_CHECKING:
    from .jarvis_agent import get_starting_agent
else:
    try:
        from jarvis_agent import get_starting_agent
    except ImportError:
        # Fallback if agent file doesn't exist yet
        get_starting_agent = None

# Import our shared contracts and prompts
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Service URLs
N8N_SERVICE_URL = os.getenv("N8N_SERVICE_URL", "http://localhost:8001")
RAG_SERVICE_URL = os.getenv("RAG_SERVICE_URL", "http://localhost:8002")

# OpenAI Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is required")

# WebSocket Manager using OpenAI Agents SDK
class RealtimeWebSocketManager:
    def __init__(self):
        self.active_sessions: dict[str, RealtimeSession] = {}
        self.session_contexts: dict[str, Any] = {}
        self.websockets: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        if not AGENTS_SDK_AVAILABLE:
            await websocket.close(code=1011, reason="OpenAI Agents SDK not available")
            return
            
        if not get_starting_agent:
            await websocket.close(code=1011, reason="Jarvis agent not configured")
            return
            
        await websocket.accept()
        self.websockets[session_id] = websocket

        # Initialize Jarvis agent with OpenAI Agents SDK following official specification
        agent = get_starting_agent()
        
        # Configure runner with proper settings following the spec - simplified approach
        runner = RealtimeRunner(
            starting_agent=agent,
            config={
                "model_settings": {
                    "model_name": "gpt-realtime",
                    "voice": "alloy",  # Alloy has a more natural, friendly tone
                    "modalities": ['audio'],
                    "input_audio_format": "pcm16",
                    "output_audio_format": "pcm16",
                    "input_audio_transcription": {"model": "gpt-4o-mini-transcribe"},
                    "turn_detection": {
                        "type": "semantic_vad", 
                        "interrupt_response": True
                    },
                    # Audio configuration - match frontend 24kHz
                    "input_audio_sample_rate": 24000,
                    "output_audio_sample_rate": 24000,
                    # Voice control settings
                    "temperature": 0.7,  # Control randomness
                    "max_response_output_tokens": 4096,
                }
            }
        )
        
        # Start session following official pattern - proper async context management
        session_context = await runner.run()
        session = await session_context.__aenter__()
        self.active_sessions[session_id] = session
        self.session_contexts[session_id] = session_context

        # Start event processing task
        asyncio.create_task(self._process_events(session_id))

    async def disconnect(self, session_id: str):
        if session_id in self.session_contexts:
            # Properly close the session context
            try:
                await self.session_contexts[session_id].__aexit__(None, None, None)
            except Exception as e:
                logger.error(f"Error closing session {session_id}: {e}")
            del self.session_contexts[session_id]
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
        if session_id in self.websockets:
            del self.websockets[session_id]

    async def send_audio(self, session_id: str, audio_bytes: bytes):
        """Send audio data to the session"""
        if session_id in self.active_sessions:
            session = self.active_sessions[session_id]
            await session.send_audio(audio_bytes)

    async def send_client_event(self, session_id: str, event: dict[str, Any]):
        """Send a raw client event to the underlying realtime model."""
        session = self.active_sessions.get(session_id)
        if not session:
            return
        await session.model.send_event(
            RealtimeModelSendRawMessage(
                message={
                    "type": event["type"],
                    "other_data": {k: v for k, v in event.items() if k != "type"},
                }
            )
        )

    async def send_user_message(self, session_id: str, message: RealtimeUserInputMessage):
        """Send a structured user message via the higher-level API (supports input_image)."""
        session = self.active_sessions.get(session_id)
        if not session:
            return
        await session.send_message(message)  # delegates to RealtimeModelSendUserInput path

    async def interrupt(self, session_id: str) -> None:
        """Interrupt current model playback/response for a session."""
        session = self.active_sessions.get(session_id)
        if not session:
            return
        await session.interrupt()

    async def _process_events(self, session_id: str):
        try:
            session = self.active_sessions[session_id]
            websocket = self.websockets[session_id]

            # Process events following the official specification pattern
            async for event in session:
                try:
                    event_data = await self._serialize_event(event)
                    # Only send event if serialization returned data (not None)
                    if event_data is not None:
                        await websocket.send_text(json.dumps(event_data))
                except Exception as e:
                    logger.error(f"Error processing event for session {session_id}: {e}")
        except Exception as e:
            logger.error(f"Error in event processing loop for session {session_id}: {e}")

    async def _serialize_event(self, event: RealtimeSessionEvent) -> dict[str, Any]:
        """Serialize event to OpenAI-compatible format for frontend compatibility"""
        
        # Handle events and convert to OpenAI-compatible format
        if event.type == "agent_start":
            logger.info(f"Agent started: {event.agent.name}")
            return {
                "type": "session.created",
                "session": {
                    "id": f"agent_{event.agent.name}",
                    "object": "realtime.session"
                }
            }
        elif event.type == "agent_end":
            logger.info(f"Agent ended: {event.agent.name}")
            return {
                "type": "response.done",
                "response": {
                    "object": "realtime.response",
                    "status": "completed"
                }
            }
        elif event.type == "handoff":
            logger.info(f"Handoff from {event.from_agent.name} to {event.to_agent.name}")
            return {
                "type": "session.updated",
                "session": {
                    "instructions": f"Handed off from {event.from_agent.name} to {event.to_agent.name}"
                }
            }
        elif event.type == "tool_start":
            logger.info(f"Tool started: {event.tool.name}")
            return {
                "type": "response.function_call_arguments.delta",
                "delta": f"Starting tool: {event.tool.name}"
            }
        elif event.type == "tool_end":
            logger.info(f"Tool ended: {event.tool.name}; output: {event.output}")
            return {
                "type": "response.function_call_arguments.done",
                "arguments": str(event.output)
            }
        elif event.type == "audio":
            # Convert to OpenAI audio format for frontend compatibility
            audio_b64 = base64.b64encode(event.audio.data).decode("utf-8")
            logger.info(f"Audio chunk sent: {len(event.audio.data)} bytes")
            return {
                "type": "response.audio.delta",
                "delta": audio_b64
            }
        elif event.type == "audio_interrupted":
            logger.info("Audio interrupted")
            return {
                "type": "response.cancelled",
                "response": {
                    "object": "realtime.response",
                    "status": "cancelled"
                }
            }
        elif event.type == "audio_end":
            logger.info("Audio ended")
            return {
                "type": "response.audio.done"
            }
        elif event.type == "text":
            # Handle text responses for debugging - convert to OpenAI text format
            text_content = event.text if hasattr(event, "text") else str(event)
            logger.info(f"Text response: {text_content}")
            return {
                "type": "response.text.delta",
                "delta": text_content
            }
        elif event.type == "response_text":
            # Handle response text events
            text_content = event.text if hasattr(event, "text") else str(event)
            logger.info(f"Response text: {text_content}")
            return {
                "type": "response.text.delta",
                "delta": text_content
            }
        elif event.type == "error":
            error_msg = str(event.error) if hasattr(event, "error") else "Unknown error"
            logger.error(f"Error: {error_msg}")
            return {
                "type": "error",
                "error": {
                    "type": "server_error",
                    "code": "internal_error",
                    "message": error_msg
                }
            }
        elif event.type == "history_updated":
            # Skip these frequent events but return None to avoid sending
            return None
        elif event.type == "history_added":
            # Skip these frequent events but return None to avoid sending
            return None
        elif event.type == "raw_model_event":
            # Forward raw model events if they're audio-related
            if hasattr(event.data, 'type'):
                if event.data.type in ['response.audio.delta', 'response.text.delta', 'input_audio_buffer.speech_started', 'input_audio_buffer.speech_stopped']:
                    logger.debug(f"Forwarding raw model event: {event.data.type}")
                    return event.data.__dict__ if hasattr(event.data, '__dict__') else {"type": event.data.type}
            logger.debug(f"Raw model event: {self._truncate_str(str(event.data), 200)}")
            return None
        else:
            logger.warning(f"Unknown event type: {event.type}")
            return {
                "type": "session.updated",
                "session": {
                    "instructions": f"Unknown event: {event.type}"
                }
            }

    def _truncate_str(self, s: str, max_length: int) -> str:
        """Helper function from the specification"""
        if len(s) > max_length:
            return s[:max_length] + "..."
        return s

# Global manager instance
realtime_manager = RealtimeWebSocketManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(
    title="Jarvis Gateway Service",
    description="Main API gateway for Jarvis with OpenAI Agents SDK integration",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    # read bytes (streamed, efficient)
    file_path = UPLOAD_DIR / file.filename

    # e.g. save to disk
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"filename": file.filename, "saved_to": str(file_path)}



# =============================================================================
# OPENAI REALTIME WEBSOCKET ENDPOINT
# =============================================================================

@app.websocket("/api/realtime/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint using OpenAI Agents SDK"""
    await realtime_manager.connect(websocket, session_id)
    image_buffers: dict[str, dict[str, Any]] = {}
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message["type"] == "input_audio_buffer.append":
                # Handle OpenAI WebSocket format: base64 PCM16 audio
                audio_b64 = message["audio"]
                try:
                    # Decode base64 to bytes
                    audio_bytes = base64.b64decode(audio_b64)
                    await realtime_manager.send_audio(session_id, audio_bytes)
                    logger.info(f"Received audio via input_audio_buffer.append: {len(audio_bytes)} bytes")
                except Exception as e:
                    logger.error(f"Error decoding base64 audio: {e}")
            elif message["type"] == "audio":
                # Legacy support: Convert int16 array to bytes
                int16_data = message["data"]
                audio_bytes = struct.pack(f"{len(int16_data)}h", *int16_data)
                await realtime_manager.send_audio(session_id, audio_bytes)
            elif message["type"] == "image":
                logger.info("Received image message from client (session %s).", session_id)
                # Build a conversation.item.create with input_image (and optional input_text)
                data_url = message.get("data_url")
                prompt_text = message.get("text") or "Please describe this image."
                if data_url:
                    logger.info(
                        "Forwarding image (structured message) to Realtime API (len=%d).",
                        len(data_url),
                    )
                    user_msg: RealtimeUserInputMessage = {
                        "type": "message",
                        "role": "user",
                        "content": (
                            [
                                {"type": "input_image", "image_url": data_url, "detail": "high"},
                                {"type": "input_text", "text": prompt_text},
                            ]
                            if prompt_text
                            else [{"type": "input_image", "image_url": data_url, "detail": "high"}]
                        ),
                    }
                    await realtime_manager.send_user_message(session_id, user_msg)
                    # Acknowledge to client UI
                    await websocket.send_text(
                        json.dumps(
                            {
                                "type": "client_info",
                                "info": "image_enqueued",
                                "size": len(data_url),
                            }
                        )
                    )
                else:
                    await websocket.send_text(
                        json.dumps(
                            {
                                "type": "error",
                                "error": "No data_url for image message.",
                            }
                        )
                    )
            elif message["type"] == "input_audio_buffer.commit":
                # Handle OpenAI WebSocket format: commit audio buffer
                await realtime_manager.send_client_event(session_id, {"type": "input_audio_buffer.commit"})
                logger.info("Received input_audio_buffer.commit from client")
            elif message["type"] == "commit_audio":
                # Legacy support: Force close the current input audio turn
                await realtime_manager.send_client_event(session_id, {"type": "input_audio_buffer.commit"})
            elif message["type"] == "image_start":
                img_id = str(message.get("id"))
                image_buffers[img_id] = {
                    "text": message.get("text") or "Please describe this image.",
                    "chunks": [],
                }
                await websocket.send_text(
                    json.dumps({"type": "client_info", "info": "image_start_ack", "id": img_id})
                )
            elif message["type"] == "image_chunk":
                img_id = str(message.get("id"))
                chunk = message.get("chunk", "")
                if img_id in image_buffers:
                    image_buffers[img_id]["chunks"].append(chunk)
                    if len(image_buffers[img_id]["chunks"]) % 10 == 0:
                        await websocket.send_text(
                            json.dumps(
                                {
                                    "type": "client_info",
                                    "info": "image_chunk_ack",
                                    "id": img_id,
                                    "count": len(image_buffers[img_id]["chunks"]),
                                }
                            )
                        )
            elif message["type"] == "image_end":
                img_id = str(message.get("id"))
                buf = image_buffers.pop(img_id, None)
                if buf is None:
                    await websocket.send_text(
                        json.dumps({"type": "error", "error": "Unknown image id for image_end."})
                    )
                else:
                    data_url = "".join(buf["chunks"]) if buf["chunks"] else None
                    prompt_text = buf["text"]
                    if data_url:
                        logger.info(
                            "Forwarding chunked image (structured message) to Realtime API (len=%d).",
                            len(data_url),
                        )
                        user_msg2: RealtimeUserInputMessage = {
                            "type": "message",
                            "role": "user",
                            "content": (
                                [
                                    {
                                        "type": "input_image",
                                        "image_url": data_url,
                                        "detail": "high",
                                    },
                                    {"type": "input_text", "text": prompt_text},
                                ]
                                if prompt_text
                                else [
                                    {"type": "input_image", "image_url": data_url, "detail": "high"}
                                ]
                            ),
                        }
                        await realtime_manager.send_user_message(session_id, user_msg2)
                        await websocket.send_text(
                            json.dumps(
                                {
                                    "type": "client_info",
                                    "info": "image_enqueued",
                                    "id": img_id,
                                    "size": len(data_url),
                                }
                            )
                        )
                    else:
                        await websocket.send_text(
                            json.dumps({"type": "error", "error": "Empty image."})
                        )
            elif message["type"] == "tool_call":
                print(message)
            elif message["type"] == "interrupt":
                await realtime_manager.interrupt(session_id)

    except WebSocketDisconnect:
        await realtime_manager.disconnect(session_id)

# =============================================================================
# MAIN APPLICATION RUNNER
# =============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        # Increased WebSocket frame size to comfortably handle image data URLs.
        ws_max_size=16 * 1024 * 1024,
    )
