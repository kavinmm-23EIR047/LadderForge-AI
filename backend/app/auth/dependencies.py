from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
from app.auth.jwt_handler import verify_token

security = HTTPBearer()


# 🔐 Get current user from token
def get_current_user(token=Depends(security)):
    try:
        payload = verify_token(token.credentials)
        if not payload or not isinstance(payload, dict) or "error" in payload:
            err_msg = payload.get("error", "Invalid token") if isinstance(payload, dict) else "Invalid token"
            raise HTTPException(status_code=401, detail=err_msg)
        return payload
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# 👑 Admin only access
def admin_only(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        user_id = user.get("user_id")
        if user_id:
            try:
                from app.config.database import users_collection
                from bson import ObjectId
                db_user = users_collection.find_one({"_id": ObjectId(user_id)})
                if db_user and db_user.get("role") == "admin":
                    return db_user
            except Exception:
                pass
        raise HTTPException(status_code=403, detail="Admin access required")
    return user