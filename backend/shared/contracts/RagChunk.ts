import { z } from 'zod';

// =============================================================================
// RAG (Retrieval-Augmented Generation) DATA STRUCTURES
// =============================================================================

// Base chunk structure for any indexed content
export const RagChunkSchema = z.object({
  // Content
  text: z.string().min(1, "Chunk text cannot be empty"),
  
  // Source identification
  path: z.string().min(1, "Source path cannot be empty"), // File path or URL
  anchor: z.string().optional(), // Section header, page number, or paragraph ID
  
  // Retrieval metadata
  score: z.number().min(0).max(1), // Similarity/relevance score
  
  // Content metadata
  metadata: z.object({
    // File-level metadata
    file_type: z.enum(["markdown", "pdf", "txt", "docx", "html"]).optional(),
    file_size: z.number().optional(), // bytes
    created_at: z.string().optional(), // ISO 8601
    modified_at: z.string().optional(), // ISO 8601
    
    // Content-level metadata
    chunk_index: z.number().optional(), // Position in the document
    total_chunks: z.number().optional(), // Total chunks in the document
    word_count: z.number().optional(),
    char_count: z.number().optional(),
    
    // Semantic metadata
    section_title: z.string().optional(), // Header/section this chunk belongs to
    page_number: z.number().optional(), // For PDFs
    paragraph_index: z.number().optional(),
    
    // Classification
    content_type: z.enum([
      "text", "code", "table", "list", "heading", 
      "quote", "formula", "diagram_caption"
    ]).optional(),
    
    // Topics and tags
    topics: z.array(z.string()).default([]), // Auto-extracted topics
    tags: z.array(z.string()).default([]), // User-defined tags
    
    // Additional context
    language: z.string().optional(), // ISO 639-1 code
    reading_level: z.enum(["elementary", "intermediate", "advanced"]).optional(),
    
    // Vector embedding metadata
    embedding_model: z.string().optional(), // e.g., "text-embedding-3-small"
    embedding_dimensions: z.number().optional(),
  }).default({}),
});

// Extended chunk with vector embedding
export const RagChunkWithEmbeddingSchema = RagChunkSchema.extend({
  embedding: z.array(z.number()).optional(), // Vector embedding
  embedding_hash: z.string().optional(), // Hash of the embedding for deduplication
});

// Search result structure
export const RagSearchResultSchema = z.object({
  chunks: z.array(RagChunkSchema),
  
  // Search metadata
  query: z.string(),
  total_found: z.number().min(0),
  query_time_ms: z.number().min(0),
  
  // Search parameters used
  search_params: z.object({
    top_k: z.number(),
    score_threshold: z.number().optional(),
    filter_paths: z.array(z.string()).optional(),
    filter_types: z.array(z.string()).optional(),
    date_range: z.object({
      start: z.string().optional(), // ISO 8601
      end: z.string().optional(),   // ISO 8601
    }).optional(),
  }),
  
  // Aggregated insights
  insights: z.object({
    most_relevant_sources: z.array(z.string()).default([]), // Top source files
    topic_distribution: z.record(z.number()).default({}), // topic -> count
    content_types: z.record(z.number()).default({}), // type -> count
    date_range: z.object({
      earliest: z.string().optional(),
      latest: z.string().optional(),
    }).optional(),
  }).default({}),
});

// Index statistics
export const RagIndexStatsSchema = z.object({
  total_documents: z.number().min(0),
  total_chunks: z.number().min(0),
  total_size_bytes: z.number().min(0),
  
  // By file type
  by_file_type: z.record(z.object({
    count: z.number(),
    total_chunks: z.number(),
    size_bytes: z.number(),
  })).default({}),
  
  // Index health
  last_updated: z.string(), // ISO 8601
  index_version: z.string(),
  embedding_model: z.string(),
  
  // Performance metrics
  avg_chunk_size: z.number().optional(),
  avg_chunks_per_document: z.number().optional(),
});

// Document processing status
export const DocumentProcessingStatusSchema = z.object({
  path: z.string(),
  status: z.enum(["pending", "processing", "completed", "failed", "skipped"]),
  
  // Processing details
  started_at: z.string().optional(), // ISO 8601
  completed_at: z.string().optional(), // ISO 8601
  processing_time_ms: z.number().optional(),
  
  // Results
  chunks_created: z.number().default(0),
  chunks_updated: z.number().default(0),
  chunks_deleted: z.number().default(0),
  
  // Error information
  error_message: z.string().optional(),
  error_code: z.string().optional(),
  
  // Processing metadata
  file_hash: z.string().optional(), // For change detection
  processor_version: z.string().optional(),
  processing_options: z.record(z.any()).default({}),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type RagChunk = z.infer<typeof RagChunkSchema>;
export type RagChunkWithEmbedding = z.infer<typeof RagChunkWithEmbeddingSchema>;
export type RagSearchResult = z.infer<typeof RagSearchResultSchema>;
export type RagIndexStats = z.infer<typeof RagIndexStatsSchema>;
export type DocumentProcessingStatus = z.infer<typeof DocumentProcessingStatusSchema>;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Create a minimal chunk (useful for testing or simple cases)
export function createMinimalChunk(text: string, path: string, score: number = 0.0): RagChunk {
  return {
    text,
    path,
    score,
    metadata: {},
  };
}

// Create a chunk with common metadata
export function createChunkWithMetadata(
  text: string,
  path: string,
  options: {
    score?: number;
    anchor?: string;
    section_title?: string;
    page_number?: number;
    content_type?: RagChunk['metadata']['content_type'];
    topics?: string[];
    tags?: string[];
  } = {}
): RagChunk {
  return {
    text,
    path,
    score: options.score ?? 0.0,
    anchor: options.anchor,
    metadata: {
      section_title: options.section_title,
      page_number: options.page_number,
      content_type: options.content_type,
      topics: options.topics ?? [],
      tags: options.tags ?? [],
    },
  };
}

// Extract unique sources from search results
export function extractSources(searchResult: RagSearchResult): string[] {
  return Array.from(new Set(searchResult.chunks.map(chunk => chunk.path)));
}

// Group chunks by source path
export function groupChunksBySource(chunks: RagChunk[]): Record<string, RagChunk[]> {
  return chunks.reduce((acc, chunk) => {
    if (!acc[chunk.path]) {
      acc[chunk.path] = [];
    }
    acc[chunk.path].push(chunk);
    return acc;
  }, {} as Record<string, RagChunk[]>);
}

// Calculate average score for chunks
export function calculateAverageScore(chunks: RagChunk[]): number {
  if (chunks.length === 0) return 0;
  return chunks.reduce((sum, chunk) => sum + chunk.score, 0) / chunks.length;
}
