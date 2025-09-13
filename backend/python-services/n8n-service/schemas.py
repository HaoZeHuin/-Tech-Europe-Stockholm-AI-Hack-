from pydantic import BaseModel
from typing import Dict, Any, Optional

class PromptRequest(BaseModel):
    prompt_str: str

class ToolRequest(BaseModel):
    parameters: Dict[str, Any]
    timestamp: Optional[str] = None
    user_id: Optional[str] = None
    conversation_id: Optional[str] = None