"""LLM 专用异常。

继承自 AppException，与项目现有异常体系统一，
由 main.py 中的全局异常处理器统一捕获并返回标准格式。
"""

from app.shared.exceptions import AppException


class LLMError(AppException):
    """LLM 异常基类。"""

    def __init__(
        self,
        message: str,
        *,
        code: int = 1,
        status_code: int = 500,
        data: object = None,
    ) -> None:
        super().__init__(message, code=code, status_code=status_code, data=data)


class LLMConfigError(LLMError):
    """Provider 配置错误（缺少 API Key、不支持的 Provider 等）。"""

    def __init__(self, message: str) -> None:
        super().__init__(message, code=2, status_code=500)


class LLMApiError(LLMError):
    """模型 API 调用失败（网络错误、服务端错误等）。"""

    def __init__(self, message: str, *, data: object = None) -> None:
        super().__init__(message, code=3, status_code=502, data=data)


class LLMTimeoutError(LLMError):
    """请求超时。"""

    def __init__(self, message: str = "LLM 请求超时") -> None:
        super().__init__(message, code=4, status_code=504)


class LLMRateLimitError(LLMError):
    """API 限流。"""

    def __init__(self, message: str = "LLM 请求过于频繁，请稍后再试") -> None:
        super().__init__(message, code=5, status_code=429)
