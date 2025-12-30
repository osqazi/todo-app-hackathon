"""
Pydantic schemas for task API requests and responses.

Defines validation models for creating, updating, and returning tasks.
"""

from datetime import datetime
from typing import Optional
import re

from pydantic import BaseModel, Field, field_validator

from src.models.task import TaskPriority


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

    New Phase II Part 2 fields:
        priority: Task priority level (default: medium)
        tags: Category tags (max 10 tags, each max 50 chars)
    """
    priority: TaskPriority = Field(
        default=TaskPriority.MEDIUM,
        description="Task priority level (high/medium/low)",
        examples=["high"]
    )
    tags: list[str] = Field(
        default_factory=list,
        description="Category tags (max 10 tags, alphanumeric + hyphens/underscores, max 50 chars each)",
        examples=[["work", "urgent"]]
    )

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v: list[str]) -> list[str]:
        """
        Validate tag list:
        - Max 10 tags
        - Each tag: alphanumeric + hyphens/underscores only
        - Max 50 characters per tag
        - No duplicate tags
        """
        if len(v) > 10:
            raise ValueError("Maximum 10 tags allowed")

        # Remove duplicates (case-insensitive)
        seen = set()
        unique_tags = []
        for tag in v:
            tag_lower = tag.lower()
            if tag_lower not in seen:
                seen.add(tag_lower)
                unique_tags.append(tag)

        # Validate each tag format
        tag_pattern = re.compile(r'^[a-zA-Z0-9_-]+$')
        for tag in unique_tags:
            if len(tag) > 50:
                raise ValueError(f"Tag '{tag}' exceeds 50 character limit")
            if not tag_pattern.match(tag):
                raise ValueError(f"Tag '{tag}' contains invalid characters (only alphanumeric, hyphens, and underscores allowed)")

        return unique_tags


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
    priority: Optional[TaskPriority] = Field(
        default=None,
        description="Updated task priority (optional)",
    )
    tags: Optional[list[str]] = Field(
        default=None,
        description="Updated category tags (optional, replaces existing tags)",
    )

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        """
        Validate tag list if provided:
        - Max 10 tags
        - Each tag: alphanumeric + hyphens/underscores only
        - Max 50 characters per tag
        - No duplicate tags
        """
        if v is None:
            return v

        if len(v) > 10:
            raise ValueError("Maximum 10 tags allowed")

        # Remove duplicates (case-insensitive)
        seen = set()
        unique_tags = []
        for tag in v:
            tag_lower = tag.lower()
            if tag_lower not in seen:
                seen.add(tag_lower)
                unique_tags.append(tag)

        # Validate each tag format
        tag_pattern = re.compile(r'^[a-zA-Z0-9_-]+$')
        for tag in unique_tags:
            if len(tag) > 50:
                raise ValueError(f"Tag '{tag}' exceeds 50 character limit")
            if not tag_pattern.match(tag):
                raise ValueError(f"Tag '{tag}' contains invalid characters (only alphanumeric, hyphens, and underscores allowed)")

        return unique_tags


class TaskResponse(TaskBase):
    """
    Schema for task API responses.

    Includes all task fields except user_id (implicit from auth).

    Attributes:
        id: Unique task identifier
        completed: Whether the task is complete
        created_at: Task creation timestamp
        updated_at: Last modification timestamp (null if never modified)
        priority: Task priority level
        tags: Category tags
    """
    id: int
    completed: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    priority: TaskPriority
    tags: list[str]

    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    """Schema for paginated task list responses."""
    tasks: list[TaskResponse]
    total: int
    offset: int
    limit: int
