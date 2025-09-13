from pydantic import BaseModel

class PromptRequest(BaseModel):
    prompt_str: str