# Jarvis

A **real-time voice-first** personal AI assistant powered by OpenAI's Realtime API. Talk to Jarvis naturally and get instant responses with tool execution capabilities.

## ✨ Current Features

- **🎤 Real-time Voice Interface**: Powered by OpenAI Realtime API with WebSocket streaming
- **🔧 Tool Execution**: Voice commands can trigger actions (weather, calendar, news)
- **💬 Push-to-Talk**: Click and speak for natural voice interaction
- **🎨 Modern UI**: Beautiful React interface built using Lovable
- **⚡ Fast Response**: Low-latency voice processing with jitter buffer optimization

## 🎯 Voice Commands Available

- **Daily Update**: "Jarvis give me my daily update"
- **General Chat**: Ask questions, have conversations
- **System Info**: Get information about the assistant
- More tools coming soon!

## 🏗️ Current Architecture

### Tech Stack
- **Frontend**: React + Vite + TypeScript with Tailwind CSS scaffolded with Lovable
- **Backend**: FastAPI, n8n for orchestration
- **Database**: Weaviate
- **Voice Processing**: OpenAI Realtime API with WebSocket streaming
- **Audio**: 24kHz PCM16 audio for smooth playback
- **Real-time Communication**: WebSocket connection for bidirectional audio streaming

### Voice Flow
1. **Frontend** connects to **Backend Gateway** via WebSocket
2. **Backend** establishes connection to **OpenAI Realtime API** 
3. **User speaks** → Frontend captures audio → Sends to Backend → OpenAI processes
4. **OpenAI responds** → Backend receives audio → Forwards to Frontend → Plays with jitter buffer
5. **Tool calls** handled by Backend Gateway with appropriate service routing

## 🛠️ Repository Structure

```
jarvis-voice-os/
├── frontend/                    # React + Vite voice interface
│   ├── src/
│   │   ├── components/          # UI components including RealtimeVoiceInterface
│   │   ├── pages/              # Main pages (Index.tsx)
│   │   └── lib/                # Utilities and helpers
│   ├── public/                 # Static assets including audio-processor.js
│   └── package.json            # Frontend dependencies
├── backend/                     # Python backend services
│   ├── python-services/
│   │   └── gateway/            # Main FastAPI gateway service
│   │       ├── main.py         # WebSocket server with OpenAI Realtime integration
│   │       └── env.example     # Environment template
│   ├── shared/                 # Shared resources
│   │   ├── contracts/          # Data contracts and types
│   │   └── prompts/           # System prompts for Jarvis
│   └── scripts/               # Service management scripts
├── docs/                      # Documentation
├── requirements.txt           # MASTER Python dependencies (USE THIS ONLY)
├── setup.sh                   # Automated setup script
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+** (3.13 recommended)
- **Node.js 18+** and npm
- **OpenAI API key** with Realtime API access

### Setup

#### Step 1: Clean Environment
```bash
# Clone the repository
git clone <repo-url>
cd jarvis-voice-os

# Remove any old virtual environment
rm -rf venv .venv

# Create fresh virtual environment
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip
```

#### Step 2: Install Dependencies
```bash
# Install from MASTER requirements file (project root)
pip install -r requirements.txt
```

#### Step 3: Setup Environment
```bash
# Copy environment template
cp backend/python-services/gateway/env.example backend/python-services/gateway/.env

# Edit .env file and add your OpenAI API key:
# OPENAI_API_KEY=sk-your-key-here
```

#### Step 4: Install Frontend
```bash
cd frontend
npm install
cd ..
```

#### Step 5: Start Services
```bash
# Terminal 1: Backend
source venv/bin/activate
cd backend/python-services/gateway
python main.py

# Terminal 2: Frontend (new terminal)
cd frontend  
npm run dev
```

### 🎯 Access the Application
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **WebSocket**: ws://localhost:8000/api/realtime/{session_id}

### 🚨 SSL Certificate Fix (macOS Python 3.13)
If you get SSL certificate errors:
```bash
# Install certificates
/Applications/Python\ 3.13/Install\ Certificates.command

# Or add to .env file:
SSL_CERT_FILE=/opt/anaconda3/lib/python3.13/site-packages/certifi/cacert.pem
```

## 🔧 Development

### Available Commands
```bash
# Setup everything
./setup.sh              # Automated setup script

# Manual setup
pip install -r requirements.txt
cd frontend && npm install

# Development
python backend/python-services/gateway/main.py  # Backend
cd frontend && npm run dev                       # Frontend

# Verification
pip list | grep -E "(openai|websockets)"        # Check dependencies
```

### Key Files
- **main.py**: FastAPI WebSocket server with OpenAI Realtime integration
- **RealtimeVoiceInterface.tsx**: React component for voice interaction
- **audio-processor.js**: AudioWorklet for microphone processing
- **prompts.py**: System prompts for Jarvis personality

## 🔧 Technical Details

### Audio Processing
- **Format**: PCM16 mono at 24kHz sample rate
- **Streaming**: Real-time bidirectional audio streaming
- **Buffer**: Jitter buffer for smooth playback (80ms)
- **Input**: AudioWorklet processor for microphone capture

### WebSocket Protocol
- **Frontend ↔ Backend**: Custom WebSocket protocol
- **Backend ↔ OpenAI**: OpenAI Realtime API WebSocket
- **Events**: `input_audio_buffer.append`, `input_audio_buffer.commit`, `response.audio.delta`

### Dependencies (Locked Versions)
```
openai==1.107.2          # OpenAI Python client
openai-agents==0.3.0     # OpenAI Agents SDK
websockets==14.2         # WebSocket support
fastapi>=0.104.1         # Web framework
```

## 🚨 Troubleshooting

### Common Issues
- **SSL Certificate Error**: Run certificate install command (see setup)
- **Dependency Conflicts**: Use ONLY `requirements.txt` at project root
- **Audio Not Playing**: Check 24kHz sample rate configuration
- **WebSocket Errors**: Verify OpenAI API key and Realtime API access

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

This is a hackathon project for **Tech Europe Stockholm AI Hack**. 

### Current Status
- ✅ Real-time voice interface working
- ✅ OpenAI Realtime API integration
- ✅ Audio processing pipeline
- ✅ WebSocket communication
- 🚧 Tool system expansion
- 🚧 Additional voice commands

**Ready to hack! 🚀**
