from fastapi import APIRouter
from app.services.ai_explainer import explain_rungs

router = APIRouter()

@router.post("/explain-rungs")
def explain(data: dict):
    rungs = data.get("rungs", [])
    result = explain_rungs(rungs)
    return {"explanations": result}