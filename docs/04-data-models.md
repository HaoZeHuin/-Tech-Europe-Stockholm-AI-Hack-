# Data Models

## 🗄️ Overview

Jarvis-in-a-Box uses a multi-layered data architecture optimized for personal use, privacy, and AI interaction. Data is stored locally with selective cloud integration.

## 📊 Data Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYERS                              │
├─────────────────────────────────────────────────────────────┤
│  SQLite (LifeDB)           │  Weaviate (Vector DB)         │
│  ┌─────────────────────────┐  │  ┌─────────────────────────┐ │
│  │ Personal Data           │  │  │ Document Embeddings     │ │
│  │ - Tasks & Projects      │  │  │ - Markdown Chunks       │ │
│  │ - Calendar Events       │  │  │ - PDF Extracts          │ │
│  │ - Mood & Habits         │  │  │ - Search Vectors        │ │
│  │ - Goals & Time Logs     │  │  │ - Metadata              │ │
│  └─────────────────────────┘  │  └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  File System                │  Redis Cache                  │
│  ┌─────────────────────────┐  │  ┌─────────────────────────┐ │
│  │ Document Storage        │  │  │ Session Data            │ │
│  │ - Markdown Vault        │  │  │ - User Context          │ │
│  │ - PDF Documents         │  │  │ - Tool Results          │ │
│  │ - Generated Content     │  │  │ - Temporary Data        │ │
│  └─────────────────────────┘  │  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🏗️ Core Data Models

### **LifeDB (SQLite) - Personal Data**

**Purpose**: Store structured personal data that changes frequently

**Key Models**:
- **Tasks**: Personal task management with priorities, due dates, projects
- **Projects**: Goal-oriented work with milestones and status tracking  
- **Calendar Events**: Time blocks, meetings, appointments
- **Mood Entries**: Wellness tracking with context and insights
- **Habits**: Recurring behaviors with streak tracking
- **Goals**: Long-term objectives with progress measurement

**Characteristics**:
- **Local-first**: All data stored on device
- **Relational**: Normalized structure with foreign keys
- **Versioned**: Track changes over time
- **Indexed**: Fast queries for AI tool execution

### **Weaviate (Vector DB) - Knowledge Base**

**Purpose**: Semantic search over documents and knowledge

**Key Models**:
- **Document Chunks**: Text segments from markdown/PDFs
- **Embeddings**: Vector representations for similarity search
- **Metadata**: File paths, timestamps, content types
- **Search Results**: Ranked chunks with relevance scores

**Characteristics**:
- **Semantic**: Understands meaning, not just keywords
- **Scalable**: Handles large document collections
- **Fast**: Sub-second search responses
- **Contextual**: Maintains document structure and relationships

### **File System - Document Storage**

**Purpose**: Store raw documents and generated content

**Structure**:
```
data/
├── vault/                    # Markdown knowledge base
│   ├── daily/               # Daily notes
│   ├── projects/            # Project documentation
│   └── reference/           # Reference materials
├── pdfs/                    # PDF documents
├── indices/                 # Vector database files
└── life.db                  # SQLite database
```

**Characteristics**:
- **Hierarchical**: Organized folder structure
- **Versioned**: Git-based change tracking
- **Accessible**: Direct file system access
- **Portable**: Easy backup and migration

## 🔄 Data Flow Patterns

### **Document Ingestion Flow**
```
Raw Document (PDF/Markdown)
    ↓
Content Extraction
    ↓
Chunking & Processing
    ↓
Vector Embedding Generation
    ↓
Weaviate Storage + File System
    ↓
Searchable Knowledge Base
```

### **Personal Data Flow**
```
User Action (Voice/Chat)
    ↓
AI Tool Call
    ↓
Data Validation
    ↓
SQLite Database Update
    ↓
Context Refresh
    ↓
AI Response Generation
```

### **Search & Retrieval Flow**
```
User Query
    ↓
Query Embedding
    ↓
Vector Similarity Search
    ↓
Ranked Results
    ↓
Context Assembly
    ↓
AI Processing
```

## 🔗 Data Relationships

### **Cross-Model Connections**

```typescript
// Example relationships
Task {
  id: string
  project_id?: string    // → Project.id
  related_notes: string[] // → File paths
}

Project {
  id: string
  goals: string[]        // → Goal.id
  documents: string[]    // → File paths
}

DocumentChunk {
  path: string          // → File system
  metadata: {
    project_id?: string // → Project.id
    task_id?: string    // → Task.id
  }
}
```

### **Context Assembly**

The system assembles context by:
1. **Direct queries** to SQLite for structured data
2. **Vector search** in Weaviate for relevant documents
3. **File system** access for raw content
4. **Relationship traversal** to find connected data

## 🔐 Privacy & Security

### **Data Classification**

**Public Data**: 
- Weather information
- Maps data
- General knowledge

**Personal Data** (Local only):
- Tasks, projects, calendar
- Mood, habits, goals
- Personal documents
- Search history

**Sensitive Data** (Encrypted):
- API keys and credentials
- User preferences
- Audit logs

### **Data Retention**

- **Personal Data**: Permanent local storage
- **Cache Data**: 24-hour TTL
- **Session Data**: Until logout
- **Temporary Data**: Immediate cleanup

## 📈 Performance Characteristics

### **Query Performance**

| Operation | Database | Typical Latency |
|-----------|----------|-----------------|
| Task lookup | SQLite | < 10ms |
| Calendar query | SQLite | < 50ms |
| Document search | Weaviate | < 500ms |
| File read | File System | < 100ms |

### **Storage Requirements**

| Data Type | Typical Size | Growth Rate |
|-----------|--------------|-------------|
| Personal data | 10-50MB | Linear |
| Document vectors | 100-500MB | With documents |
| Raw documents | 1-10GB | With usage |
| Cache data | 10-100MB | Constant |

## 🛠️ Data Management

### **Backup Strategy**

1. **SQLite**: Automated daily backups
2. **Documents**: Git-based versioning
3. **Vectors**: Incremental re-indexing
4. **Configuration**: Export/import tools

### **Migration & Sync**

- **Local-first**: No automatic cloud sync
- **Export tools**: Manual data export
- **Import tools**: Restore from backup
- **Version compatibility**: Schema migrations

### **Maintenance**

- **Index optimization**: Weekly vector reindexing
- **Cache cleanup**: Daily expired data removal
- **Database vacuum**: Monthly SQLite optimization
- **File organization**: Quarterly cleanup

---

*This data models overview provides the foundation for understanding how information flows through Jarvis-in-a-Box. See specific implementation guides for detailed database schemas and API usage.*
