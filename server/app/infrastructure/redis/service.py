import logging

from pydantic import EmailStr
from redis.asyncio import Redis

from app.core.config import settings

from .exceptions import RedisServiceException

logger = logging.getLogger(__name__)


class RedisService:
    def __init__(self, redis_client: Redis):
        self.redis_client = redis_client

    async def set(self, key: str, value: str, expire: int):
        try:
            await self.redis_client.set(name=key, value=value, ex=expire)
        except Exception as e:
            logger.error("Redis set failed", exc_info=e)

            raise RedisServiceException("Redis operation failed")

    async def get(self, key: str) -> str | None:

        try:  # TODO: 类型处理
            return await self.redis_client.get(key)  # type: ignore

        except Exception as e:
            logger.error("Redis get failed", exc_info=e)

            raise RedisServiceException("Redis operation failed")

    async def delete(self, key: str):

        try:
            await self.redis_client.delete(key)

        except Exception as e:
            logger.error("Redis delete failed", exc_info=e)

            raise RedisServiceException("Redis operation failed")

    async def check_send_code_limit(self, email: EmailStr) -> bool:
        """
        检查验证码发送限制

        返回：
            True: 可以发送
            False: 不可以发送
        """
        script = """
        -- KEYS: 传给Lua的Redis Key列表
        -- ARGV: 传给Lua的普通参数列表
        local cooldown = redis.call(
            "GET",
            KEYS[1]
        )
        if cooldown then
            return 0
        end
        local daily_count = redis.call(
            "GET",
            KEYS[2]
        )
        if daily_count and tonumber(daily_count) >= tonumber(ARGV[3]) then
            return 0
        end

        -- 设置60S冷却
        redis.call(
            "SET",
            KEYS[1],
            1,
            "EX",
            ARGV[1]
        )

        -- 增加每日次数
        local count = redis.call(
            "INCR",
            KEYS[2]
        )

        -- 第一次设置过期时间
        if count == 1 then
            redis.call(
                "EXPIRE",
                KEYS[2],
                ARGV[2]
            )
        end

        return 1
        """

        cooldown_key = f"auth:cooldown:{email}"
        daily_key = f"auth:daily:{email}"

        try:
            result = await self.redis_client.eval(
                script, 2, cooldown_key, daily_key,
                settings.COOLDOWN_TIME, 86400, settings.MAX_SEND_COUNT,
            )
        except Exception:
            logger.exception("Redis rate-limit check failed")
            raise RedisServiceException("Redis operation failed") from None

        return result == 1
