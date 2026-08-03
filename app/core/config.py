from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "AI Learning OS API"
    DATABASE_URL: str = ""
    REDIS_URL: str = ""

    JWT_SECRET_KEY: str = ""
    JWT_ACCESS_EXPIRE: int = 900 # 15 minutes
    JWT_REFRESH_EXPIRE: int = 604800 # 7 days
    JWT_ALGORITHM: str = "HS256"


    SMTP_HOST: str = "smtp.qq.com"
    SMTP_PORT: int = 465
    SMTP_USER: str = "1213198891@qq.com"
    SMTP_PASSWORD: str = ""

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = Settings()
