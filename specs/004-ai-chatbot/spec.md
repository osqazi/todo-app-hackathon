# Feature Specification: AI-Powered Todo Chatbot

**Feature Branch**: `004-ai-chatbot`
**Created**: 2026-01-02
**Status**: Draft
**Input**: User description: "Phase III: AI-Powered Todo Chatbot for 'The Evolution of Todo' Hackathon - Extend the existing Phase II full-stack web application (Next.js frontend deployed on Vercel + FastAPI backend deployed on Render + SQLModel + Neon DB + Better Auth JWT) by integrating a fully conversational AI chatbot interface that allows authenticated users to manage their entire Todo list (including any Intermediate/Advanced features already implemented) via natural language commands"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Basic Task Management via Chat (Priority: P1)

As an authenticated user, I want to add, view, update, and complete tasks through natural language conversation so that I can manage my todos without navigating the traditional UI.

**Why this priority**: Core chatbot functionality that delivers immediate value and proves the conversational interface works. This is the minimum viable chatbot feature that must work before any advanced capabilities.

**Independent Test**: Can be fully tested by opening the chat interface, typing "Add a task to buy groceries", verifying the task is created and listed in the chat response, then saying "Mark it as complete", and confirming the task status updates. Delivers standalone value without any other features.

**Acceptance Scenarios**:

1. **Given** I am logged in and open the chat interface, **When** I type "Create a task to finish the report", **Then** the chatbot creates a new task titled "finish the report" and responds with confirmation including the task ID
2. **Given** I have existing tasks, **When** I type "Show me all my tasks", **Then** the chatbot displays a formatted list of all my tasks with ID, title, status, and priority
3. **Given** I have a task with ID 5, **When** I type "Update task 5 to 'Complete quarterly report by Friday'", **Then** the chatbot updates the task title and confirms the change
4. **Given** I have a task with ID 3, **When** I type "Mark task 3 as done", **Then** the chatbot marks it complete and confirms the status change
5. **Given** I have a task with ID 7, **When** I type "Delete task 7", **Then** the chatbot removes the task and confirms deletion

---

### User Story 2 - Natural Language Understanding for Complex Commands (Priority: P2)

As an authenticated user, I want to express task operations in various natural ways (synonyms, different phrasings, multi-step commands) so that I can interact with the chatbot conversationally without learning specific command syntax.

**Why this priority**: Differentiates a true conversational AI from a simple command parser. Essential for user adoption and natural interaction, but depends on P1 working first.

**Independent Test**: Can be fully tested by issuing the same intent in multiple ways (e.g., "Add task X", "Create a new todo for X", "I need to remember to X") and verifying all variations produce the same result. Also test multi-step commands like "Add three tasks: review code, send email, schedule meeting" and verify all three are created.

**Acceptance Scenarios**:

1. **Given** I am in the chat, **When** I say "I need to buy milk tomorrow", **Then** the chatbot creates a task titled "buy milk" with a due date set to tomorrow
2. **Given** I have a task titled "Team meeting", **When** I say "Reschedule the team meeting to 3 PM next Monday", **Then** the chatbot updates the task's due date to next Monday at 3 PM and confirms
3. **Given** I say "Show all high priority work tasks due this week", **When** the chatbot processes this, **Then** it searches/filters tasks by priority=high, tags containing "work", and due date within the current week, displaying matching results
4. **Given** I type "Add three tasks: review PR #42, update documentation, deploy to staging", **When** the chatbot processes this, **Then** it creates three separate tasks with those titles and confirms all three
5. **Given** I say "What's on my plate today?", **When** the chatbot processes this informal query, **Then** it understands this as "show tasks due today" and displays them

---

### User Story 3 - Multi-Turn Conversation and Context Awareness (Priority: P3)

As an authenticated user, I want the chatbot to remember context from earlier in the conversation so that I can refer to previously mentioned tasks without repeating details.

**Why this priority**: Enables natural, flowing conversations and improves user experience significantly. Builds on P1 and P2 to create a truly conversational interface, but not critical for basic functionality.

**Independent Test**: Can be fully tested by creating a task in one message ("Add a task to review the design"), then in the next message saying "Set it to high priority" without specifying which task, and verifying the chatbot correctly updates the previously created task.

**Acceptance Scenarios**:

1. **Given** I just created a task and the chatbot responded with "Created task #12", **When** I immediately say "Make it high priority", **Then** the chatbot understands "it" refers to task #12 and updates its priority to high
2. **Given** I asked "Show my work tasks" and the chatbot listed 5 tasks, **When** I say "Mark the first one as complete", **Then** the chatbot identifies the first task from the previous response and marks it complete
3. **Given** I'm discussing task #8 across multiple messages, **When** I say "Also add a due date of Friday", **Then** the chatbot maintains context and adds the due date to task #8
4. **Given** I ask "What tasks are overdue?", **When** the chatbot lists them and I say "Delete all of them", **Then** the chatbot requests confirmation and deletes only the previously listed overdue tasks
5. **Given** I start a new chat session after logging out and back in, **When** I say "What did we talk about?", **Then** the chatbot retrieves conversation history from the database and provides a summary of recent interactions

---

### User Story 4 - Advanced Task Operations (Priorities, Tags, Dates, Recurrence) (Priority: P4)

As an authenticated user, I want to manage all advanced task attributes (priorities, tags, due dates, recurring patterns) through natural language so that I can leverage all Phase II features without leaving the chat interface.

**Why this priority**: Provides feature parity with the traditional UI for power users, but requires all Phase II features to be implemented and P1-P3 chatbot capabilities to work. Nice-to-have for comprehensive functionality.

**Independent Test**: Can be fully tested by saying "Create a high-priority work task 'Daily standup' that recurs every weekday at 9 AM", verifying the task is created with priority=high, tag=work, due_date=next weekday 9 AM, and recurrence_pattern=daily (weekdays only).

**Acceptance Scenarios**:

1. **Given** I am in the chat, **When** I say "Add a high priority task tagged 'urgent' and 'work' to submit expense report by end of day Friday", **Then** the chatbot creates a task with priority=high, tags=['urgent', 'work'], and due_date=this Friday 23:59
2. **Given** I have a task, **When** I say "Make this a recurring weekly task every Monday", **Then** the chatbot updates the task to recur weekly and sets the next occurrence for the upcoming Monday
3. **Given** I say "Show me all my personal tasks sorted by priority", **When** the chatbot processes this, **Then** it filters by tag='personal' and sorts by priority (high to low)
4. **Given** I type "Find all overdue high-priority work tasks", **When** the chatbot executes this, **Then** it applies filters for due_date < today, priority=high, tag=work and displays matching tasks
5. **Given** I have a recurring task, **When** I say "Stop the weekly report task from recurring after next month", **Then** the chatbot sets an end date on the recurrence pattern for one month from now

---

### User Story 5 - Streaming Responses with Agent Reasoning (Priority: P5)

As an authenticated user, I want to see the chatbot's responses stream in real-time, including its reasoning process for complex operations, so that I understand what it's doing and get immediate feedback.

**Why this priority**: Enhances user experience and trust by showing the agent's thinking, but is a UI polish feature that doesn't affect core functionality. Valuable for transparency but lowest priority.

**Independent Test**: Can be fully tested by issuing a complex command ("Show all high-priority tasks due this week and mark any overdue ones as complete"), watching the response stream in, and verifying the chatbot displays its reasoning steps (e.g., "Searching for high-priority tasks... Found 5 tasks. Checking due dates... 2 are overdue. Marking them complete...").

**Acceptance Scenarios**:

1. **Given** I ask a complex question, **When** the chatbot processes it, **Then** I see the response appear progressively word-by-word rather than all at once
2. **Given** I request a multi-step operation, **When** the chatbot executes it, **Then** the streaming response shows reasoning steps like "First, I'll search for tasks matching your criteria... Found 3 tasks. Now updating their priorities..."
3. **Given** the chatbot needs to call multiple tools, **When** it processes my request, **Then** the streamed response indicates which tools are being called (e.g., "Calling search_tasks tool... Calling update_task tool...")
4. **Given** an operation takes longer than 2 seconds, **When** the chatbot is processing, **Then** I see interim updates or a thinking indicator rather than a frozen interface
5. **Given** the chatbot encounters an error, **When** it streams the response, **Then** I see the reasoning that led to the error and a helpful explanation of what went wrong

---

### Edge Cases

- **Ambiguous Intent**: What happens when a user says "Show me the tasks" but has 500 tasks? The chatbot asks for clarification (e.g., "You have 500 tasks. Would you like to see tasks due this week, high-priority tasks, or all tasks?") rather than overwhelming the user
- **Unauthorized Access Attempt**: What happens if the chatbot tries to access another user's tasks? The MCP tools enforce JWT-based user isolation, and the chatbot never sees or accesses other users' data
- **Missing Task Reference**: What happens when a user says "Mark it as done" without prior context? The chatbot responds with "I'm not sure which task you're referring to. Could you provide the task ID or describe the task?"
- **Invalid Natural Language**: What happens when a user types nonsense or an irrelevant question like "What's the weather?" The chatbot responds politely: "I'm specialized in managing your todo list. I can help you add, view, update, or complete tasks. How can I assist with your tasks today?"
- **Rate Limiting / API Errors**: What happens if OpenAI API is down or rate-limited? The chatbot gracefully handles errors and displays: "I'm having trouble processing your request right now. Please try again in a moment or use the traditional task interface."
- **Long Conversation Memory**: What happens when a conversation spans 100+ messages? The system maintains a sliding window of recent context (last 20 messages) and stores full history in the database, allowing the chatbot to retrieve older context if needed
- **Concurrent Task Modifications**: What happens if a user modifies a task via the traditional UI while discussing it in chat? The chatbot always fetches fresh task data before operations, ensuring it works with the latest state
- **Multi-Language Input**: What happens if a user types in Urdu or another language? The chatbot responds in English explaining it currently only supports English natural language commands (multi-language is out of scope for Phase III)
- **Voice Input**: What happens if a user tries to use voice commands? The chat interface is text-only for Phase III (voice is a bonus feature out of scope)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a persistent chat interface accessible to authenticated users within the existing Next.js Todo web application
- **FR-002**: System MUST use OpenAI ChatKit (with domain key domain_pk_695744ba42d081938c10c399e8db7e0b062b49cd2f212200) for the frontend chat UI components
- **FR-003**: System MUST integrate OpenAI Agents SDK in the FastAPI backend to create an intelligent agent capable of understanding natural language task management intents
- **FR-004**: System MUST define MCP (Multi-Context Protocol) tools using the Official MCP SDK that expose all Todo operations (add, list, view, update, delete, complete/uncomplete, search, filter, sort, set priority, set tags, set due date, set recurrence)
- **FR-005**: All MCP tools MUST wrap/call the existing secure REST API endpoints (e.g., /api/{user_id}/tasks) and pass the authenticated user's JWT for authorization
- **FR-006**: System MUST enforce per-user task isolation - the chatbot agent can only access and modify tasks belonging to the authenticated user making the chat request
- **FR-007**: System MUST support multi-turn conversations with context awareness, storing conversation history in the database associated with the authenticated user
- **FR-008**: System MUST handle natural language variations for common task operations (add/create/new, show/list/view, update/edit/change, delete/remove, complete/done/finish, etc.)
- **FR-009**: System MUST stream agent responses to the frontend in real-time, displaying the agent's reasoning and thinking process where appropriate
- **FR-010**: System MUST handle complex, multi-criteria commands (e.g., "Show all high-priority work tasks due this week") by parsing intent and calling multiple MCP tools or passing compound filters
- **FR-011**: Chat interface MUST be responsive and accessible on both desktop and mobile devices
- **FR-012**: System MUST persist chat messages (user input and agent responses) in the database for conversation history and future retrieval
- **FR-013**: System MUST gracefully handle errors (API failures, ambiguous input, unauthorized access) and provide helpful user-facing error messages
- **FR-014**: System MUST not modify the existing database schema for tasks (unless explicitly required for chatbot-specific metadata like conversation sessions)
- **FR-015**: System MUST maintain backward compatibility with the existing traditional Todo UI - both interfaces operate on the same task data
- **FR-016**: Chatbot MUST support all Phase II advanced features (priorities, tags, due dates, recurrence, search/filter/sort) via natural language commands
- **FR-017**: System MUST request and handle browser notification permissions when users set due dates via chat (consistent with traditional UI behavior)
- **FR-018**: System MUST validate and sanitize all user inputs to prevent injection attacks or prompt manipulation
- **FR-019**: System MUST log all agent tool calls and user interactions for debugging, auditing, and improving the agent over time
- **FR-020**: System MUST allow users to clear conversation history or start a new conversation thread

### Non-Functional Requirements

- **NFR-001**: Chat responses MUST begin streaming within 2 seconds of user message submission for 95% of requests
- **NFR-002**: The chatbot MUST correctly interpret user intent with at least 90% accuracy for common task operations (add, list, update, complete, delete)
- **NFR-003**: The chat interface MUST load in under 3 seconds on a standard broadband connection
- **NFR-004**: The system MUST handle at least 100 concurrent chat sessions without performance degradation
- **NFR-005**: All MCP tool calls MUST enforce JWT authentication and reject unauthorized requests
- **NFR-006**: Conversation history MUST be stored securely and only accessible to the authenticated user who created it
- **NFR-007**: The chatbot MUST not expose or leak information about other users' tasks or conversations
- **NFR-008**: The system MUST be deployable on the existing infrastructure (Vercel for frontend, Render for backend) without requiring new services
- **NFR-009**: OpenAI API calls MUST include retry logic with exponential backoff for transient failures
- **NFR-010**: The chat interface MUST follow WCAG 2.1 Level AA accessibility guidelines for keyboard navigation and screen readers

### Key Entities

- **ChatConversation**: Represents a conversation session between a user and the chatbot
  - Attributes: conversation_id, user_id (references authenticated user), created_at, updated_at
  - Relationships: has many ChatMessages, belongs to one User

- **ChatMessage**: Represents a single message in a conversation (user input or agent response)
  - Attributes: message_id, conversation_id, role (user/agent/system), content (text), created_at, tool_calls (JSON array of MCP tools called), metadata (JSON for streaming state, reasoning steps, etc.)
  - Relationships: belongs to one ChatConversation

- **User** (existing entity): Authenticated user with JWT token
  - New relationship: has many ChatConversations

- **Task** (existing entity): Todo task with all Phase II attributes
  - No schema changes required - chatbot operates on existing task data via API

### MCP Tool Definitions

The following MCP tools MUST be implemented using the Official MCP SDK to enable the chatbot agent to manage tasks:

1. **create_task**
   - Description: Creates a new task for the authenticated user
   - Parameters: title (required string), description (optional string), priority (optional enum: high/medium/low), tags (optional string array), due_date (optional ISO datetime), is_recurring (optional boolean), recurrence_pattern (optional enum: daily/weekly/monthly)
   - Returns: Task object with ID and all attributes
   - Authorization: Requires valid JWT; creates task for authenticated user only

2. **list_tasks**
   - Description: Retrieves all tasks for the authenticated user with optional filters
   - Parameters: status (optional: pending/completed), priority (optional), tags (optional string array), due_date_range (optional: start_date, end_date), limit (optional int, default 50), offset (optional int, default 0)
   - Returns: Array of Task objects matching filters
   - Authorization: Requires valid JWT; returns only authenticated user's tasks

3. **get_task**
   - Description: Retrieves a single task by ID for the authenticated user
   - Parameters: task_id (required integer)
   - Returns: Task object if found and belongs to user
   - Authorization: Requires valid JWT; fails if task doesn't belong to authenticated user

4. **update_task**
   - Description: Updates an existing task for the authenticated user
   - Parameters: task_id (required integer), title (optional string), description (optional string), priority (optional), tags (optional string array), due_date (optional), is_recurring (optional), recurrence_pattern (optional)
   - Returns: Updated Task object
   - Authorization: Requires valid JWT; fails if task doesn't belong to authenticated user

5. **delete_task**
   - Description: Deletes a task by ID for the authenticated user
   - Parameters: task_id (required integer)
   - Returns: Success confirmation
   - Authorization: Requires valid JWT; fails if task doesn't belong to authenticated user

6. **toggle_task_completion**
   - Description: Marks a task as complete or incomplete
   - Parameters: task_id (required integer), completed (required boolean)
   - Returns: Updated Task object
   - Authorization: Requires valid JWT; fails if task doesn't belong to authenticated user

7. **search_tasks**
   - Description: Searches tasks by keyword across title and description
   - Parameters: query (required string), filters (optional: status, priority, tags, due_date_range), sort_by (optional: due_date/priority/alphabetical), sort_order (optional: asc/desc), limit (optional int, default 50)
   - Returns: Array of matching Task objects
   - Authorization: Requires valid JWT; searches only authenticated user's tasks

Each tool MUST:
- Validate the JWT token and extract the authenticated user_id
- Call the existing REST API endpoint (e.g., POST /api/{user_id}/tasks) with proper authorization headers
- Handle API errors gracefully and return structured error responses
- Log the tool call for auditing and debugging

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Authenticated users can successfully add a new task via natural language chat command in under 10 seconds (from typing to confirmation)
- **SC-002**: The chatbot correctly interprets and executes at least 90% of common task operations (add, list, view, update, delete, complete) in standardized test scenarios
- **SC-003**: Multi-turn conversations maintain context accurately for at least 5 consecutive messages without losing reference to previously mentioned tasks
- **SC-004**: Chat responses begin streaming within 2 seconds for 95% of requests under normal load conditions
- **SC-005**: Complex commands involving multiple criteria (e.g., "Show high-priority work tasks due this week") execute successfully and return correct results in under 5 seconds
- **SC-006**: The chat interface loads and becomes interactive in under 3 seconds on a standard broadband connection
- **SC-007**: The system handles at least 100 concurrent chat sessions without errors or performance degradation (response time increase < 20%)
- **SC-008**: Zero unauthorized access incidents - all MCP tool calls correctly enforce user isolation and no user can access another user's tasks via chat
- **SC-009**: User satisfaction score of at least 4/5 when surveyed about the chatbot's ease of use and accuracy (measured via optional in-app feedback)
- **SC-010**: The chatbot successfully handles at least 95% of edge cases (ambiguous input, missing context, errors) with helpful error messages rather than crashes
- **SC-011**: Conversation history is correctly persisted and retrievable across sessions for 100% of users
- **SC-012**: The chat interface meets WCAG 2.1 Level AA accessibility standards for keyboard navigation and screen reader compatibility
- **SC-013**: Feature parity with traditional UI - all task operations available in the traditional interface can be performed via natural language chat (95% coverage for Phase II features)
- **SC-014**: The implementation is deployable on existing infrastructure (Vercel + Render) without requiring additional cloud services or significant cost increases (< 20% infrastructure cost increase)

## Assumptions

- OpenAI ChatKit, OpenAI Agents SDK, and Official MCP SDK are compatible with the existing Next.js 16+ and FastAPI tech stack
- The Chatkit Domain Key (domain_pk_695744ba42d081938c10c399e8db7e0b062b49cd2f212200) is valid and correctly configured
- The existing FastAPI backend can be extended to run an OpenAI agent with MCP tools without major refactoring
- OpenAI API usage costs are acceptable for the expected user volume and conversation length (assumption: < $100/month for demo/hackathon usage)
- All Phase II features (priorities, tags, due dates, recurrence, search/filter/sort) are already implemented and accessible via the existing REST API
- The existing REST API endpoints follow the pattern /api/{user_id}/tasks and accept JWT bearer tokens for authentication
- Browser notification permissions work the same via chat as via the traditional UI (no additional permission handling required)
- Users have access to modern browsers that support WebSockets or Server-Sent Events for streaming responses
- The database (Neon Serverless PostgreSQL) can handle additional tables/columns for chat conversations and messages without schema migration issues

## Dependencies

- **External Services**:
  - OpenAI API (for ChatKit frontend components and Agents SDK backend agent)
  - Existing Neon Serverless PostgreSQL database (for conversation/message persistence)
  - Existing Better Auth JWT authentication service

- **Internal Dependencies**:
  - Phase II REST API must be fully functional and secured with JWT authentication
  - All Phase II advanced features (priorities, tags, due dates, recurrence, search/filter/sort) must be implemented
  - Existing Next.js frontend must support adding new routes/components for the chat interface
  - Existing FastAPI backend must support adding new endpoints for chat message handling and agent execution

- **Technical Dependencies**:
  - OpenAI ChatKit library (frontend)
  - OpenAI Agents SDK (backend)
  - Official MCP SDK (backend tool definitions)
  - Database migration capability for new ChatConversation and ChatMessage tables (using Alembic or equivalent)

## Out of Scope

- **Phase IV/V Features**: Kubernetes deployment, Docker containerization, Helm charts, cloud-native blueprints
- **Event-Driven Architecture**: Kafka, Dapr, or other event streaming platforms
- **Advanced AI Features**: Custom subagents, multi-agent orchestration, reusable intelligence modules
- **Multi-Language Support**: Natural language understanding in languages other than English (e.g., Urdu)
- **Voice Commands**: Speech-to-text or voice-activated task management
- **Standalone Chatbot**: The chatbot is integrated into the existing Todo app, not a separate standalone application
- **Manual Coding**: All implementation must be spec-driven and generated by Claude Code following these specifications
- **Major Database Schema Changes**: No restructuring of existing Task table or user authentication schema
- **Third-Party Integrations**: No integration with external calendars, email, Slack, etc.
- **Advanced Analytics**: No task analytics, productivity dashboards, or AI-powered insights beyond basic task management

## Constraints

- **Technology Stack**: MUST use OpenAI ChatKit (frontend), OpenAI Agents SDK (backend), Official MCP SDK (tool definitions)
- **Infrastructure**: MUST deploy on existing Vercel (frontend) and Render (backend) without requiring new cloud services
- **Authentication**: MUST use existing Better Auth JWT tokens; no separate authentication for chatbot
- **Data Isolation**: MUST enforce per-user task isolation at all layers (frontend, backend, MCP tools, API calls)
- **API Integration**: MCP tools MUST call existing REST API endpoints rather than directly accessing the database
- **Schema Stability**: MUST NOT modify existing Task table schema or authentication tables (new tables for chat are allowed)
- **Backward Compatibility**: Traditional Todo UI MUST continue to work unchanged; both UIs share the same task data
- **Security**: MUST validate and sanitize all user inputs to prevent prompt injection, SQL injection, or other attacks
- **Streaming**: MUST support real-time streaming of agent responses using Server-Sent Events or WebSockets
- **Responsiveness**: Chat interface MUST work on mobile devices with screen widths down to 320px
- **Cost**: OpenAI API usage MUST stay within reasonable limits for a hackathon demo (assumed < $100/month)

## Configuration Requirements

- **ChatKit Domain Key**: domain_pk_695744ba42d081938c10c399e8db7e0b062b49cd2f212200 (from CDK.txt)
- **Environment Variables** (to be added):
  - OPENAI_API_KEY (for OpenAI Agents SDK and ChatKit)
  - MCP_SERVER_URL (base URL for MCP tool server if separate from main backend)
  - CHATBOT_MAX_CONVERSATION_HISTORY (default: 20 messages)
  - CHATBOT_STREAMING_ENABLED (default: true)
  - CHATBOT_DEBUG_MODE (default: false for production, true for development)

## References and Documentation

### OpenAI ChatKit

- **React Package**: `@openai/chatkit-react`
- **Core Package**: `@openai/chatkit` (for vanilla JS/web components)
- **Installation**: `npm install @openai/chatkit-react`
- **Documentation**: https://openai.github.io/chatkit-js/
- **Quickstart**: https://github.com/openai/chatkit-js
- **Key Features**:
  - Domain key authentication via `api.domainKey` configuration
  - Built-in response streaming
  - React hooks (`useChatKit`) for state management
  - Customizable theme, header, composer, and UI components
  - Conversation history persistence

### OpenAI Agents SDK

- **Package Name**: `openai-agents`
- **Installation**: `pip install openai-agents`
- **Documentation**: https://openai.github.io/openai-agents-python/
- **Repository**: https://github.com/openai/openai-agents-python
- **Key Features**:
  - `Agent` class for creating conversational agents
  - `Runner` for synchronous and asynchronous execution
  - `@function_tool` decorator for defining callable tools
  - Built-in tracing and debugging capabilities
  - Support for handoffs, guardrails, and sessions
  - Compatible with OpenAI API and other LLM providers

### Model Context Protocol (MCP) SDK

- **Package Name**: `mcp`
- **Installation**: `pip install mcp`
- **Documentation**: https://modelcontextprotocol.io
- **Repository**: https://github.com/modelcontextprotocol/python-sdk
- **Standard**: This is Anthropic's Model Context Protocol for standardized LLM context exchange
- **Key Features**:
  - `FastMCP` class for rapid server creation
  - `@mcp.tool()` decorator for defining tools
  - `@mcp.resource()` decorator for exposing resources
  - `@mcp.prompt()` decorator for prompt templates
  - Support for stdio and HTTP transports
  - Structured input/output validation with JSON schemas
  - Integration with FastAPI and other Python web frameworks

## Next Steps

After specification approval, proceed to:

1. **/sp.plan** - Create detailed architecture and implementation plan covering:
   - Frontend: OpenAI ChatKit integration, chat UI component structure, streaming response handling
   - Backend: OpenAI Agents SDK setup, MCP tool definitions with Official MCP SDK, FastAPI endpoint for chat
   - Database: ChatConversation and ChatMessage table schemas and migrations
   - Security: JWT validation in MCP tools, user isolation enforcement, input sanitization
   - Testing: Example conversations, tool call validation, end-to-end flows
3. **/sp.tasks** - Generate ordered, testable implementation tasks
4. **/sp.implement** - Execute implementation following the task list
