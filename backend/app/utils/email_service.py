import smtplib
from email.mime.text import MIMEText
import logging

from app.config.settings import settings

# Configure logging
logger = logging.getLogger(__name__)

# Use 465 for SSL (More reliable on Railway/Cloud)
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465

EMAIL = settings.EMAIL
PASSWORD = settings.EMAIL_PASSWORD


def send_email(to: str, subject: str, body: str):
    if not EMAIL or not PASSWORD:
        logger.warning(f"📩 [SKIP EMAIL] Missing credentials. Content: {subject} to {to}")
        return

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = EMAIL
    msg["To"] = to

    try:
        # Use SMTP_SSL for port 465
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            server.login(EMAIL, PASSWORD)
            server.send_message(msg)

        logger.info(f"✅ Email sent successfully to {to}")

    except Exception as e:
        logger.error(f"❌ Email failed to {to}: {str(e)}")
        # We don't raise error to prevent blocking the user flow
        # The OTP is still printed in the logs for the admin to find