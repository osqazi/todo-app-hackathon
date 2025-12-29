"""Database session management with dependency injection."""
from sqlmodel import Session
from typing import Generator
from .engine import engine


def get_session() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a database session.

    Usage:
        @app.get("/tasks")
        def get_tasks(session: Session = Depends(get_session)):
            tasks = session.exec(select(Task)).all()
            return tasks

    The session is automatically closed after the request completes.
    Changes are committed when the request handler completes successfully.
    """
    with Session(engine) as session:
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
