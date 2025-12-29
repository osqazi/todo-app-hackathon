"""
Simple migration script to create tasks table.
Uses raw SQL to avoid SQLModel metadata issues.
"""
import os
from dotenv import load_dotenv
import psycopg2

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def create_tasks_table():
    """Create tasks table with foreign key to Better Auth user table."""
    print("Creating tasks table...")

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    try:
        # Create tasks table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                title VARCHAR(500) NOT NULL,
                description VARCHAR(2000) NOT NULL DEFAULT '',
                completed BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE,
                FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
            )
        """)

        # Create index on user_id for better query performance
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)
        """)

        conn.commit()
        print("SUCCESS: Tasks table created successfully!")
        print("Tables: tasks")

    except Exception as e:
        conn.rollback()
        print(f"ERROR: Failed to create tasks table: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    create_tasks_table()
