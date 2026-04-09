from pydantic import BaseModel

class PromptRequest(BaseModel):
    prompt: str
    project_name: str
    user_id: str