"""Task entity module.

This module defines the Task dataclass which represents a single todo item
in the application.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass
class Task:
    """Represents a single todo task.

    Attributes:
        id: Unique identifier (auto-generated, starting at 1)
        title: Task title (required, non-empty, max 200 chars)
        description: Optional task description (default: empty string)
        completed: Completion status (default: False for incomplete)
        created_at: UTC timestamp of task creation (auto-generated)
    """

    id: int
    title: str
    description: str = ""
    completed: bool = False
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def status_indicator(self) -> str:
        """Return status indicator for console display.

        Returns:
            '[X]' if completed, '[ ]' if incomplete
        """
        return "[X]" if self.completed else "[ ]"
