import logging
from email.message import EmailMessage

import aiosmtplib
from pydantic import EmailStr

logger = logging.getLogger(__name__)


class EmailClient:
    async def send(
        self,
        to_email: EmailStr,
        subject: str,
        content: str,
        host: str,
        port: int,
        username: str,
        password: str,
        from_email: EmailStr,
    ):

        message = EmailMessage()  # 创建邮件对象

        message["From"] = from_email
        message["To"] = to_email
        message["Subject"] = subject

        message.set_content(content)

        try:
            await aiosmtplib.send(
                message,
                hostname=host,
                port=port,
                username=username,
                password=password,
                use_tls=True,
            )
        except (aiosmtplib.SMTPException, OSError):
            logger.exception("Email delivery failed recipient=%s", to_email)
            raise
