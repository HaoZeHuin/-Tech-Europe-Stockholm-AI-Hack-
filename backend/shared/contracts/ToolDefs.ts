import { z } from 'zod';

// =============================================================================
// TOOL PARAMETER SCHEMAS (Zod for runtime validation)
// =============================================================================

export const RagSearchParamsSchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
  top_k: z.number().int().min(1).max(20).default(5),
  filter_paths: z.array(z.string()).optional(), // Optional: filter to specific files/folders
});

export const NoteAppendParamsSchema = z.object({
  path: z.string().min(1, "Path cannot be empty"), // e.g., "daily/2024-09-13.md"
  markdown: z.string().min(1, "Content cannot be empty"),
  section: z.string().optional(), // Optional: append to specific section
});

export const TaskCreateParamsSchema = z.object({
  title: z.string().min(1, "Title cannot be empty"),
  description: z.string().optional(),
  due_date: z.string().optional(), // ISO 8601 format
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  project_id: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

// Calendar scheduling uses n8n workflow for smart scheduling
export const CalendarSchedulingParamsSchema = z.object({
  title: z.string().min(1, "Title cannot be empty"),
  start_time: z.string().optional(), // ISO 8601 format - if not provided, AI suggests optimal time
  end_time: z.string().optional(),   // ISO 8601 format - if not provided, uses duration
  duration_minutes: z.number().optional(), // Alternative to end_time
  description: z.string().optional(),
  location: z.string().optional(),
  
  // Smart scheduling options
  find_optimal_time: z.boolean().default(false), // Let AI find best time slot
  attendee_emails: z.array(z.string()).default([]), // Email addresses of attendees
  avoid_conflicts: z.boolean().default(true),
  buffer_time_minutes: z.number().default(15),
  
  // Meeting preferences
  create_meeting_link: z.boolean().default(false), // Create Zoom/Teams link
  send_invitations: z.boolean().default(false),
  recurring_pattern: z.string().optional(), // "daily", "weekly", "monthly"
});

export const WeatherLookupParamsSchema = z.object({
  location: z.string().min(1, "Location cannot be empty"), // "Stockholm" or "Legora HQ"
  include_forecast: z.boolean().default(false),
});

export const MapsLinkParamsSchema = z.object({
  destination: z.string().min(1, "Destination cannot be empty"),
  origin: z.string().optional(), // If not provided, uses current location
  mode: z.enum(["driving", "walking", "transit", "bicycling"]).default("driving"),
  
  // Enhanced routing options
  include_traffic: z.boolean().default(true), // Include real-time traffic data
  include_alternatives: z.boolean().default(false), // Show alternative routes
  departure_time: z.string().optional(), // ISO 8601 - for traffic predictions
  avoid: z.array(z.enum(["tolls", "highways", "ferries", "indoor"])).default([]),
  
  // Transit-specific options (when mode is "transit")
  transit_preferences: z.object({
    preferred_modes: z.array(z.enum(["bus", "subway", "train", "tram", "rail"])).optional(),
    routing_preference: z.enum(["less_walking", "fewer_transfers"]).optional(),
  }).optional(),
});

// n8n Workflow Tools (these proxy to n8n webhooks)
export const WeeklyPlannerParamsSchema = z.object({
  week_start: z.string(), // ISO 8601 date
  goals: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]), // e.g., "No meetings before 9am"
  calendar_path: z.string().optional(), // Path to ICS file or calendar integration
});

export const PdfInboxParamsSchema = z.object({
  pdf_path: z.string().min(1, "PDF path cannot be empty"),
  extract_action_items: z.boolean().default(true),
  target_vault_path: z.string().optional(), // Where to save extracted notes
  summarize: z.boolean().default(true),
});

// =============================================================================
// TOOL RESULT SCHEMAS
// =============================================================================

export const RagSearchResultSchema = z.object({
  chunks: z.array(z.object({
    text: z.string(),
    path: z.string(),
    anchor: z.string().optional(), // Section header or page number
    score: z.number().min(0).max(1),
    metadata: z.record(z.any()).optional(),
  })),
  total_found: z.number(),
  query_time_ms: z.number(),
});

export const NoteAppendResultSchema = z.object({
  success: z.boolean(),
  path: z.string(),
  bytes_written: z.number(),
  message: z.string(),
});

export const TaskCreateResultSchema = z.object({
  success: z.boolean(),
  task_id: z.string().optional(),
  message: z.string(),
});

export const CalendarSchedulingResultSchema = z.object({
  success: z.boolean(),
  event_id: z.string().optional(),
  message: z.string(),
  
  // Enhanced scheduling results
  scheduled_time: z.object({
    start_time: z.string(),
    end_time: z.string(),
    timezone: z.string(),
  }).optional(),
  
  conflicts_found: z.array(z.object({
    title: z.string(),
    start_time: z.string(),
    end_time: z.string(),
    calendar_name: z.string().optional(),
  })).default([]),
  
  alternative_times: z.array(z.object({
    start_time: z.string(),
    end_time: z.string(),
    confidence_score: z.number(),
    reason: z.string().optional(),
  })).default([]),
  
  meeting_details: z.object({
    meeting_link: z.string().optional(),
    calendar_url: z.string().optional(),
    invitations_sent: z.number().default(0),
  }).optional(),
});

export const WeatherLookupResultSchema = z.object({
  location: z.string(),
  current: z.object({
    temperature: z.number(),
    condition: z.string(),
    humidity: z.number(),
    wind_speed: z.number(),
  }),
  forecast: z.array(z.object({
    date: z.string(),
    high: z.number(),
    low: z.number(),
    condition: z.string(),
  })).optional(),
});

export const MapsLinkResultSchema = z.object({
  google_maps_url: z.string(),
  estimated_duration: z.string().optional(),
  estimated_distance: z.string().optional(),
  
  // Enhanced routing information
  traffic_info: z.object({
    current_conditions: z.enum(["light", "moderate", "heavy", "severe"]).optional(),
    delay_minutes: z.number().optional(),
    best_departure_time: z.string().optional(), // ISO 8601
  }).optional(),
  
  route_details: z.object({
    total_steps: z.number().optional(),
    major_roads: z.array(z.string()).default([]),
    tolls_required: z.boolean().optional(),
    accessibility_info: z.string().optional(),
  }).optional(),
  
  alternative_routes: z.array(z.object({
    url: z.string(),
    duration: z.string(),
    distance: z.string(),
    description: z.string(), // e.g., "Fastest route", "Avoid highways"
    traffic_delay: z.number().optional(),
  })).default([]),
  
  // Transit-specific information
  transit_info: z.object({
    departure_times: z.array(z.string()).optional(), // Next few departure times
    total_fare: z.string().optional(),
    walking_distance: z.string().optional(),
    transfers_required: z.number().optional(),
  }).optional(),
});

export const WeeklyPlannerResultSchema = z.object({
  success: z.boolean(),
  plan: z.object({
    week_start: z.string(),
    time_blocks: z.array(z.object({
      title: z.string(),
      start_time: z.string(),
      end_time: z.string(),
      type: z.enum(["work", "personal", "break", "buffer"]),
      description: z.string().optional(),
    })),
    goals_mapped: z.array(z.string()),
    notes: z.string().optional(),
  }).optional(),
  message: z.string(),
});

export const PdfInboxResultSchema = z.object({
  success: z.boolean(),
  summary: z.string().optional(),
  action_items: z.array(z.string()).default([]),
  notes_path: z.string().optional(), // Where the extracted notes were saved
  message: z.string(),
});

// =============================================================================
// TYPE EXPORTS (for TypeScript usage)
// =============================================================================

export type RagSearchParams = z.infer<typeof RagSearchParamsSchema>;
export type RagSearchResult = z.infer<typeof RagSearchResultSchema>;

export type NoteAppendParams = z.infer<typeof NoteAppendParamsSchema>;
export type NoteAppendResult = z.infer<typeof NoteAppendResultSchema>;

export type TaskCreateParams = z.infer<typeof TaskCreateParamsSchema>;
export type TaskCreateResult = z.infer<typeof TaskCreateResultSchema>;

export type CalendarSchedulingParams = z.infer<typeof CalendarSchedulingParamsSchema>;
export type CalendarSchedulingResult = z.infer<typeof CalendarSchedulingResultSchema>;

export type WeatherLookupParams = z.infer<typeof WeatherLookupParamsSchema>;
export type WeatherLookupResult = z.infer<typeof WeatherLookupResultSchema>;

export type MapsLinkParams = z.infer<typeof MapsLinkParamsSchema>;
export type MapsLinkResult = z.infer<typeof MapsLinkResultSchema>;

export type WeeklyPlannerParams = z.infer<typeof WeeklyPlannerParamsSchema>;
export type WeeklyPlannerResult = z.infer<typeof WeeklyPlannerResultSchema>;

export type PdfInboxParams = z.infer<typeof PdfInboxParamsSchema>;
export type PdfInboxResult = z.infer<typeof PdfInboxResultSchema>;

// =============================================================================
// OPENAI TOOL DEFINITIONS (for Realtime & Responses APIs)
// =============================================================================

export const OPENAI_TOOLS = [
  {
    name: "rag_search",
    description: "Search through the user's indexed markdown files and PDFs to find relevant information. Use this when the user asks questions about their notes, documents, or knowledge base.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to find relevant information"
        },
        top_k: {
          type: "number",
          description: "Number of results to return (1-20)",
          minimum: 1,
          maximum: 20,
          default: 5
        },
        filter_paths: {
          type: "array",
          items: { type: "string" },
          description: "Optional: filter search to specific file paths or folders"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "note_append",
    description: "Append markdown content to a specific note file. Use this to add information, meeting notes, or thoughts to the user's vault.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The path to the note file (e.g., 'daily/2024-09-13.md')"
        },
        markdown: {
          type: "string",
          description: "The markdown content to append"
        },
        section: {
          type: "string",
          description: "Optional: specific section to append to"
        }
      },
      required: ["path", "markdown"]
    }
  },
  {
    name: "task_create",
    description: "Create a new task in the user's task management system.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The task title"
        },
        description: {
          type: "string",
          description: "Optional task description"
        },
        due_date: {
          type: "string",
          description: "Optional due date in ISO 8601 format"
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "urgent"],
          description: "Task priority level"
        },
        project_id: {
          type: "string",
          description: "Optional project ID to associate with"
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Optional tags for the task"
        }
      },
      required: ["title"]
    }
  },
  {
    name: "calendar_scheduling",
    description: "Schedule an event with smart calendar integration, conflict detection, and optional meeting links. This triggers an n8n workflow for advanced scheduling features.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The event title"
        },
        start_time: {
          type: "string",
          description: "Preferred start time in ISO 8601 format (optional - AI can suggest optimal time)"
        },
        end_time: {
          type: "string",
          description: "End time in ISO 8601 format (optional if duration_minutes is provided)"
        },
        duration_minutes: {
          type: "number",
          description: "Event duration in minutes (alternative to end_time)",
          minimum: 15,
          maximum: 480
        },
        description: {
          type: "string",
          description: "Optional event description"
        },
        location: {
          type: "string",
          description: "Optional event location"
        },
        find_optimal_time: {
          type: "boolean",
          description: "Let AI find the best available time slot",
          default: false
        },
        attendee_emails: {
          type: "array",
          items: { type: "string" },
          description: "Email addresses of attendees for conflict checking and invitations"
        },
        avoid_conflicts: {
          type: "boolean",
          description: "Check for and avoid calendar conflicts",
          default: true
        },
        create_meeting_link: {
          type: "boolean",
          description: "Create a Zoom/Teams meeting link",
          default: false
        },
        send_invitations: {
          type: "boolean",
          description: "Send calendar invitations to attendees",
          default: false
        },
        recurring_pattern: {
          type: "string",
          description: "Recurring pattern: 'daily', 'weekly', 'monthly'"
        }
      },
      required: ["title"]
    }
  },
  {
    name: "weather_lookup",
    description: "Get current weather information for a specific location.",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The location to get weather for (e.g., 'Stockholm', 'Legora HQ')"
        },
        include_forecast: {
          type: "boolean",
          description: "Whether to include weather forecast",
          default: false
        }
      },
      required: ["location"]
    }
  },
  {
    name: "maps_link",
    description: "Generate enhanced Google Maps directions with real-time traffic, alternative routes, and transit information.",
    parameters: {
      type: "object",
      properties: {
        destination: {
          type: "string",
          description: "The destination address or location"
        },
        origin: {
          type: "string",
          description: "Optional origin address (uses current location if not provided)"
        },
        mode: {
          type: "string",
          enum: ["driving", "walking", "transit", "bicycling"],
          description: "Transportation mode",
          default: "driving"
        },
        include_traffic: {
          type: "boolean",
          description: "Include real-time traffic data and delays",
          default: true
        },
        include_alternatives: {
          type: "boolean",
          description: "Show alternative route options",
          default: false
        },
        departure_time: {
          type: "string",
          description: "Departure time in ISO 8601 format for traffic predictions"
        },
        avoid: {
          type: "array",
          items: {
            type: "string",
            enum: ["tolls", "highways", "ferries", "indoor"]
          },
          description: "Route features to avoid"
        },
        transit_preferences: {
          type: "object",
          properties: {
            preferred_modes: {
              type: "array",
              items: {
                type: "string",
                enum: ["bus", "subway", "train", "tram", "rail"]
              },
              description: "Preferred transit modes (when mode is 'transit')"
            },
            routing_preference: {
              type: "string",
              enum: ["less_walking", "fewer_transfers"],
              description: "Transit routing preference"
            }
          },
          description: "Transit-specific routing preferences"
        }
      },
      required: ["destination"]
    }
  },
  {
    name: "weekly_planner",
    description: "Generate a weekly plan based on goals and calendar constraints. This triggers an n8n workflow.",
    parameters: {
      type: "object",
      properties: {
        week_start: {
          type: "string",
          description: "Start date of the week in ISO 8601 format"
        },
        goals: {
          type: "array",
          items: { type: "string" },
          description: "Goals for the week"
        },
        constraints: {
          type: "array",
          items: { type: "string" },
          description: "Scheduling constraints (e.g., 'No meetings before 9am')"
        },
        calendar_path: {
          type: "string",
          description: "Optional path to calendar file or integration"
        }
      },
      required: ["week_start"]
    }
  },
  {
    name: "pdf_inbox",
    description: "Process a PDF document - extract summary and action items, then add to knowledge vault. This triggers an n8n workflow.",
    parameters: {
      type: "object",
      properties: {
        pdf_path: {
          type: "string",
          description: "Path to the PDF file to process"
        },
        extract_action_items: {
          type: "boolean",
          description: "Whether to extract action items from the PDF",
          default: true
        },
        target_vault_path: {
          type: "string",
          description: "Optional: where to save extracted notes in the vault"
        },
        summarize: {
          type: "boolean",
          description: "Whether to generate a summary",
          default: true
        }
      },
      required: ["pdf_path"]
    }
  }
] as const;

// Tool name type for type safety
export type ToolName = typeof OPENAI_TOOLS[number]['name'];
