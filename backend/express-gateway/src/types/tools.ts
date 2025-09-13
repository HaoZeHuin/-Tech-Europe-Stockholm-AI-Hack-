// Import the tool definitions from your existing contracts
import { z } from 'zod';

// Import from shared contracts (now with dependencies installed)
export * from '../../../shared/contracts/ToolDefs';
export * from '../../../shared/contracts/RagChunk';
export * from '../../../shared/contracts/LifeDB';
export * from '../../../shared/contracts/WebhookContracts';

// Service communication types
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ToolExecutionRequest {
  name: string;
  parameters: Record<string, any>;
  user_id?: string;
  conversation_id?: string;
}

export interface ToolExecutionResponse {
  success: boolean;
  result?: any;
  error?: string;
  execution_time_ms: number;
  service_used: 'direct' | 'n8n' | 'rag' | 'ml';
}

// Tool categories for routing (import from your contracts, but define routing logic here)
export const TOOL_CATEGORIES = {
  // Direct execution tools (handled by Express gateway)
  DIRECT: [
    'note_append',
    'weather_lookup', 
    'maps_link'
  ],
  
  // RAG/Vector search tools (routed to python rag-service)
  RAG_TOOLS: [
    'rag_search'
  ],
  
  // n8n workflow tools (handled separately by Ignatius)
  N8N_WORKFLOWS: [
    'calendar_scheduling',
  ]
} as const;

export type ToolCategory = keyof typeof TOOL_CATEGORIES;
export type DirectTool = typeof TOOL_CATEGORIES.DIRECT[number];
export type N8nTool = typeof TOOL_CATEGORIES.N8N_WORKFLOWS[number];
export type RagTool = typeof TOOL_CATEGORIES.RAG_TOOLS[number];