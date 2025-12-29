"""Task model for todo items with user ownership."""
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class Task(SQLModel, table=True):
    """
    Task database model with user ownership and audit fields.
    
    Every task belongs to exactly one user (enforced by foreign key).
    All queries MUST filter by user_id for multi-tenant isolation.
    """
    __tablename__ = "tasks"

    # Primary key
    id: Optional[int] = Field(default=None, primary_key=True)

    # Foreign key (user ownership) - references Better Auth user table (TEXT id)
    # NOTE: Foreign key constraint is created at database level by migration script
    # We don't define it in SQLModel to avoid metadata conflicts with Better Auth tables
    user_id: str = Field(
        index=True,
        max_length=255,
        description="ID of user who owns this task (TEXT from Better Auth)"
    )

    # Task content
    title: str = Field(
        min_length=1,
        max_length=500,
        description="Task title (required, 1-500 characters)"
    )
    description: str = Field(
        default="",
        max_length=2000,
        description="Task description (optional, max 2000 characters)"
    )

    # Task state
    completed: bool = Field(
        default=False,
        description="Whether task is completed (True) or incomplete (False)"
    )

    # Audit timestamps
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Task creation timestamp (UTC)"
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        description="Last modification timestamp (UTC), NULL if never modified"
    )
