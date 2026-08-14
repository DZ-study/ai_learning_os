from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.core.dependencies import get_llm_service
from app.modules.ai.schemas import ChatRequest

router = APIRouter(prefix="/ai")


# 聊天流式输出
@router.post("/chat")
async def chat(request: ChatRequest, ai_service=Depends(get_llm_service)):
    return StreamingResponse(
        ai_service.chat_stream(user_message=request.messages),
        media_type="text/event-stream",
    )
