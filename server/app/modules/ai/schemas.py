from anthropic import BaseModel


class ChatRequest(BaseModel):
    messages: str
