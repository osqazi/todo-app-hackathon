---
id: 0003
title: Intermediate Advanced Features Task Breakdown
stage: tasks
date: 2025-12-30
surface: agent
model: claude-sonnet-4-5-20250929
feature: 003-intermediate-advanced-features
branch: 003-intermediate-advanced-features
user: Admin
command: /sp.tasks
labels: ["tasks", "implementation", "user-stories", "priorities", "tags", "search", "filter", "sort", "recurring-tasks", "due-dates", "notifications"]
links:
  spec: specs/003-intermediate-advanced-features/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-intermediate-advanced-features/tasks.md
tests:
  - Task format validation (PASS - all 79 tasks follow checklist format)
  - User story organization validation (PASS - tasks organized by 5 user stories)
  - Dependency graph validation (PASS - clear dependency paths identified)
---

## Prompt

Generate actionable task breakdown for Intermediate and Advanced Todo Features based on:
- spec.md (5 user stories with priorities P1-P5)
- plan.md (10 milestones, tech stack, architecture)
- data-model.md (8 new Task fields, 3 enums, 4 indexes)
- contracts/api-endpoints.md (8 API endpoints, TypeScript models)
- research.md (7 technology decisions)

Organize tasks by user story to enable independent implementation and testing. Each user story should be fully testable in isolation.

## Response snapshot

Generated comprehensive task breakdown with 79 tasks organized into 8 phases:

**Phase 1: Setup (4 tasks)**
- Install Alembic, initialize configuration
- Install react-datepicker
- Configure database connection

**Phase 2: Foundational (6 tasks)**
- Create TaskPriority and RecurrencePattern enums
- Extend Task model with 8 new fields
- Generate and apply Alembic migration
- Verify schema changes

**Phase 3: User Story 1 - Priorities & Tags (17 tasks)**
- Backend: Pydantic schemas with validation (tags: max 10, format validation, priority enum)
- Backend: Extend POST/PATCH /tasks endpoints
- Frontend: PrioritySelector, TagInput components with styles
- Frontend: Integrate into create/edit forms and task list display
- Independent test: Create task with priority="high", tags=["work", "urgent"]

**Phase 4: User Story 2 - Search/Filter/Sort (14 tasks)**
- Backend: Add search (ILIKE), filters (status, priority, tags, dates), sort query params to GET /tasks
- Backend: Dynamic query building, NULL-safe sorting, pagination metadata
- Frontend: SearchBar (300ms debounce), TaskFilters, SortSelector components
- Frontend: Integrate filters with state management, display result counts
- Independent test: Search + filter + sort with 20 tasks

**Phase 5: User Story 3 - Due Dates & Reminders (15 tasks)**
- Backend: Add due_date to schemas and endpoints, notification_sent reset logic
- Backend: GET /due (5-min window), POST /notification-sent endpoints
- Frontend: DateTimePicker component, add to forms
- Frontend: useNotificationPolling hook (60s interval), permission request, Notification API
- Independent test: Set due date to +2 minutes, verify notification fires

**Phase 6: User Story 4 - Recurring Tasks (12 tasks)**
- Backend: Recurrence fields in schemas, calculate_next_due_date(), complete_task() service
- Backend: POST /complete endpoint returns next_instance
- Frontend: RecurrenceConfig component, integrate into forms
- Frontend: Update mark complete flow to show next instance
- Independent test: Complete daily task, verify tomorrow's instance created

**Phase 7: User Story 5 - Multi-Criteria Discovery (7 tasks)**
- Frontend: URL state persistence for filters/sort (bookmarkable)
- Frontend: Combined search + filter + sort UI refinement
- Frontend: Visual feedback for active filters
- Independent test: Apply 3+ criteria, bookmark URL, verify state persists

**Phase 8: Polish (4 tasks)**
- Verify indexes, test query performance (500-task dataset)
- Update documentation, create deployment checklist

**Task Organization**:
- All 79 tasks follow strict checklist format: `- [ ] [T###] [Markers] Description with file path`
- 25 tasks marked [P] for parallel execution
- All story tasks labeled [US1] through [US5]
- Dependencies clearly documented with graph

**MVP Scope**: User Story 1 (P1) only - Priorities & Tags (17 tasks, ~2-3 days)

## Outcome

- ✅ Impact: Created actionable 79-task implementation plan organized by 5 user stories, enabling independent testing and incremental delivery. MVP scope identified (US1 - 17 tasks). 25 parallel execution opportunities flagged.
- 🧪 Tests: Task format validation PASS (all follow checklist), user story organization validation PASS (clear US labels), dependency graph validation PASS (Setup → Foundational → US1/US3 → US2/US4 → US5 → Polish)
- 📁 Files: tasks.md created with 8 phases, dependency graph, parallel execution examples, MVP definition
- 🔁 Next prompts: Begin implementation with Phase 1 (Setup), then Phase 2 (Foundational), then US1 (MVP). Test each story independently before proceeding.
- 🧠 Reflection: Task breakdown successfully organized by user story rather than technical layer, enabling true independent testing and incremental delivery. Each user story has clear acceptance criteria and independent test scenario. Parallel opportunities identified within each story (e.g., frontend components can be built simultaneously). Critical path identified: Setup → Foundational → US1 → US2 → US5. US3 can start immediately after Foundational (doesn't depend on US1). US4 requires both US1 and US3. Task format strictly enforced with checkboxes, IDs, story labels, and file paths for LLM executability.

## Evaluation notes (flywheel)

- Failure modes observed: None - task generation completed successfully with proper organization and validation
- Graders run and results (PASS/FAIL): Task format validation PASS, User story organization PASS, Dependency graph PASS
- Prompt variant (if applicable): Standard /sp.tasks workflow with user-story-centric organization
- Next experiment (smallest change to try): Consider adding estimated time ranges for each user story to help with sprint planning (e.g., US1: 2-3 days, US2: 2-3 days, US3: 3-4 days, US4: 2-3 days, US5: 1-2 days)
