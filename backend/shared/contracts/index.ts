// =============================================================================
// JARVIS-IN-A-BOX CONTRACTS - MAIN EXPORT FILE
// =============================================================================

// Tool definitions and OpenAI integration
export * from './ToolDefs';

// n8n webhook contracts
export * from './WebhookContracts';

// RAG (Retrieval-Augmented Generation) data structures
export * from './RagChunk';

// Life database schemas (tasks, projects, mood, etc.)
export * from './LifeDB';

// =============================================================================
// VERSION INFO
// =============================================================================

export const CONTRACTS_VERSION = "1.0.0";
export const LAST_UPDATED = "2024-09-13";

// =============================================================================
// COMMON UTILITY TYPES
// =============================================================================

// Generic API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string; // ISO 8601
  request_id?: string;
}

// Pagination for list endpoints
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// File upload metadata
export interface FileUpload {
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  uploaded_at: string; // ISO 8601
  checksum?: string;
}

// User preferences (for future multi-user support)
export interface UserPreferences {
  timezone: string;
  date_format: string;
  time_format: '12h' | '24h';
  language: string; // ISO 639-1 code
  voice_settings?: {
    preferred_voice: string;
    speech_rate: number; // 0.5 to 2.0
    pitch: number; // -20 to 20
  };
  notification_settings?: {
    email_enabled: boolean;
    push_enabled: boolean;
    quiet_hours: {
      start: string; // "22:00"
      end: string;   // "08:00"
    };
  };
}

// System health check
export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'up' | 'down';
    vector_db: 'up' | 'down';
    n8n: 'up' | 'down';
    openai: 'up' | 'down';
  };
  version: string;
  uptime_seconds: number;
}
