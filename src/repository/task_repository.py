"""Task repository module.

This module provides in-memory storage and CRUD operations for tasks.
"""

from datetime import datetime, timezone

from src.domain import Task, TaskNotFoundError


class TaskRepository:
    """In-memory repository for Task entities.

    Provides CRUD operations with O(1) lookup using dictionary storage.
    IDs are auto-generated sequentially starting from 1.

    Attributes:
        _tasks: Dictionary mapping task IDs to Task objects
        _next_id: Counter for generating unique task IDs
    """

    def __init__(self) -> None:
        """Initialize empty task repository."""
        self._tasks: dict[int, Task] = {}
        self._next_id: int = 1

    def create(self, title: str, description: str = "") -> Task:
        """Create and store a new task.

        Args:
            title: Task title (required)
            description: Optional task description

        Returns:
            Newly created task with auto-generated ID
        """
        task = Task(
            id=self._next_id,
            title=title,
            description=description,
            completed=False,
            created_at=datetime.now(timezone.utc),
        )
        self._tasks[self._next_id] = task
        self._next_id += 1
        return task

    def get_by_id(self, task_id: int) -> Task:
        """Retrieve task by ID.

        Args:
            task_id: Task ID to retrieve

        Returns:
            Task object

        Raises:
            TaskNotFoundError: If task_id not found in storage
        """
        if task_id not in self._tasks:
            raise TaskNotFoundError(task_id)
        return self._tasks[task_id]

    def get_all(self) -> list[Task]:
        """Retrieve all tasks in insertion order.

        Returns:
            List of all Task objects (empty list if none exist)
        """
        return list(self._tasks.values())

    def update(self, task_id: int, title: str | None = None, description: str | None = None) -> Task:
        """Update task title and/or description.

        Args:
            task_id: ID of task to update
            title: New title (None to keep current)
            description: New description (None to keep current)

        Returns:
            Updated task object

        Raises:
            TaskNotFoundError: If task_id not found in storage
        """
        task = self.get_by_id(task_id)

        if title is not None:
            task.title = title
        if description is not None:
            task.description = description

        return task

    def delete(self, task_id: int) -> None:
        """Delete task by ID.

        Args:
            task_id: ID of task to delete

        Raises:
            TaskNotFoundError: If task_id not found in storage
        """
        if task_id not in self._tasks:
            raise TaskNotFoundError(task_id)
        del self._tasks[task_id]

    def toggle_status(self, task_id: int) -> Task:
        """Toggle task completion status.

        Args:
            task_id: ID of task to toggle

        Returns:
            Updated task with toggled status

        Raises:
            TaskNotFoundError: If task_id not found
        """
        task = self.get_by_id(task_id)
        task.completed = not task.completed
        return task

    def count(self) -> int:
        """Return the number of tasks in storage.

        Returns:
            Number of stored tasks
        """
        return len(self._tasks)
