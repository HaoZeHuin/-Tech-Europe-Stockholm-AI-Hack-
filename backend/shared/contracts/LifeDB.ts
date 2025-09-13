import { z } from 'zod';

// =============================================================================
// LIFE DATABASE SCHEMAS (SQLite-based personal data)
// =============================================================================

// Base entity with common fields
export const BaseEntitySchema = z.object({
  id: z.string(), // UUID or similar
  created_at: z.string(), // ISO 8601
  updated_at: z.string(), // ISO 8601
  deleted_at: z.string().optional(), // Soft delete
});

// =============================================================================
// TASKS & PROJECTS
// =============================================================================

export const TaskSchema = BaseEntitySchema.extend({
  title: z.string().min(1, "Task title cannot be empty"),
  description: z.string().optional(),
  
  // Status and priority
  status: z.enum([
    "inbox",      // Just captured, not processed
    "todo",       // Ready to work on
    "in_progress", // Currently being worked on
    "waiting",    // Blocked/waiting for something
    "completed",  // Done
    "cancelled",  // No longer needed
    "someday"     // Maybe later
  ]).default("inbox"),
  
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  
  // Scheduling
  due_date: z.string().optional(), // ISO 8601
  scheduled_date: z.string().optional(), // When to start working on it
  completed_at: z.string().optional(), // ISO 8601
  
  // Organization
  project_id: z.string().optional(),
  parent_task_id: z.string().optional(), // For subtasks
  
  // Metadata
  tags: z.array(z.string()).default([]),
  estimated_minutes: z.number().optional(),
  actual_minutes: z.number().optional(),
  energy_required: z.enum(["low", "medium", "high"]).optional(),
  context: z.string().optional(), // e.g., "@computer", "@phone", "@errands"
  
  // Notes and references
  notes: z.string().optional(),
  attachments: z.array(z.string()).default([]), // File paths or URLs
  
  // Tracking
  completion_percentage: z.number().min(0).max(100).default(0),
  recurring_pattern: z.string().optional(), // Cron-like pattern for recurring tasks
  next_occurrence: z.string().optional(), // Next due date for recurring tasks
});

export const ProjectSchema = BaseEntitySchema.extend({
  name: z.string().min(1, "Project name cannot be empty"),
  description: z.string().optional(),
  
  // Status
  status: z.enum([
    "active",
    "on_hold",
    "completed",
    "cancelled",
    "planning"
  ]).default("planning"),
  
  // Dates
  start_date: z.string().optional(), // ISO 8601
  target_date: z.string().optional(), // Desired completion
  completed_at: z.string().optional(),
  
  // Organization
  category: z.string().optional(), // "work", "personal", "learning", etc.
  tags: z.array(z.string()).default([]),
  
  // Goals and outcomes
  goals: z.array(z.string()).default([]),
  success_criteria: z.array(z.string()).default([]),
  
  // Metadata
  color: z.string().optional(), // For UI visualization
  icon: z.string().optional(), // Emoji or icon identifier
  
  // Notes
  notes: z.string().optional(),
  vision: z.string().optional(), // Long-term vision for the project
});

// =============================================================================
// CALENDAR & TIME TRACKING
// =============================================================================

export const CalendarEventSchema = BaseEntitySchema.extend({
  title: z.string().min(1, "Event title cannot be empty"),
  description: z.string().optional(),
  
  // Timing
  start_time: z.string(), // ISO 8601
  end_time: z.string(),   // ISO 8601
  all_day: z.boolean().default(false),
  timezone: z.string().default("Europe/Stockholm"),
  
  // Location
  location: z.string().optional(),
  location_url: z.string().optional(), // Maps link or video call URL
  
  // Organization
  calendar_id: z.string().optional(), // Which calendar this belongs to
  event_type: z.enum([
    "meeting",
    "focus_time",
    "break",
    "personal",
    "travel",
    "meal",
    "exercise",
    "other"
  ]).default("other"),
  
  // Attendees and collaboration
  attendees: z.array(z.string()).default([]), // Email addresses or names
  organizer: z.string().optional(),
  
  // Metadata
  tags: z.array(z.string()).default([]),
  color: z.string().optional(),
  
  // Recurrence
  recurring_pattern: z.string().optional(),
  recurrence_end: z.string().optional(),
  
  // Status
  status: z.enum(["confirmed", "tentative", "cancelled"]).default("confirmed"),
  
  // Integration
  external_id: z.string().optional(), // For syncing with external calendars
  external_source: z.string().optional(), // "google", "outlook", etc.
});

export const TimeLogSchema = BaseEntitySchema.extend({
  // What was worked on
  task_id: z.string().optional(),
  project_id: z.string().optional(),
  activity: z.string().optional(), // Free-form activity description
  
  // Timing
  start_time: z.string(), // ISO 8601
  end_time: z.string().optional(), // ISO 8601, null if still running
  duration_minutes: z.number().optional(), // Calculated field
  
  // Context
  location: z.string().optional(),
  mood: z.enum(["great", "good", "okay", "tired", "stressed"]).optional(),
  energy_level: z.enum(["low", "medium", "high"]).optional(),
  focus_quality: z.enum(["poor", "fair", "good", "excellent"]).optional(),
  
  // Notes
  notes: z.string().optional(),
  interruptions: z.number().default(0),
  
  // Tags and categorization
  tags: z.array(z.string()).default([]),
  work_type: z.enum([
    "deep_work",
    "meetings",
    "communication",
    "planning",
    "learning",
    "admin",
    "break"
  ]).optional(),
});

// =============================================================================
// MOOD & WELLNESS TRACKING
// =============================================================================

export const MoodEntrySchema = BaseEntitySchema.extend({
  // Core mood data
  timestamp: z.string(), // ISO 8601
  mood_score: z.number().min(1).max(10), // 1 = terrible, 10 = amazing
  energy_level: z.number().min(1).max(10),
  stress_level: z.number().min(1).max(10), // 1 = no stress, 10 = extremely stressed
  
  // Emotional state
  emotions: z.array(z.enum([
    "happy", "sad", "angry", "anxious", "excited", "calm", 
    "frustrated", "grateful", "overwhelmed", "confident", 
    "lonely", "content", "worried", "optimistic"
  ])).default([]),
  
  // Context
  location: z.string().optional(),
  weather: z.string().optional(),
  social_context: z.enum([
    "alone", "with_family", "with_friends", "with_colleagues", 
    "in_meeting", "in_public", "at_event"
  ]).optional(),
  
  // Activities (what contributed to this mood)
  activities: z.array(z.string()).default([]),
  
  // Physical factors
  sleep_hours: z.number().optional(),
  sleep_quality: z.number().min(1).max(10).optional(),
  exercise_minutes: z.number().optional(),
  caffeine_cups: z.number().optional(),
  
  // Notes
  notes: z.string().optional(),
  gratitude: z.array(z.string()).default([]), // Things grateful for
  challenges: z.array(z.string()).default([]), // Current challenges
  
  // Goals and reflection
  day_rating: z.number().min(1).max(10).optional(), // Overall day rating
  tomorrow_intention: z.string().optional(), // Intention for tomorrow
});

// =============================================================================
// GOALS & HABITS
// =============================================================================

export const GoalSchema = BaseEntitySchema.extend({
  title: z.string().min(1, "Goal title cannot be empty"),
  description: z.string().optional(),
  
  // Goal type and timeframe
  goal_type: z.enum([
    "outcome",    // Specific result to achieve
    "process",    // Behavior or habit to maintain
    "learning",   // Skill or knowledge to acquire
    "experience", // Something to experience or try
  ]),
  
  timeframe: z.enum([
    "daily", "weekly", "monthly", "quarterly", 
    "yearly", "someday", "ongoing"
  ]),
  
  // Status and progress
  status: z.enum([
    "active", "completed", "paused", "cancelled", "not_started"
  ]).default("not_started"),
  
  progress_percentage: z.number().min(0).max(100).default(0),
  
  // Dates
  start_date: z.string().optional(),
  target_date: z.string().optional(),
  completed_at: z.string().optional(),
  
  // Measurement
  measurable: z.boolean().default(false),
  metric: z.string().optional(), // How to measure progress
  target_value: z.number().optional(),
  current_value: z.number().optional(),
  unit: z.string().optional(), // "hours", "books", "kg", etc.
  
  // Organization
  category: z.string().optional(), // "health", "career", "relationships", etc.
  tags: z.array(z.string()).default([]),
  
  // Motivation and context
  why: z.string().optional(), // Why this goal matters
  obstacles: z.array(z.string()).default([]),
  strategies: z.array(z.string()).default([]),
  
  // Related entities
  related_projects: z.array(z.string()).default([]), // Project IDs
  related_habits: z.array(z.string()).default([]), // Habit IDs
});

export const HabitSchema = BaseEntitySchema.extend({
  name: z.string().min(1, "Habit name cannot be empty"),
  description: z.string().optional(),
  
  // Habit configuration
  frequency: z.enum([
    "daily", "weekly", "monthly", "custom"
  ]).default("daily"),
  
  target_frequency: z.number().default(1), // How many times per period
  
  // Tracking
  streak_current: z.number().default(0),
  streak_longest: z.number().default(0),
  total_completions: z.number().default(0),
  
  // Scheduling
  preferred_time: z.string().optional(), // "morning", "afternoon", "evening", or specific time
  reminder_time: z.string().optional(), // ISO 8601 time
  
  // Context
  location: z.string().optional(),
  trigger: z.string().optional(), // What triggers this habit
  reward: z.string().optional(), // What reward follows completion
  
  // Status
  is_active: z.boolean().default(true),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  
  // Organization
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  
  // Notes
  notes: z.string().optional(),
});

export const HabitLogSchema = BaseEntitySchema.extend({
  habit_id: z.string(),
  date: z.string(), // ISO 8601 date (YYYY-MM-DD)
  completed: z.boolean().default(false),
  
  // Optional details
  completion_time: z.string().optional(), // ISO 8601 timestamp
  notes: z.string().optional(),
  mood_before: z.number().min(1).max(10).optional(),
  mood_after: z.number().min(1).max(10).optional(),
  difficulty_felt: z.enum(["very_easy", "easy", "medium", "hard", "very_hard"]).optional(),
  
  // Context
  location: z.string().optional(),
  duration_minutes: z.number().optional(),
  
  // Skipping reasons
  skipped: z.boolean().default(false),
  skip_reason: z.string().optional(),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type Task = z.infer<typeof TaskSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type CalendarEvent = z.infer<typeof CalendarEventSchema>;
export type TimeLog = z.infer<typeof TimeLogSchema>;
export type MoodEntry = z.infer<typeof MoodEntrySchema>;
export type Goal = z.infer<typeof GoalSchema>;
export type Habit = z.infer<typeof HabitSchema>;
export type HabitLog = z.infer<typeof HabitLogSchema>;

// Union types for database operations
export type LifeDBEntity = Task | Project | CalendarEvent | TimeLog | MoodEntry | Goal | Habit | HabitLog;

// =============================================================================
// DATABASE QUERY HELPERS
// =============================================================================

// Common query filters
export const TaskFiltersSchema = z.object({
  status: z.array(z.string()).optional(),
  priority: z.array(z.string()).optional(),
  project_id: z.string().optional(),
  due_before: z.string().optional(), // ISO 8601
  due_after: z.string().optional(),  // ISO 8601
  tags: z.array(z.string()).optional(),
  context: z.string().optional(),
  search: z.string().optional(), // Text search in title/description
});

export const ProjectFiltersSchema = z.object({
  status: z.array(z.string()).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
});

export const TimeLogFiltersSchema = z.object({
  start_date: z.string().optional(), // ISO 8601 date
  end_date: z.string().optional(),   // ISO 8601 date
  project_id: z.string().optional(),
  task_id: z.string().optional(),
  work_type: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export const MoodFiltersSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  min_mood: z.number().min(1).max(10).optional(),
  max_mood: z.number().min(1).max(10).optional(),
  emotions: z.array(z.string()).optional(),
  social_context: z.string().optional(),
});

export type TaskFilters = z.infer<typeof TaskFiltersSchema>;
export type ProjectFilters = z.infer<typeof ProjectFiltersSchema>;
export type TimeLogFilters = z.infer<typeof TimeLogFiltersSchema>;
export type MoodFilters = z.infer<typeof MoodFiltersSchema>;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Generate new entity ID
export function generateEntityId(prefix: string = "ent"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create timestamps
export function createTimestamps(): { created_at: string; updated_at: string } {
  const now = new Date().toISOString();
  return { created_at: now, updated_at: now };
}

// Update timestamp
export function updateTimestamp(): { updated_at: string } {
  return { updated_at: new Date().toISOString() };
}
