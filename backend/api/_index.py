"""
Vercel serverless function entry point for FastAPI backend.

This file imports the FastAPI app and wraps it with Mangum
to make it compatible with Vercel's serverless environment.
"""

import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Import the FastAPI app from src.main
from src.main import app as fastapi_app

# Import Mangum to wrap FastAPI for serverless
from mangum import Mangum

# Wrap the FastAPI app with Mangum for AWS Lambda/Vercel compatibility
handler = Mangum(fastapi_app, lifespan="off")
