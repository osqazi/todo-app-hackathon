"""JWKS (JSON Web Key Set) fetching and caching for JWT verification."""
import httpx
from functools import lru_cache
from typing import Dict, Any
import os


@lru_cache(maxsize=1)
def fetch_jwks(jwks_url: str) -> Dict[str, Any]:
    """
    Fetch JSON Web Key Set (JWKS) from Better Auth.
    
    The JWKS contains public keys used to verify JWT signatures.
    Results are cached for 1 hour to minimize network requests.
    
    Args:
        jwks_url: URL to Better Auth JWKS endpoint (e.g., http://localhost:3000/api/auth/jwks)
    
    Returns:
        JWKS dictionary with "keys" array containing public key data
    
    Raises:
        httpx.HTTPError: If JWKS fetch fails
    """
    try:
        response = httpx.get(jwks_url, timeout=10.0)
        response.raise_for_status()
        jwks = response.json()
        
        if "keys" not in jwks or not isinstance(jwks["keys"], list):
            raise ValueError(f"Invalid JWKS format: {jwks}")
        
        return jwks
    except httpx.HTTPError as e:
        raise RuntimeError(f"Failed to fetch JWKS from {jwks_url}: {e}")


def get_jwks_url() -> str:
    """Get JWKS URL from environment variable."""
    jwks_url = os.getenv("BETTER_AUTH_JWKS_URL")
    if not jwks_url:
        raise RuntimeError(
            "BETTER_AUTH_JWKS_URL environment variable not set. "
            "Set it in .env.local (localhost) or .env (production)."
        )
    return jwks_url


def clear_jwks_cache():
    """Clear the JWKS cache. Useful for testing or key rotation."""
    fetch_jwks.cache_clear()
