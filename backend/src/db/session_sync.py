"""Synchronous database session for use in async tools."""
from sqlmodel import Session, create_engine
from src.config import settings

# Create sync engine
sync_engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10
)


def get_session_sync() -> Session:
    """
    Create a new synchronous database session.

    Note: Caller is responsible for closing the session.
    """
    return Session(sync_engine)
