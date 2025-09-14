# Jarvis Backend - Real-time Voice Services 🎤

FastAPI-based backend services for Jarvis Voice Assistant with OpenAI Realtime API integration.

## ✅ CURRENT ARCHITECTURE

### Services
- **Gateway Service**: Main FastAPI service with WebSocket server for OpenAI Realtime API
- **Shared Resources**: Contracts, prompts, and utilities

### Tech Stack
- **FastAPI**: Modern Python web framework
- **WebSockets**: Real-time bidirectional communication  
- **OpenAI Agents SDK**: Integration with OpenAI Realtime API
- **Uvicorn**: ASGI server for FastAPI

## 🛠️ Directory Structure

```
backend/
├── python-services/
│   └── gateway/              # Main FastAPI Gateway Service
│       ├── main.py          # WebSocket server with OpenAI Realtime integration
│       ├── jarvis_agent.py  # Jarvis agent configuration
│       ├── env.example      # Environment template
│       └── requirements.txt # DELETED - use project root requirements.txt
├── shared/                   # Shared Resources
│   ├── contracts/           # Data contracts and types
│   │   └── contracts.py     # Python contract definitions
│   └── prompts/            # System prompts
│       └── prompts.py      # Jarvis personality and behavior
└── scripts/                 # Utility scripts
    ├── start-services.sh
    ├── stop-services.sh
    └── test-realtime-voice.sh
```

## 🚀 Quick Setup

### Prerequisites
- **Python 3.8+** (3.13 recommended)
- **OpenAI API key** with Realtime API access

### Installation
```bash
# From project root - use MASTER requirements.txt ONLY
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Environment Setup
```bash
# Copy environment template
cp backend/python-services/gateway/env.example backend/python-services/gateway/.env

# Edit .env and add your OpenAI API key:
# OPENAI_API_KEY=sk-your-key-here
```

### Start Gateway Service
```bash
source venv/bin/activate
cd backend/python-services/gateway
python main.py
```

**Service will be available at:** `http://localhost:8000`
**WebSocket endpoint:** `ws://localhost:8000/api/realtime/{session_id}`

## 🔧 Gateway Service Details

### main.py - Core Features
- **WebSocket Server**: Handles real-time voice communication
- **OpenAI Integration**: Uses OpenAI Agents SDK for Realtime API
- **Audio Processing**: Handles PCM16 audio at 24kHz sample rate
- **Session Management**: Manages voice session lifecycle
- **Event Routing**: Translates between frontend and OpenAI events

### Key Components
```python
# WebSocket endpoint for real-time voice
@app.websocket("/api/realtime/{session_id}")

# Event handling for audio streaming
async def handle_websocket_message(message)

# OpenAI Realtime integration
RealtimeRunner(starting_agent=agent, config=model_settings)
```

### Supported Events
- `input_audio_buffer.append` - Send audio to OpenAI
- `input_audio_buffer.commit` - Commit audio buffer
- `response.audio.delta` - Receive audio from OpenAI
- `response.audio.done` - Audio response completed

## 🎯 Voice Configuration

### Model Settings (main.py)
```python
config = {
    "model_settings": {
        "model_name": "gpt-realtime",
        "voice": "alloy",              # Voice model
        "modalities": ['audio'],       # Audio-only mode
        "input_audio_format": "pcm16", 
        "output_audio_format": "pcm16",
        "input_audio_sample_rate": 24000,
        "output_audio_sample_rate": 24000,
        "temperature": 0.7,
        "max_response_output_tokens": 4096,
        "turn_detection": {
            "type": "semantic_vad", 
            "interrupt_response": True
        }
    }
}
```

### System Prompt (prompts.py)
Located in `backend/shared/prompts/prompts.py`:
- Defines Jarvis personality
- Sets response tone and pace
- Configures behavior patterns

## 🚨 Troubleshooting

### SSL Certificate Error (macOS Python 3.13)
```bash
# Install certificates
/Applications/Python\ 3.13/Install\ Certificates.command

# Or add to .env file:
SSL_CERT_FILE=/opt/anaconda3/lib/python3.13/site-packages/certifi/cacert.pem
REQUESTS_CA_BUNDLE=/opt/anaconda3/lib/python3.13/site-packages/certifi/cacert.pem
```

### Dependency Conflicts
```bash
# ONLY use the master requirements.txt at project root
pip install -r requirements.txt  # From project root

# Verify versions
pip list | grep -E "(openai|websockets|openai-agents)"
```

### WebSocket Connection Issues
- Verify OpenAI API key has Realtime API access
- Check that backend is running on port 8000
- Ensure frontend connects to correct WebSocket URL

### Audio Issues
- Confirm 24kHz sample rate configuration
- Check browser microphone permissions
- Verify audio format (PCM16 mono)

## 📊 Monitoring & Logs

### Development Logging
The service provides detailed logging for:
- WebSocket connections and disconnections
- Audio chunk processing
- OpenAI API interactions
- Error handling and debugging

### Log Examples
```
INFO: WebSocket /api/realtime/session_123 [accepted]
INFO: Received audio via input_audio_buffer.append: 1024 bytes
INFO: Audio chunk sent: 512 samples
INFO: connection closed
```

## 🔒 Security

### Environment Variables
- Store OpenAI API key in `.env` file (never commit)
- Use environment-specific configurations
- Validate all incoming WebSocket messages

### API Security
- Session-based WebSocket connections
- Input validation and sanitization
- Error handling without exposing internals

## 🚀 Development

### Adding New Features
1. Update contracts in `shared/contracts/`
2. Modify WebSocket event handling in `main.py`
3. Update frontend to handle new events
4. Test with real voice interactions

### Testing
```bash
# Test basic connectivity
curl http://localhost:8000/health

# Test WebSocket (use wscat or similar)
wscat -c ws://localhost:8000/api/realtime/test_session
```

---

**Ready for hackathon development! 🎯**