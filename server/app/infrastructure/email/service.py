from app.core.config import settings
from app.infrastructure.email.client import EmailClient


class EmailService:
    def __init__(self, client: EmailClient):
        self.client = client

    async def send_email(self, email: str, subject: str, content: str):
        await self.client.send(
            to_email=email,
            subject=subject,
            content=content,
            host=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            from_email=settings.SMTP_USER,
        )
