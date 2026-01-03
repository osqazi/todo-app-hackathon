---
id: 0002
title: AI Chatbot Architecture and Implementation Plan
stage: plan
date: 2026-01-02
surface: agent
model: claude-sonnet-4-5-20250929
feature: 004-ai-chatbot
branch: 004-ai-chatbot
user: user
command: /sp.plan
labels: ["plan", "architecture", "ai-chatbot", "phase-iii", "openai-chatkit", "openai-agents", "mcp-sdk", "decision-records"]
links:
  spec: ../../../specs/004-ai-chatbot/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/004-ai-chatbot/plan.md
 - specs/004-ai-chatbot/research.md
 - specs/004-ai-chatbot/data-model.md
 - specs/004-ai-chatbot/quickstart.md
 - CLAUDE.md (updated with AI technologies)
tests:
 - (none - planning phase)
---

## Prompt

Phase III: AI-Powered Todo Chatbot – Architecture and Design Planning

Create comprehensive architecture extension plan for adding fully conversational AI chatbot to existing Phase II web application. Generate:
- Updated high-level architecture showing AI components (ChatKit UI, Agents SDK, MCP tools)
- Component breakdown and data flow diagrams
- Architectural decisions with rationale for 7 key areas
- Database schema for conversation persistence
- API contracts for MCP tools and chat endpoint
- Testing strategy and development quickstart guide

Requirements:
- Build on existing Next.js (Vercel) + FastAPI (Render) + SQLModel + Neon DB + Better Auth JWT stack
- Use exact Phase III technologies: OpenAI ChatKit, OpenAI Agents SDK, Official MCP SDK
- MCP tools must wrap existing REST API endpoints with JWT auth
- ChatKit domain key: domain_pk_695744ba42d081938c10c399e8db7e0b062b49cd2f212200
- Maintain per-user task isolation and backward compatibility

Decisions requiring documentation:
1. Chat interface integration strategy (dedicated page vs sidebar/modal)
2. MCP tool granularity (7 granular vs 2 abstract tools)
3. Authentication flow (JWT pass-through vs re-authentication)
4. Streaming implementation (SSE vs WebSocket)
5. Context management (Agents SDK vs database persistence)
6. Agent-API bridge pattern (direct REST calls vs service layer)
7. Error handling strategy (retry vs immediate feedback)

## Response snapshot

Created comprehensive Phase III architecture and implementation plan with complete Phase 0 research and Phase 1 design artifacts:

**plan.md** (Main Implementation Plan):
- Summary: AI chatbot extending existing Todo app with OpenAI ChatKit + Agents SDK + MCP tools
- Technical Context: TypeScript 5+ frontend, Python 3.13+ backend, 7 MCP tools, 2 new DB tables
- Constitution Check: ✅ ALL PASS (9/9 checks) - No violations detected
- Project Structure: Web application with AI extensions (`/chat` page, `/agents` and `/mcp` backend modules)
- Complexity Tracking: No violations - additive-only architecture extension

**research.md** (Phase 0 - Architecture Decisions):
Documented 7 critical architectural decisions with full rationale, alternatives considered, tradeoffs, and implementation patterns:

1. **Chat Interface**: Dedicated `/chat` page (vs sidebar/modal)
   - Rationale: Clear UX separation, mobile-friendly, full immersion, future extensibility
   - Pattern: Full-page Next.js route with optional floating button access

2. **MCP Tool Granularity**: 7 granular tools (vs 2 abstract)
   - Rationale: Spec alignment, agent precision, error isolation, clear contracts, REST API mapping
   - Tools: create_task, list_tasks, get_task, update_task, delete_task, toggle_task_completion, search_tasks

3. **Authentication**: JWT pass-through (vs re-authentication)
   - Rationale: Simplicity, security, existing Better Auth reuse, no duplication
   - Flow: Frontend JWT → /api/chat validates → Agent context → MCP tools → REST API calls

4. **Streaming**: Server-Sent Events with Agents SDK (vs WebSocket)
   - Rationale: ChatKit native support, HTTP/1.1 compatible, simpler than WebSocket
   - Pattern: FastAPI StreamingResponse with Agents SDK Runner.run_stream()

5. **Context Management**: Hybrid (Agents SDK + Database)
   - Rationale: In-conversation efficiency + long-term persistence
   - Strategy: Active session in memory, write to DB on each message, load history on resume

6. **Agent-API Bridge**: Direct REST API calls via httpx (vs service layer)
   - Rationale: Reuse existing validation, consistent behavior, no code duplication
   - Pattern: MCP tools call existing REST endpoints with JWT header

7. **Error Handling**: Immediate user feedback (vs automatic retry)
   - Rationale: Transparency, user control, avoid loops, faster feedback
   - Pattern: Surface helpful error messages; no silent retries

**data-model.md** (Phase 1 - Database Schema):
- **ChatConversation** table: conversation_id (PK), user_id (FK), created_at, updated_at
- **ChatMessage** table: message_id (PK), conversation_id (FK), role (ENUM: user/agent/system), content (TEXT), tool_calls (JSONB), metadata (JSONB), created_at
- Indexes: Composite indexes for performance (user_id + created_at, conversation_id + created_at), GIN index on tool_calls JSONB
- Migration: Alembic migration script `004_add_chat_tables.py` with proper up/down, trigger for updating conversation.updated_at
- Relationships: User 1→∞ ChatConversation 1→∞ ChatMessage (cascade delete)

**quickstart.md** (Phase 1 - Development Guide):
- Prerequisites: OpenAI API key, ChatKit domain key, Phase II app running
- Backend setup: Install openai-agents + mcp, configure env vars, run migration, start server
- Frontend setup: Install @openai/chatkit-react, configure domain key, start dev server
- Testing checklist: 15 manual test scenarios (P1-P5 user stories + edge cases)
- Automated tests: pytest (backend), Jest (frontend), Playwright (E2E)
- Development workflows: Adding MCP tools, debugging agent, monitoring API usage
- Troubleshooting: 5 common issues with solutions
- Performance benchmarks: Expected latencies for chat/tools/DB queries
- Deployment: Render (backend) and Vercel (frontend) steps

**CLAUDE.md Updated**:
- Active Technologies: Added @openai/chatkit-react, openai-agents, mcp
- Recent Changes: Documented AI chatbot additions
- Implementation Details: Architecture layers, key files, running instructions

**Architectural Decisions Summary**:
All 7 decisions finalized with clear implementation patterns. No open questions blocking implementation. Design supports:
- Natural language task management via conversational UI
- Secure per-user isolation via JWT propagation
- Real-time streaming responses with agent reasoning
- Long-term conversation persistence
- Backward compatibility with traditional Todo UI
- Future extensibility (voice, multi-language, offline mode noted for Phase IV)

## Outcome

- ✅ Impact: Complete Phase III architecture plan ready for immediate task generation and implementation. All architectural uncertainties resolved with documented decisions.
- 🧪 Tests: Testing strategy defined (unit/integration/E2E). Manual test checklist with 15 scenarios. Performance benchmarks specified.
- 📁 Files: Created 4 planning artifacts (plan.md, research.md, data-model.md, quickstart.md) + updated CLAUDE.md
- 🔁 Next prompts: `/sp.tasks` to generate ordered implementation tasks, then `/sp.implement` to execute
- 🧠 Reflection: Comprehensive planning phase covered all architectural decisions before coding. Research phase (7 decisions) critical for avoiding implementation rework. Database schema designed for performance (composite indexes) and future analytics (JSONB tool_calls tracking). Hybrid context management balances real-time UX with long-term persistence requirements.

## Evaluation notes (flywheel)

- Failure modes observed: None - planning completed systematically with full Phase 0 research and Phase 1 design
- Graders run and results (PASS/FAIL): Constitution Check - ALL PASS (9/9 checks), No violations, No complexity justifications needed
- Prompt variant (if applicable): Standard /sp.plan workflow with Phase 0 (research) and Phase 1 (data model + contracts + quickstart)
- Next experiment (smallest change to try): Future plans could benefit from earlier Context7 lookup for library-specific patterns (e.g., ChatKit streaming best practices, Agents SDK session management) during research phase rather than assuming from documentation
