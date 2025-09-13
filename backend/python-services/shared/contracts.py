from pydantic import BaseModel, Field, validator
from typing import Dict, Any, List, Optional, Union
from enum import Enum

# =============================================================================
# TOOL PARAMETER SCHEMAS (Pydantic for runtime validation)
# =============================================================================

class RagSearchParams(BaseModel):
    query: str = Field(..., min_length=1, description="Query cannot be empty")
    top_k: int = Field(5, ge=1, le=20, description="Number of results to return (1-20)")
    filter_paths: Optional[List[str]] = Field(None, description="Optional: filter to specific files/folders")

class NoteAppendParams(BaseModel):
    path: str = Field(..., min_length=1, description="Path cannot be empty")
    markdown: str = Field(..., min_length=1, description="Content cannot be empty")
    section: Optional[str] = Field(None, description="Optional: append to specific section")

class Priority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"

class TaskCreateParams(BaseModel):
    title: str = Field(..., min_length=1, description="Title cannot be empty")
    description: Optional[str] = None
    due_date: Optional[str] = Field(None, description="ISO 8601 format")
    priority: Priority = Priority.medium
    project_id: Optional[str] = None
    tags: List[str] = Field(default_factory=list)

class TransitMode(str, Enum):
    bus = "bus"
    subway = "subway"
    train = "train"
    tram = "tram"
    rail = "rail"

class RoutingPreference(str, Enum):
    less_walking = "less_walking"
    fewer_transfers = "fewer_transfers"

class TransitPreferences(BaseModel):
    preferred_modes: Optional[List[TransitMode]] = None
    routing_preference: Optional[RoutingPreference] = None

class TransportMode(str, Enum):
    driving = "driving"
    walking = "walking"
    transit = "transit"
    bicycling = "bicycling"

class AvoidOption(str, Enum):
    tolls = "tolls"
    highways = "highways"
    ferries = "ferries"
    indoor = "indoor"

class CalendarSchedulingParams(BaseModel):
    title: str = Field(..., min_length=1, description="Title cannot be empty")
    start_time: Optional[str] = Field(None, description="ISO 8601 format - if not provided, AI suggests optimal time")
    end_time: Optional[str] = Field(None, description="ISO 8601 format - if not provided, uses duration")
    duration_minutes: Optional[int] = Field(None, description="Alternative to end_time")
    description: Optional[str] = None
    location: Optional[str] = None
    
    # Smart scheduling options
    find_optimal_time: bool = False
    attendee_emails: List[str] = Field(default_factory=list)
    avoid_conflicts: bool = True
    buffer_time_minutes: int = 15
    
    # Meeting preferences
    create_meeting_link: bool = False
    send_invitations: bool = False
    recurring_pattern: Optional[str] = Field(None, description="daily, weekly, monthly")

class WeatherLookupParams(BaseModel):
    location: str = Field(..., min_length=1, description="Location cannot be empty")
    include_forecast: bool = False

class MapsLinkParams(BaseModel):
    destination: str = Field(..., min_length=1, description="Destination cannot be empty")
    origin: Optional[str] = Field(None, description="If not provided, uses current location")
    mode: TransportMode = TransportMode.driving
    
    # Enhanced routing options
    include_traffic: bool = True
    include_alternatives: bool = False
    departure_time: Optional[str] = Field(None, description="ISO 8601 - for traffic predictions")
    avoid: List[AvoidOption] = Field(default_factory=list)
    
    # Transit-specific options
    transit_preferences: Optional[TransitPreferences] = None

class WeeklyPlannerParams(BaseModel):
    week_start: str = Field(..., description="ISO 8601 date")
    goals: List[str] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list, description="e.g., 'No meetings before 9am'")
    calendar_path: Optional[str] = Field(None, description="Path to ICS file or calendar integration")

class PdfInboxParams(BaseModel):
    pdf_path: str = Field(..., min_length=1, description="PDF path cannot be empty")
    extract_action_items: bool = True
    target_vault_path: Optional[str] = Field(None, description="Where to save extracted notes")
    summarize: bool = True

# =============================================================================
# TOOL RESULT SCHEMAS
# =============================================================================

class RagChunk(BaseModel):
    text: str
    path: str
    anchor: Optional[str] = Field(None, description="Section header or page number")
    score: float = Field(..., ge=0.0, le=1.0)
    metadata: Optional[Dict[str, Any]] = None

class RagSearchResult(BaseModel):
    chunks: List[RagChunk]
    total_found: int
    query_time_ms: int

class NoteAppendResult(BaseModel):
    success: bool
    path: str
    bytes_written: int
    message: str

class TaskCreateResult(BaseModel):
    success: bool
    task_id: Optional[str] = None
    message: str

class ScheduledTime(BaseModel):
    start_time: str
    end_time: str
    timezone: str

class CalendarConflict(BaseModel):
    title: str
    start_time: str
    end_time: str
    calendar_name: Optional[str] = None

class AlternativeTime(BaseModel):
    start_time: str
    end_time: str
    confidence_score: float
    reason: Optional[str] = None

class MeetingDetails(BaseModel):
    meeting_link: Optional[str] = None
    calendar_url: Optional[str] = None
    invitations_sent: int = 0

class CalendarSchedulingResult(BaseModel):
    success: bool
    event_id: Optional[str] = None
    message: str
    scheduled_time: Optional[ScheduledTime] = None
    conflicts_found: List[CalendarConflict] = Field(default_factory=list)
    alternative_times: List[AlternativeTime] = Field(default_factory=list)
    meeting_details: Optional[MeetingDetails] = None

class WeatherCurrent(BaseModel):
    temperature: float
    condition: str
    humidity: float
    wind_speed: float

class WeatherForecast(BaseModel):
    date: str
    high: float
    low: float
    condition: str

class WeatherLookupResult(BaseModel):
    location: str
    current: WeatherCurrent
    forecast: Optional[List[WeatherForecast]] = None

class TrafficCondition(str, Enum):
    light = "light"
    moderate = "moderate"
    heavy = "heavy"
    severe = "severe"

class TrafficInfo(BaseModel):
    current_conditions: Optional[TrafficCondition] = None
    delay_minutes: Optional[int] = None
    best_departure_time: Optional[str] = Field(None, description="ISO 8601")

class RouteDetails(BaseModel):
    total_steps: Optional[int] = None
    major_roads: List[str] = Field(default_factory=list)
    tolls_required: Optional[bool] = None
    accessibility_info: Optional[str] = None

class AlternativeRoute(BaseModel):
    url: str
    duration: str
    distance: str
    description: str = Field(..., description="e.g., 'Fastest route', 'Avoid highways'")
    traffic_delay: Optional[int] = None

class TransitInfo(BaseModel):
    departure_times: Optional[List[str]] = Field(None, description="Next few departure times")
    total_fare: Optional[str] = None
    walking_distance: Optional[str] = None
    transfers_required: Optional[int] = None

class MapsLinkResult(BaseModel):
    google_maps_url: str
    estimated_duration: Optional[str] = None
    estimated_distance: Optional[str] = None
    traffic_info: Optional[TrafficInfo] = None
    route_details: Optional[RouteDetails] = None
    alternative_routes: List[AlternativeRoute] = Field(default_factory=list)
    transit_info: Optional[TransitInfo] = None

class TimeBlockType(str, Enum):
    work = "work"
    personal = "personal"
    break_time = "break"
    buffer = "buffer"

class TimeBlock(BaseModel):
    title: str
    start_time: str
    end_time: str
    type: TimeBlockType
    description: Optional[str] = None

class WeeklyPlan(BaseModel):
    week_start: str
    time_blocks: List[TimeBlock]
    goals_mapped: List[str]
    notes: Optional[str] = None

class WeeklyPlannerResult(BaseModel):
    success: bool
    plan: Optional[WeeklyPlan] = None
    message: str

class PdfInboxResult(BaseModel):
    success: bool
    summary: Optional[str] = None
    action_items: List[str] = Field(default_factory=list)
    notes_path: Optional[str] = Field(None, description="Where the extracted notes were saved")
    message: str

# =============================================================================
# SERVICE COMMUNICATION TYPES
# =============================================================================

class ServiceResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    message: Optional[str] = None

class ToolExecutionRequest(BaseModel):
    name: str
    parameters: Dict[str, Any]
    user_id: Optional[str] = None
    conversation_id: Optional[str] = None

class ToolExecutionResponse(BaseModel):
    success: bool
    result: Optional[Any] = None
    error: Optional[str] = None
    execution_time_ms: int
    service_used: str = Field(..., description="direct, n8n, rag, or ml")

# =============================================================================
# TOOL CATEGORIES FOR ROUTING
# =============================================================================

class ToolCategories:
    # Direct execution tools (handled by gateway)
    DIRECT = [
        "note_append",
        "weather_lookup", 
        "maps_link"
    ]
    
    # RAG/Vector search tools (routed to rag-service)
    RAG_TOOLS = [
        "rag_search"
    ]
    
    # n8n workflow tools (handled by n8n-service)
    N8N_WORKFLOWS = [
        "calendar_scheduling",
        "weekly_planner",
        "pdf_inbox"
    ]
