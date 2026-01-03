"""
JWT authentication helpers for MCP tools using thread-safe storage.

Fixed version that doesn't rely on ContextVar which doesn't work properly
with OpenAI Agents SDK's async execution model.
"""
import asyncio
from typing import Optional, Dict
from threading import Lock


class AuthenticationError(Exception):
    """Raised when authentication context is missing or invalid."""
    pass


class AuthContext:
    """Thread-safe authentication context storage."""

    def __init__(self):
        self._lock = Lock()
        self._storage: Dict[str, Dict[str, str]] = {}

    def set(self, task_id: str, jwt_token: str, user_id: str) -> None:
        """Set auth context for a specific task."""
        with self._lock:
            self._storage[task_id] = {
                'jwt_token': jwt_token,
                'user_id': user_id
            }

    def get(self, task_id: str) -> Optional[Dict[str, str]]:
        """Get auth context for a specific task."""
        with self._lock:
            return self._storage.get(task_id)

    def clear(self, task_id: str) -> None:
        """Clear auth context for a specific task."""
        with self._lock:
            self._storage.pop(task_id, None)


# Global auth context storage
_auth_context = AuthContext()
# Track current task ID per async task
_current_task_id: Dict[int, str] = {}
_task_id_lock = Lock()


def set_auth_context(jwt_token: str, user_id: str) -> None:
    """
    Set authentication context for the current agent execution.

    Args:
        jwt_token: Better Auth JWT token from Authorization header
        user_id: Authenticated user's ID from JWT claims
    """
    # Use current async task ID as key
    task_id = str(id(asyncio.current_task()))

    with _task_id_lock:
        _current_task_id[id(asyncio.current_task())] = task_id

    _auth_context.set(task_id, jwt_token, user_id)
    print(f"DEBUG: Set auth context for task {task_id}")


def clear_auth_context() -> None:
    """Clear authentication context after agent execution completes."""
    task = asyncio.current_task()
    if task:
        task_key = id(task)
        with _task_id_lock:
            task_id = _current_task_id.pop(task_key, None)

        if task_id:
            _auth_context.clear(task_id)
            print(f"DEBUG: Cleared auth context for task {task_id}")


def get_jwt_from_context() -> str:
    """
    Extract JWT token from agent execution context.

    Returns:
        JWT token string for authenticating REST API calls

    Raises:
        AuthenticationError: If JWT is not set in context
    """
    task = asyncio.current_task()
    if not task:
        print("DEBUG: get_jwt_from_context - NO CURRENT TASK!")
        raise AuthenticationError("No current async task")

    task_key = id(task)
    with _task_id_lock:
        task_id = _current_task_id.get(task_key)

    if not task_id:
        print(f"DEBUG: get_jwt_from_context - task {task_key} not in mapping!")
        raise AuthenticationError("Task ID not found in context mapping")

    context = _auth_context.get(task_id)
    if not context:
        print(f"DEBUG: get_jwt_from_context - No auth context for task {task_id}!")
        raise AuthenticationError(
            "JWT token not found in context. "
            "Ensure set_auth_context() is called before running agent."
        )

    print(f"DEBUG: get_jwt_from_context - Found token for task {task_id}")
    return context['jwt_token']


def get_user_id_from_context() -> str:
    """
    Extract user_id from agent execution context.

    Returns:
        User ID string for scoping API calls to authenticated user

    Raises:
        AuthenticationError: If user_id is not set in context
    """
    task = asyncio.current_task()
    if not task:
        raise AuthenticationError("No current async task")

    task_key = id(task)
    with _task_id_lock:
        task_id = _current_task_id.get(task_key)

    if not task_id:
        raise AuthenticationError("Task ID not found in context mapping")

    context = _auth_context.get(task_id)
    if not context:
        raise AuthenticationError(
            "User ID not found in context. "
            "Ensure set_auth_context() is called before running agent."
        )

    return context['user_id']


def get_auth_headers() -> dict[str, str]:
    """
    Get HTTP headers with JWT authentication for REST API calls.

    Returns:
        Dictionary with Authorization header containing Bearer token

    Raises:
        AuthenticationError: If JWT is not available in context
    """
    jwt_token = get_jwt_from_context()
    return {
        "Authorization": f"Bearer {jwt_token}",
        "Content-Type": "application/json"
    }
