---
id: 0002
title: Intermediate Advanced Features Architecture Plan
stage: plan
date: 2025-12-30
surface: agent
model: claude-sonnet-4-5-20250929
feature: 003-intermediate-advanced-features
branch: 003-intermediate-advanced-features
user: Admin
command: /sp.plan
labels: ["planning", "architecture", "database-design", "api-design", "alembic", "postgresql", "enums", "arrays", "recurring-tasks", "notifications", "search-filter-sort"]
links:
  spec: specs/003-intermediate-advanced-features/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-intermediate-advanced-features/plan.md
  - specs/003-intermediate-advanced-features/research.md
  - specs/003-intermediate-advanced-features/data-model.md
  - specs/003-intermediate-advanced-features/quickstart.md
  - specs/003-intermediate-advanced-features/contracts/api-endpoints.md
  - CLAUDE.md (agent context updated)
tests:
  - Constitution check (PASS)
  - Post-design constitution re-check (PASS)
---

## Prompt

Phase II - Part 2: Intermediate and Advanced Level Features – Architecture and Design Planning for "The Evolution of Todo" Full-Stack Todo App

Target audience: Claude Code (via Spec-Kit Plus /sp.plan) acting as lead system architect for spec-driven development
Focus: Generate a comprehensive architecture extension plan, high-level design decisions, and implementation roadmap for adding all Intermediate Level (Priorities & Tags/Categories, Search & Filter, Sort Tasks) and Advanced Level (Recurring Tasks, Due Dates & Time Reminders) features to the existing Phase II full-stack web application

Create:
- Updated high-level architecture diagram/description showing new components (e.g., recurrence engine, notification handler, advanced query layer)
- Extended monorepo structure with new/updated specification files
- Component breakdown extensions: Database schema updates, Backend query enhancements, Frontend new UI components
- Data flow sketches: Task creation → persistence → auto-generation → browser notification triggering
- Sequence diagrams or flow descriptions for key new operations
- Section structure recommendations for new specification files

Decisions needing documentation:
- Priority & Tags modeling: Enum vs string; Array vs separate join table
- Search & Filter implementation: Full-text search vs LIKE queries; Client-side vs server-side filtering
- Sort mechanism: Server-side vs client-side
- Recurring tasks logic: Pre-generate vs on-the-fly generation
- Due date reminders: Browser Notification API with polling vs Service Worker
- Database migrations: SQLModel native vs Alembic
- UI library choices: Pure React vs lightweight components

Testing strategy: Unit tests, integration tests, validation checks, manual testing checklist
Technical details: Build on Phase II stack (Next.js 16+, FastAPI, SQLModel, Neon DB, Better Auth JWT)

## Response snapshot

Generated comprehensive architecture and design plan with 5 design artifacts:

**Phase 0: Research (research.md)**
- 7 major technology decisions documented with rationale:
  1. Priority as PostgreSQL ENUM, Tags as ARRAY with GIN index
  2. ILIKE queries for search, server-side filtering
  3. Server-side sorting with client caching
  4. Lazy recurring task generation on completion
  5. Browser Notification API with 60s foreground polling
  6. Alembic for production-grade migrations
  7. react-datepicker + custom tag/priority components

**Phase 1: Data Model Design (data-model.md)**
- Extended Task model with 8 new fields
- 3 enums (TaskPriority, RecurrencePattern, TaskStatus)
- 4 database indexes (composite, GIN, B-tree)
- 15 field validation rules
- State transition diagrams for task completion and recurrence
- Alembic migration strategy with backward compatibility

**Phase 1: API Contracts (contracts/api-endpoints.md)**
- Extended GET /tasks with 11 query parameters (search, filters, sort)
- Extended POST/PATCH /tasks with 7 new request fields
- 3 new endpoints: GET /due, POST /notification-sent, GET /tags
- TypeScript request/response models
- Comprehensive error handling specifications

**Phase 1: Implementation Guide (quickstart.md)**
- Step-by-step implementation sequence (3 phases)
- Code examples for all components
- Testing checklist (unit, integration, manual)
- Deployment steps with smoke tests
- Common issues & solutions table

**Implementation Plan (plan.md)**
- 10 milestones with dependencies and deliverables
- Constitution check (PASS) + post-design re-check (PASS)
- Testing strategy across all layers
- Deployment checklist with validation steps
- Risk analysis with mitigation strategies
- Success metrics (functional, performance, quality, UX)

## Outcome

- ✅ Impact: Created production-ready architecture plan for extending Todo app with 8 database fields, 11 API query parameters, 7 frontend components, covering priorities, tags, search/filter/sort, recurring tasks, and due date notifications
- 🧪 Tests: Constitution gates passed (pre-Phase 0, post-Phase 1). Test strategy defined for unit tests (recurrence logic, validators), integration tests (search/filter/sort, recurring flow), and manual tests (notifications, responsive UI)
- 📁 Files: 5 design artifacts created (plan.md, research.md, data-model.md, quickstart.md, api-endpoints.md), agent context updated
- 🔁 Next prompts: `/sp.tasks` to generate actionable task breakdown, then implement following 10-milestone roadmap
- 🧠 Reflection: Architecture plan successfully balances comprehensive feature coverage with pragmatic technology choices. All decisions prioritize simplicity at current scale (100-500 tasks/user), backward compatibility with Phase II, and production-readiness. PostgreSQL ARRAY/ENUM types, Alembic migrations, and server-side filtering chosen over more complex alternatives. Browser Notification API with foreground polling avoids Service Worker complexity. Ready for task generation and implementation.

## Evaluation notes (flywheel)

- Failure modes observed: None - planning completed successfully with all design artifacts generated and constitution checks passed
- Graders run and results (PASS/FAIL): Constitution check (pre-Phase 0) - PASS, Constitution re-check (post-Phase 1) - PASS
- Prompt variant (if applicable): Standard /sp.plan workflow with comprehensive architecture planning prompt
- Next experiment (smallest change to try): Consider creating visual architecture diagrams (Mermaid/C4) for complex data flows in future planning sessions to enhance clarity for recurring task generation and notification polling sequences
