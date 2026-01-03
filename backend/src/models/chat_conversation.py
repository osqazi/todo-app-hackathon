"""ChatConversation model for AI chatbot conversation sessions."""
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from .chat_message import ChatMessage


class ChatConversation(SQLModel, table=True):
    """
    ChatConversation database model representing a conversation session between a user and the AI assistant.

    Each conversation belongs to exactly one user and contains multiple messages.
    Conversations are automatically timestamped and updated when new messages are added.
    """
    __tablename__ = "chat_conversations"

    # Primary key
    conversation_id: Optional[int] = Field(default=None, primary_key=True)

    # Foreign key (user ownership) - references Better Auth user table (TEXT id)
    # NOTE: Foreign key constraint created by migration script
    user_id: str = Field(
        index=True,
        max_length=255,
        description="ID of user who owns this conversation (TEXT from Better Auth)"
    )

    # Timestamps
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
        description="When conversation was started"
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
        description="Last message timestamp (auto-updated by database trigger)"
    )

    # Relationships
    messages: list["ChatMessage"] = Relationship(
        back_populates="conversation",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "lazy": "selectin"}
    )
