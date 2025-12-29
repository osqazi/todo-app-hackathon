"""Custom domain exceptions module.

This module defines custom exceptions for the Todo application domain layer.
"""


class TaskNotFoundError(Exception):
    """Raised when a task with the specified ID is not found.

    Attributes:
        task_id: The ID of the task that was not found
    """

    def __init__(self, task_id: int) -> None:
        self.task_id = task_id
        super().__init__(f"Task ID {task_id} not found")


class InvalidTaskError(Exception):
    """Raised when task data is invalid.

    This exception is used for validation errors such as:
    - Empty title
    - Title exceeds maximum length
    """

    def __init__(self, message: str) -> None:
        super().__init__(message)
