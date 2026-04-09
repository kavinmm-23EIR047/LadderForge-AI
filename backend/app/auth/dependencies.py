from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
from app.auth.jwt_handler import verify_token

security = HTTPBearer()


# 🔐 Get current user from token
def get_current_user(token=Depends(security)):
    try:
        payload = verify_token(token.credentials)
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# 👑 Admin only access
def admin_only(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user