"""
Chat API endpoint for AI chatbot interactions.

Handles natural language task management via OpenAI agent with MCP tools.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlmodel import Session

from src.auth.dependencies import get_current_user
from src.db.session import get_session
from src.agents.agent_runner import run_agent_with_tools, run_agent_stream
from src.services.conversation_service import ConversationService
from src.models.chat_message import MessageRole
from src.config import settings
from src.middleware.rate_limit import check_chat_rate_limit
from src.utils.input_validation import (
    sanitize_chat_message,
    validate_conversation_id,
    sanitize_error_message,
    InputValidationError
)
from src.utils.performance_logger import perf_metrics, measure_time
import time


router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    message: str = Field(..., min_length=1, max_length=5000, description="User's message")
    conversation_id: Optional[int] = Field(None, description="Conversation ID for multi-turn context")
    stream: bool = Field(False, description="Enable streaming responses (Phase 7)")


class ChatResponse(BaseModel):
    """Response model for chat endpoint (non-streaming)."""
    response: str = Field(..., description="Agent's response message")
    conversation_id: int = Field(..., description="Conversation ID for this exchange")
    tool_calls: Optional[list[dict]] = Field(None, description="Tools called during response")


@router.post("", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def chat_endpoint(
    request: ChatRequest,
    current_user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
    http_request: Request = None
):
    """
    Process a chat message and return agent's response.

    This endpoint:
    1. Validates JWT authentication (via get_current_user dependency)
    2. Checks rate limits (Phase 8)
    3. Validates and sanitizes input (Phase 8)
    4. Loads or creates conversation for the user
    5. Optionally loads conversation history for multi-turn context
    6. Runs OpenAI agent with MCP tools to process the message
    7. Saves user message and agent response to database
    8. Returns agent's response

    For streaming responses, use /api/chat/stream endpoint.

    Args:
        request: ChatRequest with user message and optional conversation_id
        current_user_id: Authenticated user ID (injected by dependency)
        session: Database session (injected by dependency)
        http_request: FastAPI request object for accessing headers

    Returns:
        ChatResponse with agent's reply and conversation_id

    Raises:
        HTTPException 401: If authentication fails (handled by dependency)
        HTTPException 400: If validation fails
        HTTPException 429: If rate limit exceeded
        HTTPException 500: If agent execution fails
    """
    # Initialize performance tracking and error handling variables
    start_time = time.time()
    tool_calls_count = 0

    # Phase 8: Check rate limit
    await check_chat_rate_limit(http_request, current_user_id)

    # Phase 8: Validate and sanitize input
    try:
        sanitized_message = sanitize_chat_message(request.message)
        validated_conversation_id = validate_conversation_id(request.conversation_id)
    except InputValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # Extract JWT from Authorization header
    auth_header = http_request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    jwt_token = auth_header.split(" ")[1]

    # Initialize conversation service
    conv_service = ConversationService(session)

    try:
        # Get or create conversation
        conversation = await conv_service.get_or_create_conversation(
            user_id=current_user_id,
            conversation_id=validated_conversation_id
        )

        # Load conversation history (if resuming existing conversation)
        conversation_history = None
        if validated_conversation_id:
            conversation_history = await conv_service.load_conversation_history(
                conversation_id=conversation.conversation_id,
                limit=settings.CHATBOT_MAX_CONVERSATION_HISTORY
            )

        # Save user message to database (sanitized)
        await conv_service.save_message(
            conversation_id=conversation.conversation_id,
            role="user",  # Lowercase string required by database enum
            content=sanitized_message
        )

        # Run agent with authentication context (use sanitized message)
        agent_response = await run_agent_with_tools(
            message=sanitized_message,
            user_id=current_user_id,
            jwt_token=jwt_token,
            conversation_id=conversation.conversation_id,
            conversation_history=conversation_history
        )

        # Extract response content and tool calls
        response_content = agent_response.content if hasattr(agent_response, 'content') else str(agent_response)
        tool_calls = agent_response.tool_calls if hasattr(agent_response, 'tool_calls') else None
        tool_calls_count = len(tool_calls) if tool_calls else 0

        # Save agent response to database
        await conv_service.save_message(
            conversation_id=conversation.conversation_id,
            role="agent",  # Lowercase string required by database enum
            content=response_content,
            tool_calls=tool_calls
        )

        success = True

        # Phase 8: Log performance
        response_time_ms = (time.time() - start_time) * 1000
        perf_metrics.log_chat_request(
            user_id=current_user_id,
            message_length=len(sanitized_message),
            response_time_ms=response_time_ms,
            tool_calls=tool_calls_count,
            streaming=False,
            success=True
        )

        return ChatResponse(
            response=response_content,
            conversation_id=conversation.conversation_id,
            tool_calls=tool_calls
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # Phase 8: Log failed request
        response_time_ms = (time.time() - start_time) * 1000
        perf_metrics.log_chat_request(
            user_id=current_user_id,
            message_length=len(sanitized_message),
            response_time_ms=response_time_ms,
            tool_calls=tool_calls_count,
            streaming=False,
            success=False,
            error=str(e)
        )

        # Log error for debugging
        if settings.CHATBOT_DEBUG_MODE:
            print(f"Chat endpoint error: {type(e).__name__}: {str(e)}")

        # Phase 8: Sanitize error message for user
        safe_error = sanitize_error_message(str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat message: {safe_error}"
        )


@router.post("/stream", status_code=status.HTTP_200_OK)
async def chat_stream_endpoint(
    request: ChatRequest,
    current_user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
    http_request: Request = None
):
    """
    Process a chat message with streaming response (Phase 7 - US5).

    Returns Server-Sent Events (SSE) stream with agent progress:
    - message_start: Response begins
    - content_delta: Incremental content chunks
    - tool_call_start/args/result: Tool execution details
    - message_end: Response complete
    - error: Error occurred

    Args:
        request: ChatRequest with user message
        current_user_id: Authenticated user ID
        session: Database session
        http_request: Request object

    Returns:
        StreamingResponse with SSE events

    Raises:
        HTTPException 401: If authentication fails
        HTTPException 400: If validation fails
        HTTPException 429: If rate limit exceeded
        HTTPException 500: If streaming fails
    """
    # Phase 8: Check rate limit
    await check_chat_rate_limit(http_request, current_user_id)

    # Phase 8: Validate and sanitize input
    try:
        sanitized_message = sanitize_chat_message(request.message)
        validated_conversation_id = validate_conversation_id(request.conversation_id)
    except InputValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # Extract JWT
    auth_header = http_request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header"
        )
    jwt_token = auth_header.split(" ")[1]

    # Initialize conversation service
    conv_service = ConversationService(session)

    try:
        # Get or create conversation
        conversation = await conv_service.get_or_create_conversation(
            user_id=current_user_id,
            conversation_id=validated_conversation_id
        )

        # Load history if needed
        conversation_history = None
        if validated_conversation_id:
            conversation_history = await conv_service.load_conversation_history(
                conversation_id=conversation.conversation_id,
                limit=settings.CHATBOT_MAX_CONVERSATION_HISTORY
            )

        # Save user message (sanitized)
        await conv_service.save_message(
            conversation_id=conversation.conversation_id,
            role="user",  # Lowercase string required by database enum
            content=sanitized_message
        )

        # Stream agent response with message persistence
        async def event_generator():
            import json

            accumulated_content = []
            accumulated_tool_calls = []

            try:
                async for event_line in run_agent_stream(
                    message=sanitized_message,
                    user_id=current_user_id,
                    jwt_token=jwt_token,
                    conversation_id=conversation.conversation_id,
                    conversation_history=conversation_history
                ):
                    yield event_line

                    # Parse SSE events to accumulate final message
                    if event_line.startswith("event: content_delta"):
                        try:
                            data_line = event_line.split("\ndata: ")[1].rstrip("\n")
                            data = json.loads(data_line)
                            accumulated_content.append(data.get('content', ''))
                        except:
                            pass

                    elif event_line.startswith("event: tool_call_start"):
                        try:
                            data_line = event_line.split("\ndata: ")[1].rstrip("\n")
                            data = json.loads(data_line)
                            accumulated_tool_calls.append(data)
                        except:
                            pass

                # Save agent response to database after stream completes
                final_content = ''.join(accumulated_content)
                if final_content:
                    await conv_service.save_message(
                        conversation_id=conversation.conversation_id,
                        role="agent",  # Lowercase string required by database enum
                        content=final_content,
                        tool_calls=accumulated_tool_calls if accumulated_tool_calls else None
                    )

            except Exception as e:
                # Log the error for debugging
                import traceback
                print(f"EVENT GENERATOR ERROR: {type(e).__name__}: {str(e)}")
                print("Full traceback:")
                traceback.print_exc()

                # Stream error event
                error_msg = json.dumps({'error': str(e), 'type': type(e).__name__})
                yield f"event: error\ndata: {error_msg}\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Disable nginx buffering for SSE
            }
        )

    except Exception as e:
        # Log the full traceback for debugging
        import traceback
        print(f"STREAMING ERROR: {type(e).__name__}: {str(e)}")
        print("Full traceback:")
        traceback.print_exc()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Streaming failed: {str(e)}"
        )


@router.get("/conversations", status_code=status.HTTP_200_OK)
async def list_conversations(
    current_user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
    limit: int = 20,
    offset: int = 0
):
    """
    List user's conversations (most recent first).

    Args:
        current_user_id: Authenticated user ID
        session: Database session
        limit: Max conversations to return
        offset: Pagination offset

    Returns:
        List of conversations with metadata
    """
    conv_service = ConversationService(session)
    conversations = await conv_service.get_user_conversations(
        user_id=current_user_id,
        limit=limit,
        offset=offset
    )

    return {
        "conversations": [
            {
                "conversation_id": conv.conversation_id,
                "created_at": conv.created_at.isoformat(),
                "updated_at": conv.updated_at.isoformat()
            }
            for conv in conversations
        ],
        "total": len(conversations),
        "limit": limit,
        "offset": offset
    }
