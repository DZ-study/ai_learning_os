from redis.asyncio import Redis

from app.core.config import settings

redis_client = Redis.from_url(
  settings.REDIS_URL,
  # TODO:密码在哪里获取
  # password=settings.REDIS_PASSWORD,
  encoding="utf-8",
  decode_responses=True
)