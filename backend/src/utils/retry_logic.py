"""
Retry logic with exponential backoff for OpenAI API calls.

Handles transient failures gracefully with configurable retry parameters.
"""
import asyncio
import time
from typing import Callable, TypeVar, Any
from functools import wraps

T = TypeVar('T')


class RetryError(Exception):
    """Raised when all retry attempts are exhausted."""
    pass


async def retry_with_exponential_backoff(
    func: Callable[..., T],
    max_retries: int = 3,
    initial_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    jitter: bool = True,
    retryable_exceptions: tuple = (Exception,)
) -> T:
    """
    Retry an async function with exponential backoff.

    Args:
        func: Async function to retry
        max_retries: Maximum number of retry attempts
        initial_delay: Initial delay in seconds
        max_delay: Maximum delay in seconds
        exponential_base: Base for exponential backoff (e.g., 2 means 1s, 2s, 4s, 8s...)
        jitter: Add random jitter to prevent thundering herd
        retryable_exceptions: Tuple of exceptions that should trigger retry

    Returns:
        Result from successful function call

    Raises:
        RetryError: If all retry attempts are exhausted
    """
    import random

    last_exception = None

    for attempt in range(max_retries + 1):
        try:
            return await func()
        except retryable_exceptions as e:
            last_exception = e

            if attempt == max_retries:
                raise RetryError(
                    f"Failed after {max_retries} retries: {str(e)}"
                ) from e

            # Calculate delay with exponential backoff
            delay = min(initial_delay * (exponential_base ** attempt), max_delay)

            # Add jitter
            if jitter:
                delay = delay * (0.5 + random.random())

            print(f"Retry attempt {attempt + 1}/{max_retries} after {delay:.2f}s: {str(e)}")
            await asyncio.sleep(delay)

    raise RetryError(f"Failed after {max_retries} retries") from last_exception


def with_retry(
    max_retries: int = 3,
    initial_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0
):
    """
    Decorator for adding retry logic to async functions.

    Usage:
        @with_retry(max_retries=3, initial_delay=1.0)
        async def my_function():
            # Your code here
            pass

    Args:
        max_retries: Maximum number of retry attempts
        initial_delay: Initial delay in seconds
        max_delay: Maximum delay in seconds
        exponential_base: Base for exponential backoff

    Returns:
        Decorated function with retry logic
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            async def call_func():
                return await func(*args, **kwargs)

            return await retry_with_exponential_backoff(
                call_func,
                max_retries=max_retries,
                initial_delay=initial_delay,
                max_delay=max_delay,
                exponential_base=exponential_base
            )
        return wrapper
    return decorator
