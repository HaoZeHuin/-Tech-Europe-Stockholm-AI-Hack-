# Getting Started

## 🚀 Quick Setup

### Prerequisites
- **Node.js 18+** and npm
- **Docker** and Docker Compose
- **OpenAI API key**
- **Git**

### 1. Clone & Install
```bash
git clone <repository-url>
cd jarvis-voice-os
npm run setup
```

### 2. Environment Setup
Create `.env` files:

**Backend** (`apps/backend/.env`):
```bash
OPENAI_API_KEY=your_openai_key
WEAVIATE_URL=http://localhost:8080
N8N_WEBHOOK_URL=http://localhost:5678
REDIS_URL=redis://localhost:6379
DATABASE_PATH=../../data/life.db
VAULT_PATH=../../data/vault
```

**Frontend** (`apps/frontend/.env.local`):
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_OPENAI_REALTIME_URL=wss://api.openai.com/v1/realtime
```

### 3. Start Infrastructure
```bash
npm run docker:up
```

### 4. Start Development
```bash
npm run dev
```

## 🎯 First Run

### 1. Access the Interface
- **Frontend**: http://localhost:3000
- **n8n**: http://localhost:5678
- **Weaviate**: http://localhost:8080

### 2. Test Voice Interface
1. Click the microphone button
2. Say: "What's the weather like?"
3. Verify weather tool execution

### 3. Test Chat Interface
1. Type: "Create a task called 'Test task'"
2. Approve the action when prompted
3. Check task was created

### 4. Test Document Search
1. Add a markdown file to `data/vault/`
2. Say: "Search for [content from your file]"
3. Verify search results

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
