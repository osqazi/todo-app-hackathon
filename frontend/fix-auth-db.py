#!/usr/bin/env python3
"""Script to recreate Better Auth database tables."""

import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv(".env.local")

# Get database URL
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in .env.local")
    exit(1)

print(f"Connecting to database...")

# Read SQL file
with open("fix-auth-tables.sql", "r") as f:
    sql = f.read()

# Connect and execute
try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    print("Executing SQL to recreate Better Auth tables...")
    cur.execute(sql)

    conn.commit()
    print("Successfully recreated Better Auth tables!")

    cur.close()
    conn.close()

except Exception as e:
    print(f"ERROR: {e}")
    exit(1)
