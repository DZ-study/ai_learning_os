from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class GoalBase(BaseModel):
    """
    公共字段
    """

    title: str = Field(min_length=1, max_length=100, description="目标名称")

    description: str | None = Field(default=None, description="目标描述")

    level: str | None = Field(default=None, max_length=20, description="难度等级")

    start_date: date | None = Field(default=None, description="开始日期")

    end_date: date | None = Field(default=None, description="结束日期")


class GoalCreate(GoalBase):
    """
    创建目标请求
    """

    pass


class GoalUpdate(BaseModel):
    """
    更新目标请求

    全部字段可选
    """

    title: str | None = Field(default=None, min_length=1, max_length=100)

    description: str | None = None

    category: str | None = None

    level: str | None = None

    start_date: date | None = None

    end_date: date | None = None

    status: str | None = None


class GoalResponse(BaseModel):
    """
    返回给前端的数据
    """

    id: int

    user_id: int

    title: str

    description: str | None

    category: str | None

    level: str | None

    start_date: date | None

    end_date: date | None

    status: str

    created_at: datetime

    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GoalParseRequest(BaseModel):
    messages: str


class GoalParseResponse(BaseModel):
    content: str
