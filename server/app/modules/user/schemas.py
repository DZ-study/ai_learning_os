from pydantic import BaseModel, EmailStr


class GetProfileResponse(BaseModel):
    id: int  # 自增ID不能直接返回到客户端，待修改
    email: EmailStr
    nickname: str | None
    avatar: str | None
    created_at: str


class UpdateProfileRequest(BaseModel):
    nickname: str | None = None
