#!/usr/bin/env python3
"""Script to completely reset Better Auth database."""

import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv(".env.local")

# Get database URL
DATABASE_URL = os.getenv("DATABASE_URL")

try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    print("Resetting all Better Auth data...")

    # Delete all data from all tables
    cur.execute("DELETE FROM account")
    cur.execute("DELETE FROM session")
    cur.execute("DELETE FROM verification")
    cur.execute("DELETE FROM jwks")
    cur.execute("DELETE FROM \"user\"")

    conn.commit()
    print("Successfully reset all Better Auth data!")
    print("All users, sessions, and JWT keys deleted.")

    cur.close()
    conn.close()

except Exception as e:
    print(f"ERROR: {e}")
    exit(1)
