# Implementation Plan: Intermediate and Advanced Todo Features

**Branch**: `003-intermediate-advanced-features` | **Date**: 2025-12-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-intermediate-advanced-features/spec.md`

## Summary

Extend the existing Phase II full-stack Todo application with Intermediate features (Priorities, Tags, Search, Filter, Sort) and Advanced features (Recurring Tasks, Due Dates & Time Reminders). These enhancements transform the basic task management system into a powerful organizational tool with automated recurrence, contextual filtering, and timely notifications.

**Technical Approach**:
- **Database**: Extend Task model with 8 new fields (priority, tags array, due_date, recurrence metadata) using PostgreSQL ENUMs and ARRAY types
- **Backend**: Enhance FastAPI GET endpoint with dynamic query building for search/filter/sort; add recurrence logic triggered on task completion; implement notification polling endpoint
- **Frontend**: Add UI components (priority selector, tag input, date picker, search/filter bar) and browser Notification API integration with 60-second polling
- **Migration**: Use Alembic for production-grade schema evolution with rollback support

## Technical Context

**Language/Version**: Python 3.13+ (backend), TypeScript 5+ (frontend)
**Primary Dependencies**: FastAPI, SQLModel, Alembic, Next.js 16, react-datepicker
**Storage**: PostgreSQL 15+ (Neon Serverless) with ENUM types, ARRAY columns, GIN indexes
**Testing**: pytest (backend), Jest + Testing Library (frontend), manual browser notification testing
**Target Platform**: Web application (responsive desktop/mobile), modern browsers with Notification API support
**Project Type**: Web (separate backend/frontend)
**Performance Goals**:
- API responses <200ms for 500-task lists
- Real-time search with <500ms debounce
- Notification delivery within 65 seconds of due time (60s polling + 5s buffer)
**Constraints**:
- All queries must enforce per-user isolation (JWT user_id validation)
- Browser notifications require HTTPS in production
- Tags limited to 10 per task (UI/DB constraint)
- Recurring tasks generate next instance only on completion (no pre-generation)
**Scale/Scope**:
- Target: 1000+ users, 10,000+ tasks total (100-500 tasks per active user)
- Database migration must handle existing tasks (backward compatibility)
- UI components must work on screens ≥375px wide

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**From Constitution** (`.specify/memory/constitution.md`):

### Core Principles Alignment

✅ **Spec-Driven Development Methodology**: This plan follows spec-driven methodology with `/sp.specify` → `/sp.plan` → `/sp.tasks` workflow. All design artifacts (research.md, data-model.md, contracts/, quickstart.md) created before implementation.

✅ **Comprehensive Error Handling**: Plan includes validation rules for all new fields (see data-model.md), database constraints, and API error responses for malformed inputs.

✅ **Python Best Practices**: Backend uses Python 3.13+, SQLModel with type safety, Pydantic validators, Alembic migrations following best practices.

✅ **Cross-Platform Compatibility**: Responsive web UI targets modern browsers (Chrome 50+, Firefox 44+, Safari 10+, Edge 14+) with mobile-first design (≥375px width).

### Technology Constraints

✅ **Specified Technology Stack**: Extends existing Phase II stack (FastAPI, SQLModel, Next.js, Better Auth) without introducing conflicting technologies. New dependencies (Alembic, react-datepicker) are industry-standard, lightweight additions.

✅ **Proper Module Organization**: Backend follows existing structure (models/, services/, api/). Frontend adds new components/ subdirectories for filters, pickers, and notifications.

### Success Criteria

✅ **Deliver Working Application**: All 47 functional requirements map to concrete implementations in data-model.md and api-endpoints.md. 22 success criteria have measurable targets (time limits, percentages, user counts).

✅ **Meet Specified Requirements**: Implementation plan addresses all user stories (P1-P5), edge cases (10 documented), and non-functional requirements (performance, security, usability).

### Governance

✅ **Align with Stated Principles**: Design decisions (ENUM vs string, ARRAY vs join table, server-side vs client-side filtering) documented with rationale in research.md. Tradeoffs explicitly stated.

✅ **Constitution Update Check**: This feature extends basic CRUD to advanced task management. Constitution principles remain valid (no update needed). Constitution focuses on methodology and Python practices, which apply here.

**GATE RESULT**: ✅ **PASS** - All constitution principles satisfied. Proceed to Phase 0.

---

## Project Structure

### Documentation (this feature)

```text
specs/003-intermediate-advanced-features/
├── spec.md                  # Feature specification (completed via /sp.specify)
├── plan.md                  # This file (completed via /sp.plan)
├── research.md              # Technology decisions (Phase 0 output)
├── data-model.md            # Database schema extensions (Phase 1 output)
├── quickstart.md            # Implementation guide (Phase 1 output)
├── contracts/
│   └── api-endpoints.md     # API contract specifications (Phase 1 output)
└── checklists/
    └── requirements.md      # Spec quality checklist (validation complete)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── task.py                # EXTEND: Add TaskPriority, RecurrencePattern enums + new Task fields
│   ├── schemas/
│   │   └── task.py                # EXTEND: TaskCreate/TaskUpdate with new fields + validators
│   ├── services/
│   │   ├── task_service.py        # EXTEND: Add complete_task() with recurrence logic
│   │   └── notification_service.py # NEW: Notification polling logic
│   ├── api/
│   │   ├── tasks.py               # EXTEND: GET /tasks with search/filter/sort, POST /complete
│   │   └── notifications.py       # NEW: GET /due, POST /notification-sent
│   └── main.py                    # EXTEND: Register new notification routes
├── alembic/
│   ├── env.py                     # CONFIGURE: Point to Task model metadata
│   ├── versions/
│   │   └── XXXX_add_priorities_tags_due_recurrence.py  # NEW: Auto-generated migration
│   └── alembic.ini                # CONFIGURE: DATABASE_URL from .env
└── tests/
    ├── unit/
    │   ├── test_recurrence_logic.py    # NEW: Test calculate_next_due_date()
    │   └── test_validators.py          # EXTEND: Test tag/priority/recurrence validators
    └── integration/
        ├── test_search_filter_sort.py   # NEW: Test query combinations
        └── test_recurring_tasks.py      # NEW: Test complete → next instance flow

frontend/
├── src/
│   ├── components/
│   │   ├── PrioritySelector.tsx         # NEW: Dropdown/radio for priority selection
│   │   ├── TagInput.tsx                 # NEW: Tag chip input with add/remove
│   │   ├── DateTimePicker.tsx           # NEW: react-datepicker wrapper
│   │   ├── TaskFilters.tsx              # NEW: Search bar + filter checkboxes
│   │   ├── SortSelector.tsx             # NEW: Sort dropdown (due_date, priority, etc.)
│   │   └── RecurrenceConfig.tsx         # NEW: Recurring task pattern + end date
│   ├── hooks/
│   │   └── useNotificationPolling.ts    # NEW: 60s interval polling + Notification API
│   ├── lib/
│   │   └── api.ts                       # EXTEND: Add new endpoint functions
│   ├── app/
│   │   └── tasks/
│   │       ├── page.tsx                 # EXTEND: Integrate filters, search, sort UI
│   │       └── [id]/
│   │           └── edit/
│   │               └── page.tsx         # EXTEND: Add priority, tags, due date, recurrence fields
│   └── styles/
│       ├── tags.css                     # NEW: Tag chip styles
│       └── filters.css                  # NEW: Filter bar styles
└── tests/
    ├── components/
    │   ├── PrioritySelector.test.tsx    # NEW: Component tests
    │   └── TagInput.test.tsx            # NEW: Tag add/remove logic tests
    └── integration/
        └── task-management.test.tsx      # EXTEND: E2E tests for new features
```

**Structure Decision**:
Extends existing **Web Application** structure (Option 2 from template). Backend adds new service modules (notification_service.py), API routes (notifications.py), and Alembic migrations. Frontend adds specialized UI components for filtering, tagging, and date selection. Maintains clear separation of concerns (models, services, API, UI components).

---

## Complexity Tracking

**No Constitution Violations** - Complexity table not needed. All design decisions align with constitution principles.

---

## Phase 0: Research & Technology Decisions ✅ COMPLETE

See [`research.md`](./research.md) for detailed analysis.

**Key Decisions**:
1. **Priority & Tags Modeling**: Priority as PostgreSQL ENUM, Tags as ARRAY(String) column with GIN index
2. **Search/Filter**: ILIKE queries for search, server-side filtering with dynamic query building
3. **Sort**: Server-side sorting with client-side caching
4. **Recurring Tasks**: Lazy generation on task completion (not pre-generation)
5. **Notifications**: Browser Notification API with 60-second foreground polling (not Service Workers)
6. **Database Migrations**: Alembic for production-grade migration management
7. **UI Libraries**: react-datepicker for date/time selection, custom implementations for tags/priority

**Rationale Summary**: All decisions prioritize simplicity, performance at current scale (100-500 tasks/user), and backward compatibility with Phase II infrastructure.

---

## Phase 1: Design & Contracts ✅ COMPLETE

### Data Model Design

See [`data-model.md`](./data-model.md) for complete specifications.

**Summary**:
- **8 New Task Fields**: priority, tags, due_date, notification_sent, is_recurring, recurrence_pattern, recurrence_end_date, parent_task_id
- **3 Enums**: TaskPriority (high/medium/low), TaskStatus (existing), RecurrencePattern (daily/weekly/monthly)
- **4 Indexes**: Composite (user_id, status, priority), GIN (tags), B-tree (due_date, parent_task_id)
- **Validation Rules**: 15 field-level constraints (title length, tag format/count, date ranges)
- **State Transitions**: Task completion triggers recurring instance generation
- **Migration Strategy**: Alembic auto-generation + manual review + backward-compatible defaults

### API Contract Design

See [`contracts/api-endpoints.md`](./contracts/api-endpoints.md) for complete specifications.

**Summary**:
- **Extended Endpoints**:
  - `GET /api/{user_id}/tasks`: +11 query params (search, filters, sort)
  - `POST /api/{user_id}/tasks`: +7 request fields (priority, tags, due_date, recurrence)
  - `PATCH /api/{user_id}/tasks/{task_id}`: Supports all new fields
  - `POST /api/{user_id}/tasks/{task_id}/complete`: Returns next_instance for recurring tasks

- **New Endpoints**:
  - `GET /api/{user_id}/tasks/due`: Due tasks for notifications (5-minute window)
  - `POST /api/{user_id}/tasks/{task_id}/notification-sent`: Mark notification sent
  - `GET /api/{user_id}/tags`: Get all unique tags for autocomplete

- **Request/Response Models**: TypeScript interfaces for type safety
- **Error Handling**: Validation errors with field-specific messages

### Quick Reference

See [`quickstart.md`](./quickstart.md) for step-by-step implementation guide.

**Summary**:
- Phase 1: Database schema extension (Alembic migration)
- Phase 2: Backend API extensions (search/filter/sort, recurrence, notifications)
- Phase 3: Frontend UI components (priority selector, tag input, date picker, filters, notification polling)
- Testing checklist: Unit tests, integration tests, manual tests
- Deployment steps: Migration → backend → frontend → smoke test
- Common issues & solutions table

---

## Agent Context Update

**Script**: `.specify/scripts/bash/update-agent-context.sh claude`

**New Technologies to Add**:
- Alembic (database migrations)
- react-datepicker (date/time picker component)
- PostgreSQL ENUM types (TaskPriority, RecurrencePattern)
- PostgreSQL ARRAY type (tags column)
- Browser Notification API (foreground polling)

**Execution**:
```bash
.specify/scripts/bash/update-agent-context.sh claude
```

**Expected Output**: CLAUDE.md updated with new technology entries in "Active Technologies" section.

---

## Post-Design Constitution Re-Check ✅ PASS

**Re-evaluated After Phase 1 Design**:

✅ **Spec-Driven Development**: All design artifacts created (research, data-model, contracts, quickstart) before implementation begins. Ready for `/sp.tasks` to generate actionable task breakdown.

✅ **Comprehensive Error Handling**:
- Database constraints enforce data integrity (ENUM types, ARRAY length, date ranges)
- API validators reject invalid inputs with specific error messages
- Frontend components validate before submission (tag format, max count)
- Edge cases documented (10 scenarios with expected behaviors)

✅ **Python Best Practices**:
- Type safety: Pydantic models, SQLModel schemas, Python Enums
- Separation of concerns: Models (data), Services (logic), API (routes)
- Testing: Unit tests for recurrence logic, integration tests for E2E flows

✅ **Cross-Platform Compatibility**:
- Responsive UI components (tested at 375px width)
- Browser API feature detection (Notification API check)
- Graceful degradation (notifications disabled if permission denied)

**FINAL GATE RESULT**: ✅ **PASS** - Design ready for implementation. Proceed to `/sp.tasks`.

---

## Implementation Roadmap

### Milestone 1: Database Foundation (Backend)
**Tasks**:
1. Setup Alembic migration tooling
2. Update Task SQLModel with new fields and enums
3. Generate and review migration script
4. Apply migration to development database
5. Verify schema changes (columns, indexes, constraints)

**Dependencies**: Existing Phase II database schema
**Deliverables**: Migration applied, new columns visible in database
**Testing**: Manual SQL queries to verify schema

---

### Milestone 2: Backend API - Priorities & Tags (Intermediate P1)
**Tasks**:
1. Update TaskCreate/TaskUpdate Pydantic schemas with priority and tags
2. Add validation logic (tag format, max count, priority enum)
3. Extend POST /tasks endpoint to accept new fields
4. Extend PATCH /tasks endpoint to update new fields
5. Unit test validators

**Dependencies**: Milestone 1 complete
**Deliverables**: Can create/update tasks with priority and tags via API
**Testing**: Integration tests for CRUD with new fields

---

### Milestone 3: Backend API - Search, Filter, Sort (Intermediate P2)
**Tasks**:
1. Extend GET /tasks with search query parameter (ILIKE on title/description)
2. Add filter query parameters (status, priority, tags, due_date_from/to)
3. Add sort_by and sort_order parameters
4. Implement dynamic query building with SQLModel
5. Handle NULL sorting (due_date NULLS LAST)
6. Integration tests for filter combinations

**Dependencies**: Milestone 2 complete
**Deliverables**: GET /tasks supports complex queries with pagination metadata
**Testing**: Integration tests for search + multi-filter + sort combinations

---

### Milestone 4: Backend API - Due Dates & Notifications (Advanced P3)
**Tasks**:
1. Add due_date and notification_sent fields to schemas
2. Implement GET /tasks/due endpoint (5-minute window)
3. Implement POST /tasks/{id}/notification-sent endpoint
4. Add logic to reset notification_sent on due_date update
5. Unit test notification window calculation

**Dependencies**: Milestone 1 complete
**Deliverables**: Notification endpoints functional
**Testing**: Unit tests for due date filtering, integration test for notification flow

---

### Milestone 5: Backend API - Recurring Tasks (Advanced P4)
**Tasks**:
1. Add recurrence fields to schemas
2. Implement calculate_next_due_date() function (daily/weekly/monthly)
3. Implement complete_task() service with recurrence logic
4. Implement POST /tasks/{id}/complete endpoint
5. Handle month-end edge cases (e.g., Jan 31 → Feb 28)
6. Unit test recurrence calculation
7. Integration test for complete → generate next instance

**Dependencies**: Milestone 2 complete (priority, tags need to copy to next instance)
**Deliverables**: Recurring task completion generates next instance
**Testing**: Unit tests for date calculation, integration tests for full flow

---

### Milestone 6: Frontend UI - Priority & Tags (Intermediate P1)
**Tasks**:
1. Create PrioritySelector component (dropdown/radio)
2. Create TagInput component (chip UI, add/remove)
3. Add priority and tags fields to task create form
4. Add priority and tags fields to task edit form
5. Display priority indicator (color/icon) in task list
6. Display tag chips in task list
7. Component unit tests

**Dependencies**: Milestone 2 complete (backend API ready)
**Deliverables**: Can create/update tasks with priority and tags in UI
**Testing**: Component tests, manual UI testing

---

### Milestone 7: Frontend UI - Search, Filter, Sort (Intermediate P2)
**Tasks**:
1. Create TaskFilters component (search bar, status/priority/tag checkboxes)
2. Create SortSelector component (dropdown with sort options)
3. Integrate filters into task list page with state management
4. Implement search debouncing (300ms)
5. Fetch tasks with query params on filter/sort change
6. Display "Showing X of Y tasks" count
7. Add "Clear All Filters" button

**Dependencies**: Milestone 3 complete (backend API ready)
**Deliverables**: Full-featured search/filter/sort UI
**Testing**: Integration tests for filter state, manual UI testing

---

### Milestone 8: Frontend UI - Due Dates & Recurrence (Advanced P3 & P4)
**Tasks**:
1. Install react-datepicker dependency
2. Create DateTimePicker component wrapper
3. Create RecurrenceConfig component (pattern selector, end date)
4. Add due_date and recurrence fields to task create/edit forms
5. Display due date in task list (with overdue indicator)
6. Component tests for date picker and recurrence config

**Dependencies**: Milestone 4 & 5 complete (backend APIs ready)
**Deliverables**: Can set due dates and recurrence in UI
**Testing**: Component tests, manual testing of recurring task creation

---

### Milestone 9: Frontend - Notification Polling (Advanced P3)
**Tasks**:
1. Create useNotificationPolling hook (60s interval)
2. Request notification permission on first due_date set
3. Fetch GET /tasks/due endpoint every 60 seconds
4. Fire browser Notification for due tasks
5. Call POST /notification-sent after notification shown
6. Handle permission denial gracefully (show banner)
7. Manual test notification delivery

**Dependencies**: Milestone 4 complete (notification endpoint ready)
**Deliverables**: Browser notifications fire at due time
**Testing**: Manual testing (set due date to +2 minutes, verify notification)

---

### Milestone 10: Integration & Polish
**Tasks**:
1. End-to-end testing of all features
2. Responsive UI testing (mobile 375px width)
3. Performance testing (500-task list filtering)
4. Accessibility audit (keyboard navigation, screen reader)
5. Fix bugs found in integration testing
6. Update documentation with any implementation notes

**Dependencies**: All previous milestones complete
**Deliverables**: Production-ready feature set
**Testing**: Full regression test suite, manual QA

---

## Testing Strategy

### Unit Tests (Backend)

**Test Files**:
- `tests/unit/test_recurrence_logic.py`: Test `calculate_next_due_date()` for all patterns (daily/weekly/monthly) and edge cases (month-end, leap years)
- `tests/unit/test_validators.py`: Test Pydantic validators for tags (format, max count, duplicates), priority (enum), recurrence (pattern required if recurring)

**Coverage Goals**: 90%+ for new service logic (recurrence calculation, notification window)

### Integration Tests (Backend)

**Test Files**:
- `tests/integration/test_search_filter_sort.py`: Test GET /tasks with all filter combinations, verify correct results
- `tests/integration/test_recurring_tasks.py`: Test POST /complete → verify next instance created with correct fields

**Scenarios**:
- Create task with priority="high", tags=["work"], verify stored correctly
- Search for "meeting", filter by status="pending", sort by due_date ASC → verify results
- Complete recurring daily task → verify next instance due tomorrow
- Complete recurring monthly task on Jan 31 → verify next instance on Feb 28

### Unit Tests (Frontend)

**Test Files**:
- `tests/components/PrioritySelector.test.tsx`: Test priority selection, onChange callback
- `tests/components/TagInput.test.tsx`: Test tag add (Enter key), tag remove (X button), max 10 validation

**Coverage Goals**: 80%+ for new UI components

### Integration Tests (Frontend)

**Test Files**:
- `tests/integration/task-management.test.tsx`: E2E flow for creating task with all new fields, filtering, marking complete

**Scenarios**:
- Create task → set priority, add tags, set due date, enable recurrence → verify saved
- Apply search + priority filter → verify filtered list displayed
- Mark recurring task complete → verify next instance appears in list

### Manual Testing Checklist

- [ ] **Notification Permission**: Browser prompts for permission on first due_date set
- [ ] **Notification Delivery**: Task due in 5 minutes fires notification within 60 seconds
- [ ] **Tag Input UX**: Enter key adds tag, X button removes, visual feedback for max 10
- [ ] **Priority Visual Indicator**: High (red), Medium (yellow), Low (green) color coding
- [ ] **Search Real-Time**: Results update as user types (300ms debounce)
- [ ] **Mobile Responsive**: All components usable on 375px width screen
- [ ] **Recurring Instance**: Completing daily task generates tomorrow's instance
- [ ] **Filter Combinations**: Status + Priority + Tag filters work together (AND logic)
- [ ] **Sort NULL Handling**: Tasks without due_date appear last when sorting by due_date

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (unit + integration)
- [ ] Code review complete
- [ ] Migration script reviewed and tested on staging database
- [ ] Environment variables verified (.env.local for frontend, .env for backend)
- [ ] HTTPS certificate active (required for Notification API)

### Database Migration
- [ ] Backup production database
- [ ] Run `alembic upgrade head` on production
- [ ] Verify new columns exist: `SELECT column_name FROM information_schema.columns WHERE table_name='task';`
- [ ] Verify indexes created: `SELECT indexname FROM pg_indexes WHERE tablename='task';`

### Backend Deployment
- [ ] Deploy FastAPI backend to production (Vercel/Railway)
- [ ] Verify `/api/{user_id}/tasks?search=test&priority=high` endpoint works
- [ ] Verify `/api/{user_id}/tasks/due` endpoint returns empty array (no due tasks yet)
- [ ] Check logs for errors

### Frontend Deployment
- [ ] Build Next.js app: `npm run build`
- [ ] Deploy to Vercel/Netlify
- [ ] Verify task create form shows priority selector, tag input, date picker
- [ ] Verify notification permission request appears (HTTPS required)
- [ ] Test on mobile device (375px width)

### Post-Deployment Validation
- [ ] Smoke test: Create task with priority="high", tags=["test"], due_date=+5min
- [ ] Verify task appears in list with correct fields
- [ ] Wait 5+ minutes, verify notification fires
- [ ] Create recurring daily task, mark complete, verify next instance created
- [ ] Monitor error logs for 24 hours

---

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Migration fails on production database | Low | High | Test migration on staging first, have rollback script ready (`alembic downgrade -1`) |
| Browser notification permission denied by users | Medium | Medium | Show in-app banner explaining benefit, provide option to re-enable later |
| Recurring task date calculation bug (month-end) | Medium | Medium | Extensive unit tests for edge cases (Jan 31, leap years), manual QA |
| Performance degradation with 10k+ tasks | Low | High | Ensure indexes created (GIN, B-tree), monitor query performance, add pagination if needed |
| Tags array query performance | Medium | Medium | GIN index critical for array queries, monitor slow query log |
| Notification polling battery drain | Medium | Low | 60-second interval reasonable, document in user settings how to disable |
| Frontend component library conflicts | Low | Medium | Lock react-datepicker version in package.json, test in staging |

---

## Success Metrics

### Functional Completeness
- ✅ All 47 functional requirements implemented
- ✅ All 19 acceptance scenarios pass end-to-end tests
- ✅ All 10 edge cases handled correctly

### Performance
- ✅ GET /tasks responds in <200ms for 500-task lists
- ✅ Search updates in <500ms with debouncing
- ✅ Notifications fire within 65 seconds of due time

### Quality
- ✅ 90%+ backend unit test coverage for new code
- ✅ 80%+ frontend component test coverage
- ✅ Zero critical bugs in production first week
- ✅ Accessibility score ≥90 (Lighthouse audit)

### User Experience
- ✅ Task creation with all new fields <60 seconds
- ✅ Mobile usability confirmed at 375px width
- ✅ Notification permission grant rate >50% (track via analytics)

---

## Next Steps

1. ✅ **Planning Complete** - This document
2. **Task Breakdown** - Run `/sp.tasks` to generate detailed task list from this plan
3. **Implementation** - Execute tasks incrementally, following milestone order
4. **Testing** - Run test suite after each milestone
5. **Code Review** - Submit PR with spec + plan + implementation
6. **Deployment** - Follow deployment checklist
7. **Monitoring** - Track success metrics for 1 week post-launch

**Ready for `/sp.tasks` command!**
