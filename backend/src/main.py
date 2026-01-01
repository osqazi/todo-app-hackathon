"""
Todo Application Backend - FastAPI Entry Point

This module provides the main FastAPI application instance and lifecycle management.
"""

import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables FIRST before any other imports that might use them
# Get the backend directory (parent of src/)
backend_dir = Path(__file__).parent.parent
# Load from .env.local for local development, .env for production
# Render.com/Vercel set environment variables directly, so file loading is optional
env_path = backend_dir / ".env.local"
if not env_path.exists():
    env_path = backend_dir / ".env"
load_dotenv(dotenv_path=env_path, override=False)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api import tasks, health


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan context manager for startup and shutdown events."""
    # Note: Database tables are created by migration script (src/db/migrate.py)
    # For production, use Alembic migrations instead
    yield
    # Shutdown: Clean up resources if needed
    pass


# Create FastAPI application
app = FastAPI(
    title="Todo Application API",
    description="Multi-user authenticated todo management API",
    version="2.0.0",
    lifespan=lifespan,
)

# Get FRONTEND_URL from environment variable (required - no fallback)
frontend_url = os.getenv("FRONTEND_URL")
print(f"DEBUG main.py: FRONTEND_URL from env = {frontend_url}")
if not frontend_url:
    raise RuntimeError(
        "FRONTEND_URL environment variable not set. "
        "Set it in .env.local (localhost) or .env (production)."
    )

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])


@app.get("/")
async def root():
    """Root endpoint - API information."""
    return {
        "name": "Todo Application API",
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs",
    }
