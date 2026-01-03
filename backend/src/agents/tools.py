"""
Agent-compatible tools for Todo task management.

These tools wrap the MCP tool implementations with @function_tool decorator
so they work properly with the OpenAI Agents SDK.
"""
from agents import function_tool
from typing import Optional, Any
from src.mcp import tools as mcp_tools


@function_tool
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
        is_recurring: Whether the task repeats (default: False)
        recurrence_pattern: Recurrence pattern: "daily", "weekly", "monthly" (required if is_recurring=True)

    Returns:
        Dict with created task details including id, title, description, priority, tags, due_date, etc.
    """
    return await mcp_tools.create_task(
        title=title,
        description=description,
        priority=priority,
        tags=tags,
        due_date=due_date,
        is_recurring=is_recurring,
        recurrence_pattern=recurrence_pattern
    )


@function_tool
async def list_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    tags: list[str] = [],
    due_date_start: Optional[str] = None,
    due_date_end: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    limit: int = 100,
    offset: int = 0
) -> dict[str, Any]:
    """
    Lists tasks for the authenticated user with optional filters and sorting.

    Args:
        status: Filter by completion status: "complete", "incomplete", or null for all (default: null)
        priority: Filter by priority: "high", "medium", "low", or null for all (default: null)
        tags: Filter by tags (show tasks with ANY of these tags) (default: [])
        due_date_start: Filter tasks due on or after this date (ISO format) (optional)
        due_date_end: Filter tasks due on or before this date (ISO format) (optional)
        sort_by: Sort field: "created_at", "due_date", "priority", or "title" (default: "created_at")
        sort_order: Sort order: "asc" or "desc" (default: "desc")
        limit: Maximum number of tasks to return (default: 100)
        offset: Number of tasks to skip for pagination (default: 0)

    Returns:
        Dict with "tasks" (list), "total" (int), "limit" (int), "offset" (int)
    """
    return await mcp_tools.list_tasks(
        status=status,
        priority=priority,
        tags=tags,
        due_date_start=due_date_start,
        due_date_end=due_date_end,
        sort_by=sort_by,
        sort_order=sort_order,
        limit=limit,
        offset=offset
    )


@function_tool
async def get_task(task_id: int) -> dict[str, Any]:
    """
    Gets details of a specific task by ID.

    Args:
        task_id: The unique ID of the task to retrieve

    Returns:
        Dict with task details: id, title, description, completed, priority, tags, due_date, etc.
    """
    return await mcp_tools.get_task(task_id=task_id)


@function_tool
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
    Updates an existing task's attributes.

    Args:
        task_id: The unique ID of the task to update (required)
        title: New task title (optional, 1-500 characters if provided)
        description: New task description (optional)
        priority: New priority: "high", "medium", or "low" (optional)
        tags: New list of tags (replaces existing tags) (optional)
        due_date: New due date in ISO format (optional)
        is_recurring: Whether the task should repeat (optional)
        recurrence_pattern: New recurrence pattern: "daily", "weekly", "monthly" (optional)

    Returns:
        Dict with updated task details
    """
    return await mcp_tools.update_task(
        task_id=task_id,
        title=title,
        description=description,
        priority=priority,
        tags=tags,
        due_date=due_date,
        is_recurring=is_recurring,
        recurrence_pattern=recurrence_pattern
    )


@function_tool
async def delete_task(task_id: int) -> dict[str, Any]:
    """
    Permanently deletes a task by ID.

    Args:
        task_id: The unique ID of the task to delete

    Returns:
        Dict with success message and deleted task_id
    """
    return await mcp_tools.delete_task(task_id=task_id)


@function_tool
async def toggle_task_completion(task_id: int, completed: bool) -> dict[str, Any]:
    """
    Marks a task as complete or incomplete.

    Args:
        task_id: The unique ID of the task to update
        completed: True to mark as complete, False to mark as incomplete

    Returns:
        Dict with updated task details including new completion status
    """
    return await mcp_tools.toggle_task_completion(task_id=task_id, completed=completed)


@function_tool
async def search_tasks(
    query: str,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    tags: list[str] = [],
    sort_by: str = "created_at",
    sort_order: str = "desc",
    limit: int = 100,
    offset: int = 0
) -> dict[str, Any]:
    """
    Searches tasks by keyword in title or description with optional filters.

    Args:
        query: Search keyword to match in title or description (case-insensitive)
        status: Filter by status: "complete", "incomplete", or null for all (default: null)
        priority: Filter by priority: "high", "medium", "low", or null for all (default: null)
        tags: Filter by tags (show tasks with ANY of these tags) (default: [])
        sort_by: Sort field: "created_at", "due_date", "priority", or "title" (default: "created_at")
        sort_order: Sort order: "asc" or "desc" (default: "desc")
        limit: Maximum number of tasks to return (default: 100)
        offset: Number of tasks to skip for pagination (default: 0)

    Returns:
        Dict with "tasks" (list), "total" (int), "query" (str), "limit" (int), "offset" (int)
    """
    return await mcp_tools.search_tasks(
        query=query,
        status=status,
        priority=priority,
        tags=tags,
        sort_by=sort_by,
        sort_order=sort_order,
        limit=limit,
        offset=offset
    )
