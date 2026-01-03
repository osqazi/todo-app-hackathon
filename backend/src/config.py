"""
Configuration module for environment variables and application settings.

This module centralizes all configuration loading for the backend application,
including Phase III AI chatbot settings.
"""

import os
from typing import Optional


class Settings:
    """Application settings loaded from environment variables."""

    # Existing configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    BETTER_AUTH_ISSUER: str = os.getenv("BETTER_AUTH_ISSUER", "http://localhost:3000")
    API_AUDIENCE: str = os.getenv("API_AUDIENCE", "http://localhost:3000")
    BETTER_AUTH_JWKS_URL: str = os.getenv(
        "BETTER_AUTH_JWKS_URL", "http://localhost:3000/api/auth/jwks"
    )
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Phase III - AI Chatbot Configuration
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    CHATBOT_DEBUG_MODE: bool = os.getenv("CHATBOT_DEBUG_MODE", "false").lower() == "true"
    CHATBOT_MAX_CONVERSATION_HISTORY: int = int(
        os.getenv("CHATBOT_MAX_CONVERSATION_HISTORY", "20")
    )
    CHATBOT_STREAMING_ENABLED: bool = (
        os.getenv("CHATBOT_STREAMING_ENABLED", "true").lower() == "true"
    )

    @classmethod
    def validate(cls) -> None:
        """Validate that all required environment variables are set."""
        if not cls.DATABASE_URL:
            raise RuntimeError("DATABASE_URL environment variable is not set")
        if not cls.FRONTEND_URL:
            raise RuntimeError("FRONTEND_URL environment variable is not set")
        # OpenAI API key is validated when chatbot is used, not at startup


# Create global settings instance
settings = Settings()
