from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# ---------------- SIGNUP MODEL ----------------
class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    role: str = "user"


# ---------------- LOGIN MODEL ----------------
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ---------------- FORGOT PASSWORD ----------------
class ForgotPasswordRequest(BaseModel):
    email: EmailStr


# ---------------- OTP VERIFY ----------------
class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)


# ---------------- RESET PASSWORD ----------------
class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=6, max_length=128)


# ---------------- DB USER MODEL ----------------
class UserInDB(BaseModel):
    id: Optional[str] = None
    name: str
    email: EmailStr
    password: Optional[str] = None

    role: str = "user"
    auth_provider: str = "local"

    subscription_plan: str = "free"
    subscription_expiry: Optional[datetime] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ---------------- RESPONSE MODEL ----------------
class UserResponse(BaseModel):
    user_id: str
    name: str
    email: EmailStr
    role: str

    subscription_plan: str = "free"
    subscription_expiry: Optional[datetime] = None

    created_at: Optional[datetime] = None


# ---------------- TOKEN RESPONSE ----------------
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"