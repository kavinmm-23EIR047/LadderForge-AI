import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # ---------------- DATABASE ----------------
    MONGO_URI: str = os.getenv(
        "MONGO_URI",
        "mongodb://localhost:27017/"
    )

    # ---------------- AI ----------------
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    # ---------------- JWT AUTH ----------------
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60)
    )

    # ---------------- GOOGLE AUTH ----------------
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")

    # ---------------- EMAIL CONFIG ----------------
    SMTP_SERVER: str = os.getenv(
        "SMTP_SERVER",
        "smtp.gmail.com"
    )
    SMTP_PORT: int = int(
        os.getenv("SMTP_PORT", 587)
    )

    EMAIL: str = os.getenv("EMAIL", "")
    EMAIL_PASSWORD: str = os.getenv("EMAIL_PASSWORD", "")

    # ---------------- FRONTEND ----------------
    FRONTEND_URL: str = os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173"
    )


settings = Settings()