"""
统一异常体系

所有业务异常继承自 AppException，
由 main.py 中的全局异常处理器统一捕获，
返回规范的 ApiResponse 格式给前端。
"""

from typing import Any


class AppException(Exception):
    """应用级异常基类。

    子类按约定可以覆盖三个属性：
    - message:  给前端的可读错误提示
    - code:     业务错误码，默认 1
    - status_code: HTTP 状态码
    """

    def __init__(
        self,
        message: str,
        *,
        code: int = 1,
        status_code: int = 400,
        data: Any = None,
    ) -> None:
        self.message = message
        self.code = code
        self.status_code = status_code
        self.data = data
        super().__init__(message)


# ── 业务语义异常 ──────────────────────────────────


class BadRequestException(AppException):
    """通用请求错误（参数校验失败等）。"""

    def __init__(self, message: str, *, code: int = 1) -> None:
        super().__init__(message, code=code, status_code=400)


class UnauthorizedException(AppException):
    """认证失败 / Token 无效。"""

    def __init__(self, message: str, *, code: int = 1) -> None:
        super().__init__(message, code=code, status_code=401)


class ForbiddenException(AppException):
    """没有权限。"""

    def __init__(self, message: str, *, code: int = 1) -> None:
        super().__init__(message, code=code, status_code=403)


class NotFoundException(AppException):
    """资源不存在。"""

    def __init__(self, message: str, *, code: int = 1) -> None:
        super().__init__(message, code=code, status_code=404)


class ConflictException(AppException):
    """资源冲突（重复注册等）。"""

    def __init__(self, message: str, *, code: int = 1) -> None:
        super().__init__(message, code=code, status_code=409)


class TooManyRequestsException(AppException):
    """频率限制。"""

    def __init__(self, message: str, *, code: int = 1) -> None:
        super().__init__(message, code=code, status_code=429)


class InternalServerException(AppException):
    """服务端内部错误（非预期异常）。"""

    def __init__(
        self,
        message: str = "服务器内部错误，请稍后再试",
        *,
        code: int = 1,
    ) -> None:
        super().__init__(message, code=code, status_code=500)


class ServiceUnavailableException(AppException):
    """Required external service is temporarily unavailable."""

    def __init__(self, message: str = "服务暂时不可用，请稍后再试", *, code: int = 1) -> None:
        super().__init__(message, code=code, status_code=503)
