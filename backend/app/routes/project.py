from bson import ObjectId
from fastapi import APIRouter, HTTPException
from app.config.database import projects_collection
from app.utils.helpers import serialize_doc

router = APIRouter()

@router.get("/projects/{user_id}")
def get_projects(user_id: str):
    projects = list(projects_collection.find({"user_id": user_id}))

    return {
        "projects": [serialize_doc(p) for p in projects]
    }

@router.delete("/project/{project_id}")
def delete_project(project_id: str):
    try:
        res = projects_collection.delete_one({"_id": ObjectId(project_id)})
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Project not found")
        return {"message": "Project deleted successfully", "project_id": project_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))