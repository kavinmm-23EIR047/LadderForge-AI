from pydantic import BaseModel

class ProjectQuery(BaseModel):
    user_id: str