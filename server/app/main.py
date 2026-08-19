import logging
import time
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.database.base import Base
from app.core.database.session import engine
from app.core.logging import configure_logging
from app.shared.exceptions import AppException
from app.shared.schemas import ApiResponse

configure_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # 启动时尝试建表（作为安全兜底，正式的迁移由 alembic 管理）
    try:
        logger.info("Initializing database schema")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        yield
    except Exception:
        logger.exception("Application lifecycle failed")
        raise
    finally:
        await engine.dispose()
        logger.info("Database engine disposed")


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        started_at = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            logger.exception(
                "Unhandled request error request_id=%s method=%s path=%s",
                request_id,
                request.method,
                request.url.path,
            )
            raise
        elapsed_ms = (time.perf_counter() - started_at) * 1000
        response.headers["X-Request-ID"] = request_id
        logger.info(
            "Request completed request_id=%s method=%s path=%s status=%s duration_ms=%.1f",
            request_id,
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
        )
        return response


app.add_middleware(RequestLoggingMiddleware)

# ── 全局异常处理器 ──────────────────────────────
# 捕获所有 AppException 子类，按业务约定的格式返回给前端


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    logger.warning(
        "Application error method=%s path=%s status=%s code=%s message=%s",
        request.method,
        request.url.path,
        exc.status_code,
        exc.code,
        exc.message,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=ApiResponse(
            code=exc.code,
            message=exc.message,
            data=exc.data,
        ).model_dump(),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    logger.warning(
        "Request validation failed method=%s path=%s", request.method, request.url.path
    )
    return JSONResponse(
        status_code=422,
        content=ApiResponse(
            code=1, message="请求参数校验失败", data=jsonable_encoder(exc.errors())
        ).model_dump(),
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    logger.warning(
        "HTTP error method=%s path=%s status=%s",
        request.method,
        request.url.path,
        exc.status_code,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=ApiResponse(code=1, message=str(exc.detail), data=None).model_dump(),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception(
        "Unhandled application error method=%s path=%s",
        request.method,
        request.url.path,
    )
    return JSONResponse(
        status_code=500,
        content=ApiResponse(
            code=1, message="服务器内部错误，请稍后再试", data=None
        ).model_dump(),
    )


app.include_router(
    api_router,
    prefix="/api",
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/")
def root():
    return {
        "message": "AI Learning OS API running",
    }
