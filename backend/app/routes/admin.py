from fastapi import APIRouter, Depends, HTTPException
from app.auth.dependencies import admin_only
from app.config.database import users_collection
from bson import ObjectId

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users")
def get_all_users(user=Depends(admin_only)):
    users = list(users_collection.find({}, {"password": 0}))

    # convert _id to string
    for u in users:
        u["_id"] = str(u["_id"])

    return users


@router.delete("/users/{user_id}")
def delete_user(user_id: str, admin=Depends(admin_only)):
    try:
        res = users_collection.delete_one({"_id": ObjectId(user_id)})
        if res.deleted_count == 0:
            raise HTTPException(404, "User not found")
        return {"message": "User deleted successfully"}
    except Exception as e:
        raise HTTPException(400, "Invalid user ID or delete failed")