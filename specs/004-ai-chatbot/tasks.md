# Implementation Tasks: AI-Powered Todo Chatbot

**Feature**: 004-ai-chatbot
**Branch**: `004-ai-chatbot`
**Date**: 2026-01-02
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Overview

This document contains ordered, testable implementation tasks for the AI-Powered Todo Chatbot feature. Tasks are organized by user story to enable independent development, testing, and incremental delivery.

**MVP Scope**: User Story 1 (P1) - Basic Task Management via Chat
**Total Estimated Tasks**: 45 tasks across 7 phases
**Estimated LOC**: ~3500 (Frontend: 800, Backend: 1500, Tests: 1200)

---

## Implementation Strategy

### Incremental Delivery

1. **Phase 1-2 (Setup + Foundation)**: Infrastructure for all user stories
2. **Phase 3 (US1 - P1)**: MVP - Basic task management via chat (independently testable)
3. **Phase 4 (US2 - P2)**: Natural language understanding enhancements
4. **Phase 5 (US3 - P3)**: Multi-turn conversation context
5. **Phase 6 (US4 - P4)**: Advanced task operations (priorities, tags, dates, recurrence)
6. **Phase 7 (US5 - P5)**: Streaming responses with agent reasoning
7. **Phase 8**: Polish and cross-cutting concerns

### Parallel Execution Opportunities

- **Phase 1**: All setup tasks can run in parallel after T001
- **Phase 2**: Database models (T007-T009) can run parallel with MCP auth setup (T010-T011)
- **Phase 3 (US1)**: MCP tools (T013-T019) can be implemented in parallel after T012 (FastMCP server)
- **Phase 4-7**: Each user story phase builds on previous ones but can be parallelized within the phase

### Independent Testing Per Story

Each user story phase includes its own independent test that validates the feature works standalone:

- **US1**: Create task via chat → verify in traditional UI → complete via chat → verify updated
- **US2**: Test synonym variations ("add task", "create todo", "I need to") → all create tasks
- **US3**: Create task → reference "it" in next message → verify context maintained
- **US4**: Create task with complex attributes via natural language → verify all attributes set
- **US5**: Issue complex command → watch response stream → verify reasoning displayed

---

## Phase 1: Setup & Infrastructure

**Goal**: Initialize project structure, install dependencies, configure environment

**Tasks**:

- [X] T001 Checkout feature branch `004-ai-chatbot` and verify clean working directory
- [X] T002 [P] Install frontend dependencies: `npm install @openai/chatkit-react` in project root
- [X] T003 [P] Install backend dependencies: `pip install openai-agents mcp httpx` in backend/
- [X] T004 [P] Add environment variables to backend/.env: OPENAI_API_KEY, CHATBOT_DEBUG_MODE, CHATBOT_MAX_CONVERSATION_HISTORY, CHATBOT_STREAMING_ENABLED
- [X] T005 [P] Add environment variables to .env.local: NEXT_PUBLIC_CHATKIT_DOMAIN_KEY, NEXT_PUBLIC_CHATKIT_API_URL
- [X] T006 [P] Update backend/src/config.py to load new OPENAI_API_KEY and CHATBOT_* environment variables

**Verification**: Run `npm list @openai/chatkit-react` and `pip list | grep openai-agents` to confirm installations

---

## Phase 2: Foundational Components (Blocking Prerequisites)

**Goal**: Database schema, models, and authentication plumbing required by all user stories

**Tasks**:

- [X] T007 Create Alembic migration backend/alembic/versions/004_add_chat_tables.py with ChatConversation and ChatMessage tables per data-model.md
- [X] T008 Run migration: `alembic upgrade head` and verify tables created with `psql $DATABASE_URL -c "\dt chat_*"`
- [X] T009 [P] Create ChatConversation SQLModel in backend/src/models/chat_conversation.py with relationships to User and ChatMessage
- [X] T010 [P] Create ChatMessage SQLModel in backend/src/models/chat_message.py with MessageRole enum and JSONB fields for tool_calls/metadata
- [X] T011 [P] Implement JWT extraction helpers in backend/src/mcp/auth.py: get_jwt_from_context(), get_user_id_from_context()
- [X] T012 Initialize FastMCP server in backend/src/mcp/server.py with name "Todo MCP Server" and json_response=True

**Verification**: Database has `chat_conversations` and `chat_messages` tables with proper indexes; models import without errors

---

## Phase 3: User Story 1 (P1) - Basic Task Management via Chat

**Goal**: Implement MVP chatbot with 7 MCP tools + ChatKit UI + agent for basic CRUD operations

**Story**: As an authenticated user, I want to add, view, update, and complete tasks through natural language conversation.

**Independent Test**: Open /chat page → sign in → type "Add a task to buy groceries" → verify task created → type "Show me all my tasks" → verify list displayed → type "Mark it as complete" → verify task completed

### Backend: MCP Tools (7 tools)

- [X] T013 [P] [US1] Implement create_task MCP tool in backend/src/mcp/tools.py that calls POST /api/{user_id}/tasks with JWT
- [X] T014 [P] [US1] Implement list_tasks MCP tool that calls GET /api/{user_id}/tasks with optional filters (status, priority, tags, due_date_range, limit, offset)
- [X] T015 [P] [US1] Implement get_task MCP tool that calls GET /api/{user_id}/tasks/{task_id} with JWT
- [X] T016 [P] [US1] Implement update_task MCP tool that calls PUT /api/{user_id}/tasks/{task_id} with partial updates
- [X] T017 [P] [US1] Implement delete_task MCP tool that calls DELETE /api/{user_id}/tasks/{task_id} with JWT
- [X] T018 [P] [US1] Implement toggle_task_completion MCP tool that calls PATCH /api/{user_id}/tasks/{task_id}/complete with completed boolean
- [X] T019 [P] [US1] Implement search_tasks MCP tool that calls GET /api/{user_id}/tasks/search with query, filters, sort_by, sort_order params

### Backend: Agent & API

- [X] T020 [US1] Create OpenAI Agent configuration in backend/src/agents/todo_agent.py with instructions for task management and tools=[all 7 MCP tools]
- [X] T021 [US1] Implement Agent runner in backend/src/agents/agent_runner.py with run_agent_with_tools() that accepts message + context (user_id, JWT)
- [X] T022 [US1] Create ConversationService in backend/src/services/conversation_service.py with get_or_create_session(), save_message() methods
- [X] T023 [US1] Implement /api/chat endpoint in backend/src/api/chat.py with POST handler that validates JWT, runs agent, streams SSE response
- [X] T024 [US1] Register /api/chat router in backend/src/main.py

### Frontend: ChatKit UI

- [X] T025 [US1] Create ChatKit configuration in src/lib/chatkit-config.ts with useTodoChatKit() hook using NEXT_PUBLIC_CHATKIT_DOMAIN_KEY
- [X] T026 [US1] Create TypeScript types in src/types/chat.ts for ChatMessage, Conversation, ChatRequest, ChatResponse
- [X] T027 [US1] Implement ChatInterface component in src/components/chat/ChatInterface.tsx using useChatKit hook and ChatKit React component
- [X] T028 [US1] Create /chat page in src/app/chat/page.tsx with full-page chat layout and navigation back to tasks
- [X] T029 [US1] Add "Chat" navigation link in src/app/layout.tsx header pointing to /chat

### Integration & Testing

- [X] T030 [US1] Test MCP tools with mock httpx client: pytest backend/tests/unit/test_mcp_tools.py covering create/list/get/update/delete/toggle/search
- [X] T031 [US1] Test agent intent recognition: pytest backend/tests/unit/test_agent.py with mocked tool calls for "add task", "show tasks", "delete task"
- [X] T032 [US1] Integration test: pytest backend/tests/integration/test_chat_flow.py simulating full conversation (add task → list tasks → complete task)
- [X] T033 [US1] E2E test: Manual verification - login → /chat → "Add task to buy milk" → verify task created in DB and traditional UI

**Phase 3 Acceptance Criteria**:
- [ ] ✅ Can create task via chat and see confirmation with task ID
- [ ] ✅ Can list all tasks via chat and see formatted output
- [ ] ✅ Can update task title via chat by specifying task ID
- [ ] ✅ Can mark task complete via chat and verify status changed
- [ ] ✅ Can delete task via chat and verify removed from list
- [ ] ✅ All MCP tools enforce JWT auth (401 if missing/invalid)
- [ ] ✅ Traditional UI still works unchanged (backward compatibility)

---

## Phase 4: User Story 2 (P2) - Natural Language Understanding

**Goal**: Enhance agent to handle synonyms, informal phrasing, implicit attributes, and multi-step commands

**Story**: As an authenticated user, I want to express task operations in various natural ways without learning specific command syntax.

**Independent Test**: Test variations: "Add task X" / "Create todo X" / "I need to X" → all create tasks. Test "I need to buy milk tomorrow" → task created with due_date=tomorrow. Test "Add three tasks: A, B, C" → 3 tasks created.

### Backend: Agent Enhancement

- [ ] T034 [US2] Update agent instructions in backend/src/agents/todo_agent.py to handle synonym variations (add/create/new, show/list/view, update/edit/change, delete/remove, complete/done/finish)
- [ ] T035 [US2] Enhance agent instructions to parse implicit due dates ("tomorrow", "next Monday", "end of day Friday") and extract from natural language
- [ ] T036 [US2] Add agent capability to handle multi-step commands (e.g., "Add three tasks: A, B, C") by calling create_task tool multiple times
- [ ] T037 [US2] Enhance agent instructions to understand informal queries ("What's on my plate today?" → show tasks due today)

### Testing

- [ ] T038 [US2] Test synonym handling: pytest backend/tests/unit/test_agent.py with variations ("add task", "create todo", "I need to remember to") → all trigger create_task tool
- [ ] T039 [US2] Test implicit date parsing: Agent test for "buy milk tomorrow" → creates task with due_date = tomorrow's date
- [ ] T040 [US2] Test multi-step commands: Agent test for "Add three tasks: review code, send email, schedule meeting" → creates 3 separate tasks
- [ ] T041 [US2] E2E test: Manual - "I need to buy milk tomorrow" → verify task created with due_date. "What's on my plate today?" → verify shows today's tasks

**Phase 4 Acceptance Criteria**:
- [ ] ✅ Synonym variations all work correctly (add/create, show/list, update/edit, delete/remove, complete/done)
- [ ] ✅ Implicit due dates parsed correctly ("tomorrow", "next Monday at 3 PM", "end of day Friday")
- [ ] ✅ Multi-step commands create multiple tasks as expected
- [ ] ✅ Informal queries understood ("What's on my plate?" → today's tasks)
- [ ] ✅ Complex filters work: "Show high priority work tasks due this week" → correct results

---

## Phase 5: User Story 3 (P3) - Multi-Turn Conversation Context

**Goal**: Enable chatbot to maintain context across messages and reference previous tasks/responses

**Story**: As an authenticated user, I want the chatbot to remember context from earlier in the conversation so I can refer to previously mentioned tasks without repeating details.

**Independent Test**: Create task → say "Set it to high priority" (without specifying task) → verify previously created task updated to high priority

### Backend: Context Management

- [ ] T042 [US3] Implement conversation history loading in backend/src/services/conversation_service.py: load_conversation_history(conversation_id, limit=20)
- [ ] T043 [US3] Update agent_runner.py to initialize Agents SDK Session with loaded conversation history when conversation_id provided
- [ ] T044 [US3] Implement message persistence: save_message() called after each agent response with tool_calls and metadata stored in JSONB
- [ ] T045 [US3] Update /api/chat endpoint to accept optional conversation_id parameter and create new conversation if null

### Frontend: Conversation Persistence

- [ ] T046 [US3] Implement ConversationHistory component in src/components/chat/ConversationHistory.tsx to display list of user's conversations
- [ ] T047 [US3] Add conversation loading to ChatInterface: fetch conversation history on mount if conversation_id in URL params
- [ ] T048 [US3] Add "New Conversation" button to clear current conversation and start fresh

### Testing

- [ ] T049 [US3] Test context maintenance: Integration test - create task → next message "Set it to high priority" → verify task updated
- [ ] T050 [US3] Test conversation resume: Create conversation → logout → login → resume conversation → verify history loaded
- [ ] T051 [US3] E2E test: Manual - "Add task to review design" → "Set it to high priority" → verify task #X priority=high (without specifying task ID)

**Phase 5 Acceptance Criteria**:
- [ ] ✅ Can reference previously created task with "it" without specifying ID
- [ ] ✅ Can reference "the first one" from previous list response
- [ ] ✅ Multi-message discussions maintain context (task ID remembered across 3+ messages)
- [ ] ✅ Conversation history persists in database
- [ ] ✅ Can resume conversations after logout/login
- [ ] ✅ "What did we talk about?" retrieves conversation summary

---

## Phase 6: User Story 4 (P4) - Advanced Task Operations

**Goal**: Support all Phase II task attributes (priorities, tags, due dates, recurrence) via natural language

**Story**: As an authenticated user, I want to manage all advanced task attributes through natural language to leverage all Phase II features without leaving chat.

**Independent Test**: "Create high-priority work task 'Daily standup' that recurs every weekday at 9 AM" → verify task created with priority=high, tag=work, due_date=next weekday 9 AM, recurrence_pattern=daily

### Backend: Enhanced MCP Tools

- [ ] T052 [US4] Update create_task MCP tool to accept and pass priority, tags[], due_date, is_recurring, recurrence_pattern to REST API
- [ ] T053 [US4] Update update_task MCP tool to support updating priority, tags[], due_date, recurrence settings
- [ ] T054 [US4] Update list_tasks and search_tasks MCP tools to support filtering by priority, tags, due_date_range
- [ ] T055 [US4] Enhance agent instructions to parse complex attribute specifications from natural language (e.g., "high priority task tagged urgent and work due Friday")

### Testing

- [ ] T056 [US4] Test complex task creation: Agent test "high priority task tagged urgent, work due end of day Friday" → verify all attributes set correctly
- [ ] T057 [US4] Test recurrence patterns: "recurring weekly task every Monday" → verify is_recurring=true, recurrence_pattern=weekly
- [ ] T058 [US4] Test complex queries: "Show personal tasks sorted by priority" → verify filter by tag + sort applied
- [ ] T059 [US4] E2E test: Manual - "Create high-priority work task 'Daily standup' recurring weekdays at 9 AM" → verify all attributes in DB

**Phase 6 Acceptance Criteria**:
- [ ] ✅ Can create tasks with priority, tags, due date, recurrence via one natural language command
- [ ] ✅ Can update task to add/change priority, tags, due dates
- [ ] ✅ Can filter and sort tasks via complex natural language queries
- [ ] ✅ Recurring tasks set up correctly with recurrence patterns
- [ ] ✅ Due date/time parsing works for various formats ("Friday 5 PM", "tomorrow at noon", "next Monday")

---

## Phase 7: User Story 5 (P5) - Streaming Responses with Agent Reasoning

**Goal**: Stream agent responses in real-time showing reasoning steps and tool calls

**Story**: As an authenticated user, I want to see chatbot responses stream in real-time with reasoning process for transparency and immediate feedback.

**Independent Test**: Issue complex command "Show high-priority tasks due this week and mark overdue ones complete" → watch response stream → verify reasoning steps displayed ("Searching... Found 5 tasks. Checking dates... 2 overdue. Marking complete...")

### Backend: Streaming Implementation

- [ ] T060 [US5] Update agent_runner.py to use Agents SDK Runner.run_stream() instead of Runner.run_sync()
- [ ] T061 [US5] Implement SSE event generator in backend/src/api/chat.py yielding events: message_start, content_delta, tool_call, tool_result, message_end, error
- [ ] T062 [US5] Format streaming events per SSE spec: `event: {type}\ndata: {json}\n\n` for each agent event
- [ ] T063 [US5] Update /api/chat endpoint to return StreamingResponse with media_type="text/event-stream"

### Frontend: Streaming UI

- [ ] T064 [US5] Verify ChatKit handles SSE streaming automatically via api.url configuration (no custom code needed)
- [ ] T065 [US5] Add loading/thinking indicator to ChatInterface when waiting for first content_delta event
- [ ] T066 [US5] Display tool call events in chat UI: "Calling create_task tool..." with tool name and args

### Testing

- [ ] T067 [US5] Test streaming events: Integration test - mock agent stream events → verify /api/chat yields correct SSE format
- [ ] T068 [US5] Test reasoning display: Agent test - complex query → verify content_delta events include reasoning steps
- [ ] T069 [US5] E2E test: Manual - "Show high-priority tasks and mark overdue ones complete" → watch response stream word-by-word → verify reasoning steps visible

**Phase 7 Acceptance Criteria**:
- [ ] ✅ Responses stream word-by-word rather than appearing all at once
- [ ] ✅ Multi-step operations show reasoning: "First, searching... Found 3 tasks. Now updating..."
- [ ] ✅ Tool calls displayed: "Calling search_tasks tool..." with arguments
- [ ] ✅ Long operations show interim updates rather than frozen UI
- [ ] ✅ Errors stream with reasoning: "I encountered an error... {explanation}"

---

## Phase 8: Polish & Cross-Cutting Concerns

**Goal**: Error handling, edge cases, performance, deployment, documentation

**Tasks**:

### Error Handling & Edge Cases

- [ ] T070 [P] Implement error handling in MCP tools: 401 → "Session expired", 404 → "Task not found", 400 → surface validation errors, 429 → "Too many requests"
- [ ] T071 [P] Add ambiguous intent clarification in agent instructions: "I'm not sure which task... Could you provide task ID?"
- [ ] T072 [P] Implement input validation/sanitization in /api/chat endpoint to prevent prompt injection
- [ ] T073 [P] Add rate limiting to /api/chat endpoint (per user_id): 100 requests/hour

### Performance & Monitoring

- [ ] T074 [P] Add OpenAI API retry logic with exponential backoff in agent_runner.py for transient failures
- [ ] T075 [P] Implement conversation history pagination: load last 20 messages, fetch older on demand
- [ ] T076 [P] Add performance logging: log response time for each MCP tool call and total agent response time
- [ ] T077 [P] Create /api/admin/token-usage endpoint to monitor OpenAI API usage and cost estimates

### Frontend Polish

- [ ] T078 [P] Add ChatButton floating action button in src/components/chat/ChatButton.tsx for quick access from any page
- [ ] T079 [P] Implement responsive design for chat interface: test on mobile (375px), tablet (768px), desktop (1440px)
- [ ] T080 [P] Add keyboard shortcuts: Ctrl+K to open chat, Escape to close, Enter to send message
- [ ] T081 [P] Add WCAG 2.1 AA accessibility: keyboard navigation, ARIA labels, screen reader support

### Testing & Quality

- [ ] T082 Frontend component tests: Jest tests for ChatInterface, ChatButton, ConversationHistory components
- [ ] T083 Contract tests: Validate MCP tool JSON schemas match expected inputSchema/outputSchema format
- [ ] T084 Performance tests: pytest backend/tests/performance/test_chat_latency.py verifying <2s streaming start, <500ms tool calls
- [ ] T085 Load test: Simulate 100 concurrent chat sessions and verify <20% latency increase

### Documentation & Deployment

- [ ] T086 Update README.md with AI chatbot section: how to access /chat, example natural language commands, troubleshooting
- [ ] T087 Create deployment checklist: environment variables for Vercel (NEXT_PUBLIC_CHATKIT_*) and Render (OPENAI_API_KEY)
- [ ] T088 Run Alembic migration on production database (Neon): `alembic upgrade head`
- [ ] T089 Manual smoke test on deployed app: https://your-app.vercel.app/chat → create task → verify in production DB

**Phase 8 Acceptance Criteria**:
- [ ] ✅ All error scenarios handled gracefully with helpful messages
- [ ] ✅ Performance meets targets: <2s streaming, <500ms tools, 100 concurrent sessions
- [ ] ✅ Accessibility guidelines met (WCAG 2.1 AA)
- [ ] ✅ Documentation complete and accurate
- [ ] ✅ Successfully deployed to production (Vercel + Render)

---

## Dependencies & Execution Order

### Critical Path (Sequential)

```
Phase 1 (Setup) → Phase 2 (Foundation) → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (US4) → Phase 7 (US5) → Phase 8 (Polish)
```

### User Story Dependencies

- **US1 (P1)**: No dependencies (can be implemented first - MVP)
- **US2 (P2)**: Depends on US1 (enhances agent, uses same MCP tools)
- **US3 (P3)**: Depends on US1 (adds context to existing conversation flow)
- **US4 (P4)**: Depends on US1 and Phase II advanced features (priorities, tags, recurrence)
- **US5 (P5)**: Depends on US1 (adds streaming to existing responses)

### Parallel Opportunities by Phase

**Phase 1**: T002, T003, T004, T005, T006 can all run in parallel

**Phase 2**: T009, T010 (models) parallel with T011 (auth helpers)

**Phase 3 (US1)**:
- T013-T019 (7 MCP tools) can be implemented in parallel after T012 (FastMCP server)
- T025-T029 (Frontend) can run parallel with T020-T024 (Backend) if API contract agreed

**Phase 4-7**: Within each phase, backend and frontend tasks can be parallelized

**Phase 8**: T070-T081 (most tasks) can run in parallel

---

## MVP Scope Recommendation

**Minimum Viable Product**: Phase 1 + Phase 2 + Phase 3 (US1 only)

**MVP Tasks**: T001-T033 (33 tasks)

**MVP Acceptance Criteria**:
- User can sign in and navigate to /chat page
- User can create tasks via natural language ("Add task to buy milk")
- User can list all tasks ("Show me my tasks")
- User can update tasks by ID ("Update task 5 to 'New title'")
- User can complete tasks ("Mark task 3 as done")
- User can delete tasks ("Delete task 7")
- Traditional UI still works (backward compatibility verified)

**Delivery Time Estimate**: 2-3 days for MVP (Phase 1-3)

---

## Format Validation

✅ **All tasks follow required checklist format**:
- Checkbox: `- [ ]` at start
- Task ID: Sequential T001-T089
- [P] marker: Included for parallelizable tasks (31 tasks)
- [Story] label: US1-US5 for user story phases (47 tasks)
- Description: Clear action with file path specified

✅ **Task Organization**:
- Phase 1: Setup (6 tasks)
- Phase 2: Foundation (6 tasks)
- Phase 3-7: User Stories (47 tasks total)
  - US1/P1: 21 tasks
  - US2/P2: 8 tasks
  - US3/P3: 10 tasks
  - US4/P4: 8 tasks
  - US5/P5: 10 tasks
- Phase 8: Polish (20 tasks)

✅ **Independent Testing**: Each user story phase has independent test criteria

✅ **Total**: 89 tasks ready for execution

---

## Execution

Ready to execute: `/sp.implement`

This will process tasks sequentially (T001 → T089), executing parallelizable tasks concurrently where possible, and validating acceptance criteria at each phase boundary.
