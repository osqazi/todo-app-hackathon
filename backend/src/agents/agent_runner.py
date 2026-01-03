"""
Agent runner for executing Todo agent with authentication context.

This module handles running the OpenAI agent with proper authentication
and context management for secure, user-scoped task operations.
"""
from typing import Any, Optional
import os

# Import OpenAI agents package (not the local src.agents module)
import agents as openai_agents
Runner = openai_agents.Runner
RunResult = openai_agents.RunResult

from src.agents.todo_agent import todo_agent
from src.mcp.auth import set_auth_context, clear_auth_context
from src.config import settings
from src.utils.retry_logic import with_retry
from src.utils.performance_logger import measure_time


async def run_agent_with_tools(
    message: str,
    user_id: str,
    jwt_token: str,
    conversation_id: Optional[int] = None,
    conversation_history: Optional[list[dict[str, str]]] = None
) -> RunResult:
    """
    Run the Todo agent with a user message and authentication context.

    This function:
    1. Sets up authentication context for MCP tools
    2. Optionally loads conversation history for multi-turn context
    3. Executes the agent with the user's message
    4. Clears authentication context after completion

    Args:
        message: User's natural language message/command
        user_id: Authenticated user's ID (for API calls)
        jwt_token: JWT token for REST API authentication
        conversation_id: Optional conversation ID for loading history
        conversation_history: Optional pre-loaded conversation messages
            Format: [{"role": "user"/"assistant", "content": "..."}, ...]

    Returns:
        RunResult with assistant's reply and tool call metadata

    Raises:
        Exception: If agent execution fails (authentication, tool errors, etc.)
    """
    # Set authentication context for this agent execution
    set_auth_context(jwt_token=jwt_token, user_id=user_id)

    try:
        # Prepare conversation history (if available)
        messages = []
        if conversation_history:
            messages = conversation_history.copy()

        # Add current user message
        messages.append({"role": "user", "content": message})

        # Create agent runner
        runner = Runner()

        # Phase 8: Run agent with performance tracking and retry logic
        @with_retry(max_retries=2, initial_delay=1.0)
        async def run_with_retry():
            async with measure_time("agent_execution"):
                return await runner.run(
                    starting_agent=todo_agent,
                    input=messages
                )

        response = await run_with_retry()

        return response

    finally:
        # Always clear auth context after execution (even if error occurs)
        clear_auth_context()


async def run_agent_stream(
    message: str,
    user_id: str,
    jwt_token: str,
    conversation_id: Optional[int] = None,
    conversation_history: Optional[list[dict[str, str]]] = None
):
    """
    Run the Todo agent with streaming responses (Phase 7 - User Story 5).

    This function streams agent responses in real-time, showing reasoning
    steps and tool calls as they happen.

    Args:
        message: User's natural language message/command
        user_id: Authenticated user's ID
        jwt_token: JWT token for authentication
        conversation_id: Optional conversation ID
        conversation_history: Optional conversation messages

    Yields:
        Server-Sent Event formatted strings with agent progress:
        - message_start: Response begins
        - content_delta: Incremental text chunks
        - tool_call_start: Tool about to be called
        - tool_call_args: Tool arguments
        - tool_call_result: Tool execution result
        - message_end: Response complete
    """
    import json

    # Set authentication context
    set_auth_context(jwt_token=jwt_token, user_id=user_id)

    accumulated_content = []
    tool_calls_made = []

    try:
        # Prepare messages
        messages = []
        if conversation_history:
            messages = conversation_history.copy()
        messages.append({"role": "user", "content": message})

        # Create runner
        runner = Runner()

        # Signal start
        yield f"event: message_start\ndata: {json.dumps({'conversation_id': conversation_id})}\n\n"

        # Stream response (OpenAI Agents SDK - run_streamed returns RunResultStreaming)
        stream_result = runner.run_streamed(
            starting_agent=todo_agent,
            input=messages
        )

        # Iterate over stream events using .stream_events() method
        async for event in stream_result.stream_events():
            # Check if this is a raw_response_event wrapper
            event_type = getattr(event, 'type', 'unknown')

            # For raw_response_event, extract the actual event from data
            if event_type == 'raw_response_event':
                actual_event = getattr(event, 'data', None)
                if actual_event:
                    event = actual_event
                    event_type = getattr(event, 'type', 'unknown')

            # Handle ResponseTextDeltaEvent for agent's text responses
            if event_type == 'response.output_text.delta':
                # Text chunk from agent's response
                delta = getattr(event, 'delta', '')
                accumulated_content.append(delta)
                yield f"event: content_delta\ndata: {json.dumps({'content': delta})}\n\n"

            # Handle different event types from OpenAI Agents SDK
            elif event_type == 'content':
                # Incremental content chunk
                content = getattr(event, 'content', '')
                accumulated_content.append(content)
                yield f"event: content_delta\ndata: {json.dumps({'content': content})}\n\n"

            # Handle function/tool call start
            elif event_type == 'response.output_item.added':
                # Tool call starting
                item = getattr(event, 'item', None)
                if item and hasattr(item, 'name'):
                    tool_name = item.name
                    tool_calls_made.append({'tool_name': tool_name, 'arguments': {}})
                    yield f"event: tool_call_start\ndata: {json.dumps({'tool_name': tool_name})}\n\n"

            # Handle function call arguments completion
            elif event_type == 'response.function_call_arguments.done':
                # Tool arguments complete
                tool_name = getattr(event, 'name', 'unknown_tool')
                arguments_str = getattr(event, 'arguments', '{}')
                try:
                    arguments = json.loads(arguments_str)
                except:
                    arguments = {}

                # Update the last tool call with arguments
                if tool_calls_made:
                    tool_calls_made[-1]['arguments'] = arguments

                yield f"event: tool_call_args\ndata: {json.dumps({'tool_name': tool_name, 'arguments': arguments})}\n\n"

            elif event_type == 'tool_call':
                # Tool being called (legacy/alternative event)
                tool_name = getattr(event, 'tool_name', 'unknown_tool')
                tool_args = getattr(event, 'arguments', {})
                tool_calls_made.append({'tool_name': tool_name, 'arguments': tool_args})

                yield f"event: tool_call_start\ndata: {json.dumps({'tool_name': tool_name})}\n\n"
                yield f"event: tool_call_args\ndata: {json.dumps({'tool_name': tool_name, 'arguments': tool_args})}\n\n"

            elif event_type == 'tool_result':
                # Tool execution result
                tool_name = getattr(event, 'tool_name', 'unknown_tool')
                result = getattr(event, 'result', {})

                yield f"event: tool_call_result\ndata: {json.dumps({'tool_name': tool_name, 'result': result})}\n\n"

            elif event_type == 'error':
                # Error occurred
                error_msg = getattr(event, 'message', 'Unknown error')
                yield f"event: error\ndata: {json.dumps({'error': error_msg})}\n\n"

            # For any other event types, safely extract serializable data
            else:
                event_data = {'type': event_type}
                # Only extract safe, primitive attributes
                safe_attrs = ['data', 'message', 'content', 'delta']
                for attr in safe_attrs:
                    if hasattr(event, attr):
                        value = getattr(event, attr)
                        # Only add if it's a serializable type
                        if isinstance(value, (str, int, float, bool, dict, list, type(None))):
                            event_data[attr] = value
                        elif hasattr(value, '__dict__'):
                            # For objects with __dict__, try to extract basic info
                            try:
                                event_data[attr] = str(value)
                            except:
                                event_data[attr] = f"<{type(value).__name__}>"

                yield f"event: {event_type}\ndata: {json.dumps(event_data)}\n\n"

        # Signal completion
        full_content = ''.join(accumulated_content)
        yield f"event: message_end\ndata: {json.dumps({'content': full_content, 'tool_calls': tool_calls_made})}\n\n"

    except Exception as e:
        # Log error for debugging
        import traceback
        print(f"RUN_AGENT_STREAM ERROR: {type(e).__name__}: {str(e)}")
        print("Full traceback:")
        traceback.print_exc()

        # Stream error
        yield f"event: error\ndata: {json.dumps({'error': str(e), 'type': type(e).__name__})}\n\n"

    finally:
        clear_auth_context()
