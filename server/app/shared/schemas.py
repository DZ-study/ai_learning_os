from typing import Generic, TypeVar

from pydantic.generics import GenericModel

T = TypeVar("T")


class ApiResponse(GenericModel, Generic[T]):
    code: int = 0
    message: str = "success"
    data: T | None = None
