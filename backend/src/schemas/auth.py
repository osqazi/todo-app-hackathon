"""
Pydantic schemas for authentication API responses.

Note: Better Auth handles signup/signin directly.
This module provides schemas for auth-related responses if needed.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    """Schema for user information in API responses."""
    id: int
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """Schema for authentication response (if needed for custom flows)."""
    user: UserResponse
    token: str


class ErrorResponse(BaseModel):
    """Schema for error responses."""
    detail: str


class ValidationErrorResponse(BaseModel):
    """Schema for validation error responses (Pydantic)."""
    detail: list[dict]
