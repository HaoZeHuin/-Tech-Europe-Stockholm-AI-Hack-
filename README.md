# Jarvis-in-a-Box (Voice Edition)

A voice-first, privacy-aware personal OS that lives on your device and acts for you—reads your Markdown/PDF knowledge, manages your tasks & calendar, and runs permissioned workflows via n8n.

## 🎯 MVP Demo Scope

- **Voice as primary input**, chat & file-upload as secondary
- **Voice assistant** that understands you (RAG over your .md + PDFs) and acts with approval
- **Scheduler**: "Plan my week" → proposes time blocks from ICS + goals note → writes tasks/notes after you approve
- **Doc brain**: "Summarize this PDF & add action items to my vault" → appends to a Markdown note with citations
- **Weather + location helpers**: "What's the weather near Legora HQ?" → quick result + optional link to Google Maps route
- **Modes**: OpenAI online (primary, sponsor-aligned) and Local-leaning behavior for RAG/storage (no secrets leave device)

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React + Vite (Lovable scaffold) - Voice, Chat, Files, Memory tabs
- **Backend**: Multi-service architecture
  - **Express Gateway**: TypeScript API gateway and tool router
  - **Python Services**: FastAPI services for RAG and n8n integration
  - **Shared Contracts**: TypeScript types and tool definitions
- **Voice**: Browser → OpenAI Realtime (WebRTC) for low-latency speech↔speech
- **Non-voice**: Server calls OpenAI Responses/Agents for text/file flows
- **Vector DB**: Weaviate for RAG over personal documents
- **Workflows**: n8n for weekly planning and PDF processing
- **Database**: SQLite for personal life data (tasks, mood, habits)

### Voice Flow
1. Browser gets ephemeral token → WebRTC to OpenAI Realtime
2. Model streams STT/TTS; emits tool_call events when it needs data/action
3. Frontend posts tool_call to backend → backend executes → returns result
4. For write operations: frontend shows "Approve" → user confirms → backend executes

### Chat/File Flow
1. Frontend calls `/chat` on backend
2. Backend calls OpenAI Responses API with same tools + RAG context
3. Model plans → calls tools → backend executes → returns final response

## 🛠️ Repository Structure

```
jarvis-voice-os/
├── frontend/                    # React + Vite (Lovable output)
├── backend/                     # Multi-service backend architecture
│   ├── express-gateway/         # TypeScript API gateway & tool router
│   ├── python-services/         # FastAPI microservices
│   │   ├── n8n-service/         # n8n workflow integration
│   │   └── rag-service/         # RAG and vector search
│   ├── shared/                  # Shared resources
│   │   ├── contracts/           # TypeScript types & tool definitions
│   │   ├── infra/              # Docker compose files
│   │   └── prompts/            # System prompts & templates
│   └── scripts/                # Service management scripts
├── docs/                       # Comprehensive documentation
├── data/
│   ├── vault/                  # Markdown demo vault
│   ├── pdfs/                   # PDF documents
│   ├── indices/                # Vector DB files
│   └── life.db                 # SQLite personal data
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- Docker & Docker Compose
- OpenAI API key

### Setup
```bash
# Clone and install
git clone <repo-url>
cd jarvis-voice-os

# Install all dependencies using the setup script
cd backend && chmod +x scripts/install-dependencies.sh && ./scripts/install-dependencies.sh && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..

# Start infrastructure services
cd backend && docker-compose -f shared/infra/docker-compose.yml up -d && cd ..

# Start all backend services
cd backend && ./scripts/start-services.sh

# In a new terminal, start frontend
cd frontend && npm run dev
```

### Environment Variables
Copy and configure the environment files from examples:

```bash
# Backend services
cp backend/express-gateway/env.example backend/express-gateway/.env
cp backend/python-services/n8n-service/env.example backend/python-services/n8n-service/.env
cp backend/python-services/rag-service/env.example backend/python-services/rag-service/.env
```

**Backend (.env)**:
```bash
OPENAI_API_KEY=your_openai_key
WEAVIATE_URL=http://localhost:8080
N8N_WEBHOOK_URL=http://localhost:5678
REDIS_URL=redis://localhost:6379
DATABASE_PATH=../data/life.db
VAULT_PATH=../data/vault
```

**Frontend (.env.local)**:
```bash
VITE_BACKEND_URL=http://localhost:8000
VITE_OPENAI_REALTIME_URL=wss://api.openai.com/v1/realtime
```

## 🔧 Development

### Team Branches
- `main` - Stable demo

### Available Commands
```bash
npm run dev              # Start frontend + backend
npm run build            # Build all packages
npm run test             # Run tests
npm run lint             # Lint all packages
npm run docker:up        # Start infrastructure
npm run docker:down      # Stop infrastructure
npm run docker:logs     # View logs
```

### Key Contracts
- **ToolDefs.ts**: OpenAI tool schemas for Realtime & Responses APIs
- **WebhookContracts.ts**: n8n webhook payloads and responses
- **RagChunk.ts**: Vector search data structures
- **LifeDB.ts**: Personal data schemas (tasks, mood, habits)

## 🎤 Voice Tools Available

1. **rag_search** - Search personal markdown/PDF knowledge
2. **note_append** - Add content to markdown notes
3. **task_create** - Create tasks in personal system
4. **calendar_block** - Schedule time blocks
5. **weather_lookup** - Get weather information
6. **maps_link** - Generate Google Maps directions
7. **weekly_planner** - AI-powered weekly planning (via n8n)
8. **pdf_inbox** - Process PDFs with summary + action items (via n8n)

## 🔒 Privacy Features

- **Local-first**: Personal data stored locally in SQLite + vector DB
- **Selective sync**: Choose what data (if any) to sync to cloud
- **Encrypted storage**: Sensitive data encrypted at rest
- **Permission-based**: Always ask before modifying data
- **Audit trail**: Track what AI actions were taken

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

This is a hackathon project for Tech Europe Stockholm AI Hack. Team coordination via shared contracts in `/packages/contracts/`.
