"""
Conversation service for managing chatbot conversation persistence.

This service handles creating conversations, saving messages, and loading
conversation history for multi-turn context.
"""
from typing import Optional, Any
from datetime import datetime, timezone
from sqlmodel import Session, select, desc

from src.models.chat_conversation import ChatConversation
from src.models.chat_message import ChatMessage, MessageRole


class ConversationService:
    """Service for managing chat conversations and messages."""

    def __init__(self, db_session: Session):
        """
        Initialize conversation service with database session.

        Args:
            db_session: SQLModel database session
        """
        self.db = db_session

    async def get_or_create_conversation(
        self,
        user_id: str,
        conversation_id: Optional[int] = None
    ) -> ChatConversation:
        """
        Get existing conversation or create a new one.

        Args:
            user_id: User ID who owns the conversation
            conversation_id: Optional existing conversation ID

        Returns:
            ChatConversation object (existing or newly created)

        Raises:
            ValueError: If conversation_id provided but not found or not owned by user
        """
        if conversation_id:
            # Load existing conversation
            conversation = self.db.get(ChatConversation, conversation_id)
            if not conversation:
                raise ValueError(f"Conversation #{conversation_id} not found")
            if conversation.user_id != user_id:
                raise ValueError(
                    f"Conversation #{conversation_id} does not belong to user {user_id}"
                )
            return conversation
        else:
            # Create new conversation
            conversation = ChatConversation(user_id=user_id)
            self.db.add(conversation)
            self.db.commit()
            self.db.refresh(conversation)
            return conversation

    async def load_conversation_history(
        self,
        conversation_id: int,
        limit: int = 20,
        offset: int = 0
    ) -> list[dict[str, str]]:
        """
        Load conversation message history for agent context.

        Args:
            conversation_id: Conversation ID to load
            limit: Maximum number of messages to load (default: 20)
            offset: Number of messages to skip (for pagination) (default: 0)

        Returns:
            List of message dictionaries in format:
            [{"role": "user"/"agent"/"system", "content": "..."}, ...]
            Ordered chronologically (oldest first)
        """
        # Query messages for this conversation
        statement = (
            select(ChatMessage)
            .where(ChatMessage.conversation_id == conversation_id)
            .order_by(ChatMessage.created_at)
            .offset(offset)
            .limit(limit)
        )
        messages = self.db.exec(statement).all()

        # Convert to agent-compatible format
        return [
            {
                "role": "assistant" if msg.role == MessageRole.AGENT else msg.role.value,
                "content": msg.content
            }
            for msg in messages
        ]

    async def save_message(
        self,
        conversation_id: int,
        role: str,  # Enum value string: "user", "agent", or "system"
        content: str,
        tool_calls: Optional[list[dict[str, Any]]] = None,
        metadata: Optional[dict[str, Any]] = None
    ) -> ChatMessage:
        """
        Save a message to the conversation.

        Args:
            conversation_id: Conversation to add message to
            role: Message role string ("user", "agent", or "system")
            content: Message text content
            tool_calls: Optional list of tool calls made (for agent messages)
            metadata: Optional metadata (streaming state, reasoning, errors)

        Returns:
            Created ChatMessage object

        Raises:
            ValueError: If conversation not found or invalid role
        """
        # Verify conversation exists
        conversation = self.db.get(ChatConversation, conversation_id)
        if not conversation:
            raise ValueError(f"Conversation #{conversation_id} not found")

        # Validate role value
        valid_roles = ['user', 'agent', 'system']
        if role not in valid_roles:
            raise ValueError(f"Invalid role: {role}. Must be one of {valid_roles}")

        # Create message (role is already a string value, no conversion needed)
        message = ChatMessage(
            conversation_id=conversation_id,
            role=role,  # Pass string value directly
            content=content,
            tool_calls={"calls": tool_calls} if tool_calls else None,
            message_metadata=metadata
        )

        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)

        # Note: conversation.updated_at is automatically updated by database trigger

        return message

    async def get_user_conversations(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> list[ChatConversation]:
        """
        Get all conversations for a user (most recent first).

        Args:
            user_id: User ID
            limit: Maximum conversations to return
            offset: Number to skip (pagination)

        Returns:
            List of ChatConversation objects
        """
        statement = (
            select(ChatConversation)
            .where(ChatConversation.user_id == user_id)
            .order_by(desc(ChatConversation.updated_at))
            .offset(offset)
            .limit(limit)
        )
        return list(self.db.exec(statement).all())

    async def delete_conversation(self, conversation_id: int, user_id: str) -> None:
        """
        Delete a conversation and all its messages (cascade).

        Args:
            conversation_id: Conversation to delete
            user_id: User ID (for ownership verification)

        Raises:
            ValueError: If conversation not found or not owned by user
        """
        conversation = self.db.get(ChatConversation, conversation_id)
        if not conversation:
            raise ValueError(f"Conversation #{conversation_id} not found")
        if conversation.user_id != user_id:
            raise ValueError(
                f"Conversation #{conversation_id} does not belong to user {user_id}"
            )

        self.db.delete(conversation)
        self.db.commit()
