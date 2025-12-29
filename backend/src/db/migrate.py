"""Database migration script to create tables."""
from sqlmodel import SQLModel
from .engine import engine
from ..models.task import Task


def create_tables():
    """
    Create backend database tables (tasks only).

    NOTE: Users table is managed by Better Auth (frontend).
    Only creates the tasks table which references users.id.

    WARNING: This is for development only. For production, use Alembic migrations.
    This method does NOT handle schema changes (adding/removing columns).
    """
    print("Creating backend database tables...")
    print("NOTE: Assuming 'users' table exists (created by Better Auth)")
    SQLModel.metadata.create_all(engine)
    print("✅ Database tables created successfully")
    print("Tables: tasks")


def drop_tables():
    """
    Drop all database tables.
    
    WARNING: This will DELETE ALL DATA. Use only for testing/development.
    """
    print("⚠️  Dropping all database tables...")
    SQLModel.metadata.drop_all(engine)
    print("✅ All tables dropped")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--drop":
        drop_tables()
    
    create_tables()
