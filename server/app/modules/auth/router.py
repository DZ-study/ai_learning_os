from fastapi import APIRouter, Depends

from app.core.dependencies import get_auth_service, get_current_user_id
from app.shared.schemas import ApiResponse

from .schemas import (
    RefreshRequest,
    SendCodeRequest,
    SendCodeResponse,
    TokenResponse,
    VerifyCodeRequest,
)
from .service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=ApiResponse[TokenResponse])
async def login(
    request: VerifyCodeRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    result = await auth_service.login(email=request.email, code=request.code)
    return ApiResponse(data=result)


@router.post("/refresh", response_model=ApiResponse[TokenResponse])
async def refresh(
    request: RefreshRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    result = await auth_service.refresh(refresh_token=request.refresh_token)
    return ApiResponse(data=result)


@router.post("/send-code", response_model=ApiResponse[SendCodeResponse])
async def send_code(
    request: SendCodeRequest, auth_service: AuthService = Depends(get_auth_service)
):
    result = await auth_service.send_code(email=request.email)
    return ApiResponse(data=result)
