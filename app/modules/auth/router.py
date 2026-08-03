from fastapi import APIRouter, Depends

from app.core.dependencies import get_auth_service
from app.shared.schemas import ApiResponse

from .schemas import SendCodeRequest, SendCodeResponse, TokenResponse, VerifyCodeRequest
from .service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=ApiResponse[TokenResponse])
async def login(
    request: VerifyCodeRequest,
    # TODO: depends如何实现依赖注入？什么是依赖注入
    auth_service: AuthService = Depends(get_auth_service),
):
    return await auth_service.login(
        request.email,
        request.code,
    )


@router.post("/send-code", response_model=ApiResponse[SendCodeResponse])
async def send_code(
    request: SendCodeRequest, auth_service: AuthService = Depends(get_auth_service)
):
    return await auth_service.send_code(email=request.email)
