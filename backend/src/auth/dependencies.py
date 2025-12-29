"""FastAPI authentication dependencies for JWT verification."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import PyJWKClient
from typing import Dict, Any
import os
from .jwks import get_jwks_url


# HTTP Bearer token scheme
bearer_scheme = HTTPBearer(auto_error=False)


def verify_jwt_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
) -> Dict[str, Any]:
    """
    Verify JWT token from Authorization header.

    Validates:
    - Token signature using JWKS public key
    - Issuer (iss claim)
    - Audience (aud claim)
    - Expiration (exp claim)

    Args:
        credentials: Bearer token from Authorization header

    Returns:
        Decoded JWT payload with claims (sub, iss, aud, exp, email, etc.)

    Raises:
        HTTPException 401: If token is missing, invalid, or expired
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        # Get expected issuer and audience from environment
        expected_issuer = os.getenv("BETTER_AUTH_ISSUER")
        expected_audience = os.getenv("API_AUDIENCE")

        # Debug logging
        print(f"DEBUG: Expected issuer: {expected_issuer}")
        print(f"DEBUG: Expected audience: {expected_audience}")

        if not expected_issuer or not expected_audience:
            raise RuntimeError(
                "BETTER_AUTH_ISSUER and API_AUDIENCE environment variables must be set"
            )

        # First decode WITHOUT validation to see claims (BEFORE JWKS fetch)
        try:
            unverified = jwt.decode(token, options={"verify_signature": False})
            print(f"DEBUG: Token claims: iss={unverified.get('iss')}, aud={unverified.get('aud')}")
        except Exception as e:
            print(f"DEBUG: Failed to decode token WITHOUT validation: {e}")

        # Fetch JWKS and get signing key
        jwks_url = get_jwks_url()
        print(f"DEBUG: JWKS URL: {jwks_url}")
        jwks_client = PyJWKClient(jwks_url)
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        print(f"DEBUG: Got signing key, now verifying...")

        # Decode and verify JWT
        # PyJWT validates signature, issuer, audience, and expiration
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["EdDSA"],  # Better Auth uses EdDSA (Ed25519)
            issuer=expected_issuer,
            audience=expected_audience,
        )

        return payload

    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(payload: Dict[str, Any] = Depends(verify_jwt_token)) -> str:
    """
    Extract authenticated user ID from verified JWT payload.

    Args:
        payload: Decoded JWT payload from verify_jwt_token

    Returns:
        User ID (string) from the 'sub' claim (Better Auth uses TEXT IDs)

    Raises:
        HTTPException 401: If 'sub' claim is missing
    """
    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing user ID in token",
        )

    return str(user_id)
