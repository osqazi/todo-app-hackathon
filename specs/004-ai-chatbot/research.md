# Architectural Research & Decisions: AI-Powered Todo Chatbot

**Feature**: 004-ai-chatbot
**Date**: 2026-01-02
**Status**: ✅ All decisions finalized

## Overview

This document records all architectural decisions for integrating OpenAI ChatKit, OpenAI Agents SDK, and Model Context Protocol (MCP) SDK into the existing Phase II Todo web application. Each decision includes: rationale, alternatives considered, tradeoffs, and implementation pattern.

---

## Decision 1: Chat Interface Integration Strategy

### Context
Need to decide how to integrate the ChatKit conversational interface into the existing Todo web application UI.

### Decision
**✅ Dedicated `/chat` page with optional floating button access**

### Rationale
1. **Clear separation of concerns**: Traditional list view and chat interface serve different UX paradigms
2. **Full immersion**: Dedicated page allows chat to use full viewport for optimal conversation experience
3. **Easy navigation**: Simple route (`/chat`) for direct access; floating button provides quick access from any page
4. **Mobile-friendly**: Full-page chat works better on small screens than cramped sidebar
5. **Future extensibility**: Easier to add chat-specific features (voice input, image uploads) without cluttering main UI

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| **Sidebar modal overlay** | Quick access without navigation; see task list while chatting | Cramped on mobile; splits user attention; complex state management | Poor mobile UX; conflicts with existing sidebar navigation |
| **Bottom-right chat widget** | Non-intrusive; familiar pattern (support chat) | Too small for multi-turn conversations; hides task context | Doesn't match "primary interface" requirement from spec |
| **Split-screen view** | Simultaneous list + chat visibility | Complex responsive design; confusing on tablets; high cognitive load | Over-engineered for Phase III scope |

### Implementation Pattern

```typescript
// src/app/chat/page.tsx
export default function ChatPage() {
  return (
    <div className="h-screen flex flex-col">
      <header className="border-b p-4">
        <h1>AI Assistant</h1>
        <Link href="/">← Back to Tasks</Link>
      </header>
      <main className="flex-1 overflow-hidden">
        <ChatInterface />
      </main>
    </div>
  );
}

// src/components/chat/ChatButton.tsx (floating access)
export function ChatButton() {
  return (
    <Link
      href="/chat"
      className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg"
    >
      <ChatIcon />
    </Link>
  );
}
```

**References**:
- ChatKit documentation: https://openai.github.io/chatkit-js/
- Next.js App Router patterns: https://nextjs.org/docs/app

---

## Decision 2: MCP Tool Granularity

### Context
Need to decide whether to expose fine-grained MCP tools (one per operation) or higher-level abstracted tools (multi-operation).

### Decision
**✅ 7 granular MCP tools (create_task, list_tasks, get_task, update_task, delete_task, toggle_task_completion, search_tasks)**

### Rationale
1. **Spec alignment**: Specification explicitly lists 7 MCP tools covering all Todo operations
2. **Agent precision**: OpenAI Agents SDK can select exact tool needed for user intent (better than forcing agent to choose operation within abstract tool)
3. **Error isolation**: Individual tool failures don't affect other operations
4. **Clear contracts**: Each tool has focused input/output schema (easier to validate and test)
5. **REST API mapping**: One-to-one correspondence with existing REST endpoints (simpler implementation)
6. **Debugging**: Easier to trace which tool was called and why it failed

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| **2 abstract tools** (`manage_tasks`, `query_tasks`) | Fewer tool definitions; simpler agent config | Agent must pass `operation` parameter; complex input validation; harder to debug | Pushes complexity into tool logic; reduces agent's contextual understanding |
| **1 universal tool** (`task_operation`) | Single tool definition; ultimate simplicity | Massive input schema; poor error messages; violates single responsibility | Anti-pattern; makes agent harder to train; spec requires granular tools |
| **10+ hyper-granular tools** (e.g., `add_tag_to_task`, `remove_tag_from_task`) | Maximum precision | Tool explosion; agent confusion; maintenance burden | Over-engineered; existing 7 tools cover all needs |

### Implementation Pattern

```python
# backend/src/mcp/tools.py
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Todo MCP Server")

@mcp.tool()
def create_task(
    title: str,
    description: str = "",
    priority: str = "medium",
    tags: list[str] = [],
    due_date: str | None = None,
    is_recurring: bool = False,
    recurrence_pattern: str | None = None
) -> dict:
    """Creates a new task for the authenticated user."""
    # Validate JWT from context
    # Call POST /api/{user_id}/tasks
    # Return task object
    pass

@mcp.tool()
def list_tasks(
    status: str | None = None,
    priority: str | None = None,
    tags: list[str] = [],
    due_date_range: dict | None = None,
    limit: int = 50,
    offset: int = 0
) -> dict:
    """Retrieves tasks for the authenticated user with optional filters."""
    # Validate JWT
    # Call GET /api/{user_id}/tasks with query params
    # Return {tasks: [...], total, limit, offset}
    pass

# ... 5 more tools (get_task, update_task, delete_task, toggle_task_completion, search_tasks)
```

**References**:
- MCP SDK documentation: https://modelcontextprotocol.io
- OpenAI Agents SDK tool calling: https://openai.github.io/openai-agents-python/

---

## Decision 3: Authentication Flow (JWT Propagation)

### Context
MCP tools need to call authenticated REST API endpoints. Need to decide how JWT passes from frontend → backend agent → MCP tools.

### Decision
**✅ JWT pass-through from frontend to agent context, then to MCP tools**

### Rationale
1. **Simplicity**: Single authentication point (Better Auth); no duplicate auth logic
2. **Security**: JWT validated once at `/api/chat` endpoint; propagated in secure context
3. **User isolation**: Each tool call automatically scoped to authenticated user via JWT
4. **Session consistency**: Uses existing Better Auth session management
5. **No re-authentication overhead**: Avoid multiple auth round-trips per conversation

### Implementation Flow
```
User (browser) → /api/chat [JWT in Authorization header]
  ↓
FastAPI endpoint validates JWT + extracts user_id
  ↓
Pass user_id + JWT to Agent context
  ↓
Agent selects MCP tool(s)
  ↓
MCP tool receives user_id + JWT from context
  ↓
Tool calls REST API with Authorization: Bearer {JWT}
  ↓
REST API validates JWT (existing middleware) + executes operation
```

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| **Re-authenticate at tool layer** | Independent auth verification | Duplicate auth logic; performance overhead; session sync issues | Complexity; violates DRY; slower |
| **Service-to-service API key** | Bypass user auth for internal calls | Security risk (one key for all users); loses audit trail | Cannot enforce per-user isolation |
| **Agent manages sessions** | Agent-specific session state | Complex session lifecycle; JWT expiry handling in agent; security risk | Over-engineered; existing Better Auth sufficient |

### Implementation Pattern

```python
# backend/src/api/chat.py
from fastapi import APIRouter, Depends, HTTPException
from src.auth import get_current_user_from_jwt

router = APIRouter()

@router.post("/chat")
async def chat_endpoint(
    request: ChatRequest,
    user=Depends(get_current_user_from_jwt)  # Validates JWT, extracts user
):
    # Pass user_id + JWT to agent context
    agent_context = {
        "user_id": user.id,
        "jwt_token": request.headers["Authorization"].split(" ")[1]
    }

    # Run agent with context
    result = await run_agent_with_tools(
        message=request.message,
        context=agent_context
    )
    return result

# backend/src/mcp/auth.py
def get_jwt_from_context() -> str:
    """Extract JWT from agent execution context."""
    # Access thread-local or context var set by agent runner
    return current_context.jwt_token

def get_user_id_from_context() -> str:
    """Extract user_id from agent execution context."""
    return current_context.user_id

# backend/src/mcp/tools.py
@mcp.tool()
def create_task(title: str, **kwargs) -> dict:
    jwt = get_jwt_from_context()
    user_id = get_user_id_from_context()

    # Call REST API with JWT
    response = httpx.post(
        f"http://localhost:8000/api/{user_id}/tasks",
        headers={"Authorization": f"Bearer {jwt}"},
        json={"title": title, ...}
    )
    return response.json()
```

**Security Considerations**:
- JWT stored in server-side context (not exposed to agent prompt)
- JWT expiry handled by Better Auth (401 → agent returns "please re-authenticate" message)
- Rate limiting applied per user_id (not per JWT)

**References**:
- Better Auth JWT documentation
- FastAPI dependency injection: https://fastapi.tiangolo.com/tutorial/dependencies/

---

## Decision 4: Streaming Implementation

### Context
Need to stream agent responses from backend to frontend to show real-time thinking/reasoning and provide immediate feedback.

### Decision
**✅ Server-Sent Events (SSE) with OpenAI Agents SDK streaming + ChatKit built-in SSE client**

### Rationale
1. **ChatKit native support**: ChatKit React component handles SSE automatically via `api.url` config
2. **Agents SDK streaming**: OpenAI Agents SDK `Runner.run_stream()` natively produces streaming events
3. **HTTP/1.1 compatible**: SSE works on all platforms (unlike WebSocket which may be blocked)
4. **Simpler than WebSocket**: No connection lifecycle management; auto-reconnect; HTTP standard
5. **Event types**: SSE supports typed events (message_start, content_delta, tool_call, tool_result, message_end, error)

### Implementation Flow
```
ChatKit (frontend) → POST /api/chatkit (SSE connection)
  ↓
FastAPI endpoint streams SSE events
  ↓
OpenAI Agents SDK Runner.run_stream() yields events
  ↓
Each event (content_delta, tool_call, etc.) → formatted as SSE
  ↓
ChatKit receives events → updates UI in real-time
```

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| **WebSocket (custom)** | Bidirectional; lower latency | Complex lifecycle; may be blocked by firewalls; overkill for one-way streaming | SSE sufficient for agent → user streaming |
| **Polling (short intervals)** | Simple HTTP requests | High latency; server load; poor UX for streaming | Not real-time; wasteful |
| **Long polling** | Works everywhere | Complex state management; not true streaming | SSE is standard for this use case |

### Implementation Pattern

```python
# backend/src/api/chat.py
from fastapi.responses import StreamingResponse
from agents import Runner

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    async def event_generator():
        async for event in Runner.run_stream(agent, request.message):
            if event.type == "content_delta":
                yield f"event: content_delta\ndata: {json.dumps({'content': event.data})}\n\n"
            elif event.type == "tool_call":
                yield f"event: tool_call\ndata: {json.dumps({'tool': event.tool_name, 'args': event.args})}\n\n"
            elif event.type == "tool_result":
                yield f"event: tool_result\ndata: {json.dumps({'result': event.result})}\n\n"
            elif event.type == "message_end":
                yield f"event: message_end\ndata: {json.dumps({'final_output': event.output})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

```typescript
// src/lib/chatkit-config.ts
import { useChatKit } from '@openai/chatkit-react';

export function useTodoChatKit() {
  return useChatKit({
    api: {
      url: '/api/chatkit',  // ChatKit automatically uses SSE for streaming
      domainKey: process.env.NEXT_PUBLIC_CHATKIT_DOMAIN_KEY
    }
  });
}
```

**References**:
- SSE spec: https://html.spec.whatwg.org/multipage/server-sent-events.html
- FastAPI streaming: https://fastapi.tiangolo.com/advanced/custom-response/#streamingresponse
- OpenAI Agents SDK streaming: https://openai.github.io/openai-agents-python/

---

## Decision 5: Context Management (Conversation History)

### Context
Need to decide where to store conversation context for multi-turn conversations: in-memory (Agents SDK) vs database persistence.

### Decision
**✅ Hybrid approach: Agents SDK for in-conversation context + Database for long-term persistence**

### Rationale
1. **In-conversation efficiency**: Agents SDK maintains conversation state during active session (no DB round-trips per message)
2. **Long-term persistence**: Database stores full conversation history for retrieval after session ends
3. **User expectations**: Users expect to resume conversations after logout/reload (spec requirement)
4. **Auditability**: Database provides audit trail of all user interactions and tool calls
5. **Context window management**: Database allows selective context loading (last N messages) to stay within agent token limits

### Architecture
```
Active Conversation:
  - Agents SDK Session maintains message history in memory
  - Each agent response → append to in-memory session + write to DB

Conversation Resume:
  - Load last 20 messages from DB
  - Initialize new Agents SDK Session with loaded history
  - Continue conversation

New Conversation:
  - Create ChatConversation record in DB
  - Initialize empty Agents SDK Session
  - Link subsequent messages to conversation_id
```

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| **Agents SDK only** | Simple; built-in context management | Lost on server restart; no long-term history; can't resume conversations | Spec requires conversation history persistence |
| **Database only** | Complete persistence | DB query per message; slower; complex context window management | Performance overhead; Agents SDK provides better in-conversation state |
| **Redis cache + DB** | Fast retrieval; persistence | Added complexity; another service to manage | Over-engineered for Phase III scope |

### Implementation Pattern

```python
# backend/src/services/conversation_service.py
class ConversationService:
    async def get_or_create_session(self, conversation_id: int | None, user_id: str):
        if conversation_id:
            # Load existing conversation from DB
            messages = await self.get_messages(conversation_id, limit=20)
            # Initialize Agents SDK Session with history
            session = Session(
                messages=[{"role": m.role, "content": m.content} for m in messages]
            )
        else:
            # Create new conversation in DB
            conversation = ChatConversation(user_id=user_id)
            await self.db.add(conversation)
            # Initialize empty session
            session = Session(messages=[])

        return session, conversation

    async def save_message(
        self,
        conversation_id: int,
        role: str,
        content: str,
        tool_calls: list | None = None
    ):
        message = ChatMessage(
            conversation_id=conversation_id,
            role=role,
            content=content,
            tool_calls=tool_calls
        )
        await self.db.add(message)
        return message
```

**References**:
- OpenAI Agents SDK Sessions: https://openai.github.io/openai-agents-python/
- SQLModel async patterns: https://sqlmodel.tiangolo.com/tutorial/async/

---

## Decision 6: Agent-to-API Bridge Pattern

### Context
MCP tools need to call existing REST API endpoints. Decide whether to call REST API directly or abstract through service layer.

### Decision
**✅ MCP tools call REST API directly via HTTP client (httpx) with JWT propagation**

### Rationale
1. **Reuse existing validation**: REST API already has Pydantic validation, auth middleware, error handling
2. **Consistent behavior**: Ensure chatbot operations match traditional UI behavior exactly
3. **No code duplication**: Avoid reimplementing business logic in MCP tools
4. **Clear separation**: MCP tools are thin wrappers that translate agent intent → REST API calls
5. **Testing**: Can mock httpx for MCP tool unit tests; integration tests use real REST API

### Architecture
```
User message → Agent → MCP tool selection → Tool calls REST API (with JWT) → REST API validates + executes → Tool returns result → Agent formats response
```

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| **Service layer abstraction** | Direct DB access; faster | Duplicate business logic; bypass REST API validation; inconsistent behavior | Violates DRY; harder to maintain |
| **GraphQL mutation calls** | Single endpoint; batching | Requires GraphQL server; over-engineered | Phase II uses REST, not GraphQL |
| **Direct SQLModel queries** | No HTTP overhead | Bypass auth middleware; duplicate validation; security risk | Cannot enforce per-user isolation safely |

### Implementation Pattern

```python
# backend/src/mcp/tools.py
import httpx
from src.mcp.auth import get_jwt_from_context, get_user_id_from_context

# Shared HTTP client for REST API calls
API_BASE_URL = "http://localhost:8000"  # Or from config
http_client = httpx.AsyncClient(base_url=API_BASE_URL)

@mcp.tool()
async def create_task(
    title: str,
    description: str = "",
    priority: str = "medium",
    **kwargs
) -> dict:
    """Creates a new task for the authenticated user."""
    jwt = get_jwt_from_context()
    user_id = get_user_id_from_context()

    try:
        response = await http_client.post(
            f"/api/{user_id}/tasks",
            headers={"Authorization": f"Bearer {jwt}"},
            json={
                "title": title,
                "description": description,
                "priority": priority,
                **kwargs
            },
            timeout=5.0
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            raise ToolError("Authentication expired. Please sign in again.")
        elif e.response.status_code == 400:
            raise ToolError(f"Invalid task data: {e.response.json()['detail']}")
        else:
            raise ToolError(f"Failed to create task: {e}")
    except httpx.TimeoutException:
        raise ToolError("Task creation timed out. Please try again.")
```

**Error Handling Strategy**:
- 401 Unauthorized → "Please sign in again"
- 400 Bad Request → Surface validation errors to user
- 404 Not Found → "Task not found" (for update/delete)
- 429 Rate Limit → "Too many requests. Please wait."
- 500 Server Error → "Temporary issue. Please try again."
- Timeout → "Operation timed out. Please try again."

**References**:
- httpx documentation: https://www.python-httpx.org/
- MCP SDK error handling: https://modelcontextprotocol.io

---

## Decision 7: Error Handling Strategy (Retry vs Feedback)

### Context
When an MCP tool call fails, decide whether agent should retry automatically or immediately inform the user.

### Decision
**✅ Immediate user feedback with contextual error messages (no automatic retry)**

### Rationale
1. **Transparency**: Users see what went wrong and why (better UX than silent retries)
2. **User control**: User can rephrase query or fix underlying issue (e.g., invalid task ID)
3. **Avoid loops**: Automatic retry can cause infinite loops for persistent errors
4. **Faster feedback**: User sees error immediately instead of waiting for retry timeout
5. **Spec requirement**: Success criteria include "handles edge cases with helpful error messages rather than crashes"

### Error Response Patterns

| Error Type | Agent Response Example | User Action |
|------------|------------------------|-------------|
| **Authentication expired** | "Your session has expired. Please sign in again to continue." | Re-authenticate |
| **Task not found** | "I couldn't find task #42. Could you verify the task ID?" | Check ID or describe task differently |
| **Invalid input** | "The task title can't be empty. Please provide a title." | Rephrase with valid input |
| **Rate limit** | "You've sent too many messages. Please wait a moment and try again." | Wait and retry |
| **OpenAI API error** | "I'm having trouble processing your request right now. Please try again in a moment." | Retry later |
| **Ambiguous intent** | "I'm not sure which task you're referring to. Could you provide the task ID or more details?" | Clarify intent |

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| **Automatic retry (3x)** | Handles transient errors gracefully | Silent failures confuse users; can cause loops; delays feedback | Poor UX; spec requires helpful error messages |
| **Exponential backoff retry** | Standard pattern for network errors | Still delays feedback; doesn't help with validation errors | Doesn't address root causes |
| **Hybrid (retry transient, fail fast on validation)** | Best of both worlds | Complex logic; hard to categorize errors correctly | Over-engineered for Phase III |

### Implementation Pattern

```python
# backend/src/agents/todo_agent.py
from agents import Agent

agent = Agent(
    name="Todo Assistant",
    instructions="""
    You are a helpful assistant that manages todo tasks via natural language.

    When a tool call fails:
    1. Analyze the error message to understand what went wrong
    2. Provide a clear, helpful explanation to the user
    3. Suggest a corrective action if applicable
    4. Do NOT retry the same operation automatically

    Error handling examples:
    - Authentication error → "Your session expired. Please sign in again."
    - Task not found → "I couldn't find that task. Can you verify the ID?"
    - Validation error → "The task data is invalid: {specific_issue}"
    - Ambiguous intent → "Could you clarify which task you mean?"
    """,
    tools=[...],
    error_strategy="return_to_user"  # Don't retry automatically
)
```

```python
# backend/src/mcp/tools.py
class ToolError(Exception):
    """Raised when a tool operation fails with user-actionable message."""
    pass

@mcp.tool()
async def update_task(task_id: int, **kwargs) -> dict:
    try:
        response = await http_client.put(...)
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise ToolError(
                f"Task #{task_id} not found. Please check the task ID."
            )
        elif e.response.status_code == 400:
            detail = e.response.json().get("detail", "Invalid data")
            raise ToolError(f"Cannot update task: {detail}")
        else:
            raise ToolError(f"Update failed: {e}")
```

**References**:
- OpenAI Agents SDK error handling: https://openai.github.io/openai-agents-python/
- User-centered error messages: https://developers.google.com/style/error-messages

---

## Summary of Decisions

| # | Decision | Choice | Key Benefit |
|---|----------|--------|-------------|
| 1 | Chat Interface | Dedicated `/chat` page | Clear UX separation, mobile-friendly |
| 2 | MCP Tool Granularity | 7 granular tools | Spec alignment, agent precision, error isolation |
| 3 | Authentication | JWT pass-through | Simplicity, security, existing Better Auth reuse |
| 4 | Streaming | SSE with Agents SDK + ChatKit | Native support, HTTP/1.1 compatible, simple |
| 5 | Context Management | Hybrid (in-memory + DB) | Performance + long-term persistence |
| 6 | Agent-API Bridge | Direct REST API calls (httpx) | Reuse validation, consistent behavior, no duplication |
| 7 | Error Handling | Immediate feedback (no retry) | Transparency, user control, faster feedback |

**All decisions finalized and ready for implementation** ✅

---

## Open Questions / Future Considerations

1. **Voice Input**: Phase III scope excludes voice, but architecture allows future addition via ChatKit extensions
2. **Multi-Language**: NLU currently English-only; Agents SDK supports other languages if needed in future
3. **Offline Mode**: Web app requires network; PWA + IndexedDB could enable offline chat in Phase IV
4. **Cost Optimization**: Monitor OpenAI API usage; consider response caching if costs exceed $100/month
5. **Rate Limiting**: Implement per-user rate limiting on `/api/chat` if abuse detected
6. **Analytics**: Consider logging conversation analytics (intent accuracy, tool usage, error rates) for improvement

**Next Phase**: Proceed to Phase 1 (Data Model & Contracts) ✅
