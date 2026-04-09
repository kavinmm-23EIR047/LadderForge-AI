from passlib.context import CryptContext
from datetime import datetime, timedelta
from app.config.database import users_collection
import requests
import random

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ================= PASSWORD =================

def hash_password(password: str):
    password = password[:72]
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str):
    password = password[:72]
    return pwd_context.verify(password, hashed)


# ================= USER CREATE =================

def create_user(user: dict):
    user["password"] = hash_password(user["password"])
    user["role"] = "user"
    user["created_at"] = datetime.utcnow()
    user["subscription_plan"] = "free"
    user["subscription_expiry"] = None
    user["auth_provider"] = "local"
    user["is_verified"] = True

    result = users_collection.insert_one(user)
    user["_id"] = result.inserted_id

    return user


# ================= LOGIN =================

def authenticate_user(email: str, password: str):
    user = users_collection.find_one({"email": email})

    if not user:
        return None

    if user.get("auth_provider") == "google":
        return None

    if not verify_password(password, user["password"]):
        return None

    return user


# ================= GOOGLE LOGIN =================

def google_auth_login(id_token: str):
    try:
        response = requests.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
        )

        data = response.json()

        if response.status_code != 200:
            raise Exception(data.get("error_description", "Invalid Google token"))

        # 🔒 SECURITY CHECK: Verify audience
        from app.config.settings import settings
        if data.get("aud") != settings.GOOGLE_CLIENT_ID:
            raise Exception("Token audience mismatch")

        email = data.get("email")
        name = data.get("name", "Google User")

        if not email:
            raise Exception("Invalid Google token: email missing")

        user = users_collection.find_one({"email": email})

        if not user:
            new_user = {
                "name": name,
                "email": email,
                "password": None,
                "role": "user",
                "created_at": datetime.utcnow(),
                "subscription_plan": "free",
                "subscription_expiry": None,
                "auth_provider": "google",
                "is_verified": True
            }

            result = users_collection.insert_one(new_user)
            new_user["_id"] = result.inserted_id
            return new_user

        return user

    except Exception as e:
        raise Exception(f"Google authentication failed: {str(e)}")


# ================= OTP =================

def generate_otp():
    return str(random.randint(100000, 999999))


def save_otp(email: str):
    user = users_collection.find_one({"email": email})

    if not user:
        return None

    otp = generate_otp()

    users_collection.update_one(
        {"email": email},
        {
            "$set": {
                "reset_otp": otp,
                "otp_expiry": datetime.utcnow() + timedelta(minutes=5)
            }
        }
    )

    # 👉 Here you should send OTP via email (SMTP later)
    print(f"[DEBUG OTP] {email} -> {otp}")

    return otp


def verify_otp(email: str, otp: str):
    user = users_collection.find_one({"email": email})

    if not user:
        return False, "User not found"

    saved_otp = user.get("reset_otp")
    expiry = user.get("otp_expiry")

    if not saved_otp:
        return False, "OTP not generated"

    if saved_otp != otp:
        return False, "Invalid OTP"

    if not expiry:
        return False, "OTP expiry missing"

    if datetime.utcnow() > expiry:
        return False, "OTP expired"

    return True, "OTP verified"


# ================= RESET PASSWORD =================

def reset_user_password(email: str, otp: str, new_password: str):
    user = users_collection.find_one({"email": email})

    if not user:
        return False, "User not found"

    # 🔐 VERIFY OTP AGAIN (CRITICAL SECURITY)
    saved_otp = user.get("reset_otp")
    expiry = user.get("otp_expiry")

    if not saved_otp:
        return False, "OTP not generated"

    if saved_otp != otp:
        return False, "Invalid OTP"

    if not expiry:
        return False, "OTP expiry missing"

    if datetime.utcnow() > expiry:
        return False, "OTP expired"

    # 🔐 HASH NEW PASSWORD
    hashed_password = hash_password(new_password)

    users_collection.update_one(
        {"email": email},
        {
            "$set": {"password": hashed_password},
            "$unset": {
                "reset_otp": "",
                "otp_expiry": ""
            }
        }
    )

    return True, "Password reset successful"