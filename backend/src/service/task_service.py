"""
Task service layer with business logic and validation.

Coordinates between API layer and repository layer,
applying business rules and validation before data operations.
"""

from datetime import datetime, timezone
from typing import List, Optional

from sqlmodel import Session

from src.models.task import Task
from src.schemas.task import TaskCreate, TaskUpdate
from src.repository.task_repository import TaskRepository


class TaskService:
    """
    Business logic layer for Task operations.

    Handles validation, business rules, and orchestrates
    repository operations.

    Attributes:
        session: Database session
        user_id: ID of the authenticated user (from JWT)
        repository: TaskRepository instance
    """

    def __init__(self, session: Session, user_id: str):
        self.session = session
        self.user_id = user_id
        self.repository = TaskRepository(session, user_id)

    def get_tasks(
        self,
        offset: int = 0,
        limit: int = 100,
    ) -> List[Task]:
        """
        Get all tasks for the authenticated user.

        Args:
            offset: Pagination offset.
            limit: Maximum number of tasks to return.

        Returns:
            List of Task instances.
        """
        return self.repository.get_all(offset=offset, limit=limit)

    def create_task(self, task_data: TaskCreate) -> Task:
        """
        Create a new task for the authenticated user.

        Validates input before creating.

        Args:
            task_data: Task creation data.

        Returns:
            Created Task instance.

        Raises:
            ValueError: If title is empty or whitespace-only.
        """
        # Validate title
        title = task_data.title.strip()
        if not title:
            raise ValueError("Title cannot be empty")

        # Create task
        return self.repository.create(task_data)

    def get_task_by_id(self, task_id: int) -> Optional[Task]:
        """
        Get a specific task by ID.

        Args:
            task_id: Task ID to look up.

        Returns:
            Task if found and owned by user, None otherwise.
        """
        return self.repository.get_by_id(task_id)

    def update_task(
        self,
        task_id: int,
        task_data: TaskUpdate,
    ) -> Optional[Task]:
        """
        Update a task's title and/or description.

        Args:
            task_id: Task ID to update.
            task_data: Fields to update.

        Returns:
            Updated Task if found, None otherwise.

        Raises:
            ValueError: If title is provided but empty.
        """
        # Validate title if provided
        if task_data.title is not None:
            title = task_data.title.strip()
            if not title:
                raise ValueError("Title cannot be empty")
            task_data.title = title

        # Update description if provided
        if task_data.description is not None:
            task_data.description = task_data.description.strip()

        return self.repository.update(task_id, task_data)

    def delete_task(self, task_id: int) -> bool:
        """
        Delete a task permanently.

        Args:
            task_id: Task ID to delete.

        Returns:
            True if deleted, False if not found.
        """
        return self.repository.delete(task_id)

    def toggle_task(self, task_id: int) -> Optional[Task]:
        """
        Toggle task completion status.

        Args:
            task_id: Task ID to toggle.

        Returns:
            Updated Task if found, None otherwise.
        """
        return self.repository.toggle(task_id)
