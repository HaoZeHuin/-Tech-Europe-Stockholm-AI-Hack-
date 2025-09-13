# Tool System

## 🛠️ Overview

The tool system is the core execution engine, handling both direct backend operations and complex n8n workflow integrations.

## 🏗️ Architecture

### **Tool Execution Flow**
```
AI Tool Call
    ↓
Tool Router
    ├── Direct Tools ──── Backend Handler ──── Local Execution
    └── n8n Tools ────── n8n Webhook ──────── Workflow Execution
    ↓
Result Processing
    ↓
Response to AI
```

**Tool Categories**:
- **Direct Tools** (fast, local): `rag_search`, `note_append`, `task_create`, `weather_lookup`, `maps_link`
- **n8n Workflows** (complex, external): `calendar_scheduling`, `weekly_planner`, `pdf_inbox`

```typescript
// Tool categorization
const TOOL_CATEGORIES = {
  // Direct execution tools (fast, local)
  DIRECT: [
    'rag_search',           // Search knowledge base
    'note_append',          // Add to markdown files
    'task_create',          // Create tasks
    'weather_lookup',       // Get weather info
    'maps_link'             // Generate maps links
  ],
  
  // n8n workflow tools (complex, external)
  N8N_WORKFLOWS: [
    'calendar_scheduling',  // Smart calendar management
    'weekly_planner',       // AI-powered weekly planning
    'pdf_inbox'            // Document processing
  ]
};
```

## 🔧 Direct Tools Implementation

### **Tool Handler Base Class**

```typescript
// ToolHandler.ts
abstract class ToolHandler {
  abstract name: string;
  abstract execute(params: any): Promise<ToolResult>;
  
  protected validateParams(params: any, schema: ZodSchema): any {
    try {
      return schema.parse(params);
    } catch (error) {
      throw new ToolValidationError(
        `Invalid parameters for ${this.name}: ${error.message}`
      );
    }
  }
  
  protected createSuccessResult(data: any): ToolResult {
    return {
      success: true,
      data,
      message: 'Operation completed successfully'
    };
  }
  
  protected createErrorResult(error: string): ToolResult {
    return {
      success: false,
      error,
      message: 'Operation failed'
    };
  }
}
```

### **Key Direct Tools**

**RAG Search**: Vector similarity search in Weaviate  
**Note Append**: Add content to markdown files with section support  
**Weather Lookup**: Get weather with location resolution (e.g., "Legora HQ")  
**Maps Link**: Generate Google Maps URLs with traffic data  
**Task Create**: Create tasks in SQLite database

## 🔄 n8n Workflow Integration

### **n8n Tool Handler**
```typescript
class N8nToolHandler {
  async execute(toolName: string, params: any) {
    const webhookUrl = this.getWebhookUrl(toolName);
    const payload = {
      request_id: generateRequestId(),
      workflow_type: toolName,
      data: params
    };
    
    return await this.n8nClient.callWebhook(webhookUrl, payload);
  }
}
```

### **Key n8n Workflows**

**Calendar Scheduling**: Google Calendar integration with conflict detection and optimal time finding  
**Weekly Planner**: AI-powered weekly planning with goal analysis  
**PDF Inbox**: Document processing with summarization and action item extraction

## 🔧 Tool Router

**Main Router**: Routes AI tool calls to appropriate handlers (direct tools vs n8n workflows)  
**Middleware**: Handles validation, permissions, logging, and metrics  
**Error Handling**: Graceful fallbacks and user-friendly error messages

## 🧪 Testing

**Unit Tests**: Individual tool functionality  
**Integration Tests**: End-to-end tool execution flows  
**Test Framework**: Automated testing with validation and error reporting

---

*See n8n Workflows guide for detailed workflow implementation.*
