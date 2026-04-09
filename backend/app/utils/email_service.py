import smtplib
from email.mime.text import MIMEText

from app.config.settings import settings

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

EMAIL = settings.EMAIL
PASSWORD = settings.EMAIL_PASSWORD


def send_email(to: str, subject: str, body: str):
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = EMAIL
    msg["To"] = to

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL, PASSWORD)
            server.send_message(msg)

        print(f"✅ Email sent to {to}")

    except Exception as e:
        print("❌ Email failed:", str(e))