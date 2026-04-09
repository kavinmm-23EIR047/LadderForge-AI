from jose import jwt, JWTError, ExpiredSignatureError
from datetime import datetime, timedelta
from app.config.settings import settings


# ---------------- CREATE ACCESS TOKEN ----------------
def create_token(data: dict):
    payload = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload.update({
        "exp": expire,
        "type": "access"
    })

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )


# ---------------- CREATE REFRESH TOKEN ----------------
def create_refresh_token(data: dict):
    payload = data.copy()

    expire = datetime.utcnow() + timedelta(days=7)

    payload.update({
        "exp": expire,
        "type": "refresh"
    })

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )


# ---------------- VERIFY TOKEN ----------------
def verify_token(token: str):
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        return payload

    except ExpiredSignatureError:
        return {"error": "Token expired"}

    except JWTError:
        return {"error": "Invalid token"}


# ---------------- GET CURRENT USER ----------------
def get_current_user(token: str):
    payload = verify_token(token)

    if not payload or payload.get("error"):
        return None

    return {
        "user_id": payload.get("user_id"),
        "role": payload.get("role"),
        "type": payload.get("type")
    }


# ---------------- CHECK ADMIN ----------------
def is_admin(token: str):
    user = get_current_user(token)

    if not user:
        return False

    return user.get("role") == "admin"