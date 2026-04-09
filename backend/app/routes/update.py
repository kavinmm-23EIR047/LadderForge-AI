from fastapi import APIRouter
from app.schemas.update_schema import UpdateRungSchema
from app.config.database import projects_collection
from app.services.rung_updater import update_instruction

router = APIRouter()

@router.patch("/update-rung")
def update_rung(data: UpdateRungSchema):
    project = projects_collection.find_one({
        "project_name": data.project_name
    })

    if not project:
        return {"error": "Project not found"}

    updated_logic = update_instruction(
        project["plc_logic"],
        data.rung_id,
        data.instruction_id,
        data.field,
        data.value
    )

    projects_collection.update_one(
        {"project_name": data.project_name},
        {"$set": {"plc_logic": updated_logic}}
    )

    return {
        "status": "updated",
        "value": data.value
    }