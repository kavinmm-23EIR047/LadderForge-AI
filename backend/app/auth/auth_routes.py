from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr
from app.models.user_model import UserCreate, UserLogin
from app.auth.auth_service import (
    create_user,
    authenticate_user,
    reset_user_password,
    google_auth_login,
    save_otp,
    verify_otp
)
from app.auth.jwt_handler import (
    create_token,
    create_refresh_token,
    verify_token
)
from app.config.database import users_collection
from app.utils.email_service import send_email

router = APIRouter(prefix="/auth", tags=["Auth"])


# ---------------- SCHEMAS ----------------

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ---------------- SIGNUP ----------------

@router.post("/signup")
def signup(user: UserCreate):
    existing = users_collection.find_one({"email": user.email})

    if existing:
        raise HTTPException(400, "User already exists")

    create_user(user.dict())

    send_email(
        to=user.email,
        subject="Welcome to LadderAI 🚀",
        body=f"""
Hi {user.name},

Welcome to LadderAI 🚀

Your account has been created successfully.

Enjoy building ladder logic with AI.

Team LadderAI
"""
    )

    return {"message": "Signup successful"}


# ---------------- LOGIN ----------------

@router.post("/login")
def login(data: UserLogin):
    user = authenticate_user(data.email, data.password)

    if not user:
        raise HTTPException(401, "Invalid credentials")

    access_token = create_token({
        "user_id": str(user["_id"]),
        "role": user.get("role", "user")
    })

    refresh_token = create_refresh_token({
        "user_id": str(user["_id"]),
        "type": "refresh"
    })

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user_email": user["email"],
        "user_name": user.get("name", "User")
    }


# ---------------- GOOGLE LOGIN ----------------

@router.post("/google")
async def google_login(request: Request):
    body = await request.json()
    id_token = body.get("token")

    if not id_token:
        raise HTTPException(400, "Google token required")

    user = google_auth_login(id_token)

    access_token = create_token({
        "user_id": str(user["_id"]),
        "role": user.get("role", "user")
    })

    refresh_token = create_refresh_token({
        "user_id": str(user["_id"]),
        "type": "refresh"
    })

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user_email": user["email"],
        "user_name": user.get("name", "User")
    }


# ---------------- FORGOT PASSWORD OTP ----------------

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest):
    otp = save_otp(data.email)
    if not otp:
        raise HTTPException(404, "User not found")

    send_email(
        to=data.email,
        subject="Reset Password OTP 🔐",
        body=f"Your OTP is: {otp}\nValid for 5 minutes."
    )

    return {"message": "OTP sent successfully"}


# ---------------- VERIFY OTP ----------------

@router.post("/verify-otp")
def verify_otp_route(data: VerifyOTPRequest):
    valid, message = verify_otp(data.email, data.otp)

    if not valid:
        raise HTTPException(400, message)

    return {"message": "OTP verified"}


# ---------------- RESET PASSWORD ----------------

@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest):
    # reset_user_password internally verifies the OTP as well, 
    # so we can call it directly to get both status and message.
    success, message = reset_user_password(data.email, data.otp, data.new_password)

    if not success:
        raise HTTPException(400, message)

    return {"message": message}


# ---------------- REFRESH TOKEN ----------------

@router.post("/refresh")
def refresh_token(data: RefreshTokenRequest):
    payload = verify_token(data.refresh_token)

    if not payload:
        raise HTTPException(401, "Invalid refresh token")

    new_access = create_token({
        "user_id": payload["user_id"]
    })

    return {"access_token": new_access}