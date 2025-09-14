# Getting Started

## 🚀 Quick Setup - Voice Assistant

### Prerequisites
- **Python 3.8+** (3.13 recommended)
- **Node.js 18+** and npm
- **OpenAI API key** with Realtime API access

### 1. Clone & Install
```bash
git clone <repository-url>
cd jarvis-voice-os

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies from MASTER requirements file
pip install --upgrade pip
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Environment Setup
```bash
# Copy environment template
cp backend/python-services/gateway/env.example backend/python-services/gateway/.env

# Edit .env file and add your OpenAI API key:
# OPENAI_API_KEY=sk-your-key-here
```

### 3. Start Services
```bash
# Terminal 1: Backend
source venv/bin/activate
cd backend/python-services/gateway
python main.py

# Terminal 2: Frontend (new terminal)
cd frontend
npm run dev
```

## 🎯 First Run

### 1. Access the Interface
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **WebSocket**: ws://localhost:8000/api/realtime/{session_id}

### 2. Test Voice Interface
1. Click the **voice button** in the interface
2. **Push to Talk**: Click and hold to speak
3. Say: "Hello, what's the weather like?"
4. Release button and listen to Jarvis respond
5. Verify audio playback works correctly

### 3. Verify Audio Setup
- **Check microphone permissions** in your browser
- **Test audio playback** - you should hear Jarvis speak
- **Monitor console logs** for any WebSocket errors

### 4. SSL Certificate Fix (if needed)
If you see SSL certificate errors:
```bash
# macOS Python 3.13 fix
/Applications/Python\ 3.13/Install\ Certificates.command

# Or add to .env file:
SSL_CERT_FILE=/opt/anaconda3/lib/python3.13/site-packages/certifi/cacert.pem
```

## 🔧 Development Workflow

### Daily Development
```bash
# Start everything
npm run dev

# Start specific services
npm run dev:frontend
npm run dev:backend

# View logs
npm run docker:logs
```

### Testing
```bash
# Run all tests
npm test

# Run specific tests
npm test -- --grep "voice interface"

# Type checking
npm run type-check
```

### Building
```bash
# Build all packages
npm run build

# Build specific package
npm run build:backend
```

## 🐛 Troubleshooting

### Common Issues

**Port conflicts**:
```bash
# Check what's using ports
lsof -i :3000
lsof -i :3001
lsof -i :8080
lsof -i :5678
```

**Docker issues**:
```bash
# Reset Docker containers
npm run docker:down
docker system prune -f
npm run docker:up
```

**Database issues**:
```bash
# Reset database
rm data/life.db
npm run setup
```

**Voice not working**:
- Check microphone permissions
- Verify OpenAI API key
- Check browser console for errors

### Debug Mode
```bash
# Enable debug logging
DEBUG=jarvis:* npm run dev

# Verbose Docker logs
docker-compose logs -f --tail=100
```

## 📁 Project Structure

```
jarvis-voice-os/
├── apps/
│   ├── frontend/          # Next.js voice interface
│   └── backend/           # Express API server
├── packages/
│   ├── contracts/         # Shared TypeScript types
│   └── prompts/           # AI system prompts
├── infra/
│   └── docker-compose.yml # Infrastructure services
├── data/                  # User data (gitignored)
└── docs/                  # Documentation
```

## 🎯 Next Steps

1. **Read the docs**: Start with [System Overview](./01-system-overview.md)
2. **Choose your component**: 
   - Voice Interface → [Voice Interface Guide](./02-voice-interface.md)
   - Backend → [Backend Development](./06-backend-development.md)
   - n8n Workflows → [n8n Workflows](./08-n8n-workflows.md)
3. **Set up your branch**: Follow [Development Workflow](./16-development-workflow.md)
4. **Start building**: Use the contracts in `packages/contracts/`

## 💡 Tips

- **Use TypeScript**: All contracts are typed for better development
- **Check contracts first**: New features should start with contract updates
- **Test voice early**: Voice interface has unique constraints
- **Keep it simple**: Focus on core functionality first
- **Ask questions**: Use team communication channels

---

*Ready to start building? Check out the specific development guides for your component!*
