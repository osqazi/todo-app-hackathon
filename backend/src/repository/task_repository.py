"""
Task repository for data access operations.

Implements user-scoped CRUD operations ensuring data isolation.
All queries automatically filter by user_id to prevent cross-user access.
"""

from typing import List, Optional

from sqlalchemy import select, delete
from sqlmodel import Session

from src.models.task import Task
from src.schemas.task import TaskCreate, TaskUpdate


class TaskRepository:
    """
    Data access layer for Task entities.

    All methods enforce user isolation by requiring user_id parameter
    and filtering queries accordingly.

    Attributes:
        session: Database session
        user_id: ID of the owning user (injected from JWT)
    """

    def __init__(self, session: Session, user_id: str):
        self.session = session
        self.user_id = user_id

    def create(self, task_data: TaskCreate) -> Task:
        """
        Create a new task for the authenticated user.

        Args:
            task_data: Task creation data.

        Returns:
            The created Task instance.
        """
        task = Task(
            user_id=self.user_id,  # user_id is already a string from JWT
            title=task_data.title.strip(),
            description=task_data.description.strip(),
        )
        self.session.add(task)
        self.session.flush()
        self.session.refresh(task)
        return task

    def get_all(
        self,
        offset: int = 0,
        limit: int = 100,
    ) -> List[Task]:
        """
        Get all tasks for the authenticated user.

        Args:
            offset: Number of tasks to skip (pagination).
            limit: Maximum number of tasks to return.

        Returns:
            List of Task instances ordered by creation date (newest first).
        """
        statement = (
            select(Task)
            .where(Task.user_id == self.user_id)  # user_id is a string
            .order_by(Task.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = self.session.execute(statement)
        return list(result.scalars().all())

    def get_by_id(self, task_id: int) -> Optional[Task]:
        """
        Get a specific task by ID.

        Only returns the task if it belongs to the authenticated user.

        Args:
            task_id: The task ID to look up.

        Returns:
            Task instance if found and owned by user, None otherwise.
        """
        statement = (
            select(Task)
            .where(
                Task.id == task_id,
                Task.user_id == self.user_id,  # user_id is a string
            )
        )
        result = self.session.execute(statement)
        return result.scalar_one_or_none()

    def update(
        self,
        task_id: int,
        task_data: TaskUpdate,
    ) -> Optional[Task]:
        """
        Update a task's title and/or description.

        Only updates if the task belongs to the authenticated user.

        Args:
            task_id: The task ID to update.
            task_data: Fields to update (partial update supported).

        Returns:
            Updated Task instance if found, None otherwise.
        """
        task = self.get_by_id(task_id)
        if task is None:
            return None

        # Update only provided fields
        if task_data.title is not None:
            task.title = task_data.title.strip()
        if task_data.description is not None:
            task.description = task_data.description.strip()

        # Update timestamp
        from datetime import datetime, timezone
        task.updated_at = datetime.now(timezone.utc)

        self.session.flush()
        self.session.refresh(task)
        return task

    def delete(self, task_id: int) -> bool:
        """
        Delete a task permanently.

        Only deletes if the task belongs to the authenticated user.

        Args:
            task_id: The task ID to delete.

        Returns:
            True if deleted, False if not found.
        """
        task = self.get_by_id(task_id)
        if task is None:
            return False

        self.session.delete(task)
        self.session.flush()
        return True

    def toggle(self, task_id: int) -> Optional[Task]:
        """
        Toggle task completion status.

        Only toggles if the task belongs to the authenticated user.

        Args:
            task_id: The task ID to toggle.

        Returns:
            Updated Task instance if found, None otherwise.
        """
        task = self.get_by_id(task_id)
        if task is None:
            return None

        from datetime import datetime, timezone
        task.completed = not task.completed
        task.updated_at = datetime.now(timezone.utc)

        self.session.flush()
        self.session.refresh(task)
        return task
