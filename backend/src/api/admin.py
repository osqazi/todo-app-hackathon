"""
Admin API endpoints for monitoring and management.

Provides endpoints for performance metrics, token usage, and system health.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any

from src.auth.dependencies import get_current_user
from src.utils.performance_logger import perf_metrics


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/performance-metrics", status_code=status.HTTP_200_OK)
async def get_performance_metrics(
    current_user_id: str = Depends(get_current_user),
    limit: int = 100
) -> Dict[str, Any]:
    """
    Get performance metrics summary.

    Returns statistics on chat response times, tool call performance,
    and overall system health.

    Args:
        current_user_id: Authenticated user ID (must be admin in production)
        limit: Maximum number of recent metrics to return

    Returns:
        Performance metrics summary and recent metrics

    Note: In production, add admin role check:
        if not is_admin(current_user_id):
            raise HTTPException(403, "Admin access required")
    """
    summary = perf_metrics.get_summary()
    recent = perf_metrics.get_recent_metrics(limit=limit)

    return {
        "summary": summary,
        "recent_metrics": recent
    }


@router.get("/token-usage", status_code=status.HTTP_200_OK)
async def get_token_usage(
    current_user_id: str = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get OpenAI API token usage and cost estimates.

    Note: This is a placeholder for actual token usage tracking.
    In production, integrate with OpenAI's usage API or track tokens
    from the Agents SDK responses.

    Args:
        current_user_id: Authenticated user ID (must be admin)

    Returns:
        Token usage statistics and cost estimates

    Raises:
        HTTPException 403: If user is not admin
    """
    # TODO: Integrate with actual token tracking
    # OpenAI Agents SDK may provide token usage in responses
    # For now, return placeholder

    return {
        "message": "Token usage tracking not yet implemented",
        "note": "Integrate with OpenAI usage API or track from agent responses",
        "recommendations": [
            "Use OpenAI dashboard for detailed usage: https://platform.openai.com/usage",
            "Track token counts from agent responses if available",
            "Set up billing alerts in OpenAI dashboard"
        ],
        "estimated_monthly_cost_usd": None,
        "total_requests": perf_metrics.get_summary().get("total_requests", 0)
    }


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check() -> Dict[str, str]:
    """
    Health check endpoint for monitoring.

    Returns:
        Health status
    """
    return {
        "status": "healthy",
        "service": "Todo Chat API",
        "version": "1.0.0"
    }
