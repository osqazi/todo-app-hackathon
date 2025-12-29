"""
Task API endpoints - CRUD operations for todo items.

All endpoints require JWT authentication and enforce user isolation.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from src.auth.dependencies import get_current_user
from src.db.session import get_session
from src.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from src.service.task_service import TaskService

router = APIRouter(prefix="", tags=["tasks"])


@router.get("/", response_model=List[TaskResponse])
def list_tasks(
    current_user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
    offset: int = 0,
    limit: int = 100,
):
    """
    List all tasks for the authenticated user.

    Returns a paginated list of tasks owned by the current user,
    ordered by creation date (newest first).
    """
    service = TaskService(session, current_user_id)
    return service.get_tasks(offset=offset, limit=limit)


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
