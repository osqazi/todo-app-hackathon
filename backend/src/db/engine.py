"""Database engine configuration for PostgreSQL with SQLModel."""
from sqlmodel import create_engine
from sqlalchemy.pool import NullPool
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get database URL from environment variable (required - no fallback)
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL environment variable not set. "
        "Set it in .env.local (localhost) or .env (production)."
    )

# Create async engine with connection pool settings
# pool_pre_ping: Verify connections are alive before using them
# This is critical for Neon Serverless which may suspend connections
engine = create_engine(
    DATABASE_URL,
    echo=True,  # Log SQL queries (disable in production)
    pool_pre_ping=True,  # Verify connection health
    pool_size=5,  # Small pool for serverless
    max_overflow=10,  # Allow burst connections
)

# For testing: Use NullPool to avoid connection pooling issues
def create_test_engine(database_url: str):
    """Create engine for testing with NullPool."""
    return create_engine(
        database_url,
        echo=False,
        poolclass=NullPool,
    )
