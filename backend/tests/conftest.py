"""
Pytest configuration and fixtures for backend tests.

Provides common fixtures used across all test modules.
"""

import pytest
import sys
import os
from unittest.mock import AsyncMock, MagicMock, patch

# Add backend/src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))


@pytest.fixture
def mock_session():
    """Create a mock async database session."""
    session = AsyncMock()
    session.execute = AsyncMock()
    session.add = MagicMock()
    session.delete = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.flush = AsyncMock()
    session.refresh = AsyncMock()
    return session


@pytest.fixture
def mock_jwks():
    """Mock JWKS response for testing."""
    return {
        "keys": [
            {
                "kid": "test-key-1",
                "kty": "OKP",
                "crv": "Ed25519",
                "x": "test-x-value",
                "y": "test-y-value",
            }
        ]
    }


@pytest.fixture
def valid_token_payload():
    """Mock valid JWT payload."""
    return {
        "sub": "user-123",
        "email": "test@example.com",
        "iss": "http://localhost:3000",
        "aud": "http://localhost:8000",
    }


@pytest.fixture
def expired_token_payload():
    """Mock expired JWT payload."""
    from datetime import datetime, timezone, timedelta

    return {
        "sub": "user-123",
        "email": "test@example.com",
        "iss": "http://localhost:3000",
        "aud": "http://localhost:8000",
        "exp": int((datetime.now(timezone.utc) - timedelta(hours=1)).timestamp()),
        "iat": int((datetime.now(timezone.utc) - timedelta(hours=2)).timestamp()),
    }


@pytest.fixture
def mock_task():
    """Mock Task model instance."""
    task = MagicMock()
    task.id = 1
    task.user_id = 123
    task.title = "Test Task"
    task.description = "Test Description"
    task.completed = False
    task.created_at = "2025-12-29T10:00:00Z"
    task.updated_at = None
    return task


@pytest.fixture
def mock_user():
    """Mock User model instance."""
    user = MagicMock()
    user.id = 123
    user.email = "test@example.com"
    user.password_hash = "$2b$12$hash"
    user.created_at = "2025-12-29T10:00:00Z"
    return user
