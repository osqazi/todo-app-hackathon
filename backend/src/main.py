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
env_path = backend_dir / ".env"
load_dotenv(dotenv_path=env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api import tasks, health, notifications


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

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(notifications.router, prefix="/api", tags=["notifications"])


@app.get("/")
async def root():
    """Root endpoint - API information."""
    return {
        "name": "Todo Application API",
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs",
    }
