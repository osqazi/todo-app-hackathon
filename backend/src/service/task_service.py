"""
Task service layer with business logic and validation.

Coordinates between API layer and repository layer,
applying business rules and validation before data operations.
"""

from datetime import datetime, timezone, timedelta
from typing import List, Optional, Tuple
from calendar import monthrange

from sqlmodel import Session

from src.models.task import Task, RecurrencePattern
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

    def get_tasks_with_filters(
        self,
        search: Optional[str] = None,
        completed: Optional[bool] = None,
        priority: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
        due_date_from: Optional[datetime] = None,
        due_date_to: Optional[datetime] = None,
        is_overdue: Optional[bool] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        offset: int = 0,
        limit: int = 100,
    ) -> tuple[List[Task], int]:
        """
        Get tasks with dynamic filters, search, and sorting.

        Args:
            search: Search term for title/description
            completed: Filter by completion status
            priority: List of priorities to filter
            tags: List of tags to filter
            due_date_from: Filter tasks due on or after this date
            due_date_to: Filter tasks due on or before this date
            is_overdue: Filter for overdue tasks
            sort_by: Field to sort by
            sort_order: Sort direction (asc, desc)
            offset: Pagination offset
            limit: Maximum results to return

        Returns:
            Tuple of (list of tasks, total count matching filters)
        """
        return self.repository.get_all_with_filters(
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

    # ===== RECURRING TASKS LOGIC (US4) =====

    def calculate_next_due_date(
        self,
        current_due_date: datetime,
        pattern: RecurrencePattern,
    ) -> datetime:
        """
        Calculate the next due date based on recurrence pattern (T059 - US4).

        Handles month-end edge cases:
        - Jan 31 -> Feb 28/29 (not Mar 3)
        - Jan 30 -> Feb 28/29 (not Mar 2)

        Args:
            current_due_date: Current task due date
            pattern: Recurrence frequency (daily/weekly/monthly)

        Returns:
            Next due date as datetime

        Raises:
            ValueError: If pattern is invalid
        """
        if pattern == RecurrencePattern.DAILY:
            return current_due_date + timedelta(days=1)

        elif pattern == RecurrencePattern.WEEKLY:
            return current_due_date + timedelta(weeks=1)

        elif pattern == RecurrencePattern.MONTHLY:
            # Handle month-end edge cases
            current_day = current_due_date.day
            current_month = current_due_date.month
            current_year = current_due_date.year

            # Calculate next month
            next_month = current_month + 1
            next_year = current_year
            if next_month > 12:
                next_month = 1
                next_year += 1

            # Get last day of next month
            _, last_day_of_next_month = monthrange(next_year, next_month)

            # Use minimum of current_day and last_day_of_next_month
            # This handles Jan 31 -> Feb 28/29 correctly
            next_day = min(current_day, last_day_of_next_month)

            # Construct next due date with same time
            return current_due_date.replace(
                year=next_year,
                month=next_month,
                day=next_day
            )

        else:
            raise ValueError(f"Invalid recurrence pattern: {pattern}")

    def should_generate_next_instance(
        self,
        task: Task,
        next_due_date: datetime,
    ) -> bool:
        """
        Check if a next recurring instance should be generated (T060 - US4).

        Args:
            task: The recurring task being completed
            next_due_date: Calculated next due date

        Returns:
            True if next instance should be created, False otherwise

        Logic:
            - Returns False if task has recurrence_end_date and next_due_date > recurrence_end_date
            - Returns True otherwise
        """
        if task.recurrence_end_date is None:
            return True

        # Convert recurrence_end_date (date) to datetime for comparison
        # Use end of day (23:59:59) to make it inclusive
        end_datetime = datetime.combine(
            task.recurrence_end_date,
            datetime.max.time()
        ).replace(tzinfo=timezone.utc)

        return next_due_date <= end_datetime

    def complete_task(self, task_id: int) -> Tuple[Optional[Task], Optional[Task]]:
        """
        Mark a task as complete and generate next instance if recurring (T061 - US4).

        Args:
            task_id: ID of the task to complete

        Returns:
            Tuple of (completed_task, next_instance)
            - completed_task: The task that was marked complete (None if not found)
            - next_instance: The newly created next instance (None if not recurring or shouldn't generate)

        Raises:
            ValueError: If task not found or user doesn't own task
        """
        # Get the task
        task = self.repository.get_by_id(task_id)
        if not task:
            return (None, None)

        # Mark as complete
        task.completed = True
        task.updated_at = datetime.now(timezone.utc)
        self.session.add(task)
        self.session.flush()  # Flush to get the updated task

        # If not recurring, return early
        if not task.is_recurring or not task.recurrence_pattern or not task.due_date:
            self.session.commit()
            return (task, None)

        # Calculate next due date
        next_due_date = self.calculate_next_due_date(
            task.due_date,
            task.recurrence_pattern
        )

        # Check if we should generate next instance
        if not self.should_generate_next_instance(task, next_due_date):
            self.session.commit()
            return (task, None)

        # Create next instance with inherited properties
        next_instance_data = TaskCreate(
            title=task.title,
            description=task.description,
            priority=task.priority,
            tags=task.tags.copy() if task.tags else [],
            due_date=next_due_date,
            is_recurring=task.is_recurring,
            recurrence_pattern=task.recurrence_pattern,
            recurrence_end_date=datetime.combine(
                task.recurrence_end_date,
                datetime.min.time()
            ).replace(tzinfo=timezone.utc) if task.recurrence_end_date else None,
            parent_task_id=task.id,
        )

        next_instance = self.repository.create(next_instance_data)
        self.session.commit()

        return (task, next_instance)
