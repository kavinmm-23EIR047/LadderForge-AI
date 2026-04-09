from pydantic import BaseModel
from typing import List, Dict

class Rung(BaseModel):
    rung_id: str
    instructions: List[Dict]

class PLC(BaseModel):
    network_id: int
    rungs: List[Rung]