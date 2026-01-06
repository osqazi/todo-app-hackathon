"""
Bulk delete tool for deleting all tasks for a user.

This tool provides a single operation to delete all tasks for a user,
avoiding the need for multiple individual delete operations that can
cause conversation flow issues.
"""
from agents import function_tool
from typing import Dict, Any
from src.mcp import tools as mcp_tools


@function_tool
async def bulk_delete_all_tasks() -> Dict[str, Any]:
    """
    Delete all tasks for the authenticated user.

    This tool provides a single operation to delete all tasks associated
    with the user's account, avoiding multiple individual delete operations
    that can cause issues with the agent's conversation flow.

    Returns:
        Dict with deletion summary including number of tasks deleted
    """
    # First, get all tasks to count them
    all_tasks_response = await mcp_tools.list_tasks(
        status=None,
        priority=None,
        tags=[],
        due_date_start=None,
        due_date_end=None,
        sort_by="created_at",
        sort_order="desc",
        limit=10000,  # Large limit to get all tasks
        offset=0
    )

    total_tasks = all_tasks_response.get("total", 0)
    tasks = all_tasks_response.get("tasks", [])

    # Delete each task individually (since there's no bulk delete at the database level)
    deleted_count = 0
    for task in tasks:
        try:
            await mcp_tools.delete_task(task_id=task["id"])
            deleted_count += 1
        except Exception:
            # Continue deleting other tasks even if one fails
            continue

    return {
        "message": f"Successfully deleted {deleted_count} out of {total_tasks} tasks.",
        "deleted_count": deleted_count,
        "total_count": total_tasks,
        "failed_deletions": total_tasks - deleted_count
    }