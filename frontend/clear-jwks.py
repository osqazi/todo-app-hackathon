#!/usr/bin/env python3
"""Script to clear JWKS cache from database."""

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

    print("Clearing JWKS cache...")
    cur.execute("DELETE FROM jwks")

    conn.commit()
    print(f"Successfully deleted JWKS records!")

    cur.close()
    conn.close()

except Exception as e:
    print(f"ERROR: {e}")
    exit(1)
