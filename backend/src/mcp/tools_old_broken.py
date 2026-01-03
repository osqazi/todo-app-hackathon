"""
MCP tools for Todo task management (DIRECT SERVICE ACCESS).

Fixed version that directly accesses the service layer instead of making
HTTP calls back to the same server. This avoids context propagation issues.
"""
from typing import Optional, Any
from datetime import datetime
from sqlmodel import Session

from .server import mcp
from .auth import get_user_id_from_context, AuthenticationError
from src.db.session import get_session_sync
from src.service.task_service import TaskService
from src.schemas.task import TaskCreate, TaskUpdate


class ToolError(Exception):
    """Raised when a tool operation fails with user-actionable message."""
    pass


def _get_service() -> tuple[TaskService, Session, str]:
    """Helper to get service, session, and user_id."""
    try:
        user_id = get_user_id_from_context()
    except AuthenticationError as e:
        raise ToolError(f"Authentication required: {e}")

    session = get_session_sync()
    service = TaskService(session, user_id)  # TaskService needs both session AND user_id
    return service, session, user_id


@mcp.tool()
async def create_task(
    title: str,
    description: str = "",
    priority: str = "medium",
    tags: list[str] = [],
    due_date: Optional[str] = None,
    is_recurring: bool = False,
    recurrence_pattern: Optional[str] = None
) -> dict[str, Any]:
    """
    Creates a new task for the authenticated user.

    Args:
        title: Task title (required, 1-500 characters)
        description: Task description (optional)
        priority: Task priority: "high", "medium", or "low" (default: "medium")
        tags: List of tags/categories (optional)
        due_date: Due date in ISO format YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS (optional)
        is_recurring: Whether task repeats (default: false)
        recurrence_pattern: Recurrence frequency: "daily", "weekly", or "monthly" (required if is_recurring=true)

    Returns:
        Created task object

    Raises:
        ToolError: If validation fails or creation error occurs
    """
    service, session, user_id = _get_service()

    try:
        # Parse due_date if provided
        due_date_parsed = None
        if due_date:
            try:
                due_date_parsed = datetime.fromisoformat(due_date)
            except ValueError:
                raise ToolError(f"Invalid due_date format: {due_date}. Use YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS")

        # Create task
        task_data = TaskCreate(
            title=title,
            description=description,
            priority=priority,
            tags=tags,
            due_date=due_date_parsed,
            is_recurring=is_recurring,
            recurrence_pattern=recurrence_pattern
        )

        task = service.create_task(user_id=user_id, task_data=task_data)
        session.commit()

        return {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "completed": task.completed,
            "priority": task.priority,
            "tags": task.tags,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "is_recurring": task.is_recurring,
            "recurrence_pattern": task.recurrence_pattern,
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat()
        }
    except Exception as e:
        session.rollback()
        raise ToolError(f"Failed to create task: {str(e)}")
    finally:
        session.close()


@mcp.tool()
async def list_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    tags: list[str] = [],
    due_date_start: Optional[str] = None,
    due_date_end: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> dict[str, Any]:
    """
    Retrieves tasks for the authenticated user with optional filters.

    Args:
        status: Filter by completion status: "completed" or "incomplete" (optional)
        priority: Filter by priority: "high", "medium", or "low" (optional)
        tags: Filter by tags (returns tasks with ANY of these tags) (optional)
        due_date_start: Filter tasks due after this date (ISO format) (optional)
        due_date_end: Filter tasks due before this date (ISO format) (optional)
        limit: Maximum number of tasks to return (default: 50, max: 100)
        offset: Number of tasks to skip for pagination (default: 0)

    Returns:
        Dictionary with tasks, total, limit, and offset

    Raises:
        ToolError: If error occurs
    """
    service, session, user_id = _get_service()

    try:
        # Parse filters
        completed = None
        if status:
            completed = (status.lower() == "completed")

        due_from = None
        if due_date_start:
            try:
                due_from = datetime.fromisoformat(due_date_start)
            except ValueError:
                pass

        due_to = None
        if due_date_end:
            try:
                due_to = datetime.fromisoformat(due_date_end)
            except ValueError:
                pass

        # Get tasks
        tasks = service.list_tasks(
            user_id=user_id,
            offset=offset,
            limit=min(limit, 100),
            completed=completed,
            priority=[priority] if priority else None,
            tags=tags if tags else None,
            due_date_from=due_from,
            due_date_to=due_to
        )

        total = service.count_tasks(
            user_id=user_id,
            completed=completed,
            priority=[priority] if priority else None,
            tags=tags if tags else None,
            due_date_from=due_from,
            due_date_to=due_to
        )

        return {
            "tasks": [
                {
                    "id": t.id,
                    "title": t.title,
                    "description": t.description,
                    "completed": t.completed,
                    "priority": t.priority,
                    "tags": t.tags,
                    "due_date": t.due_date.isoformat() if t.due_date else None,
                    "is_recurring": t.is_recurring,
                    "recurrence_pattern": t.recurrence_pattern,
                    "created_at": t.created_at.isoformat(),
                    "updated_at": t.updated_at.isoformat()
                }
                for t in tasks
            ],
            "total": total,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise ToolError(f"Failed to list tasks: {str(e)}")
    finally:
        session.close()


@mcp.tool()
async def get_task(task_id: int) -> dict[str, Any]:
    """
    Retrieves a specific task by ID for the authenticated user.

    Args:
        task_id: Task ID to retrieve

    Returns:
        Task object

    Raises:
        ToolError: If task not found or error occurs
    """
    service, session, user_id = _get_service()

    try:
        task = service.get_task(task_id=task_id, user_id=user_id)
        if not task:
            raise ToolError(f"Task #{task_id} not found. Please check the task ID.")

        return {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "completed": task.completed,
            "priority": task.priority,
            "tags": task.tags,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "is_recurring": task.is_recurring,
            "recurrence_pattern": task.recurrence_pattern,
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat()
        }
    except ToolError:
        raise
    except Exception as e:
        raise ToolError(f"Failed to get task: {str(e)}")
    finally:
        session.close()


@mcp.tool()
async def update_task(
    task_id: int,
    title: Optional[str] = None,
    description: Optional[str] = None,
    priority: Optional[str] = None,
    tags: Optional[list[str]] = None,
    due_date: Optional[str] = None,
    is_recurring: Optional[bool] = None,
    recurrence_pattern: Optional[str] = None
) -> dict[str, Any]:
    """
    Updates a task's attributes (partial update).

    Args:
        task_id: Task ID to update (required)
        title: New task title (optional)
        description: New task description (optional)
        priority: New priority: "high", "medium", or "low" (optional)
        tags: New list of tags (replaces existing tags) (optional)
        due_date: New due date in ISO format (optional)
        is_recurring: Update recurring status (optional)
        recurrence_pattern: New recurrence pattern (optional)

    Returns:
        Updated task object

    Raises:
        ToolError: If task not found, validation fails, or error occurs
    """
    service, session, user_id = _get_service()

    try:
        # Parse due_date if provided
        due_date_parsed = None
        if due_date:
            try:
                due_date_parsed = datetime.fromisoformat(due_date)
            except ValueError:
                raise ToolError(f"Invalid due_date format: {due_date}")

        # Build update data
        update_data = TaskUpdate(
            title=title,
            description=description,
            priority=priority,
            tags=tags,
            due_date=due_date_parsed,
            is_recurring=is_recurring,
            recurrence_pattern=recurrence_pattern
        )

        task = service.update_task(task_id=task_id, user_id=user_id, task_data=update_data)
        if not task:
            raise ToolError(f"Task #{task_id} not found. Please check the task ID.")

        session.commit()

        return {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "completed": task.completed,
            "priority": task.priority,
            "tags": task.tags,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "is_recurring": task.is_recurring,
            "recurrence_pattern": task.recurrence_pattern,
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat()
        }
    except ToolError:
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        raise ToolError(f"Failed to update task: {str(e)}")
    finally:
        session.close()


@mcp.tool()
async def delete_task(task_id: int) -> dict[str, str]:
    """
    Deletes a task permanently.

    Args:
        task_id: Task ID to delete

    Returns:
        Confirmation message

    Raises:
        ToolError: If task not found or error occurs
    """
    service, session, user_id = _get_service()

    try:
        success = service.delete_task(task_id=task_id, user_id=user_id)
        if not success:
            raise ToolError(f"Task #{task_id} not found. Please check the task ID.")

        session.commit()
        return {"message": f"Task #{task_id} deleted successfully"}
    except ToolError:
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        raise ToolError(f"Failed to delete task: {str(e)}")
    finally:
        session.close()


@mcp.tool()
async def toggle_task_completion(task_id: int, completed: bool) -> dict[str, Any]:
    """
    Marks a task as completed or incomplete.

    Args:
        task_id: Task ID to update
        completed: True to mark complete, False to mark incomplete

    Returns:
        Updated task object

    Raises:
        ToolError: If task not found or error occurs
    """
    service, session, user_id = _get_service()

    try:
        task = service.toggle_completion(task_id=task_id, user_id=user_id, completed=completed)
        if not task:
            raise ToolError(f"Task #{task_id} not found. Please check the task ID.")

        session.commit()

        return {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "completed": task.completed,
            "priority": task.priority,
            "tags": task.tags,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "is_recurring": task.is_recurring,
            "recurrence_pattern": task.recurrence_pattern,
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat()
        }
    except ToolError:
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        raise ToolError(f"Failed to toggle task completion: {str(e)}")
    finally:
        session.close()


@mcp.tool()
async def search_tasks(
    query: str,
    priority: Optional[str] = None,
    tags: list[str] = [],
    completed: Optional[bool] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    limit: int = 50
) -> dict[str, Any]:
    """
    Searches tasks by keyword in title/description with filters.

    Args:
        query: Search keyword (searches in title and description)
        priority: Filter by priority: "high", "medium", or "low" (optional)
        tags: Filter by tags (optional)
        completed: Filter by completion status (optional)
        sort_by: Sort field (default: "created_at")
        sort_order: Sort order: "asc" or "desc" (default: "desc")
        limit: Maximum number of results (default: 50, max: 100)

    Returns:
        Dictionary with tasks, total, and query

    Raises:
        ToolError: If error occurs
    """
    service, session, user_id = _get_service()

    try:
        tasks = service.search_tasks(
            user_id=user_id,
            search=query,
            completed=completed,
            priority=[priority] if priority else None,
            tags=tags if tags else None,
            sort_by=sort_by,
            sort_order=sort_order,
            limit=min(limit, 100)
        )

        return {
            "tasks": [
                {
                    "id": t.id,
                    "title": t.title,
                    "description": t.description,
                    "completed": t.completed,
                    "priority": t.priority,
                    "tags": t.tags,
                    "due_date": t.due_date.isoformat() if t.due_date else None,
                    "is_recurring": t.is_recurring,
                    "recurrence_pattern": t.recurrence_pattern,
                    "created_at": t.created_at.isoformat(),
                    "updated_at": t.updated_at.isoformat()
                }
                for t in tasks
            ],
            "total": len(tasks),
            "query": query
        }
    except Exception as e:
        raise ToolError(f"Failed to search tasks: {str(e)}")
    finally:
        session.close()
