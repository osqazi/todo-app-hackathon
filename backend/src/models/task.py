"""Task model for todo items with user ownership."""
from datetime import datetime, timezone, date
from typing import Optional
from enum import Enum as PyEnum
from sqlmodel import Field, SQLModel, Column, Enum as SQLModelEnum, ARRAY, String


class TaskPriority(str, PyEnum):
    """Task priority levels for organization"""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class RecurrencePattern(str, PyEnum):
    """Recurrence frequency patterns for recurring tasks"""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


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

    # ===== PHASE II PART 2: NEW FIELDS =====

    # Priority & Tags (Intermediate Features - US1)
    priority: TaskPriority = Field(
        default=TaskPriority.MEDIUM,
        sa_column=Column(SQLModelEnum(TaskPriority)),
        description="Task priority level (high/medium/low, default: medium)"
    )
    tags: list[str] = Field(
        default_factory=list,
        sa_column=Column(ARRAY(String(50))),
        description="User-defined category tags (max 50 chars each, max 10 tags)"
    )

    # Due Dates & Reminders (Advanced Features - US3)
    due_date: Optional[datetime] = Field(
        default=None,
        description="Task due date/time in UTC (NULL if no due date)"
    )
    notification_sent: bool = Field(
        default=False,
        description="Track if due date notification has been sent (reset on due_date update)"
    )

    # Recurring Tasks (Advanced Features - US4)
    is_recurring: bool = Field(
        default=False,
        description="Whether task repeats on a schedule (default: False)"
    )
    recurrence_pattern: Optional[RecurrencePattern] = Field(
        default=None,
        sa_column=Column(SQLModelEnum(RecurrencePattern)),
        description="Frequency of recurrence (daily/weekly/monthly), required if is_recurring=True"
    )
    recurrence_end_date: Optional[date] = Field(
        default=None,
        description="Optional end date for recurrence (inclusive), prevents future instances after this date"
    )
    parent_task_id: Optional[int] = Field(
        default=None,
        foreign_key="tasks.id",
        description="Reference to parent task if this is a recurring instance"
    )
