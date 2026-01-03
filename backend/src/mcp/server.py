"""
FastMCP server initialization for Todo MCP tools.

This module sets up the MCP server that exposes Todo management tools
to the OpenAI agent. Tools are registered here and made available for
natural language task management.
"""
from mcp.server.fastmcp import FastMCP


# Initialize FastMCP server with descriptive name
mcp = FastMCP(
    name="Todo MCP Server",
    dependencies=["httpx>=0.24.0"]
)


# Server will be populated with tools in tools.py
# Tools are registered using @mcp.tool() decorator
