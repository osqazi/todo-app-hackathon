"""
JWT authentication helpers for MCP tools using simple global storage.

Uses user_id as the storage key since tools run in different async tasks
from where auth context is set (OpenAI Agents SDK creates new tasks for tools).

This works in single-worker mode. For multi-worker production, use Redis or similar.
"""
from typing import Optional, Dict
from threading import Lock


class AuthenticationError(Exception):
    """Raised when authentication context is missing or invalid."""
    pass


class SimpleAuthStorage:
    """Thread-safe global authentication storage using user_id as key."""

    def __init__(self):
        self._lock = Lock()
        # Map user_id -> jwt_token
        self._storage: Dict[str, str] = {}

    def set(self, user_id: str, jwt_token: str) -> None:
        """Set auth data for a user."""
        with self._lock:
            self._storage[user_id] = jwt_token
            print(f"DEBUG SimpleAuthStorage.set: user_id={user_id}, stored={len(self._storage)} users")

    def get(self, user_id: str) -> Optional[str]:
        """Get JWT token for a user."""
        with self._lock:
            token = self._storage.get(user_id)
            print(f"DEBUG SimpleAuthStorage.get: user_id={user_id}, found={'YES' if token else 'NO'}")
            return token

    def clear(self, user_id: str) -> None:
        """Clear auth data for a user."""
        with self._lock:
            self._storage.pop(user_id, None)
            print(f"DEBUG SimpleAuthStorage.clear: user_id={user_id}")


# Global storage instance
_auth_storage = SimpleAuthStorage()

# Track current user_id per request (for tools to lookup)
_current_user_id: Optional[str] = None
_user_id_lock = Lock()


def set_auth_context(jwt_token: str, user_id: str, request_id: Optional[str] = None) -> str:
    """
    Set authentication context for the current agent execution.

    Args:
        jwt_token: Better Auth JWT token from Authorization header
        user_id: Authenticated user's ID from JWT claims
        request_id: Ignored (kept for API compatibility)

    Returns:
        The user_id (for compatibility)
    """
    global _current_user_id

    print(f"DEBUG set_auth_context: user_id={user_id}")

    # Store JWT by user_id
    _auth_storage.set(user_id, jwt_token)

    # Set current user_id
    with _user_id_lock:
        _current_user_id = user_id

    return user_id


def clear_auth_context(request_id: Optional[str] = None) -> None:
    """
    Clear authentication context.

    Args:
        request_id: Ignored (kept for API compatibility)
    """
    global _current_user_id

    with _user_id_lock:
        if _current_user_id:
            print(f"DEBUG clear_auth_context: user_id={_current_user_id}")
            _auth_storage.clear(_current_user_id)
            _current_user_id = None


def get_jwt_from_context() -> str:
    """
    Extract JWT token from current request context.

    Returns:
        JWT token string for authenticating REST API calls

    Raises:
        AuthenticationError: If JWT is not set in context
    """
    with _user_id_lock:
        user_id = _current_user_id

    if not user_id:
        raise AuthenticationError(
            "No user_id in context. Ensure set_auth_context() is called before running agent."
        )

    jwt_token = _auth_storage.get(user_id)
    if not jwt_token:
        raise AuthenticationError(
            f"JWT token not found for user {user_id}. Ensure set_auth_context() is called before running agent."
        )

    return jwt_token


def get_user_id_from_context() -> str:
    """
    Extract user_id from current request context.

    Returns:
        User ID string for scoping API calls to authenticated user

    Raises:
        AuthenticationError: If user_id is not set in context
    """
    with _user_id_lock:
        user_id = _current_user_id

    if not user_id:
        raise AuthenticationError(
            "No user_id in context. Ensure set_auth_context() is called before running agent."
        )

    print(f"DEBUG get_user_id_from_context: returning user_id={user_id}")
    return user_id


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
