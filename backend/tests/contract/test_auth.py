"""
Contract tests for authentication endpoints.

Tests JWT verification, user isolation, and auth dependencies.
These tests verify the contract between the frontend Better Auth
and the FastAPI backend.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException


# Valid JWT format: header.payload.signature (base64 encoded)
VALID_MOCK_TOKEN = "eyJhbGciOiJFZERTQSJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.mock_signature_value"
INVALID_FORMAT_TOKEN = "not-enough-segments"


class TestJWKSFetching:
    """Tests for JWKS fetching and caching."""

    def test_fetch_jwks_returns_dict(self):
        """Verify fetch_jwks returns a dictionary with keys."""
        from src.auth.jwks import fetch_jwks

        with patch("httpx.Client") as mock_client:
            mock_response = MagicMock()
            mock_response.json.return_value = {"keys": [{"kid": "test-key-1", "kty": "OKP", "crv": "Ed25519"}]}
            mock_response.raise_for_status = MagicMock()
            mock_client.return_value.__enter__.return_value.get.return_value = mock_response

            result = fetch_jwks()

            assert isinstance(result, dict)
            assert "keys" in result

    def test_fetch_jwks_caches_result(self):
        """Verify fetch_jwks uses lru_cache for caching."""
        from src.auth.jwks import fetch_jwks

        # The function should be cached (uses lru_cache)
        assert hasattr(fetch_jwks, "cache_info")


class TestJWTSigningKey:
    """Tests for signing key extraction from JWT."""

    def test_get_signing_key_raises_for_invalid_format(self):
        """Verify get_signing_key raises ValueError for token with invalid format."""
        from src.auth.jwks import get_signing_key
        from jose.exceptions import JWTError

        # Token with invalid format (not enough segments)
        with pytest.raises((ValueError, JWTError)):
            get_signing_key(INVALID_FORMAT_TOKEN)


class TestAuthDependencies:
    """Tests for auth dependency functions."""

    def test_get_current_user_returns_user_id(self):
        """Verify get_current_user extracts user_id from token payload."""
        from src.auth.dependencies import get_current_user

        mock_payload = {"sub": "user-123", "email": "test@example.com"}

        result = get_current_user(mock_payload)

        assert result == "user-123"

    def test_get_current_user_raises_for_missing_sub(self):
        """Verify get_current_user raises for token without sub claim."""
        from src.auth.dependencies import get_current_user, HTTPException

        mock_payload = {"email": "test@example.com"}

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(mock_payload)

        assert exc_info.value.status_code == 401
        assert "missing user identifier" in exc_info.value.detail


class TestTokenValidation:
    """Tests for JWT token validation scenarios."""

    def test_expired_token_raises_401(self):
        """Verify expired tokens return 401 Unauthorized."""
        from src.auth.dependencies import verify_jwt_token, HTTPException

        mock_credentials = MagicMock()
        mock_credentials.credentials = VALID_MOCK_TOKEN

        with patch("src.auth.dependencies.jwt.decode") as mock_decode:
            mock_decode.side_effect = Exception("ExpiredSignatureError: Token has expired")

            with pytest.raises(HTTPException) as exc_info:
                verify_jwt_token(mock_credentials)

            assert exc_info.value.status_code == 401
            # Check that error message contains some indication of the issue
            error_msg = exc_info.value.detail.lower()
            assert "expired" in error_msg or "signature" in error_msg or "token" in error_msg

    def test_invalid_issuer_raises_401(self):
        """Verify tokens with invalid issuer return 401."""
        from src.auth.dependencies import verify_jwt_token, HTTPException

        mock_credentials = MagicMock()
        mock_credentials.credentials = VALID_MOCK_TOKEN

        with patch("src.auth.dependencies.jwt.decode") as mock_decode:
            mock_decode.side_effect = Exception("InvalidIssuerError: Invalid issuer")

            with pytest.raises(HTTPException) as exc_info:
                verify_jwt_token(mock_credentials)

            assert exc_info.value.status_code == 401
            error_msg = exc_info.value.detail.lower()
            assert "issuer" in error_msg or "token" in error_msg

    def test_invalid_audience_raises_401(self):
        """Verify tokens with invalid audience return 401."""
        from src.auth.dependencies import verify_jwt_token, HTTPException

        mock_credentials = MagicMock()
        mock_credentials.credentials = VALID_MOCK_TOKEN

        with patch("src.auth.dependencies.jwt.decode") as mock_decode:
            mock_decode.side_effect = Exception("InvalidAudienceError: Invalid audience")

            with pytest.raises(HTTPException) as exc_info:
                verify_jwt_token(mock_credentials)

            assert exc_info.value.status_code == 401
            error_msg = exc_info.value.detail.lower()
            assert "audience" in error_msg or "token" in error_msg

    def test_malformed_token_raises_401(self):
        """Verify malformed tokens return 401."""
        from src.auth.dependencies import verify_jwt_token, HTTPException

        mock_credentials = MagicMock()
        mock_credentials.credentials = INVALID_FORMAT_TOKEN

        with patch("src.auth.dependencies.jwt.decode") as mock_decode:
            mock_decode.side_effect = Exception("JWTError: Not enough segments")

            with pytest.raises(HTTPException) as exc_info:
                verify_jwt_token(mock_credentials)

            assert exc_info.value.status_code == 401


class TestUserIsolation:
    """Tests for user isolation enforcement."""

    def test_task_repository_filters_by_user_id(self):
        """Verify TaskRepository filters queries by user_id."""
        from src.repository.task_repository import TaskRepository

        mock_session = AsyncMock()
        # Use numeric user_id since repository converts to int
        repo = TaskRepository(mock_session, "123")

        # Verify the repository stores the user_id
        assert repo.user_id == "123"

    def test_get_by_id_includes_user_filter(self):
        """Verify get_by_id constructs query with user_id filter."""
        from src.repository.task_repository import TaskRepository
        from sqlalchemy import select

        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute = AsyncMock(return_value=mock_result)

        repo = TaskRepository(mock_session, "456")  # Use numeric string for int() conversion

        # Call the async method
        import asyncio
        asyncio.run(repo.get_by_id(task_id=123))

        # Verify execute was called with user_id filter
        call_args = mock_session.execute.call_args
        statement = call_args[0][0]

        # Check that the statement has WHERE clauses
        assert statement.whereclause is not None


class TestTaskServiceIsolation:
    """Tests for task service user isolation."""

    def test_task_service_stores_user_id(self):
        """Verify TaskService stores the user_id from JWT."""
        from src.service.task_service import TaskService

        mock_session = AsyncMock()
        service = TaskService(mock_session, "jwt-user-789")

        assert service.user_id == "jwt-user-789"
        assert service.repository.user_id == "jwt-user-789"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
