"""
MCP Tool Call Logger (FR-019 Implementation)

Decorates MCP tools to automatically log all invocations for debugging and auditing.
Logs include: timestamp, user_id, tool_name, arguments, result, execution_time, success/error.
"""
import time
from functools import wraps
from typing import Callable, Any
from src.utils.performance_logger import perf_metrics
from src.mcp.auth import get_user_id_from_context


def log_tool_call(func: Callable) -> Callable:
    """
    Decorator to log MCP tool calls for debugging and auditing (FR-019).

    Automatically captures:
    - User ID (from auth context)
    - Tool name
    - Arguments (sanitized)
    - Execution time
    - Success/failure
    - Result (preview)
    - Errors

    Usage:
        @mcp.tool()
        @log_tool_call
        async def my_tool(arg1: str, arg2: int):
            # Tool implementation
            pass

    Args:
        func: The MCP tool function to wrap

    Returns:
        Wrapped function with automatic logging
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        tool_name = func.__name__
        start_time = time.time()
        success = False
        error = None
        result = None
        user_id = None

        try:
            # Get user_id from context (if available)
            try:
                user_id = get_user_id_from_context()
            except:
                user_id = "anonymous"  # Fallback if context not set

            # Execute the tool
            result = await func(*args, **kwargs)
            success = True
            return result

        except Exception as e:
            error = str(e)
            success = False
            raise  # Re-raise to maintain original behavior

        finally:
            # Calculate execution time
            execution_time_ms = (time.time() - start_time) * 1000

            # Sanitize arguments (remove sensitive data)
            sanitized_args = _sanitize_arguments(kwargs)

            # Log the tool call
            perf_metrics.log_tool_call(
                tool_name=tool_name,
                execution_time_ms=execution_time_ms,
                success=success,
                error=error,
                arguments=sanitized_args,
                result=result,
                user_id=user_id
            )

    return wrapper


def _sanitize_arguments(args: dict) -> dict:
    """
    Sanitize tool arguments before logging (remove sensitive data).

    Args:
        args: Tool arguments dictionary

    Returns:
        Sanitized arguments dictionary
    """
    sanitized = {}

    for key, value in args.items():
        # Remove JWT tokens
        if key in ['jwt', 'token', 'jwt_token', 'authorization']:
            sanitized[key] = "[REDACTED]"
        # Remove passwords
        elif 'password' in key.lower():
            sanitized[key] = "[REDACTED]"
        # Truncate very long strings
        elif isinstance(value, str) and len(value) > 500:
            sanitized[key] = value[:500] + "... [TRUNCATED]"
        # Keep everything else
        else:
            sanitized[key] = value

    return sanitized
