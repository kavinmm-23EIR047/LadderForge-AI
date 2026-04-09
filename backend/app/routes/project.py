from fastapi import APIRouter
from app.config.database import projects_collection
from app.utils.helpers import serialize_doc

router = APIRouter()

@router.get("/projects/{user_id}")
def get_projects(user_id: str):
    projects = list(projects_collection.find({"user_id": user_id}))

    return {
        "projects": [serialize_doc(p) for p in projects]
    }