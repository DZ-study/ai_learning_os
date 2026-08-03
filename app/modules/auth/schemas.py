from pydantic import BaseModel, EmailStr


class SendCodeRequest(BaseModel):
  """
  请求发送验证码
  """
  email: EmailStr

class SendCodeResponse(BaseModel):
  """
  返回发送验证码
  """
  email: EmailStr

class LoginRequest(BaseModel):
  """
  请求登录
  """
  email: EmailStr
  code: str


class TokenResponse(BaseModel):
  """
  登陆成功返回token
  """
  access_token: str
  refresh_token: str
  token_type: str

class VerifyCodeRequest(BaseModel):
    """
    验证验证码登录
    """
    email: EmailStr
    code: str

class CurrentUserResponse(BaseModel):
    """
    当前用户信息
    """
    id: int
    email: EmailStr

    class Config:
        from_attributes = True