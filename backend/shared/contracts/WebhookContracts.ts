import { z } from 'zod';

// =============================================================================
// N8N WEBHOOK CONTRACTS
// =============================================================================

// Base webhook payload structure
export const BaseWebhookPayloadSchema = z.object({
  request_id: z.string(), // Unique ID to track the request
  timestamp: z.string(), // ISO 8601 timestamp
  user_id: z.string().optional(), // Optional user identification
});

// =============================================================================
// WEEKLY PLANNER WEBHOOK
// =============================================================================

export const WeeklyPlannerWebhookPayloadSchema = BaseWebhookPayloadSchema.extend({
  workflow_type: z.literal("weekly_planner"),
  data: z.object({
    week_start: z.string(), // ISO 8601 date
    goals: z.array(z.string()),
    constraints: z.array(z.string()),
    calendar_path: z.string().optional(),
    // Additional context for the planner
    work_hours: z.object({
      start: z.string(), // "09:00"
      end: z.string(),   // "17:00"
      timezone: z.string().default("Europe/Stockholm"),
    }).optional(),
    break_preferences: z.object({
      lunch_duration: z.number().default(60), // minutes
      short_breaks: z.number().default(15),   // minutes
      break_frequency: z.number().default(120), // every N minutes
    }).optional(),
  }),
});

export const WeeklyPlannerWebhookResponseSchema = z.object({
  success: z.boolean(),
  request_id: z.string(),
  data: z.object({
    plan: z.object({
      week_start: z.string(),
      time_blocks: z.array(z.object({
        title: z.string(),
        start_time: z.string(), // ISO 8601
        end_time: z.string(),   // ISO 8601
        type: z.enum(["work", "personal", "break", "buffer", "deep_work", "meetings"]),
        description: z.string().optional(),
        goal_alignment: z.array(z.string()).default([]), // Which goals this block serves
        priority: z.enum(["low", "medium", "high"]).default("medium"),
      })),
      goals_mapped: z.array(z.string()),
      scheduling_notes: z.string().optional(),
      conflicts_resolved: z.array(z.string()).default([]),
    }),
  }).optional(),
  error: z.string().optional(),
  execution_time_ms: z.number().optional(),
});

// =============================================================================
// PDF INBOX WEBHOOK
// =============================================================================

export const PdfInboxWebhookPayloadSchema = BaseWebhookPayloadSchema.extend({
  workflow_type: z.literal("pdf_inbox"),
  data: z.object({
    pdf_path: z.string(),
    extract_action_items: z.boolean().default(true),
    target_vault_path: z.string().optional(),
    summarize: z.boolean().default(true),
    // Processing preferences
    processing_options: z.object({
      chunk_size: z.number().default(1000), // characters per chunk
      overlap: z.number().default(200),     // character overlap between chunks
      extract_tables: z.boolean().default(true),
      extract_images: z.boolean().default(false),
      ocr_enabled: z.boolean().default(true), // For scanned PDFs
    }).optional(),
    // Output formatting
    output_format: z.object({
      include_citations: z.boolean().default(true),
      markdown_style: z.enum(["standard", "obsidian", "notion"]).default("obsidian"),
      section_headers: z.boolean().default(true),
    }).optional(),
  }),
});

export const PdfInboxWebhookResponseSchema = z.object({
  success: z.boolean(),
  request_id: z.string(),
  data: z.object({
    summary: z.string().optional(),
    action_items: z.array(z.object({
      text: z.string(),
      priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
      due_date: z.string().optional(), // ISO 8601
      category: z.string().optional(), // e.g., "research", "follow-up", "decision"
      page_reference: z.number().optional(),
    })).default([]),
    notes_path: z.string().optional(),
    extracted_content: z.object({
      title: z.string().optional(),
      author: z.string().optional(),
      pages: z.number().optional(),
      word_count: z.number().optional(),
      key_topics: z.array(z.string()).default([]),
      chunks_processed: z.number().optional(),
    }).optional(),
    citations: z.array(z.object({
      text: z.string(),
      page: z.number(),
      context: z.string().optional(),
    })).default([]),
  }).optional(),
  error: z.string().optional(),
  execution_time_ms: z.number().optional(),
});

// =============================================================================
// CALENDAR SCHEDULING WEBHOOK
// =============================================================================

export const CalendarSchedulingWebhookPayloadSchema = BaseWebhookPayloadSchema.extend({
  workflow_type: z.literal("calendar_scheduling"),
  data: z.object({
    title: z.string().min(1, "Event title cannot be empty"),
    start_time: z.string().optional(), // ISO 8601 - if not provided, AI will suggest optimal time
    end_time: z.string().optional(),   // ISO 8601 - if not provided, duration will be used
    duration_minutes: z.number().optional(), // Alternative to end_time
    description: z.string().optional(),
    location: z.string().optional(),
    
    // Smart scheduling preferences
    scheduling_preferences: z.object({
      preferred_time_slots: z.array(z.object({
        day_of_week: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
        start_time: z.string(), // "09:00"
        end_time: z.string(),   // "17:00"
      })).optional(),
      avoid_conflicts: z.boolean().default(true),
      buffer_time_minutes: z.number().default(15), // Buffer before/after meetings
      max_suggestions: z.number().default(3),
      timezone: z.string().default("Europe/Stockholm"),
    }).optional(),
    
    // Attendees and collaboration
    attendees: z.array(z.object({
      email: z.string().email(),
      name: z.string().optional(),
      required: z.boolean().default(true),
    })).default([]),
    
    // Meeting configuration
    meeting_config: z.object({
      create_meeting_link: z.boolean().default(false), // Zoom/Teams integration
      send_invitations: z.boolean().default(true),
      reminder_minutes: z.array(z.number()).default([15, 60]), // Reminder times
      recurring_pattern: z.string().optional(), // "daily", "weekly", "monthly", or cron-like
      recurring_end_date: z.string().optional(), // ISO 8601
    }).optional(),
    
    // Calendar integration
    calendar_integration: z.object({
      calendar_id: z.string().optional(), // Specific calendar to use
      check_all_calendars: z.boolean().default(true), // Check conflicts across all calendars
      sync_to_external: z.array(z.enum(["google", "outlook", "apple"])).default([]),
    }).optional(),
  }),
});

export const CalendarSchedulingWebhookResponseSchema = z.object({
  success: z.boolean(),
  request_id: z.string(),
  data: z.object({
    event: z.object({
      event_id: z.string(),
      title: z.string(),
      start_time: z.string(), // Final scheduled time
      end_time: z.string(),
      location: z.string().optional(),
      meeting_link: z.string().optional(), // Zoom/Teams link if created
      calendar_url: z.string().optional(), // Link to view in calendar
    }).optional(),
    
    // Conflict resolution
    conflicts_found: z.array(z.object({
      title: z.string(),
      start_time: z.string(),
      end_time: z.string(),
      calendar_name: z.string().optional(),
      attendee_conflicts: z.array(z.string()).default([]),
    })).default([]),
    
    // Alternative suggestions if conflicts exist
    alternative_times: z.array(z.object({
      start_time: z.string(),
      end_time: z.string(),
      confidence_score: z.number().min(0).max(1), // How good this suggestion is
      reason: z.string().optional(), // Why this time was suggested
    })).default([]),
    
    // Attendee responses
    invitations_sent: z.array(z.object({
      email: z.string(),
      status: z.enum(["sent", "failed", "bounced"]),
      message: z.string().optional(),
    })).default([]),
    
    // Scheduling insights
    scheduling_notes: z.string().optional(),
    optimal_time_analysis: z.string().optional(),
  }).optional(),
  error: z.string().optional(),
  execution_time_ms: z.number().optional(),
});

// =============================================================================
// GENERIC WEBHOOK STRUCTURES
// =============================================================================

// Union of all possible webhook payloads
export const WebhookPayloadSchema = z.discriminatedUnion("workflow_type", [
  WeeklyPlannerWebhookPayloadSchema,
  PdfInboxWebhookPayloadSchema,
  CalendarSchedulingWebhookPayloadSchema,
]);

// Union of all possible webhook responses
export const WebhookResponseSchema = z.union([
  WeeklyPlannerWebhookResponseSchema,
  PdfInboxWebhookResponseSchema,
  CalendarSchedulingWebhookResponseSchema,
]);

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type BaseWebhookPayload = z.infer<typeof BaseWebhookPayloadSchema>;

export type WeeklyPlannerWebhookPayload = z.infer<typeof WeeklyPlannerWebhookPayloadSchema>;
export type WeeklyPlannerWebhookResponse = z.infer<typeof WeeklyPlannerWebhookResponseSchema>;

export type PdfInboxWebhookPayload = z.infer<typeof PdfInboxWebhookPayloadSchema>;
export type PdfInboxWebhookResponse = z.infer<typeof PdfInboxWebhookResponseSchema>;

export type CalendarSchedulingWebhookPayload = z.infer<typeof CalendarSchedulingWebhookPayloadSchema>;
export type CalendarSchedulingWebhookResponse = z.infer<typeof CalendarSchedulingWebhookResponseSchema>;

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;
export type WebhookResponse = z.infer<typeof WebhookResponseSchema>;

// =============================================================================
// N8N WEBHOOK ENDPOINTS
// =============================================================================

export const WEBHOOK_ENDPOINTS = {
  WEEKLY_PLANNER: "/webhook/n8n/weekly-planner",
  PDF_INBOX: "/webhook/n8n/pdf-inbox",
  CALENDAR_SCHEDULING: "/webhook/n8n/calendar-scheduling",
} as const;

// Helper function to create webhook URLs
export function createWebhookUrl(baseUrl: string, endpoint: keyof typeof WEBHOOK_ENDPOINTS): string {
  return `${baseUrl}${WEBHOOK_ENDPOINTS[endpoint]}`;
}

// Helper function to generate request IDs
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
