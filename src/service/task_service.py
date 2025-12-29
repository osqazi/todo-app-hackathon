"""Task service module.

This module provides business logic and validation for task operations.
"""

from domain.task import Task
from domain.exceptions import InvalidTaskError
from repository.task_repository import TaskRepository


class TaskService:
    """Service layer for task operations.

    Provides business logic, validation, and orchestration of task
    operations through the repository layer.

    Attributes:
        _repository: TaskRepository instance for data access
    """

    MAX_TITLE_LENGTH = 200

    def __init__(self, repository: TaskRepository) -> None:
        """Initialize task service with repository.

        Args:
            repository: TaskRepository instance for data access
        """
        self._repository = repository

    def add_task(self, title: str, description: str = "") -> Task:
        """Add a new task with validation.

        Args:
            title: Task title (required, non-empty)
            description: Optional task description

        Returns:
            Newly created task

        Raises:
            InvalidTaskError: If title is empty or too long
        """
        self._validate_title(title)
        return self._repository.create(title.strip(), description.strip())

    def list_tasks(self) -> list[Task]:
        """Get all tasks.

        Returns:
            List of all tasks in insertion order
        """
        return self._repository.get_all()

    def get_task(self, task_id: int) -> Task:
        """Get a specific task by ID.

        Args:
            task_id: ID of task to retrieve

        Returns:
            Task object

        Raises:
            TaskNotFoundError: If task not found
        """
        return self._repository.get_by_id(task_id)

    def update_task(
        self, task_id: int, title: str | None = None, description: str | None = None
    ) -> Task:
        """Update task title and/or description with validation.

        Args:
            task_id: ID of task to update
            title: New title (None or empty string to keep current)
            description: New description (None to keep current)

        Returns:
            Updated task

        Raises:
            TaskNotFoundError: If task not found
            InvalidTaskError: If new title is empty (when provided)
        """
        # If title is provided and not empty, validate it
        if title is not None and title.strip():
            self._validate_title(title)
            title = title.strip()
        elif title is not None and not title.strip():
            # Empty string provided - means keep current title
            title = None

        # If description provided, strip it; if empty string, keep as empty
        if description is not None:
            description = description.strip() if description else ""

        return self._repository.update(task_id, title, description)

    def delete_task(self, task_id: int) -> None:
        """Delete a task by ID.

        Args:
            task_id: ID of task to delete

        Raises:
            TaskNotFoundError: If task not found
        """
        self._repository.delete(task_id)

    def toggle_task_status(self, task_id: int) -> Task:
        """Toggle task completion status.

        Args:
            task_id: ID of task to toggle

        Returns:
            Updated task with toggled status

        Raises:
            TaskNotFoundError: If task not found
        """
        return self._repository.toggle_status(task_id)

    def _validate_title(self, title: str) -> None:
        """Validate task title.

        Args:
            title: Title to validate

        Raises:
            InvalidTaskError: If title is empty or too long
        """
        if not title.strip():
            raise InvalidTaskError("Title cannot be empty")
        if len(title.strip()) > self.MAX_TITLE_LENGTH:
            raise InvalidTaskError(f"Title too long (max {self.MAX_TITLE_LENGTH} characters)")
