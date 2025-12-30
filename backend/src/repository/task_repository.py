"""
Task repository for data access operations.

Implements user-scoped CRUD operations ensuring data isolation.
All queries automatically filter by user_id to prevent cross-user access.
"""

from typing import List, Optional
from datetime import datetime

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
            task_data: Task creation data (includes priority and tags from Phase II Part 2).

        Returns:
            The created Task instance.
        """
        task = Task(
            user_id=self.user_id,  # user_id is already a string from JWT
            title=task_data.title.strip(),
            description=task_data.description.strip(),
            priority=task_data.priority,  # Phase II Part 2
            due_date=task_data.due_date,  # US3: Due dates
            tags=task_data.tags,  # Phase II Part 2
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
        Update a task's fields (title, description, priority, tags, due_date).

        Only updates if the task belongs to the authenticated user.
        Resets notification_sent=False when due_date is updated (US3).


        Args:
            task_id: The task ID to update.
            task_data: Fields to update (partial update supported, includes Phase II Part 2 fields).

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
        if task_data.priority is not None:  # Phase II Part 2
            task.priority = task_data.priority
        if task_data.due_date is not None:
            # US3: Reset notification_sent when due_date changes
            if task.due_date != task_data.due_date:
                task.notification_sent = False
            task.due_date = task_data.due_date

        if task_data.tags is not None:  # Phase II Part 2
            task.tags = task_data.tags

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

    def get_all_with_filters(
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
            search: Search term for title/description (ILIKE)
            completed: Filter by completion status
            priority: List of priorities to filter (e.g., ["high", "medium"])
            tags: List of tags to filter (task must contain at least one)
            due_date_from: Filter tasks due on or after this date
            due_date_to: Filter tasks due on or before this date
            is_overdue: Filter for overdue tasks
            sort_by: Field to sort by (created_at, due_date, priority, title)
            sort_order: Sort direction (asc, desc)
            offset: Pagination offset
            limit: Maximum results to return

        Returns:
            Tuple of (list of tasks, total count matching filters)
        """
        from sqlalchemy import or_, and_, func
        from src.models.task import TaskPriority

        # Base query with user filter
        query = select(Task).where(Task.user_id == self.user_id)

        # Apply search filter
        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    Task.title.ilike(search_term),
                    Task.description.ilike(search_term)
                )
            )

        # Apply status filter
        if completed is not None:
            query = query.where(Task.completed == completed)

        # Apply priority filter
        if priority:
            # Convert string priorities to enum values
            priority_enums = [TaskPriority(p) for p in priority]
            query = query.where(Task.priority.in_(priority_enums))

        # Apply tag filter (array overlap operator)
        if tags:
            # Task must contain at least one of the specified tags
            query = query.where(Task.tags.overlap(tags))

        # Apply due date range filter
        if due_date_from:
            query = query.where(Task.due_date >= due_date_from)
        if due_date_to:
            query = query.where(Task.due_date <= due_date_to)

        # Apply overdue filter
        if is_overdue is not None:
            now = datetime.now()
            if is_overdue:
                query = query.where(
                    and_(
                        Task.due_date < now,
                        Task.completed == False
                    )
                )
            else:
                query = query.where(
                    or_(
                        Task.due_date >= now,
                        Task.due_date.is_(None),
                        Task.completed == True
                    )
                )

        # Get total count before pagination
        count_query = select(func.count()).select_from(query.subquery())
        total_count = self.session.execute(count_query).scalar()

        # Apply sorting
        if sort_by == "due_date":
            # NULL values last for due_date
            if sort_order == "asc":
                query = query.order_by(Task.due_date.asc().nullslast())
            else:
                query = query.order_by(Task.due_date.desc().nullslast())
        elif sort_by == "priority":
            # High -> Medium -> Low
            priority_order = {
                TaskPriority.HIGH: 1,
                TaskPriority.MEDIUM: 2,
                TaskPriority.LOW: 3
            }
            if sort_order == "asc":
                query = query.order_by(Task.priority.asc())
            else:
                query = query.order_by(Task.priority.desc())
        elif sort_by == "title":
            if sort_order == "asc":
                query = query.order_by(Task.title.asc())
            else:
                query = query.order_by(Task.title.desc())
        else:  # created_at (default)
            if sort_order == "asc":
                query = query.order_by(Task.created_at.asc())
            else:
                query = query.order_by(Task.created_at.desc())

        # Apply pagination
        query = query.offset(offset).limit(limit)

        # Execute query
        result = self.session.execute(query)
        tasks = list(result.scalars().all())

        return tasks, total_count
