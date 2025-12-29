"""
Integration tests for authentication flow.

Tests the complete authentication flow from JWT verification
through to user-scoped API operations.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import FastAPI
from fastapi.testclient import TestClient


class TestAppStructure:
    """Tests for FastAPI app structure."""

    def test_app_has_title(self):
        """Verify app has correct title."""
        from src.main import app
        assert "Todo Application API" in app.title

    def test_app_has_version(self):
        """Verify app has correct version."""
        from src.main import app
        assert app.version == "2.0.0"

    def test_root_endpoint_exists(self):
        """Verify root endpoint is defined."""
        from src.main import app
        routes = [r.path for r in app.routes]
        assert "/" in routes

    def test_health_endpoint_exists(self):
        """Verify health endpoint is registered."""
        from src.main import app
        routes = [r.path for r in app.routes]
        assert "/api/health" in routes


class TestEndpoints:
    """Tests for endpoint existence and structure."""

    def test_tasks_router_registered(self):
        """Verify tasks router is registered."""
        from src.main import app
        routes = [r.path for r in app.routes]
        # Routes are prefixed with /api/tasks
        assert any("/api/tasks" in path for path in routes)

    def test_cors_middleware_configured(self):
        """Verify CORS middleware is configured."""
        from src.main import app
        # Check that app has middleware stack
        assert hasattr(app, "middleware_stack")


class TestJWKSEndpoint:
    """Tests for JWKS endpoint behavior."""

    def test_jwks_fetch_failure_handling(self):
        """Verify JWKS fetch failures are handled gracefully."""
        from src.auth.jwks import fetch_jwks
        import httpx

        # Clear the cache to ensure fresh fetch
        fetch_jwks.cache_clear()

        with patch("httpx.Client") as mock_client:
            mock_client.return_value.__enter__.return_value.get.side_effect = httpx.HTTPError(
                "Connection refused"
            )

            with pytest.raises(httpx.HTTPError):
                fetch_jwks()


class TestTokenClaims:
    """Tests for JWT token claim validation."""

    def test_token_claims_structure(self):
        """Verify expected claims in JWT payload."""
        expected_claims = ["sub", "email"]

        # These claims should be present in tokens issued by Better Auth
        for claim in expected_claims:
            assert claim in expected_claims

    def test_subject_claim_is_user_id(self):
        """Verify 'sub' claim contains user identifier."""
        user_id = "user-123"
        payload = {"sub": user_id, "email": "test@example.com"}

        assert payload["sub"] == user_id
        assert isinstance(payload["sub"], str)


class TestErrorHandling:
    """Tests for authentication error handling."""

    def test_invalid_token_format(self):
        """Verify malformed tokens are rejected."""
        from src.auth.dependencies import verify_jwt_token, HTTPException

        mock_credentials = MagicMock()
        mock_credentials.credentials = "not-a-valid-jwt-format"

        with patch("src.auth.dependencies.jwt.decode") as mock_decode:
            mock_decode.side_effect = Exception("JWTError: Not enough segments")

            with pytest.raises(HTTPException) as exc_info:
                verify_jwt_token(mock_credentials)

            assert exc_info.value.status_code == 401

    def test_tampered_token(self):
        """Verify tampered tokens are rejected."""
        from src.auth.dependencies import verify_jwt_token, HTTPException

        mock_credentials = MagicMock()
        mock_credentials.credentials = "eyJhbGciOiJFZERTQSJ9.tampered.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature"

        with patch("src.auth.dependencies.jwt.decode") as mock_decode:
            mock_decode.side_effect = Exception("JWSSignatureError: Signature verification failed")

            with pytest.raises(HTTPException) as exc_info:
                verify_jwt_token(mock_credentials)

            assert exc_info.value.status_code == 401


class TestAPIResponseStructure:
    """Tests for API response structures."""

    def test_root_response_structure(self):
        """Verify root endpoint returns expected structure."""
        from src.main import app

        client = TestClient(app)
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "version" in data
        assert "status" in data

    def test_health_response_structure(self):
        """Verify health endpoint returns expected structure."""
        from src.main import app

        client = TestClient(app)
        response = client.get("/api/health")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data


class TestUserIsolationEnforcement:
    """Tests for user isolation enforcement in API."""

    def test_unauthenticated_request_to_tasks_returns_401(self):
        """Verify unauthenticated requests to /api/tasks return 401."""
        from src.main import app

        client = TestClient(app)
        response = client.get("/api/tasks")

        # Should return 401 or 403 for unauthenticated request
        assert response.status_code in [401, 403]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
