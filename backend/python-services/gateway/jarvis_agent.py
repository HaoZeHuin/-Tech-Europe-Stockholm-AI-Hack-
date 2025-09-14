import os
import sys
import httpx
import json
from typing import Dict, Any, Optional

# Add path to shared contracts
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))

from agents import function_tool
from agents.realtime import RealtimeAgent
from prompts import REALTIME_SYSTEM_PROMPT

# Service URLs
N8N_SERVICE_URL = os.getenv("N8N_SERVICE_URL", "http://localhost:8001")
RAG_SERVICE_URL = os.getenv("RAG_SERVICE_URL", "http://localhost:8002")

### JARVIS TOOLS

@function_tool(
    name_override="rag_search",
    description_override="Search through the user's personal knowledge base including notes, documents, and files."
)
async def rag_search_tool(query: str, top_k: int = 5) -> str:
    """Search the user's personal knowledge base for relevant information."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{RAG_SERVICE_URL}/search",
                json={"query": query, "top_k": top_k},
                timeout=10.0
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success") and result.get("data", {}).get("chunks"):
                    chunks = result["data"]["chunks"]
                    formatted_results = []
                    for chunk in chunks:
                        formatted_results.append(f"From {chunk['path']}: {chunk['text']}")
                    return f"Found {len(chunks)} relevant results:\n\n" + "\n\n".join(formatted_results)
                else:
                    return "No relevant information found in your knowledge base."
            else:
                return f"Search failed with status {response.status_code}"
                
    except Exception as e:
        return f"Error searching knowledge base: {str(e)}"


@function_tool(
    name_override="calendar_get_events", 
    description_override="Get calendar events for a specific date range."
)
async def calendar_get_events_tool(start_date: str, end_date: str) -> str:
    """
    Get calendar events for a date range.
    
    Args:
        start_date: Start date in ISO 8601 format (e.g., "2024-01-15")
        end_date: End date in ISO 8601 format (e.g., "2024-01-15")
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{N8N_SERVICE_URL}/tools/calendar_get_events",
                json={"parameters": {"start_date": start_date, "end_date": end_date}},
                timeout=10.0
            )
            
            if response.status_code == 200:
                result = response.json()
                return f"Calendar events retrieved successfully: {json.dumps(result, indent=2)}"
            else:
                return f"Failed to get calendar events: {response.status_code}"
                
    except Exception as e:
        return f"Error getting calendar events: {str(e)}"


@function_tool(
    name_override="weather_get_current",
    description_override="Get current weather conditions for a specific location."
)
async def weather_get_current_tool(location: str) -> str:
    """
    Get current weather for a location.
    
    Args:
        location: The city or location to get weather for (e.g., "London", "New York")
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{N8N_SERVICE_URL}/tools/weather_get_current",
                json={"parameters": {"location": location}},
                timeout=10.0
            )
            
            if response.status_code == 200:
                result = response.json()
                return f"Current weather for {location}: {json.dumps(result, indent=2)}"
            else:
                return f"Failed to get weather for {location}: {response.status_code}"
                
    except Exception as e:
        return f"Error getting weather: {str(e)}"


@function_tool(
    name_override="todo_create_task",
    description_override="Create a new task or reminder for the user."
)
async def todo_create_task_tool(title: str, description: str = "", priority: str = "medium", due_date: str = "") -> str:
    """
    Create a new task for the user.
    
    Args:
        title: The task title
        description: Optional task description
        priority: Task priority (low, medium, high, urgent)
        due_date: Optional due date in ISO 8601 format
    """
    try:
        params = {"title": title, "priority": priority}
        if description:
            params["description"] = description
        if due_date:
            params["due_date"] = due_date
            
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{N8N_SERVICE_URL}/tools/todo_create_task",
                json={"parameters": params},
                timeout=10.0
            )
            
            if response.status_code == 200:
                result = response.json()
                return f"Task created successfully: {title}"
            else:
                return f"Failed to create task: {response.status_code}"
                
    except Exception as e:
        return f"Error creating task: {str(e)}"


@function_tool(
    name_override="todo_get_tasks",
    description_override="Get the user's current tasks and reminders."
)
async def todo_get_tasks_tool(status: str = "", priority: str = "", limit: int = 10) -> str:
    """
    Get the user's tasks.
    
    Args:
        status: Filter by status (todo, in_progress, completed)
        priority: Filter by priority (low, medium, high, urgent)
        limit: Maximum number of tasks to return
    """
    try:
        params = {"limit": limit}
        if status:
            params["status"] = status
        if priority:
            params["priority"] = priority
            
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{N8N_SERVICE_URL}/tools/todo_get_tasks",
                json={"parameters": params},
                timeout=10.0
            )
            
            if response.status_code == 200:
                result = response.json()
                return f"Tasks retrieved: {json.dumps(result, indent=2)}"
            else:
                return f"Failed to get tasks: {response.status_code}"
                
    except Exception as e:
        return f"Error getting tasks: {str(e)}"


@function_tool(
    name_override="note_append",
    description_override="Add content to the user's notes or create a new note."
)
async def note_append_tool(path: str, content: str, section: str = "") -> str:
    """
    Append content to a note file.
    
    Args:
        path: The path to the note file
        content: The content to append
        section: Optional section to append to
    """
    try:
        params = {"path": path, "markdown": content}
        if section:
            params["section"] = section
            
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{N8N_SERVICE_URL}/tools/note_append",
                json={"parameters": params},
                timeout=10.0
            )
            
            if response.status_code == 200:
                result = response.json()
                return f"Note updated successfully at {path}"
            else:
                return f"Failed to update note: {response.status_code}"
                
    except Exception as e:
        return f"Error updating note: {str(e)}"


# Single Jarvis Agent - handles everything with tools
jarvis_agent = RealtimeAgent(
    name="Jarvis",
    instructions=REALTIME_SYSTEM_PROMPT,
    tools=[
        # Knowledge & Notes
        rag_search_tool,
        note_append_tool,
        
        # Calendar & Tasks  
        calendar_get_events_tool,
        todo_create_task_tool,
        todo_get_tasks_tool,
        
        # Weather
        weather_get_current_tool,
    ],
)


def get_starting_agent() -> RealtimeAgent:
    """Return the main Jarvis agent as the starting point."""
    return jarvis_agent
