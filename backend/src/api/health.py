"""
Health check endpoints for monitoring and load balancer probes.
"""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Basic health check endpoint."""
    return {"status": "healthy"}


@router.get("/health/ready")
async def readiness_check():
    """
    Readiness check - verifies the application is ready to serve traffic.
    Includes database connectivity check.
    """
    from src.db.session import get_session

    try:
        # Attempt to get a database session to verify connectivity
        async for session in get_session():
            await session.execute("SELECT 1")
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        return {"status": "not_ready", "database": "disconnected", "error": str(e)}


@router.get("/health/live")
async def liveness_check():
    """
    Liveness check - verifies the application process is running.
    Used by Kubernetes to determine if the pod should be restarted.
    """
    return {"status": "alive"}
