# Backend Development

## 🏗️ Architecture Overview

The backend uses a **multi-service architecture** with an Express Gateway coordinating between TypeScript and Python services.

```
Frontend (Voice/Chat) → Express Gateway → Python Services
                           ↓                ↓
                      Tool Router      n8n/RAG Services
                           ↓                ↓
                    Direct Tools      Weaviate/Workflows
```

### Service Architecture
- **Express Gateway** (TypeScript): API gateway, tool routing, authentication
- **Python Services**: Specialized FastAPI services for RAG and n8n integration
- **Shared Contracts**: Common TypeScript types and tool definitions

## 🔧 Core Components

### **Backend Structure**
```
backend/
├── express-gateway/         # TypeScript API Gateway
│   ├── src/
│   │   ├── routes/         # API endpoints (/chat, /tools, /health)
│   │   ├── services/       # Tool routing logic
│   │   ├── middleware/     # Auth, validation, logging
│   │   └── types/          # Type definitions
│   ├── package.json
│   └── .env
├── python-services/         # FastAPI Microservices
│   ├── n8n-service/        # n8n workflow integration
│   ├── rag-service/        # RAG and vector search
│   └── */requirements.txt
├── shared/                  # Shared Resources
│   ├── contracts/          # TypeScript types & schemas
│   ├── infra/             # Docker compose
│   └── prompts/           # System prompts
└── scripts/               # Service management
    ├── start-services.sh
    ├── stop-services.sh
    └── test-connections.sh
```

### **Key Responsibilities**

#### Express Gateway
- **API Gateway**: Single entry point for frontend requests
- **Tool Routing**: Intelligent routing to appropriate services
- **Authentication**: OpenAI token management and user sessions
- **Request/Response**: Validation using shared contracts

#### Python Services
- **RAG Service**: Vector search, document indexing, Weaviate operations
- **n8n Service**: Workflow triggers, calendar integration, PDF processing
- **Data Access**: SQLite queries and specialized tool execution

## 🛠️ Implementation Guide

### **1. Service Management**

The backend includes comprehensive service management scripts:

```bash
# Install all dependencies
./scripts/install-dependencies.sh

# Start all services (Express Gateway + Python services)
./scripts/start-services.sh

# Test service connections and health
./scripts/test-connections.sh

# Stop all services
./scripts/stop-services.sh
```

### **2. Express Gateway Setup**

```typescript
// src/server.ts
import express from 'express';
import { toolRouter } from './routes/tools';
import { chatRouter } from './routes/chat';
import { webhookRouter } from './routes/webhooks';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(logger());

// Routes
app.use('/tools', toolRouter);
app.use('/chat', chatRouter);
app.use('/webhooks', webhookRouter);

app.listen(3001, () => {
  console.log('Backend server running on port 3001');
});
```

### **2. Tool Execution**

```typescript
// src/routes/tools.ts
export const toolRouter = express.Router();

toolRouter.post('/execute', async (req, res) => {
  const { tool_name, parameters } = req.body;
  
  try {
    const result = await toolRouter.execute(tool_name, parameters);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### **3. Chat Endpoint**

```typescript
// src/routes/chat.ts
export const chatRouter = express.Router();

chatRouter.post('/', async (req, res) => {
  const { message, context } = req.body;
  
  // Build contextual prompt
  const systemPrompt = createContextualPrompt(
    CHAT_INTERACTION_PROMPT,
    context
  );
  
  // Call OpenAI Responses API
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ],
    tools: OPENAI_TOOLS
  });
  
  res.json({ response: response.choices[0].message });
});
```

### **4. n8n Webhook Integration**

```typescript
// src/routes/webhooks.ts
export const webhookRouter = express.Router();

webhookRouter.post('/n8n/:workflow', async (req, res) => {
  const { workflow } = req.params;
  const payload = req.body;
  
  try {
    const result = await n8nClient.callWorkflow(workflow, payload);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 🔌 External Service Integration

### **OpenAI Integration**

```typescript
// src/services/openai.ts
class OpenAIService {
  async createRealtimeToken(): Promise<string> {
    // Generate ephemeral token for frontend
    return await this.openai.tokens.create({
      type: 'realtime',
      expires_in: 3600
    });
  }
  
  async processWithTools(message: string, tools: any[]) {
    return await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: message }],
      tools
    });
  }
}
```

### **Weaviate Integration**

```typescript
// src/services/weaviate.ts
class WeaviateService {
  async search(query: string, topK: number = 5) {
    const queryEmbedding = await this.embedQuery(query);
    
    return await this.client.query
      .get('DocumentChunk', ['text', 'path', 'score'])
      .withNearVector({ vector: queryEmbedding })
      .withLimit(topK)
      .do();
  }
  
  async addDocument(path: string, chunks: DocumentChunk[]) {
    // Add document chunks to Weaviate
    for (const chunk of chunks) {
      await this.client.data.creator()
        .withClassName('DocumentChunk')
        .withProperties(chunk)
        .do();
    }
  }
}
```

### **SQLite Integration**

```typescript
// src/services/database.ts
class DatabaseService {
  async createTask(task: TaskCreateParams): Promise<Task> {
    const db = await this.getConnection();
    
    const result = await db.run(`
      INSERT INTO tasks (title, description, status, priority, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [task.title, task.description, 'inbox', task.priority, new Date().toISOString()]);
    
    return { id: result.lastID, ...task };
  }
  
  async getTasks(filters: TaskFilters): Promise<Task[]> {
    const db = await this.getConnection();
    
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];
    
    if (filters.status?.length) {
      query += ' AND status IN (' + filters.status.map(() => '?').join(',') + ')';
      params.push(...filters.status);
    }
    
    return await db.all(query, params);
  }
}
```

## 🔐 Authentication & Security

### **API Key Management**

```typescript
// src/middleware/auth.ts
export const authenticateAPI = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || !isValidAPIKey(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  next();
};
```

### **Input Validation**

```typescript
// src/middleware/validation.ts
export const validateToolCall = (schema: ZodSchema) => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
  };
};
```

## 📊 Monitoring & Logging

### **Request Logging**

```typescript
// src/middleware/logger.ts
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};
```

### **Error Handling**

```typescript
// src/middleware/errorHandler.ts
export const errorHandler = (error, req, res, next) => {
  console.error('Error:', error);
  
  if (error instanceof ValidationError) {
    return res.status(400).json({ error: 'Validation failed', details: error.errors });
  }
  
  if (error instanceof ToolExecutionError) {
    return res.status(500).json({ error: 'Tool execution failed', message: error.message });
  }
  
  res.status(500).json({ error: 'Internal server error' });
};
```

## 🧪 Testing

### **Unit Tests**

```typescript
// src/tools/__tests__/ragSearch.test.ts
describe('RAG Search Tool', () => {
  test('should search documents successfully', async () => {
    const tool = new RagSearchTool(mockWeaviate, mockVectorizer);
    const result = await tool.execute({ query: 'test', top_k: 5 });
    
    expect(result.success).toBe(true);
    expect(result.chunks).toHaveLength(5);
  });
});
```

### **Integration Tests**

```typescript
// src/__tests__/api.test.ts
describe('API Endpoints', () => {
  test('POST /tools/execute should execute tool', async () => {
    const response = await request(app)
      .post('/tools/execute')
      .send({
        tool_name: 'weather_lookup',
        parameters: { location: 'Stockholm' }
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## 🚀 Deployment

### **Docker Configuration**

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
EXPOSE 3001

CMD ["node", "dist/server.js"]
```

### **Environment Configuration**

```typescript
// src/config/index.ts
export const config = {
  port: process.env.PORT || 3001,
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    realtimeUrl: process.env.OPENAI_REALTIME_URL
  },
  weaviate: {
    url: process.env.WEAVIATE_URL || 'http://localhost:8080'
  },
  database: {
    path: process.env.DATABASE_PATH || './data/life.db'
  }
};
```

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start with hot reload
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed test data
npm run db:reset         # Reset database
```

---

*This backend guide covers the essential patterns for building the API layer. See the Tool System guide for detailed tool implementation and the n8n Workflows guide for workflow integration.*
