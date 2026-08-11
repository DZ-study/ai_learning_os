import secrets

from pydantic import EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security.jwt import (
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.infrastructure.email.service import EmailService
from app.infrastructure.redis.service import RedisService
from app.modules.user.repository import UserRepository
from app.shared.exceptions import (
    BadRequestException,
    TooManyRequestsException,
    UnauthorizedException,
)

from .repository import AuthRepository


class AuthService:
    """认证业务逻辑 — 持有数据库会话，统一管理事务提交。"""

    def __init__(
        self,
        session: AsyncSession,
        auth_repository: AuthRepository,
        user_repository: UserRepository,
        email_service: EmailService,
        redis_service: RedisService,
    ) -> None:
        self.session = session
        self.auth_repository = auth_repository
        self.user_repository = user_repository
        self.email_service = email_service
        self.redis_service = redis_service

    async def login(self, email: EmailStr, code: str) -> dict:
        """验证码登录，必要时自动创建用户。事务在 service 层提交。"""

        # 1. 从 Redis 校验验证码
        stored_code = await self.redis_service.get(key=f"auth:code:{email}")

        if not stored_code:
            raise BadRequestException("验证码已过期，请重新发送")

        if stored_code != code:
            raise BadRequestException("验证码错误，请重新输入")

        # 验证通过，删除已使用的验证码
        await self.redis_service.delete(key=f"auth:code:{email}")

        # 2. 查询或创建用户（数据库操作统一 flush，此处 commit）
        user = await self.auth_repository.get_user_by_email(email)

        if not user:
            user = await self.user_repository.create(email)
            await self.auth_repository.create_auth_account(
                user_id=user.id,
                provider="email",
                email=email,
            )

        # 3. 所有数据库操作成功，提交事务
        await self.session.commit()

        # 4. 签发 JWT
        return {
            "access_token": create_access_token(user.id),
            "refresh_token": create_refresh_token(user.id),
            "token_type": "bearer",
        }

    async def send_code(self, email: EmailStr) -> dict:
        """发送邮箱验证码（无数据库操作）。"""

        can_send = await self.redis_service.check_send_code_limit(email=email)

        if not can_send:
            raise TooManyRequestsException("请勿频繁发送验证码，请稍后再试")

        code = str(secrets.randbelow(900_000) + 100_000)  # 6 位随机数

        await self.redis_service.set(key=f"auth:code:{email}", value=code, expire=300)

        await self.email_service.send_email(email, "验证码", f"您的验证码是 {code}")

        return {"email": email}

    async def refresh(self, refresh_token: str) -> dict:
        """用 refresh_token 换取新的 token 对。"""

        payload = decode_token(refresh_token)

        if not payload or payload.get("type") != "refresh":
            raise UnauthorizedException("刷新令牌无效或已过期")

        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedException("无效的令牌载荷")

        user = await self.user_repository.get_by_id(int(user_id))
        if not user:
            raise UnauthorizedException("用户不存在")

        return {
            "access_token": create_access_token(user.id),
            "refresh_token": create_refresh_token(user.id),
            "token_type": "bearer",
        }
