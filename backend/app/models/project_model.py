from pydantic import BaseModel
from typing import Dict

class Project(BaseModel):
    user_id: str
    project_name: str
    prompt: str
    plc_logic: Dict