# Quickstart: AI Chatbot Development & Testing

**Feature**: 004-ai-chatbot
**Updated**: 2026-01-02

## Prerequisites

- ✅ Phase II Todo application deployed (Next.js on Vercel + FastAPI on Render)
- ✅ PostgreSQL database (Neon Serverless) accessible
- ✅ OpenAI API key (https://platform.openai.com/api-keys)
- ✅ ChatKit Domain Key from `CDK.txt`: `domain_pk_695744ba42d081938c10c399e8db7e0b062b49cd2f212200`
- ✅ Node.js 18+ and Python 3.13+ installed

---

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
pip install openai-agents mcp httpx
```

Or with uv (faster):
```bash
uv add openai-agents mcp httpx
```

### 2. Environment Variables

Add to `backend/.env`:

```env
# Existing variables (from Phase II)
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...

# New AI Chatbot variables
OPENAI_API_KEY=sk-proj-...
CHATBOT_DEBUG_MODE=true
CHATBOT_MAX_CONVERSATION_HISTORY=20
CHATBOT_STREAMING_ENABLED=true
```

### 3. Run Database Migration

```bash
cd backend
alembic upgrade head
```

Expected output:
```
INFO  [alembic.runtime.migration] Running upgrade 003 -> 004, Add chat_conversations and chat_messages tables
```

Verify tables created:
```bash
psql $DATABASE_URL -c "\dt chat_*"
```

Should show:
```
 public | chat_conversations | table
 public | chat_messages      | table
```

### 4. Start FastAPI Server

Development mode with hot reload:
```bash
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Check health endpoint:
```bash
curl http://localhost:8000/health
# Expected: {"status": "healthy", "chatbot": "enabled"}
```

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend  # or root if Next.js is at project root
npm install @openai/chatkit-react
```

Verify installation:
```bash
npm list @openai/chatkit-react
# Should show version (e.g., @openai/chatkit-react@1.x.x)
```

### 2. Environment Variables

Add to `.env.local`:

```env
# Existing variables (from Phase II)
NEXT_PUBLIC_API_URL=http://localhost:8000

# New ChatKit variables
NEXT_PUBLIC_CHATKIT_DOMAIN_KEY=domain_pk_695744ba42d081938c10c399e8db7e0b062b49cd2f212200
NEXT_PUBLIC_CHATKIT_API_URL=http://localhost:8000/api/chatkit
```

For production deployment (`vercel.json` or Vercel dashboard):
```env
NEXT_PUBLIC_CHATKIT_DOMAIN_KEY=domain_pk_695744ba42d081938c10c399e8db7e0b062b49cd2f212200
NEXT_PUBLIC_CHATKIT_API_URL=https://your-api.onrender.com/api/chatkit
```

### 3. Start Next.js Dev Server

```bash
npm run dev
```

Navigate to:
- Main app: http://localhost:3000
- Chat page: http://localhost:3000/chat

---

## Testing the Chatbot

### Manual Testing Checklist

#### Basic Task Management (P1)

1. **Navigate to chat**: http://localhost:3000/chat
2. **Sign in** with test user (if not already authenticated)
3. **Add a task**:
   - Input: `"Create a task to buy groceries"`
   - Expected: Agent confirms task created with task ID
4. **List tasks**:
   - Input: `"Show me all my tasks"`
   - Expected: Agent displays formatted list with IDs, titles, statuses
5. **Update task**:
   - Input: `"Update task 5 to 'Complete quarterly report by Friday'"`
   - Expected: Agent confirms task 5 updated
6. **Complete task**:
   - Input: `"Mark task 3 as done"`
   - Expected: Agent confirms task 3 marked complete
7. **Delete task**:
   - Input: `"Delete task 7"`
   - Expected: Agent confirms task 7 deleted

#### Natural Language Understanding (P2)

8. **Synonyms test**:
   - `"Add a new todo for team meeting"` → Should create task
   - `"I need to remember to send email"` → Should create task
   - `"Create a reminder to call client"` → Should create task
9. **Implicit due dates**:
   - `"Add task to submit report tomorrow"` → Task with due_date = tomorrow
   - `"Schedule dentist appointment for next Monday at 2 PM"` → Task with specific due date/time
10. **Complex queries**:
    - `"Show all high priority work tasks due this week"`
    - Expected: Filters by priority=high, tags containing "work", due_date within current week

#### Multi-Turn Context (P3)

11. **Reference previous task**:
    - Message 1: `"Add task to review design"`
    - Message 2: `"Set it to high priority"`
    - Expected: Agent updates the previously created task (not asks which task)
12. **List and modify**:
    - Message 1: `"Show my work tasks"`
    - Message 2: `"Mark the first one as complete"`
    - Expected: Agent marks first task from previous list as complete

#### Edge Cases

13. **Ambiguous intent**:
    - Input: `"Show me the tasks"` (user has 500 tasks)
    - Expected: Agent asks for clarification or suggests filters
14. **Invalid task ID**:
    - Input: `"Update task 9999 to 'New title'"`
    - Expected: Agent responds "Task #9999 not found. Please check the task ID."
15. **Empty title**:
    - Input: `"Create a task with empty title"`
    - Expected: Agent responds "Task title can't be empty. Please provide a title."

### Automated Testing

#### Backend Unit Tests

Test MCP tools:
```bash
cd backend
pytest tests/unit/test_mcp_tools.py -v
```

Expected output:
```
tests/unit/test_mcp_tools.py::test_create_task_success PASSED
tests/unit/test_mcp_tools.py::test_create_task_invalid_title PASSED
tests/unit/test_mcp_tools.py::test_list_tasks_with_filters PASSED
tests/unit/test_mcp_tools.py::test_update_task_not_found PASSED
...
```

Test agent intent recognition:
```bash
pytest tests/unit/test_agent.py -v
```

#### Backend Integration Tests

Test full conversation flows:
```bash
pytest tests/integration/test_chat_flow.py -v
```

#### Frontend Component Tests

Test ChatKit integration:
```bash
cd frontend
npm test -- ChatInterface.test.tsx
```

Expected output:
```
PASS src/components/chat/ChatInterface.test.tsx
  ✓ renders chat interface
  ✓ sends message and receives response
  ✓ displays conversation history
```

#### End-to-End Tests (Playwright)

```bash
npx playwright test tests/e2e/chatbot.spec.ts
```

Test scenarios:
- User signs in → opens chat → creates task → verifies in traditional UI
- User creates recurring task via chat → checks database for recurrence pattern
- User searches tasks via chat → verifies results match filters

---

## Development Workflows

### Adding a New MCP Tool

1. **Define tool schema** in `backend/src/mcp/tools.py`:
   ```python
   @mcp.tool()
   def my_new_tool(param1: str, param2: int) -> dict:
       """Tool description for agent."""
       jwt = get_jwt_from_context()
       user_id = get_user_id_from_context()

       # Call REST API
       response = await http_client.post(...)
       return response.json()
   ```

2. **Add tool to agent** in `backend/src/agents/todo_agent.py`:
   ```python
   agent = Agent(
       name="Todo Assistant",
       instructions="...",
       tools=[..., my_new_tool]  # Add new tool
   )
   ```

3. **Write unit test** in `tests/unit/test_mcp_tools.py`:
   ```python
   def test_my_new_tool():
       result = my_new_tool(param1="test", param2=42)
       assert result["success"] == True
   ```

4. **Test in chat**:
   - Navigate to http://localhost:3000/chat
   - Try natural language command that should trigger the new tool
   - Check agent response and tool call logs

### Debugging Agent Behavior

Enable debug mode in `backend/.env`:
```env
CHATBOT_DEBUG_MODE=true
```

View agent logs:
```bash
tail -f logs/agent_debug.log
```

Log format:
```
2026-01-02 10:05:00 | USER    | "Add task to buy milk"
2026-01-02 10:05:01 | INTENT  | create_task (confidence: 0.95)
2026-01-02 10:05:01 | TOOL    | create_task(title="buy milk")
2026-01-02 10:05:02 | RESULT  | {"task_id": 42, "title": "buy milk"}
2026-01-02 10:05:02 | AGENT   | "I've created task #42: buy milk"
```

### Monitoring OpenAI API Usage

Check token usage:
```bash
curl -X GET "http://localhost:8000/api/admin/token-usage" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Response:
```json
{
  "total_tokens": 15420,
  "cost_estimate": "$0.23",
  "conversations_today": 45,
  "avg_tokens_per_conversation": 342
}
```

---

## Troubleshooting

### Issue: "OPENAI_API_KEY not found"

**Solution**:
1. Verify `.env` file exists in `backend/` directory
2. Check variable name exactly matches `OPENAI_API_KEY`
3. Restart FastAPI server after adding variable
4. Test: `echo $OPENAI_API_KEY` (should print key)

### Issue: "ChatKit domain key invalid"

**Symptoms**: Chat interface shows "Authentication failed" error

**Solution**:
1. Verify domain key in `.env.local` matches `CDK.txt`
2. Check for typos (key starts with `domain_pk_`)
3. Ensure key has no quotes or extra spaces
4. For production, verify domain key bound to deployed domain

### Issue: "Conversation history not persisting"

**Symptoms**: Messages disappear after page refresh

**Solution**:
1. Check database migration ran: `alembic current`
2. Verify tables exist: `psql $DATABASE_URL -c "\dt chat_*"`
3. Check `conversation_service.py` saves messages to DB
4. Enable SQL query logging: `SQLALCHEMY_ECHO=true`

### Issue: "Agent not calling tools"

**Symptoms**: Agent responds with generic text instead of performing operations

**Solution**:
1. Check agent instructions include tool usage examples
2. Verify tools registered in `Agent(tools=[...])`
3. Test tool directly: `create_task(title="test")`
4. Check OpenAI API response for tool call events
5. Enable debug mode to see agent reasoning

### Issue: "JWT authentication failed in MCP tools"

**Symptoms**: All tool calls return 401 Unauthorized

**Solution**:
1. Verify JWT passed to agent context in `/api/chat` endpoint
2. Check `get_jwt_from_context()` retrieves JWT correctly
3. Test JWT validity: `curl -H "Authorization: Bearer $JWT" http://localhost:8000/api/me`
4. Check Better Auth JWT expiry settings

---

## Performance Benchmarks

Run performance tests:
```bash
pytest tests/performance/test_chat_latency.py
```

Expected metrics:
- **Chat response starts streaming**: <2 seconds (p95)
- **MCP tool call (create_task)**: <500ms
- **MCP tool call (list_tasks, 500 tasks)**: <800ms
- **Database query (conversation history, 20 messages)**: <100ms
- **Concurrent sessions (100 users)**: No errors, <20% latency increase

---

## Deployment

### Backend (Render)

1. Add environment variables in Render dashboard:
   - `OPENAI_API_KEY`
   - `CHATBOT_DEBUG_MODE=false`
   - `CHATBOT_STREAMING_ENABLED=true`

2. Run migration on production DB:
   ```bash
   # Connect to Render shell
   alembic upgrade head
   ```

3. Verify deployment:
   ```bash
   curl https://your-api.onrender.com/health
   ```

### Frontend (Vercel)

1. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_CHATKIT_DOMAIN_KEY` (production domain key)
   - `NEXT_PUBLIC_CHATKIT_API_URL` (Render backend URL)

2. Deploy:
   ```bash
   vercel --prod
   ```

3. Test chat on production:
   - Navigate to https://your-app.vercel.app/chat
   - Perform basic task operations
   - Verify data persists in production database

---

## Next Steps

After successful setup and testing:

1. **Run `/sp.tasks`**: Generate ordered implementation tasks from plan
2. **Implement features**: Follow tasks.md in priority order (P1 → P5)
3. **Write tests**: TDD approach for each task
4. **Deploy**: Push to production after all acceptance tests pass

**Quickstart Complete** ✅ Ready for development!
