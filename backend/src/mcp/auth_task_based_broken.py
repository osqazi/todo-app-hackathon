"""
JWT authentication helpers for MCP tools using global storage.

Uses thread-safe global storage instead of ContextVar because OpenAI Agents SDK
runs tools in different async contexts where ContextVar values don't propagate.
"""
from typing import Optional, Dict
from threading import Lock
import asyncio


class AuthenticationError(Exception):
    """Raised when authentication context is missing or invalid."""
    pass


class GlobalAuthStorage:
    """Thread-safe global authentication storage."""

    def __init__(self):
        self._lock = Lock()
        # Map request ID -> auth data
        self._storage: Dict[str, Dict[str, str]] = {}

    def set(self, request_id: str, jwt_token: str, user_id: str) -> None:
        """Set auth data for a request."""
        with self._lock:
            self._storage[request_id] = {
                'jwt_token': jwt_token,
                'user_id': user_id
            }

    def get(self, request_id: str) -> Optional[Dict[str, str]]:
        """Get auth data for a request."""
        with self._lock:
            return self._storage.get(request_id)

    def clear(self, request_id: str) -> None:
        """Clear auth data for a request."""
        with self._lock:
            self._storage.pop(request_id, None)


# Global storage instance
_auth_storage = GlobalAuthStorage()

# Track current request ID per async task
_task_to_request_id: Dict[int, str] = {}
_request_id_lock = Lock()


def set_auth_context(jwt_token: str, user_id: str, request_id: Optional[str] = None) -> str:
    """
    Set authentication context for the current request.

    Args:
        jwt_token: Better Auth JWT token from Authorization header
        user_id: Authenticated user's ID from JWT claims
        request_id: Optional request identifier (auto-generated if not provided)

    Returns:
        The request ID used for this auth context
    """
    # Generate request ID if not provided
    if request_id is None:
        # Use current task ID as unique identifier
        task = asyncio.current_task()
        request_id = str(id(task)) if task else str(id(asyncio.get_event_loop()))

    print(f"DEBUG set_auth_context: request_id={request_id}, user_id={user_id}")
    # Store auth data
    _auth_storage.set(request_id, jwt_token, user_id)

    # Map current task to request ID
    task = asyncio.current_task()
    if task:
        with _request_id_lock:
            _task_to_request_id[id(task)] = request_id

    return request_id


def clear_auth_context(request_id: Optional[str] = None) -> None:
    """
    Clear authentication context.

    Args:
        request_id: Request ID to clear (auto-detected from current task if not provided)
    """
    if request_id is None:
        # Try to get request ID from current task
        task = asyncio.current_task()
        if task:
            with _request_id_lock:
                request_id = _task_to_request_id.pop(id(task), None)

    if request_id:
        _auth_storage.clear(request_id)


def _get_current_request_id() -> str:
    """Get request ID for current async context."""
    task = asyncio.current_task()
    if not task:
        raise AuthenticationError("No current async task")

    # Try to get mapped request ID
    with _request_id_lock:
        request_id = _task_to_request_id.get(id(task))

    if not request_id:
        # Fallback: use task ID directly
        request_id = str(id(task))

    return request_id


def get_jwt_from_context() -> str:
    """
    Extract JWT token from current request context.

    Returns:
        JWT token string for authenticating REST API calls

    Raises:
        AuthenticationError: If JWT is not set in context
    """
    task = asyncio.current_task()
    print(f"DEBUG get_user_id: task={id(task) if task else None}")
    request_id = _get_current_request_id()
    print(f"DEBUG get_user_id: request_id={request_id}")
    auth_data = _auth_storage.get(request_id)
    print(f"DEBUG get_user_id: auth_data={"FOUND" if auth_data else "NONE"}")

    if not auth_data:
        raise AuthenticationError(
            f"JWT token not found in context (request_id: {request_id}). "
            "Ensure set_auth_context() is called before running agent."
        )

    return auth_data['jwt_token']


def get_user_id_from_context() -> str:
    """
    Extract user_id from current request context.

    Returns:
        User ID string for scoping API calls to authenticated user

    Raises:
        AuthenticationError: If user_id is not set in context
    """
    task = asyncio.current_task()
    print(f"DEBUG get_user_id: task={id(task) if task else None}")
    request_id = _get_current_request_id()
    print(f"DEBUG get_user_id: request_id={request_id}")
    auth_data = _auth_storage.get(request_id)
    print(f"DEBUG get_user_id: auth_data={"FOUND" if auth_data else "NONE"}")

    if not auth_data:
        raise AuthenticationError(
            f"User ID not found in context (request_id: {request_id}). "
            "Ensure set_auth_context() is called before running agent."
        )

    return auth_data['user_id']


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
