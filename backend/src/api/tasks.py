"""
Task API endpoints - CRUD operations for todo items.

All endpoints require JWT authentication and enforce user isolation.
"""

from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlmodel import Session

from src.auth.dependencies import get_current_user
from src.db.session import get_session
from src.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from src.service.task_service import TaskService

router = APIRouter(prefix="", tags=["tasks"])


class TaskListResponse(BaseModel):
    """Response model for paginated task list with metadata"""
    tasks: List[TaskResponse]
    total: int
    offset: int
    limit: int
    filters_applied: dict


class CompleteTaskResponse(BaseModel):
    """Response model for completing a recurring task (US4 - T063)"""
    completed_task: TaskResponse
    next_instance: Optional[TaskResponse] = None


@router.get("/", response_model=TaskListResponse)
def list_tasks(
    current_user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
    offset: int = 0,
    limit: int = 100,
    # Search parameter
    search: Optional[str] = Query(None, description="Search in title and description"),
    # Filter parameters
    completed: Optional[bool] = Query(None, description="Filter by completion status"),
    priority: Optional[List[str]] = Query(None, description="Filter by priority (high, medium, low)"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags (OR logic)"),
    due_date_from: Optional[datetime] = Query(None, description="Filter tasks due on or after this date"),
    due_date_to: Optional[datetime] = Query(None, description="Filter tasks due on or before this date"),
    is_overdue: Optional[bool] = Query(None, description="Filter for overdue tasks"),
    # Sort parameters
    sort_by: str = Query("created_at", description="Field to sort by (created_at, due_date, priority, title)"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
):
    """
    List all tasks for the authenticated user with search, filter, and sort capabilities.

    Returns a paginated list of tasks with metadata about total count and applied filters.
    """
    service = TaskService(session, current_user_id)
    tasks, total = service.get_tasks_with_filters(
        search=search,
        completed=completed,
        priority=priority,
        tags=tags,
        due_date_from=due_date_from,
        due_date_to=due_date_to,
        is_overdue=is_overdue,
        sort_by=sort_by,
        sort_order=sort_order,
        offset=offset,
        limit=limit,
    )

    # Build filters_applied dict for metadata
    filters_applied = {}
    if search:
        filters_applied["search"] = search
    if completed is not None:
        filters_applied["completed"] = completed
    if priority:
        filters_applied["priority"] = priority
    if tags:
        filters_applied["tags"] = tags
    if due_date_from:
        filters_applied["due_date_from"] = due_date_from.isoformat()
    if due_date_to:
        filters_applied["due_date_to"] = due_date_to.isoformat()
    if is_overdue is not None:
        filters_applied["is_overdue"] = is_overdue
    filters_applied["sort_by"] = sort_by
    filters_applied["sort_order"] = sort_order

    return TaskListResponse(
        tasks=tasks,
        total=total,
        offset=offset,
        limit=limit,
        filters_applied=filters_applied,
    )


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_data: TaskCreate,
    current_user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Create a new task for the authenticated user.

    The task is automatically associated with the authenticated user's ID.
    """
    service = TaskService(session, current_user_id)
    return service.create_task(task_data)


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    current_user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Get a specific task by ID.

    Returns 404 if the task doesn't exist or doesn't belong to the user.
    """
    service = TaskService(session, current_user_id)
    task = service.get_task_by_id(task_id)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    current_user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Update a task's title and/or description.

    Only updates the fields that are provided (partial update).
    Returns 404 if the task doesn't exist or doesn't belong to the user.
    """
    service = TaskService(session, current_user_id)
    task = service.update_task(task_id, task_data)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    current_user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Delete a task permanently.

    Returns 404 if the task doesn't exist or doesn't belong to the user.
    """
    service = TaskService(session, current_user_id)
    deleted = service.delete_task(task_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )


@router.post("/{task_id}/toggle", response_model=TaskResponse)
def toggle_task(
    task_id: int,
    current_user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Toggle task completion status.

    Flips the task between complete and incomplete states.
    Returns 404 if the task doesn't exist or doesn't belong to the user.
    """
    service = TaskService(session, current_user_id)
    task = service.toggle_task(task_id)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return task


@router.post("/{task_id}/complete", response_model=CompleteTaskResponse)
def complete_task(
    task_id: int,
    current_user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Mark a task as complete and generate next instance if recurring (US4 - T062, T063).

    For non-recurring tasks:
        - Marks the task as complete
        - Returns completed_task and next_instance=null

    For recurring tasks:
        - Marks the task as complete
        - Calculates next due date based on recurrence_pattern
        - Creates next instance if within recurrence_end_date
        - Returns both completed_task and next_instance

    Returns 404 if the task doesn't exist or doesn't belong to the user.
    """
    service = TaskService(session, current_user_id)
    completed_task, next_instance = service.complete_task(task_id)

    if completed_task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    return CompleteTaskResponse(
        completed_task=completed_task,
        next_instance=next_instance
    )
