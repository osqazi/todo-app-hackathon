"""
Notification API endpoints for due task reminders.

Provides endpoints for checking due tasks and marking notifications as sent.
"""

from typing import List
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from src.auth.dependencies import get_current_user
from src.db.session import get_session
from src.models.task import Task
from src.schemas.task import TaskResponse

router = APIRouter(prefix="/tasks", tags=["notifications"])


@router.get("/due", response_model=List[TaskResponse])
def get_due_tasks(
    current_user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Get tasks due within the next 5 minutes that haven't been notified yet.

    Returns tasks where:
    - due_date is between now and now + 5 minutes
    - status is not completed
    - notification_sent is False
    - belongs to the authenticated user

    Used by frontend notification polling (60-second interval).
    """
    now = datetime.utcnow()
    notification_window = now + timedelta(minutes=5)

    statement = (
        select(Task)
        .where(
            Task.user_id == current_user_id,
            Task.completed == False,
            Task.due_date.between(now, notification_window),
            Task.notification_sent == False,
        )
        .order_by(Task.due_date.asc())
    )

    tasks = session.exec(statement).all()
    return list(tasks)


@router.post("/{task_id}/notification-sent", status_code=status.HTTP_204_NO_CONTENT)
def mark_notification_sent(
    task_id: int,
    current_user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Mark a task's notification as sent.

    Updates notification_sent=True to prevent duplicate notifications.
    Only the task owner can mark their task as notified.

    Returns 404 if task not found or doesn't belong to user.
    """
    statement = select(Task).where(
        Task.id == task_id,
        Task.user_id == current_user_id,
    )

    task = session.exec(statement).first()
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    task.notification_sent = True
    session.add(task)
    session.commit()
