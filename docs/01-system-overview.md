# System Overview

## 🎯 Project Vision

Jarvis-in-a-Box is a **voice-first, privacy-aware personal OS** that lives on your device and acts for you. It reads your Markdown/PDF knowledge, manages your tasks & calendar, and runs permissioned workflows via n8n.

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    JARVIS-IN-A-BOX                          │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Next.js)          │  Backend (Express)          │
│  ┌─────────────────────────┐  │  ┌─────────────────────────┐ │
│  │ Voice Interface         │  │  │ Tool Handlers           │ │
│  │ - WebRTC to OpenAI      │  │  │ - Direct Tools          │ │
│  │ - Real-time STT/TTS     │  │  │ - n8n Webhooks          │ │
│  │ - Approval UI           │  │  │ - Auth & Validation     │ │
│  └─────────────────────────┘  │  └─────────────────────────┘ │
│  ┌─────────────────────────┐  │  ┌─────────────────────────┐ │
│  │ Chat Interface          │  │  │ OpenAI Integration      │ │
│  │ - Text Input            │  │  │ - Realtime API          │ │
│  │ - File Upload           │  │  │ - Responses API         │ │
│  │ - Markdown Rendering    │  │  │ - Tool Calling          │ │
│  └─────────────────────────┘  │  └─────────────────────────┘ │
│  ┌─────────────────────────┐  │  ┌─────────────────────────┐ │
│  │ Memory Interface        │  │  │ Data Layer              │ │
│  │ - Knowledge Search      │  │  │ - SQLite (LifeDB)       │ │
│  │ - Document Management   │  │  │ - Weaviate (Vector DB)  │ │
│  │ - RAG Results           │  │  │ - File System           │ │
│  └─────────────────────────┘  │  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                        │
├─────────────────────────────────────────────────────────────┤
│  n8n Workflows              │  OpenAI APIs                 │
│  ┌─────────────────────────┐  │  ┌─────────────────────────┐ │
│  │ Weekly Planner          │  │  │ Realtime API            │ │
│  │ - Goal Analysis         │  │  │ - Voice Streaming       │ │
│  │ - Calendar Integration  │  │  │ - Tool Calling          │ │
│  │ - Time Block Creation   │  │  │ - WebRTC Connection     │ │
│  └─────────────────────────┘  │  └─────────────────────────┘ │
│  ┌─────────────────────────┐  │  ┌─────────────────────────┐ │
│  │ PDF Inbox               │  │  │ Responses API           │ │
│  │ - Document Processing   │  │  │ - Text/File Processing  │ │
│  │ - Summary Generation    │  │  │ - Tool Calling          │ │
│  │ - Action Item Extraction│  │  │ - Single Request Flow   │ │
│  └─────────────────────────┘  │  └─────────────────────────┘ │
│  ┌─────────────────────────┐  │  ┌─────────────────────────┐ │
│  │ Calendar Scheduling     │  │  │ External APIs           │ │
│  │ - Google Calendar API   │  │  │ - Weather Service       │ │
│  │ - Conflict Detection    │  │  │ - Google Maps API       │ │
│  │ - Meeting Links         │  │  │ - Email Service         │ │
│  └─────────────────────────┘  │  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Key Components:**
- **Frontend**: Voice/Chat UI with WebRTC to OpenAI
- **Backend**: Tool execution and n8n webhook relay  
- **Data**: SQLite (personal data) + Weaviate (vector search)
- **Workflows**: n8n for complex operations (calendar, PDF processing)

## 🔄 Data Flow

**Voice**: User speaks → WebRTC → OpenAI → Tool calls → Backend → Response  
**Chat**: User types → Backend → OpenAI → Tool calls → Response  
**n8n**: AI tool call → Backend → n8n webhook → External APIs → Response

## 🛠️ Tech Stack

- **Frontend**: Next.js + TypeScript + WebRTC
- **Backend**: Express + SQLite + Weaviate  
- **AI**: OpenAI Realtime/Responses APIs
- **Workflows**: n8n + External APIs
- **Infra**: Docker + Redis + PostgreSQL

## 🔐 Privacy

- **Local-first**: Personal data stays on device
- **Selective sync**: Only AI processing goes to cloud
- **Permission-based**: Always ask before external actions
- **Encrypted**: Sensitive data encrypted at rest

## 🎯 Core Features

- **Voice Interface**: Natural speech-to-speech with tool calling
- **Knowledge Search**: RAG over personal Markdown/PDFs  
- **Task Management**: Create and track tasks/projects
- **Smart Calendar**: AI-powered scheduling with conflict detection
- **Workflow Automation**: n8n for complex operations

---

*See specific guides for implementation details.*
