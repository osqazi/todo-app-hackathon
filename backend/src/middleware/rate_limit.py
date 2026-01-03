"""
Rate limiting middleware for chat endpoints.

Implements per-user rate limiting to prevent abuse and manage costs.
"""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, Tuple
import asyncio


class RateLimiter:
    """
    In-memory rate limiter for chat endpoints.

    For production, consider using Redis for distributed rate limiting.
    """

    def __init__(self, requests_per_hour: int = 100, requests_per_minute: int = 20):
        """
        Initialize rate limiter.

        Args:
            requests_per_hour: Maximum requests per hour per user
            requests_per_minute: Maximum requests per minute per user
        """
        self.requests_per_hour = requests_per_hour
        self.requests_per_minute = requests_per_minute

        # Track requests: {user_id: [(timestamp, count), ...]}
        self.hourly_requests: Dict[str, list[Tuple[datetime, int]]] = defaultdict(list)
        self.minute_requests: Dict[str, list[Tuple[datetime, int]]] = defaultdict(list)

        # Cleanup task
        self._cleanup_task = None

    async def check_rate_limit(self, user_id: str) -> Tuple[bool, str]:
        """
        Check if user has exceeded rate limits.

        Args:
            user_id: User identifier

        Returns:
            (is_allowed, error_message)
        """
        now = datetime.now()

        # Clean old entries
        self._cleanup_old_entries(user_id, now)

        # Check minute limit
        minute_count = sum(count for timestamp, count in self.minute_requests[user_id])
        if minute_count >= self.requests_per_minute:
            return False, f"Rate limit exceeded: {self.requests_per_minute} requests per minute. Please slow down."

        # Check hour limit
        hour_count = sum(count for timestamp, count in self.hourly_requests[user_id])
        if hour_count >= self.requests_per_hour:
            return False, f"Rate limit exceeded: {self.requests_per_hour} requests per hour. Please try again later."

        # Record this request
        self.minute_requests[user_id].append((now, 1))
        self.hourly_requests[user_id].append((now, 1))

        return True, ""

    def _cleanup_old_entries(self, user_id: str, now: datetime):
        """Remove entries older than the time window."""
        # Clean minute entries (older than 1 minute)
        minute_cutoff = now - timedelta(minutes=1)
        self.minute_requests[user_id] = [
            (timestamp, count) for timestamp, count in self.minute_requests[user_id]
            if timestamp > minute_cutoff
        ]

        # Clean hour entries (older than 1 hour)
        hour_cutoff = now - timedelta(hours=1)
        self.hourly_requests[user_id] = [
            (timestamp, count) for timestamp, count in self.hourly_requests[user_id]
            if timestamp > hour_cutoff
        ]

    async def periodic_cleanup(self):
        """Periodically clean up old entries to prevent memory leaks."""
        while True:
            await asyncio.sleep(300)  # Every 5 minutes
            now = datetime.now()

            # Clean all users
            for user_id in list(self.minute_requests.keys()):
                self._cleanup_old_entries(user_id, now)

            # Remove empty user entries
            self.minute_requests = {
                user_id: entries for user_id, entries in self.minute_requests.items()
                if entries
            }
            self.hourly_requests = {
                user_id: entries for user_id, entries in self.hourly_requests.items()
                if entries
            }


# Global rate limiter instance
rate_limiter = RateLimiter(requests_per_hour=100, requests_per_minute=20)


async def check_chat_rate_limit(request: Request, user_id: str) -> None:
    """
    Dependency for checking rate limits on chat endpoints.

    Args:
        request: FastAPI request
        user_id: Authenticated user ID

    Raises:
        HTTPException: 429 if rate limit exceeded
    """
    is_allowed, error_message = await rate_limiter.check_rate_limit(user_id)

    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=error_message,
            headers={"Retry-After": "60"}  # Suggest retry after 60 seconds
        )
