# Implementation Plan: AI-Powered Todo Chatbot

**Branch**: `004-ai-chatbot` | **Date**: 2026-01-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-ai-chatbot/spec.md`

## Summary

Add a fully conversational AI chatbot interface to the existing Todo web application, enabling authenticated users to manage their entire task list via natural language commands. The chatbot integrates OpenAI ChatKit (frontend UI), OpenAI Agents SDK (backend agent orchestration), and Model Context Protocol (MCP) SDK (tool definitions) to provide secure, context-aware, streaming conversations that wrap existing REST API endpoints.

**Technical Approach**: Extend Next.js frontend with ChatKit React component at `/chat` page, add FastAPI `/api/chat` endpoint hosting an OpenAI Agent with 7 MCP tools that securely call existing authenticated REST APIs via JWT pass-through, persist conversation history in new `chat_conversations` and `chat_messages` PostgreSQL tables, and stream agent responses with reasoning steps back to the user using Server-Sent Events.

## Technical Context

**Language/Version**:
- Frontend: TypeScript 5+ (Next.js 16 App Router, React 19)
- Backend: Python 3.13+ (FastAPI, async/await)

**Primary Dependencies**:
- Frontend: `@openai/chatkit-react@latest`, Tailwind CSS, React hooks
- Backend: `openai-agents@latest`, `mcp@latest`, FastAPI, SQLModel, Pydantic v2, httpx (for REST API calls)
- Database: Neon Serverless PostgreSQL 15+, Alembic migrations
- Auth: Better Auth with JWT (existing)

**Storage**:
- Existing: Neon PostgreSQL (tasks, users, sessions, auth tables)
- New: `chat_conversations` table (conversation metadata)
- New: `chat_messages` table (user/agent messages with tool call tracking)
- Indexes: user_id, conversation_id, created_at for performance

**Testing**:
- Backend Unit: pytest for MCP tool functions, agent intent mocking
- Backend Integration: pytest with test database for full conversation flows
- Frontend Unit: Jest + React Testing Library for ChatKit component
- E2E: Playwright for user → chat → task update → verification flows
- Manual: Natural language variety testing, edge case handling

**Target Platform**:
- Frontend Deployment: Vercel (existing Next.js deployment)
- Backend Deployment: Render (existing FastAPI deployment)
- Production: ChatKit domain key (domain_pk_695744ba42d081938c10c399e8db7e0b062b49cd2f212200)
- Development: Local domain key for testing

**Project Type**: Web application (full-stack AI extension)

**Performance Goals**:
- Chat response streaming starts <2 seconds (p95)
- Individual MCP tool calls complete <500ms
- Support 100 concurrent chat sessions
- Agent intent recognition >90% accuracy for common CRUD operations
- Database queries <100ms for conversation history retrieval

**Constraints**:
- MUST use exact Phase III tech stack (ChatKit, Agents SDK, MCP SDK)
- NO modifications to existing Task table schema
- NO changes to existing REST API endpoint signatures
- Maintain strict per-user task isolation via JWT propagation through all layers
- ChatKit domain key binding for production security
- Backward compatibility: traditional Todo UI must work unchanged
- OpenAI API cost <$100/month for demo usage

**Scale/Scope**:
- 5 prioritized user stories (P1: Basic chat, P2: NLU, P3: Context, P4: Advanced features, P5: Streaming)
- 7 MCP tool definitions (create/list/get/update/delete/toggle/search tasks)
- 20 functional requirements + 10 non-functional requirements
- 2 new database tables with 4 total indexes
- Estimated ~3500 LOC (frontend: 800, backend: 1500, tests: 1200)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Full-Stack Architecture
- **Status**: PASS
- **Alignment**: Extends existing Next.js 16 + FastAPI + SQLModel + Neon architecture with new AI components
- **Details**: ChatKit integrates cleanly into Next.js App Router at `/chat`; Agent/MCP server runs as FastAPI module; maintains clean separation of concerns (UI → API → Agent → Tools → REST API)

### ✅ Spec-Driven Development
- **Status**: PASS
- **Alignment**: Following `/sp.specify` → `/sp.plan` → `/sp.tasks` → `/sp.implement` workflow
- **Details**: Spec complete and validated (all checklist items pass); this is plan phase; tasks and implementation follow strict spec-driven approach

### ✅ Database Integrity & Migrations
- **Status**: PASS
- **Alignment**: New tables use Alembic migrations with proper rollback support
- **Details**: Migration `004_add_chat_tables.py` creates `chat_conversations` and `chat_messages` tables; no changes to existing Task/User schemas; additive-only (backward compatible)

### ✅ API-First Design
- **Status**: PASS with Extension
- **Alignment**: MCP tool JSON schemas define contracts before implementation; tools wrap existing REST API
- **Details**: MCP tool `inputSchema` and `outputSchema` serve as API contracts; Pydantic validation maintained for `/api/chat` endpoint; existing REST API contracts unchanged

### ✅ Comprehensive Error Handling
- **Status**: PASS
- **Alignment**: Agent error handling, MCP tool failure recovery, user-friendly error messages in chat
- **Details**: Graceful degradation on OpenAI API errors; ambiguous intent clarification responses; rate limit handling with retry; tool call errors surfaced to user with helpful explanations

### Backend Stack Compliance
- **Status**: PASS with Additions
- **Existing**: Python 3.13+, FastAPI, SQLModel, Pydantic v2, Alembic, Better Auth JWT, Neon PostgreSQL
- **New Dependencies**: `openai-agents` (OpenAI Agents SDK), `mcp` (Model Context Protocol SDK), `httpx` (for internal REST API calls)
- **Justification**: Required for Phase III conversational AI; extends existing FastAPI stack without replacing core components

### Frontend Stack Compliance
- **Status**: PASS with Additions
- **Existing**: TypeScript 5+, Next.js 16 App Router, React 19, Tailwind CSS, react-datepicker
- **New Dependencies**: `@openai/chatkit-react` (ChatKit React components and hooks)
- **Justification**: Required for Phase III chat UI; integrates seamlessly with existing Next.js 16 + React 19 stack

### Database Compliance
- **Status**: PASS
- **Changes**: Add 2 new tables (`chat_conversations`, `chat_messages`) with proper indexes
- **PostgreSQL Features**: Uses ENUM for message role, JSONB for tool_calls/metadata, GIN index for tool_calls if needed
- **Migration Strategy**: Alembic migration; backward-compatible; existing functionality unaffected; proper foreign keys and cascade rules

### Success Criteria Alignment
- **Functional**: All 20 FR requirements mapped to implementation components (ChatKit UI, Agent, MCP tools, API endpoint, database persistence)
- **Performance**: Chat streaming <2s, tool calls <500ms, 100 concurrent sessions, >90% intent accuracy
- **Quality**: Unit tests for MCP tools, integration tests for conversation flows, E2E tests for full user journeys, manual edge case testing

**Overall Gate Result**: ✅ **PASS** - All constitution principles align with Phase III AI chatbot extension. No violations. Complexity justified by spec requirements.

## Project Structure

### Documentation (this feature)

```text
specs/004-ai-chatbot/
├── spec.md              # Feature specification (✅ complete)
├── plan.md              # This file (/sp.plan output)
├── research.md          # Phase 0: Architecture decisions (generated below)
├── data-model.md        # Phase 1: Database schemas (generated below)
├── contracts/           # Phase 1: API contracts (generated below)
│   ├── mcp-tools.json   # MCP tool JSON schemas (OpenAPI-style)
│   └── chat-api.yaml    # /api/chat endpoint OpenAPI spec
├── quickstart.md        # Phase 1: Dev setup guide (generated below)
├── checklists/          # Quality validation
│   └── requirements.md  # Specification checklist (✅ complete)
└── tasks.md             # Phase 2: /sp.tasks output (NOT created by /sp.plan)
```

### Source Code (repository root)

```text
# Frontend (Next.js 16 App Router + TypeScript)
src/
├── app/
│   ├── chat/
│   │   └── page.tsx                    # NEW: Chat interface page (ChatKit integration)
│   ├── api/
│   │   └── chatkit/
│   │       └── route.ts                # NEW: Proxy endpoint for ChatKit → FastAPI
│   ├── layout.tsx                      # MODIFY: Add "Chat" link to navigation
│   └── globals.css                     # EXISTING: Tailwind styles (no changes)
│
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx           # NEW: ChatKit React wrapper component
│   │   ├── ChatButton.tsx              # NEW: Floating chat button (sidebar access option)
│   │   └── ConversationHistory.tsx     # NEW: Conversation history sidebar
│   ├── tasks/                          # EXISTING: Task list components (no changes)
│   └── ui/                             # EXISTING: Shared UI components (no changes)
│
├── lib/
│   ├── chatkit-config.ts               # NEW: ChatKit initialization + domain key
│   ├── api.ts                          # EXISTING: API client (no changes)
│   └── auth.ts                         # EXISTING: Better Auth integration (no changes)
│
└── types/
    └── chat.ts                         # NEW: TypeScript types for ChatMessage, Conversation

# Backend (FastAPI + Python)
backend/
├── src/
│   ├── models/
│   │   ├── task.py                     # EXISTING: Task model (no changes)
│   │   ├── user.py                     # EXISTING: User model (no changes)
│   │   ├── chat_conversation.py        # NEW: ChatConversation SQLModel
│   │   └── chat_message.py             # NEW: ChatMessage SQLModel
│   │
│   ├── agents/
│   │   ├── __init__.py                 # NEW: Agents module
│   │   ├── todo_agent.py               # NEW: OpenAI Agent config (instructions, tools)
│   │   └── agent_runner.py             # NEW: Agent execution with streaming (Runner)
│   │
│   ├── mcp/
│   │   ├── __init__.py                 # NEW: MCP module
│   │   ├── tools.py                    # NEW: MCP tool definitions (@mcp.tool decorators)
│   │   ├── server.py                   # NEW: FastMCP server initialization
│   │   └── auth.py                     # NEW: JWT extraction/validation for tool auth
│   │
│   ├── api/
│   │   ├── tasks.py                    # EXISTING: Task REST endpoints (no changes)
│   │   ├── auth.py                     # EXISTING: Auth endpoints (no changes)
│   │   └── chat.py                     # NEW: /api/chat endpoint (agent + streaming)
│   │
│   ├── services/
│   │   ├── task_service.py             # EXISTING: Task business logic (no changes)
│   │   └── conversation_service.py     # NEW: Conversation/message persistence
│   │
│   ├── schemas/
│   │   ├── task.py                     # EXISTING: Pydantic schemas (no changes)
│   │   └── chat.py                     # NEW: ChatRequest, ChatResponse Pydantic schemas
│   │
│   ├── database.py                     # EXISTING: DB connection (no changes)
│   ├── config.py                       # MODIFY: Add OPENAI_API_KEY, CHATBOT_* env vars
│   └── main.py                         # MODIFY: Register /api/chat router
│
├── alembic/
│   ├── versions/
│   │   ├── 001_initial.py              # EXISTING: Initial tables
│   │   ├── 002_better_auth.py          # EXISTING: Auth tables
│   │   ├── 003_intermediate_features.py# EXISTING: Phase II features
│   │   └── 004_add_chat_tables.py      # NEW: ChatConversation + ChatMessage tables
│   └── env.py                          # EXISTING: Alembic config (no changes)
│
└── tests/
    ├── unit/
    │   ├── test_tasks.py               # EXISTING: Task tests (no changes)
    │   ├── test_mcp_tools.py           # NEW: MCP tool unit tests (mock REST API)
    │   └── test_agent.py               # NEW: Agent intent recognition tests
    ├── integration/
    │   ├── test_task_api.py            # EXISTING: Task API tests (no changes)
    │   └── test_chat_flow.py           # NEW: E2E conversation flow tests
    └── contract/
        └── test_mcp_schemas.py         # NEW: MCP tool schema validation tests

# Configuration
.env.local                               # ADD: OPENAI_API_KEY, CHATBOT_DEBUG_MODE
.env.production                          # ADD: Production ChatKit domain key binding
backend/.env                             # ADD: Backend env vars
```

**Structure Decision**:
- Chosen **Web application** structure (Option 2 from template) with AI-specific extensions
- Frontend: `/chat` page + ChatKit components in `src/components/chat/`
- Backend: New `/agents` and `/mcp` modules alongside existing `/api`, `/models`, `/services`
- Database: Alembic migration `004_add_chat_tables.py` for additive schema changes
- Tests: Parallel structure for AI components (unit/integration/contract)
- Configuration: Environment variables for OpenAI API key and ChatKit domain key

**Rationale**: This maintains existing architecture while cleanly isolating AI-specific code. Backend follows existing pattern (models/services/api separation). Frontend follows Next.js App Router conventions. Database migrations are backward-compatible.

## Complexity Tracking

> **No violations detected** - All constitution checks passed.

| Check | Status | Details |
|-------|--------|---------|
| Full-Stack Architecture | ✅ PASS | Clean separation: ChatKit UI → FastAPI endpoint → Agent → MCP tools → REST API |
| Spec-Driven Development | ✅ PASS | Following standard workflow; spec complete before planning |
| Database Integrity | ✅ PASS | Additive-only migrations; proper foreign keys; rollback support |
| API-First Design | ✅ PASS | MCP tool JSON schemas as contracts; /api/chat OpenAPI spec |
| Error Handling | ✅ PASS | Agent/tool/API error handling; user-friendly messages; retry logic |
| Backend Stack | ✅ PASS | Extends with openai-agents + mcp; maintains FastAPI core |
| Frontend Stack | ✅ PASS | Extends with @openai/chatkit-react; maintains Next.js 16 + React 19 |
| Database Compliance | ✅ PASS | PostgreSQL ENUM/JSONB/GIN; proper indexes; Alembic migrations |
| Success Criteria | ✅ PASS | All FR/NFR mapped; performance targets defined; testing strategy complete |

**No complexity justifications required** - Feature adds new capabilities without violating existing principles.

---

## Phase 0: Research & Architecture Decisions

**Goal**: Document all architectural decisions with rationale, alternatives considered, and implementation patterns.

**Output**: `research.md` (generated below)
