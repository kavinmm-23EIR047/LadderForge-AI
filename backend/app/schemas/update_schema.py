from pydantic import BaseModel

class UpdateRungSchema(BaseModel):
    project_name: str
    rung_id: str
    instruction_id: str   # ✅ FIXED
    field: str
    value: int