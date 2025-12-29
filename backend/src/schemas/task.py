"""
Pydantic schemas for task API requests and responses.

Defines validation models for creating, updating, and returning tasks.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TaskBase(BaseModel):
    """
    Base task schema with common fields.

    Attributes:
        title: Task title (1-200 characters, required)
        description: Optional task description (0-2000 characters)
    """
    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Task title (required, 1-200 characters)",
        examples=["Buy groceries"],
    )
    description: str = Field(
        default="",
        max_length=2000,
        description="Task description (optional, max 2000 characters)",
        examples=["Milk, eggs, bread"],
    )


class TaskCreate(TaskBase):
    """
    Schema for creating a new task.

    Used in POST /api/tasks request body.
    User ID is extracted from JWT, not included in request.
    """
    pass


class TaskUpdate(BaseModel):
    """
    Schema for updating an existing task.

    All fields are optional for partial updates.
    If a field is not provided, it won't be updated.
    """
    title: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=200,
        description="Updated task title (optional)",
    )
    description: Optional[str] = Field(
        default=None,
        max_length=2000,
        description="Updated task description (optional)",
    )


class TaskResponse(TaskBase):
    """
    Schema for task API responses.

    Includes all task fields except user_id (implicit from auth).

    Attributes:
        id: Unique task identifier
        completed: Whether the task is complete
        created_at: Task creation timestamp
        updated_at: Last modification timestamp (null if never modified)
    """
    id: int
    completed: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    """Schema for paginated task list responses."""
    tasks: list[TaskResponse]
    total: int
    offset: int
    limit: int
