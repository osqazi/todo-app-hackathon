"""ChatMessage model for individual messages in AI chatbot conversations."""
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING, Any
from enum import Enum as PyEnum
from sqlmodel import Field, SQLModel, Relationship, Column, JSON
from sqlalchemy import Enum as SQLAlchemyEnum, Text

if TYPE_CHECKING:
    from .chat_conversation import ChatConversation


class MessageRole(str, PyEnum):
    """Enum for message roles in conversation."""
    USER = "user"
    AGENT = "agent"
    SYSTEM = "system"


class ChatMessage(SQLModel, table=True):
    """
    ChatMessage database model representing a single message in a conversation.

    Messages can be from users, the AI agent, or system notifications.
    Tool calls and metadata are stored as JSONB for flexibility.
    """
    __tablename__ = "chat_messages"

    # Primary key
    message_id: Optional[int] = Field(default=None, primary_key=True)

    # Foreign key (conversation)
    conversation_id: int = Field(
        foreign_key="chat_conversations.conversation_id",
        index=True,
        nullable=False,
        description="Parent conversation ID"
    )

    # Message attributes
    role: str = Field(
        sa_column=Column(
            SQLAlchemyEnum("user", "agent", "system", name="message_role", native_enum=True),
            nullable=False,
            index=True
        ),
        description="Message sender: user, agent, or system"
    )
    content: str = Field(
        sa_column=Column("content", Text, nullable=False),
        description="Message text content"
    )

    # Tool tracking (JSONB)
    tool_calls: Optional[dict[str, Any]] = Field(
        default=None,
        sa_column=Column(JSON),
        description="Array of tool calls made during agent response (JSONB)"
    )

    # Message metadata (JSONB) - using 'message_metadata' to avoid SQLAlchemy reserved name
    message_metadata: Optional[dict[str, Any]] = Field(
        default=None,
        sa_column=Column("metadata", JSON),  # Column name in DB is still 'metadata'
        description="Additional data: streaming state, reasoning, errors (JSONB)"
    )

    # Timestamp
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
        description="When message was created"
    )

    # Relationships
    conversation: "ChatConversation" = Relationship(back_populates="messages")
