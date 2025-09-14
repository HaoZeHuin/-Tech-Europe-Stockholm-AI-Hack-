# Jarvis Backend - Hybrid Architecture

A hybrid TypeScript + Python backend architecture for the Jarvis voice-first personal assistant.

## 🏗️ Architecture Overview

```
backend/
├── express-gateway/          # TypeScript API Gateway (Main Entry Point)
│   ├── src/
│   │   ├── routes/          # API routes (chat, tools, health)
│   │   ├── services/        # Business logic (tool routing)
│   │   ├── middleware/      # Express middleware
│   │   └── types/          # TypeScript types and interfaces
│   ├── package.json
│   └── tsconfig.json
├── python-services/          # Python Microservices
│   ├── n8n-service/         # n8n workflow integration
│   └── rag-service/         # Weaviate vector database & RAG
├── shared/                   # Shared Resources
│   ├── contracts/           # TypeScript contracts & schemas
│   ├── prompts/            # System prompts for AI
│   └── infra/              # Docker infrastructure
└── scripts/                 # Utility scripts
    ├── start-services.sh
    └── stop-services.sh
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- Docker & Docker Compose
- OpenAI API key

### 1. Install Dependencies

```bash
# Express Gateway (TypeScript)
cd express-gateway
npm install
cd ..

# Python Services - Use MASTER requirements file
cd ../..  # Go to project root
pip install -r requirements.txt
```

### 2. Environment Setup

Create `.env` files:

**express-gateway/.env**:
```bash
PORT=3001
NODE_ENV=development
OPENAI_API_KEY=your_openai_api_key_here
N8N_SERVICE_URL=http://localhost:8001
RAG_SERVICE_URL=http://localhost:8002
N8N_WEBHOOK_URL=http://localhost:5678
WEAVIATE_URL=http://localhost:8080
```

**python-services/n8n-service/.env**:
```bash
OPENAI_API_KEY=your_openai_api_key_here
N8N_WEBHOOK_URL=http://localhost:5678
EXPRESS_GATEWAY_URL=http://localhost:3001
```

**python-services/rag-service/.env**:
```bash
WEAVIATE_URL=http://localhost:8080
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Start Services

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Start all services
./scripts/start-services.sh
```

This will start:
- 🐳 Docker infrastructure (Weaviate, n8n, PostgreSQL, Redis)
- 🐍 Python services (n8n-service:8001, rag-service:8002)
- 🌐 Express Gateway (port 3001)

### 4. Verify Services

```bash
# Health checks
curl http://localhost:3001/api/health          # Express Gateway
curl http://localhost:8001/health              # n8n Service
curl http://localhost:8002/health              # RAG Service
curl http://localhost:3001/api/health/services # All services
```

### 5. Test Chat

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, what can you help me with?"}'
```

## 🔧 Development Workflow

### Request Flow

```
User Request → Express Gateway → Tool Router → Python Services
                     ↓
              OpenAI API + Tool Calls
                     ↓
            Response with Tool Results
```

**Example Tool Call Flow:**
1. User: "Search my notes for project ideas"
2. Express Gateway receives request
3. OpenAI decides to call `rag_search` tool
4. Tool Router routes to RAG Service (port 8002)
5. RAG Service queries Weaviate
6. Results flow back through the chain

### Adding New Tools

1. **Define in Contracts**: Add to `shared/contracts/ToolDefs.ts`
2. **Route in Gateway**: Update `express-gateway/src/types/tools.ts` categories
3. **Implement in Service**: Add handler in appropriate Python service
4. **Test**: Use `/api/tools/available` to verify

### Service Communication

Services communicate via HTTP REST APIs:

```typescript
// Express Gateway calls Python services
const response = await axios.post('http://localhost:8001/tools/weekly_planner', {
  parameters: { week_start: '2024-09-13', goals: ['Finish project'] }
});
```

## 📝 API Endpoints

### Express Gateway (Port 3001)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Main chat interface with tool calling |
| `/api/tools/execute` | POST | Execute individual tools |
| `/api/tools/available` | GET | List all available tools |
| `/api/health` | GET | Service health check |

### n8n Service (Port 8001)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/prompt` | POST | Legacy chat endpoint (proxies to Gateway) |
| `/tools/{tool_name}` | POST | Execute n8n workflow tools |
| `/health` | GET | Service health check |

### RAG Service (Port 8002)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/tools/rag_search` | POST | Vector search in knowledge base |
| `/index/document` | POST | Index new documents |
| `/index/stats` | GET | Get index statistics |
| `/health` | GET | Service health check |

## 🛠️ Tool Categories

### Direct Tools (Express Gateway)
- `note_append` - Append to markdown files
- `weather_lookup` - Get weather information
- `maps_link` - Generate Google Maps links

### n8n Workflow Tools (n8n Service)
- `weekly_planner` - AI-powered weekly planning
- `pdf_inbox` - Process PDFs with extraction
- `calendar_scheduling` - Smart calendar management
- `task_create` - Create tasks via workflows

### RAG Tools (RAG Service)
- `rag_search` - Semantic search in knowledge base

## 🐳 Infrastructure Services

Started via Docker Compose in `shared/infra/docker-compose.yml`:

- **Weaviate** (port 8080) - Vector database for RAG
- **n8n** (port 5678) - Workflow automation platform
- **PostgreSQL** (internal) - Database for n8n
- **Redis** (port 6379) - Caching and session storage

## 🔍 Monitoring & Debugging

### Logs
```bash
# Express Gateway logs
cd express-gateway && npm run dev

# Python service logs
cd python-services/n8n-service && python -m uvicorn main:app --reload --port 8001
cd python-services/rag-service && python -m uvicorn main:app --reload --port 8002

# Infrastructure logs
docker-compose -f shared/infra/docker-compose.yml logs -f
```

### Health Monitoring
```bash
# Comprehensive health check
curl http://localhost:3001/api/health/services | jq
```

## 🚦 Stopping Services

```bash
# Stop all backend services
./scripts/stop-services.sh

# Stop infrastructure (Docker)
docker-compose -f shared/infra/docker-compose.yml down
```

## 📚 Shared Resources

### Contracts (`shared/contracts/`)
- `ToolDefs.ts` - OpenAI tool definitions
- `LifeDB.ts` - Personal data schemas
- `RagChunk.ts` - Vector search data structures
- `WebhookContracts.ts` - n8n webhook payloads

### Prompts (`shared/prompts/`)
- `system-prompts.ts` - AI personality and behavior definitions

## 🔧 Troubleshooting

### Common Issues

1. **Port conflicts**: Check if ports 3001, 8001, 8002 are available
2. **Docker not running**: Ensure Docker daemon is running
3. **Missing API keys**: Check all `.env` files have OpenAI API key
4. **Service communication**: Verify all services are healthy via `/health` endpoints

### Reset Everything
```bash
./scripts/stop-services.sh
docker-compose -f shared/infra/docker-compose.yml down -v
./scripts/start-services.sh
```

## 🎯 Next Steps

1. **OpenAI Realtime API**: Add WebSocket support for voice
2. **Authentication**: Add user authentication and session management
3. **Monitoring**: Add proper logging and metrics
4. **Testing**: Add comprehensive test suites
5. **Deployment**: Add production deployment configurations
