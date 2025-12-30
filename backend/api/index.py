"""
Vercel serverless function entry point for FastAPI backend.

This file imports the FastAPI app and exports it for Vercel's Python runtime.
"""

import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Import the FastAPI app from src.main
from src.main import app

# Export the app for Vercel
# Vercel expects a variable that can be called as an ASGI app
handler = app
