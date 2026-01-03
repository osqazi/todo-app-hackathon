"""Test script to debug MCP tool execution."""
import asyncio
from src.mcp.auth import set_auth_context, clear_auth_context
from src.agents import tools

async def test_list_tasks():
    """Test list_tasks tool with debug output."""
    # Set up fake auth context (you'll need to replace with a real JWT)
    fake_jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test"
    fake_user_id = "test-user"

    set_auth_context(jwt_token=fake_jwt, user_id=fake_user_id)

    try:
        print("Calling list_tasks tool...")
        result = await tools.list_tasks()
        print(f"Success! Got result: {result}")
    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
    finally:
        clear_auth_context()

if __name__ == "__main__":
    asyncio.run(test_list_tasks())
