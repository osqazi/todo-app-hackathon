"""
Vercel serverless function entry point for FastAPI backend.
"""

from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    """
    Simple HTTP handler for Vercel Python runtime.
    """
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()

        response = {
            "message": "Todo Backend API is running",
            "status": "ok",
            "version": "2.0.0",
            "path": self.path,
            "docs": "/docs (FastAPI integration pending)"
        }

        self.wfile.write(json.dumps(response).encode())
        return
