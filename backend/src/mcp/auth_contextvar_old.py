"""
JWT authentication helpers for MCP tools.

These utilities allow MCP tools to access the authenticated user's JWT token
and user_id from the agent execution context, enabling secure calls to the
existing REST API endpoints.
"""
from contextvars import ContextVar
from typing import Optional


# Context variables for storing authentication data during agent execution
_jwt_token: ContextVar[Optional[str]] = ContextVar("jwt_token", default=None)
_user_id: ContextVar[Optional[str]] = ContextVar("user_id", default=None)


class AuthenticationError(Exception):
    """Raised when authentication context is missing or invalid."""
    pass


def set_auth_context(jwt_token: str, user_id: str) -> None:
    """
    Set authentication context for the current agent execution.

    This should be called at the start of each agent request to establish
    the authenticated user's context for all subsequent MCP tool calls.

    Args:
        jwt_token: Better Auth JWT token from Authorization header
        user_id: Authenticated user's ID from JWT claims
    """
    _jwt_token.set(jwt_token)
    _user_id.set(user_id)


def clear_auth_context() -> None:
    """
    Clear authentication context after agent execution completes.

    This ensures no auth data leaks between requests.
    """
    _jwt_token.set(None)
    _user_id.set(None)


def get_jwt_from_context() -> str:
    """
    Extract JWT token from agent execution context.

    Returns:
        JWT token string for authenticating REST API calls

    Raises:
        AuthenticationError: If JWT is not set in context (agent not properly initialized)
    """
    token = _jwt_token.get()
    if not token:
        raise AuthenticationError(
            "JWT token not found in context. "
            "Ensure set_auth_context() is called before running agent."
        )
    return token


def get_user_id_from_context() -> str:
    """
    Extract user_id from agent execution context.

    Returns:
        User ID string for scoping API calls to authenticated user

    Raises:
        AuthenticationError: If user_id is not set in context
    """
    user_id = _user_id.get()
    if not user_id:
        raise AuthenticationError(
            "User ID not found in context. "
            "Ensure set_auth_context() is called before running agent."
        )
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
