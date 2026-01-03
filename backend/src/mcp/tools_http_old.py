"""
MCP tools for Todo task management.

These tools provide the interface between the OpenAI agent and the Todo REST API.
Each tool authenticates using JWT from context and calls the appropriate API endpoint.

FR-019: All tools are logged for debugging and auditing via @log_tool_call decorator.
"""
import os
import httpx
from typing import Optional, Any
from datetime import datetime

from .server import mcp
from .auth import get_jwt_from_context, get_user_id_from_context, AuthenticationError
from .tool_logger import log_tool_call  # FR-019: Tool call logging


# API base URL from environment or default to localhost
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")

# Shared async HTTP client for API calls
http_client = httpx.AsyncClient(base_url=API_BASE_URL, timeout=10.0)


class ToolError(Exception):
    """Raised when a tool operation fails with user-actionable message."""
    pass


@mcp.tool()
@log_tool_call  # FR-019: Log all tool calls for debugging/auditing
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
        Created task object with id, title, description, completed status, etc.

    Raises:
        ToolError: If authentication fails, validation fails, or API error occurs
    """
    try:
        jwt = get_jwt_from_context()
        user_id = get_user_id_from_context()
    except AuthenticationError as e:
        raise ToolError(f"Authentication required: {e}")

    # Build request payload
    payload = {
        "title": title,
        "description": description,
        "priority": priority,
        "tags": tags,
        "is_recurring": is_recurring
    }

    if due_date:
        payload["due_date"] = due_date
    if recurrence_pattern:
        payload["recurrence_pattern"] = recurrence_pattern

    try:
        response = await http_client.post(
            "/api/tasks/",
            headers={"Authorization": f"Bearer {jwt}"},
            json=payload
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            raise ToolError("Your session has expired. Please sign in again to continue.")
        elif e.response.status_code == 400:
            detail = e.response.json().get("detail", "Invalid task data")
            raise ToolError(f"Cannot create task: {detail}")
        elif e.response.status_code == 429:
            raise ToolError("Too many requests. Please wait a moment and try again.")
        elif e.response.status_code >= 500:
            raise ToolError("The task service is temporarily unavailable. Please try again in a moment.")
        else:
            raise ToolError(f"Failed to create task: {e.response.status_code}")
    except httpx.TimeoutException:
        raise ToolError("Task creation timed out. Please try again.")
    except Exception as e:
        raise ToolError(f"Unexpected error creating task: {str(e)}")


@mcp.tool()
@log_tool_call  # FR-019: Log all tool calls
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
        Dictionary with:
        - tasks: List of task objects
        - total: Total count of matching tasks
        - limit: Applied limit
        - offset: Applied offset

    Raises:
        ToolError: If authentication fails or API error occurs
    """
    try:
        jwt = get_jwt_from_context()
        user_id = get_user_id_from_context()
    except AuthenticationError as e:
        raise ToolError(f"Authentication required: {e}")

    # Build query parameters
    params = {
        "limit": min(limit, 100),  # Cap at 100
        "offset": offset
    }

    if status:
        params["completed"] = (status == "completed")
    if priority:
        params["priority"] = priority
    if tags:
        params["tags"] = ",".join(tags)
    if due_date_start:
        params["due_date_start"] = due_date_start
    if due_date_end:
        params["due_date_end"] = due_date_end

    try:
        response = await http_client.get(
            "/api/tasks/",
            headers={"Authorization": f"Bearer {jwt}"},
            params=params
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            raise ToolError("Your session has expired. Please sign in again.")
        else:
            raise ToolError(f"Failed to list tasks: {e.response.status_code}")
    except httpx.TimeoutException:
        raise ToolError("Request timed out. Please try again.")
    except Exception as e:
        raise ToolError(f"Unexpected error listing tasks: {str(e)}")


@mcp.tool()
@log_tool_call  # FR-019: Log all tool calls
async def get_task(task_id: int) -> dict[str, Any]:
    """
    Retrieves a specific task by ID for the authenticated user.

    Args:
        task_id: Task ID to retrieve

    Returns:
        Task object with all attributes

    Raises:
        ToolError: If task not found, authentication fails, or API error occurs
    """
    try:
        jwt = get_jwt_from_context()
        user_id = get_user_id_from_context()
    except AuthenticationError as e:
        raise ToolError(f"Authentication required: {e}")

    try:
        response = await http_client.get(
            f"/api/tasks/{task_id}",
            headers={"Authorization": f"Bearer {jwt}"}
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            raise ToolError("Your session has expired. Please sign in again.")
        elif e.response.status_code == 404:
            raise ToolError(f"Task #{task_id} not found. Please check the task ID.")
        else:
            raise ToolError(f"Failed to get task: {e.response.status_code}")
    except httpx.TimeoutException:
        raise ToolError("Request timed out. Please try again.")
    except Exception as e:
        raise ToolError(f"Unexpected error getting task: {str(e)}")


@mcp.tool()
@log_tool_call  # FR-019: Log all tool calls
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
    Updates a task's attributes (partial update - only provided fields are changed).

    Args:
        task_id: Task ID to update (required)
        title: New task title (optional)
        description: New task description (optional)
        priority: New priority: "high", "medium", or "low" (optional)
        tags: New list of tags (replaces existing tags) (optional)
        due_date: New due date in ISO format (optional)
        is_recurring: Update recurring status (optional)
        recurrence_pattern: New recurrence pattern: "daily", "weekly", or "monthly" (optional)

    Returns:
        Updated task object

    Raises:
        ToolError: If task not found, validation fails, authentication fails, or API error occurs
    """
    try:
        jwt = get_jwt_from_context()
        user_id = get_user_id_from_context()
    except AuthenticationError as e:
        raise ToolError(f"Authentication required: {e}")

    # Build payload with only provided fields
    payload = {}
    if title is not None:
        payload["title"] = title
    if description is not None:
        payload["description"] = description
    if priority is not None:
        payload["priority"] = priority
    if tags is not None:
        payload["tags"] = tags
    if due_date is not None:
        payload["due_date"] = due_date
    if is_recurring is not None:
        payload["is_recurring"] = is_recurring
    if recurrence_pattern is not None:
        payload["recurrence_pattern"] = recurrence_pattern

    if not payload:
        raise ToolError("No fields provided to update. Please specify at least one field to change.")

    try:
        response = await http_client.put(
            f"/api/tasks/{task_id}",
            headers={"Authorization": f"Bearer {jwt}"},
            json=payload
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            raise ToolError("Your session has expired. Please sign in again.")
        elif e.response.status_code == 404:
            raise ToolError(f"Task #{task_id} not found. Please check the task ID.")
        elif e.response.status_code == 400:
            detail = e.response.json().get("detail", "Invalid update data")
            raise ToolError(f"Cannot update task: {detail}")
        else:
            raise ToolError(f"Failed to update task: {e.response.status_code}")
    except httpx.TimeoutException:
        raise ToolError("Update timed out. Please try again.")
    except Exception as e:
        raise ToolError(f"Unexpected error updating task: {str(e)}")


@mcp.tool()
@log_tool_call  # FR-019: Log all tool calls
async def delete_task(task_id: int) -> dict[str, str]:
    """
    Deletes a task permanently.

    Args:
        task_id: Task ID to delete

    Returns:
        Confirmation message

    Raises:
        ToolError: If task not found, authentication fails, or API error occurs
    """
    try:
        jwt = get_jwt_from_context()
        user_id = get_user_id_from_context()
    except AuthenticationError as e:
        raise ToolError(f"Authentication required: {e}")

    try:
        response = await http_client.delete(
            f"/api/tasks/{task_id}",
            headers={"Authorization": f"Bearer {jwt}"}
        )
        response.raise_for_status()
        return {"message": f"Task #{task_id} deleted successfully"}
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            raise ToolError("Your session has expired. Please sign in again.")
        elif e.response.status_code == 404:
            raise ToolError(f"Task #{task_id} not found. Please check the task ID.")
        else:
            raise ToolError(f"Failed to delete task: {e.response.status_code}")
    except httpx.TimeoutException:
        raise ToolError("Delete timed out. Please try again.")
    except Exception as e:
        raise ToolError(f"Unexpected error deleting task: {str(e)}")


@mcp.tool()
@log_tool_call  # FR-019: Log all tool calls
async def toggle_task_completion(task_id: int, completed: bool) -> dict[str, Any]:
    """
    Marks a task as completed or incomplete.

    Args:
        task_id: Task ID to update
        completed: True to mark complete, False to mark incomplete

    Returns:
        Updated task object

    Raises:
        ToolError: If task not found, authentication fails, or API error occurs
    """
    try:
        jwt = get_jwt_from_context()
        user_id = get_user_id_from_context()
    except AuthenticationError as e:
        raise ToolError(f"Authentication required: {e}")

    try:
        response = await http_client.patch(
            f"/api/tasks/{task_id}/complete",
            headers={"Authorization": f"Bearer {jwt}"},
            json={"completed": completed}
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            raise ToolError("Your session has expired. Please sign in again.")
        elif e.response.status_code == 404:
            raise ToolError(f"Task #{task_id} not found. Please check the task ID.")
        else:
            raise ToolError(f"Failed to toggle task completion: {e.response.status_code}")
    except httpx.TimeoutException:
        raise ToolError("Request timed out. Please try again.")
    except Exception as e:
        raise ToolError(f"Unexpected error toggling task: {str(e)}")


@mcp.tool()
@log_tool_call  # FR-019: Log all tool calls
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
    Searches tasks by keyword in title/description with filters and sorting.

    Args:
        query: Search keyword (searches in title and description)
        priority: Filter by priority: "high", "medium", or "low" (optional)
        tags: Filter by tags (returns tasks with ANY of these tags) (optional)
        completed: Filter by completion status: true or false (optional)
        sort_by: Sort field: "created_at", "due_date", "priority", or "title" (default: "created_at")
        sort_order: Sort order: "asc" or "desc" (default: "desc")
        limit: Maximum number of results (default: 50, max: 100)

    Returns:
        Dictionary with:
        - tasks: List of matching task objects
        - total: Total count of matches
        - query: Search query used

    Raises:
        ToolError: If authentication fails or API error occurs
    """
    try:
        jwt = get_jwt_from_context()
        user_id = get_user_id_from_context()
    except AuthenticationError as e:
        raise ToolError(f"Authentication required: {e}")

    # Build query parameters
    params = {
        "query": query,
        "sort_by": sort_by,
        "sort_order": sort_order,
        "limit": min(limit, 100)
    }

    if priority:
        params["priority"] = priority
    if tags:
        params["tags"] = ",".join(tags)
    if completed is not None:
        params["completed"] = completed

    try:
        response = await http_client.get(
            "/api/tasks/search",
            headers={"Authorization": f"Bearer {jwt}"},
            params=params
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            raise ToolError("Your session has expired. Please sign in again.")
        else:
            raise ToolError(f"Failed to search tasks: {e.response.status_code}")
    except httpx.TimeoutException:
        raise ToolError("Search timed out. Please try again.")
    except Exception as e:
        raise ToolError(f"Unexpected error searching tasks: {str(e)}")
