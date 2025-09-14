# System Overview

## 🎯 Current Project Status

Jarvis-in-a-Box is a **real-time voice-first AI assistant** powered by OpenAI's Realtime API. The current implementation focuses on seamless voice interaction with tool execution capabilities.

## 🏗️ Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  JARVIS VOICE ASSISTANT                      │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React + Vite)     │  Backend (FastAPI + Python)  │
│  ┌─────────────────────────┐  │  ┌─────────────────────────┐ │
│  │ Voice Interface         │  │  │ Gateway Service         │ │
│  │ - Push-to-Talk UI       │◄─┼──┤ - WebSocket Server      │ │
│  │ - Audio Processing      │  │  │ - OpenAI Integration    │ │
│  │ - Jitter Buffer         │  │  │ - Session Management    │ │
│  └─────────────────────────┘  │  └─────────────────────────┘ │
│  ┌─────────────────────────┐  │  ┌─────────────────────────┐ │
│  │ Audio Pipeline          │  │  │ OpenAI Realtime API     │ │
│  │ - AudioWorklet          │  │  │ - Voice Processing      │ │
│  │ - PCM16 @ 24kHz         │◄─┼──┤ - Tool Execution        │ │
│  │ - Real-time Streaming   │  │  │ - Response Generation   │ │
│  └─────────────────────────┘  │  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **WebSocket** for real-time communication
- **AudioWorklet** for microphone processing

### Backend
- **FastAPI** Python web framework
- **Uvicorn** ASGI server
- **OpenAI Agents SDK** for Realtime API integration
- **WebSockets** for bidirectional communication

### Audio Processing
- **Format**: PCM16 mono audio
- **Sample Rate**: 24kHz input and output
- **Streaming**: Real-time bidirectional audio
- **Buffering**: Jitter buffer for smooth playback

## 🎤 Voice Interaction Flow

### 1. User Interaction
```
User clicks voice button → Microphone activates → Audio capture begins
```

### 2. Audio Processing
```
AudioWorklet captures → Convert to PCM16 → Base64 encode → WebSocket send
```

### 3. Backend Processing
```
WebSocket receive → Decode audio → Forward to OpenAI → Process response
```

### 4. Response Playback
```
OpenAI audio response → Jitter buffer → Audio scheduling → Speaker output
```

## 📡 Communication Protocol

### WebSocket Events

**Frontend → Backend:**
- `input_audio_buffer.append` - Send audio data to OpenAI
- `input_audio_buffer.commit` - Commit audio buffer for processing

**Backend → Frontend:**
- `response.audio.delta` - Audio response chunks from OpenAI
- `response.audio.done` - Audio response completed
- `session.created` - Session established
- `error` - Error messages

### Audio Data Format
```json
{
  "type": "input_audio_buffer.append",
  "audio": "base64-encoded-pcm16-audio-data"
}
```

## 🛠️ Key Components

### Frontend Components
- **RealtimeVoiceInterface.tsx**: Main voice interaction component
- **audio-processor.js**: AudioWorklet for microphone processing
- **Index.tsx**: Main page layout with voice interface

### Backend Components
- **main.py**: FastAPI WebSocket server with OpenAI integration
- **jarvis_agent.py**: Jarvis agent configuration
- **prompts.py**: System prompts and personality

### Configuration
- **Model Settings**: Voice model, audio format, sample rates
- **System Prompts**: Jarvis personality and behavior
- **Environment**: API keys and service configuration

## 🔄 Session Lifecycle

### 1. Connection
```python
# Frontend connects to WebSocket
ws = new WebSocket('ws://localhost:8000/api/realtime/session_123')

# Backend establishes OpenAI Realtime session
session = await session_context.__aenter__()
```

### 2. Audio Streaming
```python
# Continuous bidirectional audio streaming
Frontend ←→ Backend ←→ OpenAI Realtime API
```

### 3. Cleanup
```python
# Session cleanup on disconnect
await session_context.__aexit__()
```

## 🎯 Current Capabilities

### ✅ Working Features
- **Real-time voice interaction** with low latency
- **Push-to-talk interface** with visual feedback
- **Audio processing pipeline** at 24kHz PCM16
- **WebSocket communication** with OpenAI
- **Jitter buffer** for smooth audio playback
- **Session management** with proper cleanup

### 🚧 In Development
- **Tool system expansion** for more voice commands
- **Enhanced error handling** and recovery
- **Audio quality optimization**
- **Additional voice commands and capabilities**

## 📊 Performance Characteristics

### Latency
- **Audio capture**: ~20ms (AudioWorklet buffer)
- **Network transmission**: ~10-50ms (depends on connection)
- **OpenAI processing**: ~200-500ms (voice-to-voice)
- **Total round-trip**: ~250-600ms

### Audio Quality
- **Sample rate**: 24kHz (high quality)
- **Bit depth**: 16-bit PCM
- **Channels**: Mono
- **Buffering**: 80ms jitter buffer for smoothness

## 🔒 Security & Privacy

### Current Implementation
- **API key security**: Stored in environment variables
- **Session isolation**: Each WebSocket connection is isolated
- **Input validation**: WebSocket message validation
- **Error handling**: Safe error responses without data leakage

### Planned Enhancements
- **Rate limiting** for API calls
- **User authentication** for multi-user support
- **Audit logging** for voice interactions
- **Data retention policies**

## 🚀 Development Status

### Current Phase: **MVP Voice Assistant**
- Core voice interaction working
- Real-time audio streaming implemented
- Basic tool execution framework
- Development-ready setup

### Next Phase: **Tool System Expansion**
- Weather, calendar, and note-taking tools
- Enhanced voice command recognition
- Multi-modal interaction support
- Production deployment preparation

---

**Ready for hackathon development! The foundation is solid and extensible.** 🎯