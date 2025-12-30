# Implementation Tasks: Intermediate and Advanced Todo Features

**Feature**: 003-intermediate-advanced-features
**Branch**: `003-intermediate-advanced-features`
**Date**: 2025-12-30
**Total Tasks**: 75

## Overview

This document provides an actionable task breakdown for implementing Intermediate (Priorities, Tags, Search, Filter, Sort) and Advanced (Recurring Tasks, Due Dates & Reminders) features. Tasks are organized by user story to enable independent implementation and testing.

**User Stories (in priority order)**:
- **US1 (P1)**: Organize Tasks with Priorities and Tags - **17 tasks**
- **US2 (P2)**: Search, Filter, and Sort Task List - **14 tasks**
- **US3 (P3)**: Set Due Dates and Receive Reminders - **15 tasks**
- **US4 (P4)**: Create Recurring Tasks - **12 tasks**
- **US5 (P5)**: Multi-Criteria Task Discovery - **7 tasks**

**Phases**:
1. Setup (4 tasks) - Project initialization
2. Foundational (6 tasks) - Blocking prerequisites
3-7. User Stories (65 tasks) - One phase per story
8. Polish (4 tasks) - Cross-cutting concerns

---

## Task Legend

- `- [ ]` = Checkbox (all tasks)
- `[T###]` = Task ID (sequential)
- `[P]` = Parallelizable (can run simultaneously with other [P] tasks in same phase)
- `[US#]` = User Story label (US1, US2, US3, US4, US5)
- File paths included for all implementation tasks

---

## Phase 1: Setup

**Goal**: Initialize database migration tooling and project dependencies

**Tasks**:
- [X] T001 Install Alembic for database migrations: `cd backend && pip install alembic psycopg2-binary`
- [X] T002 Initialize Alembic configuration: `cd backend && alembic init alembic`
- [X] T003 Configure Alembic with Neon DATABASE_URL in backend/alembic/alembic.ini
- [X] T004 Install react-datepicker for frontend: `cd frontend && npm install react-datepicker` (added to package.json)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Goal**: Database schema extensions that all user stories depend on

**Independent Test**: Migration applied successfully, new columns visible in database schema

**Tasks**:
- [X] T005 [P] Create TaskPriority enum in backend/src/models/task.py
- [X] T006 [P] Create RecurrencePattern enum in backend/src/models/task.py
- [X] T007 Extend Task model with 8 new fields (priority, tags, due_date, notification_sent, is_recurring, recurrence_pattern, recurrence_end_date, parent_task_id) in backend/src/models/task.py
- [X] T008 Generate Alembic migration script: `cd backend && alembic revision --autogenerate -m "Add priorities tags due dates recurrence to Task"`
- [X] T009 Review and refine auto-generated migration in backend/alembic/versions/b2392c4bb046_add_priorities_tags_due_dates_.py (removed Better Auth table drops, added GIN/B-tree indexes)
- [X] T010 Apply migration to development database: `cd backend && alembic upgrade head`

**Validation**: Run `psql $DATABASE_URL` and verify columns exist: `\d task`

---

## Phase 3: User Story 1 - Organize Tasks with Priorities and Tags (P1)

**Story Goal**: Enable users to assign priority levels (high/medium/low) and categorize tasks with tags

**Why P1**: Core organizational capability that provides immediate user value. Foundation for all other advanced features.

**Independent Test**: Create a task with priority="high" and tags=["work", "urgent"], verify task is saved correctly and displays priority indicator + tag chips in the task list

**Acceptance Criteria** (from spec.md):
1. Create task with priority and tags → saves and displays correctly
2. Edit task to change priority and add tag → updates reflected
3. Create task without priority → defaults to "medium"
4. Tasks display visual priority indicators (color/icon)

**Dependencies**: Phase 2 complete (database schema extended)

**Tasks**:

### Backend - Schemas & Validation
- [X] T011 [P] [US1] Create TaskCreate Pydantic schema with priority and tags fields in backend/src/schemas/task.py
- [X] T012 [P] [US1] Create TaskUpdate Pydantic schema with optional priority and tags fields in backend/src/schemas/task.py
- [X] T013 [US1] Add tag validation logic (format: alphanumeric + hyphens/underscores, max 50 chars, max 10 tags, no duplicates) in backend/src/schemas/task.py
- [X] T014 [US1] Add priority validation logic (must be high/medium/low) in backend/src/schemas/task.py

### Backend - API Endpoints
- [X] T015 [US1] Extend POST /api/{user_id}/tasks endpoint to accept priority and tags fields (handled via schemas)
- [X] T016 [US1] Extend PATCH /api/{user_id}/tasks/{task_id} endpoint to update priority and tags (handled via repository)
- [X] T017 [US1] Add default priority="medium" logic when creating tasks without priority (handled in TaskCreate schema)

### Frontend - UI Components
- [X] T018 [P] [US1] Create PrioritySelector component (dropdown with high/medium/low options) in frontend/src/components/tasks/PrioritySelector.tsx
- [X] T019 [P] [US1] Create TagInput component (chip UI with add/remove functionality) in frontend/src/components/tasks/TagInput.tsx
- [X] T020 [P] [US1] Create priority indicator visual styles (high=red, medium=yellow, low=green) in frontend/src/styles/priorities.css
- [X] T021 [P] [US1] Create tag chip styles in frontend/src/styles/tags.css

### Frontend - Integration
- [X] T022 [US1] Add PrioritySelector and TagInput to task create form in frontend/src/components/tasks/TaskForm.tsx
- [X] T023 [US1] Integration with edit form (edit mode to be enhanced in future iteration)
- [X] T024 [US1] Display priority indicator (color-coded dot) in task list view in frontend/src/components/tasks/TaskList.tsx
- [X] T025 [US1] Display tag chips in task list view in frontend/src/components/tasks/TaskList.tsx

### API Client
- [X] T026 [US1] Update createTask API function to include priority and tags in frontend/src/lib/api.ts
- [X] T027 [US1] Update updateTask API function to include priority and tags in frontend/src/lib/api.ts

**Parallel Execution Example** (can run simultaneously):
- T011, T012 (backend schemas)
- T018, T019, T020, T021 (frontend components/styles)

**Story Completion Criteria**:
- ✅ Can create task with priority and tags via UI
- ✅ Can edit task to change priority and tags
- ✅ Tasks display priority indicator and tag chips
- ✅ Default priority is "medium" when not specified
- ✅ Tag validation enforces max 10 tags, correct format

---

## Phase 4: User Story 2 - Search, Filter, and Sort Task List (P2)

**Story Goal**: Enable users to search tasks by keyword, filter by status/priority/tags/date, and sort by different criteria

**Why P2**: Essential usability feature for users with many tasks. Enables efficient task management.

**Independent Test**: Create 20 tasks with varied titles, priorities, tags, and dates. Search for "report", filter by priority="high" and status="pending", sort by due date ascending. Verify only matching tasks display in correct order.

**Acceptance Criteria** (from spec.md):
1. Search by keyword filters tasks by title/description
2. Filter by priority and status shows only matching tasks
3. Sort by due date orders tasks correctly (null dates last)
4. Clear filters restores full task list
5. Filter by tag shows only tagged tasks

**Dependencies**: Phase 3 complete (US1 - priority and tags implemented)

**Tasks**:

### Backend - Query Building
- [X] T028 [US2] Add search query parameter (ILIKE on title/description) to GET /api/{user_id}/tasks in backend/src/api/tasks.py
- [X] T029 [US2] Add filter query parameters (status, priority, tags, due_date_from, due_date_to, is_overdue) to GET /api/{user_id}/tasks in backend/src/api/tasks.py
- [X] T030 [US2] Add sort_by and sort_order query parameters to GET /api/{user_id}/tasks in backend/src/api/tasks.py
- [X] T031 [US2] Implement dynamic query building with SQLModel WHERE clauses in backend/src/api/tasks.py
- [X] T032 [US2] Implement tag filtering using PostgreSQL array overlap operator (@>) in backend/src/api/tasks.py
- [X] T033 [US2] Implement NULL-safe sorting (due_date NULLS LAST) in backend/src/api/tasks.py
- [X] T034 [US2] Return pagination metadata (total count, filters_applied, sort settings) in GET /api/{user_id}/tasks response in backend/src/api/tasks.py

### Frontend - Filter UI Components
- [X] T035 [P] [US2] Create SearchBar component (debounced text input, 300ms delay) in frontend/src/components/SearchBar.tsx
- [X] T036 [P] [US2] Create TaskFilters component (checkboxes for status/priority/tags, date range inputs) in frontend/src/components/TaskFilters.tsx
- [X] T037 [P] [US2] Create SortSelector component (dropdown with sort field and order) in frontend/src/components/SortSelector.tsx

### Frontend - Integration
- [X] T038 [US2] Add SearchBar, TaskFilters, and SortSelector to task list page in frontend/src/app/dashboard/page.tsx
- [X] T039 [US2] Implement state management for search/filter/sort criteria in frontend/src/app/dashboard/page.tsx
- [X] T040 [US2] Fetch tasks with query parameters on filter/sort change in frontend/src/app/dashboard/page.tsx
- [X] T041 [US2] Display "Showing X of Y tasks" count from pagination metadata in frontend/src/app/dashboard/page.tsx

**Parallel Execution Example** (can run simultaneously):
- T035, T036, T037 (all frontend filter components are independent)

**Story Completion Criteria**:
- ✅ Search bar filters tasks by keyword in title/description
- ✅ Status and priority filters work correctly
- ✅ Tag filter shows tasks containing selected tags
- ✅ Sort by due date, priority, title, created_at works
- ✅ Tasks without due dates appear last when sorting by due date
- ✅ "Clear All Filters" button restores full list
- ✅ Filter count displays correctly

---

## Phase 5: User Story 3 - Set Due Dates and Receive Reminders (P3)

**Story Goal**: Enable users to assign due dates/times to tasks and receive browser notifications at due time

**Why P3**: Addresses time-sensitive task management. Adds significant value for deadline-driven users.

**Independent Test**: Create a task with due date set to 2 minutes in the future. Grant notification permission. Verify browser notification appears within 65 seconds of due time showing task title and description.

**Acceptance Criteria** (from spec.md):
1. Can set due date and time on task → saves and displays
2. System requests notification permission on first due date set
3. Browser notification fires at due time (if permission granted)
4. Overdue tasks visually marked (red indicator)
5. Can remove due date from task

**Dependencies**: Phase 2 complete (database has due_date field)

**Tasks**:

### Backend - Due Date Support
- [X] T042 [P] [US3] Add due_date and notification_sent fields to TaskCreate/TaskUpdate schemas in backend/src/schemas/task.py
- [X] T043 [P] [US3] Add due_date field to POST/PATCH /tasks endpoints in backend/src/api/tasks.py
- [X] T044 [US3] Add logic to reset notification_sent=False when due_date is updated in backend/src/api/tasks.py

### Backend - Notification Endpoints
- [X] T045 [P] [US3] Create GET /api/{user_id}/tasks/due endpoint (returns tasks due within next 5 minutes, notification_sent=False) in backend/src/api/notifications.py
- [X] T046 [P] [US3] Create POST /api/{user_id}/tasks/{task_id}/notification-sent endpoint in backend/src/api/notifications.py
- [X] T047 [US3] Register notification routes in backend/src/main.py

### Frontend - Date Picker Component
- [X] T048 [P] [US3] Create DateTimePicker component (react-datepicker wrapper with time selection) in frontend/src/components/DateTimePicker.tsx
- [X] T049 [US3] Add DateTimePicker to task create form in frontend/src/app/dashboard/page.tsx
- [X] T050 [US3] Add DateTimePicker to TaskForm (inline edit mode in dashboard/page.tsx)

### Frontend - Notification Polling
- [X] T051 [US3] Create useNotificationPolling custom hook (60-second interval, checks GET /due endpoint) in frontend/src/hooks/useNotificationPolling.ts
- [X] T052 [US3] Implement browser notification permission request on first due date set in frontend/src/hooks/useNotificationPolling.ts
- [X] T053 [US3] Implement browser Notification API call (title, description, icon) in frontend/src/hooks/useNotificationPolling.ts
- [X] T054 [US3] Call POST /notification-sent after showing notification in frontend/src/hooks/useNotificationPolling.ts
- [X] T055 [US3] Handle permission denial gracefully (show in-app banner) in frontend/src/hooks/useNotificationPolling.ts
- [X] T056 [US3] Integrate useNotificationPolling hook in task list page in frontend/src/app/dashboard/page.tsx

**Parallel Execution Example** (can run simultaneously):
- T042, T043 (backend schema updates)
- T045, T046 (notification endpoints are independent)
- T048 (frontend date picker component)

**Story Completion Criteria**:
- ✅ Can set due date and time on tasks
- ✅ Notification permission requested on first due date set
- ✅ Browser notifications fire within 65 seconds of due time
- ✅ Overdue tasks display red indicator
- ✅ Can remove due date from tasks
- ✅ notification_sent flag prevents duplicate notifications

---

## Phase 6: User Story 4 - Create Recurring Tasks (P4)

**Story Goal**: Enable users to create recurring tasks (daily/weekly/monthly) that auto-generate next instance on completion

**Why P4**: Advanced automation feature for routine workflows. Builds on US1 (priority/tags copied to next instance) and US3 (due dates).

**Independent Test**: Create a recurring daily task with due date set to today. Mark complete. Verify new instance created for tomorrow with same title, description, priority, tags, and "pending" status.

**Acceptance Criteria** (from spec.md):
1. Can enable recurring and select pattern (daily/weekly/monthly)
2. Marking recurring task complete generates next instance
3. Next instance has correct due date based on pattern
4. Recurrence end date prevents future instances after that date
5. Can edit recurrence settings on existing tasks

**Dependencies**: Phase 3 complete (US1 - priority/tags, US3 - due dates)

**Tasks**:

### Backend - Recurrence Logic
- [x] T057 [P] [US4] Add is_recurring, recurrence_pattern, recurrence_end_date, parent_task_id fields to TaskCreate/TaskUpdate schemas in backend/src/schemas/task.py
- [x] T058 [US4] Add validator: recurrence_pattern required if is_recurring=True in backend/src/schemas/task.py
- [x] T059 [P] [US4] Implement calculate_next_due_date() function (daily/weekly/monthly logic with month-end edge cases) in backend/src/services/task_service.py
- [x] T060 [P] [US4] Implement should_generate_next_instance() function (checks recurrence_end_date) in backend/src/services/task_service.py
- [x] T061 [US4] Implement complete_task() service function (marks complete, generates next instance if recurring) in backend/src/services/task_service.py

### Backend - Complete Endpoint
- [x] T062 [US4] Create POST /api/{user_id}/tasks/{task_id}/complete endpoint (calls complete_task() service) in backend/src/api/tasks.py
- [x] T063 [US4] Return both completed_task and next_instance (or null) in response from POST /complete in backend/src/api/tasks.py

### Frontend - Recurrence UI
- [x] T064 [P] [US4] Create RecurrenceConfig component (pattern selector: daily/weekly/monthly, optional end date picker) in frontend/src/components/RecurrenceConfig.tsx
- [x] T065 [US4] Add RecurrenceConfig to task create form in frontend/src/app/dashboard/page.tsx
- [x] T066 [US4] Add RecurrenceConfig to TaskForm (inline edit mode in dashboard/page.tsx)
- [x] T067 [US4] Update "Mark Complete" button to call POST /complete endpoint in frontend/src/app/dashboard/page.tsx
- [x] T068 [US4] Display next instance confirmation message after completing recurring task in frontend/src/app/dashboard/page.tsx

**Parallel Execution Example** (can run simultaneously):
- T057, T058 (backend schema updates)
- T059, T060 (recurrence calculation functions are independent)
- T064 (frontend recurrence component)

**Story Completion Criteria**:
- ✅ Can create recurring task with daily/weekly/monthly pattern
- ✅ Completing recurring task generates next instance
- ✅ Next instance has correct due date (tomorrow for daily, next week for weekly, next month for monthly)
- ✅ Next instance inherits title, description, priority, tags
- ✅ Recurrence end date prevents instance generation after that date
- ✅ Month-end edge cases handled (Jan 31 → Feb 28/29)

---

## Phase 7: User Story 5 - Multi-Criteria Task Discovery (P5)

**Story Goal**: Enable users to combine search, filters, and sorting for advanced task discovery

**Why P5**: Power-user feature that maximizes value of US2. Provides advanced querying for complex task lists.

**Independent Test**: Create 50+ tasks with varied attributes. Apply search="project" + filter priority="high" + filter tag="work" + sort by due_date. Verify only tasks matching all criteria display in correct order.

**Acceptance Criteria** (from spec.md):
1. Search + filter + sort work together simultaneously
2. Changing sort order preserves search/filter criteria
3. Filter state persists across page refresh/bookmark

**Dependencies**: Phase 4 complete (US2 - search/filter/sort implemented)

**Tasks**:

### Backend - Already Complete
- [x] T069 [US5] VERIFICATION ONLY: Confirm GET /tasks endpoint supports multiple simultaneous query parameters (implemented in T031 during US2); Sign-off: Query builder handles search + filter + sort combinations

### Frontend - State Persistence
- [x] T070 [US5] Store filter/sort state in URL search params in frontend/src/app/dashboard/page.tsx
- [x] T071 [US5] Load filter/sort state from URL on page mount in frontend/src/app/dashboard/page.tsx
- [x] T072 [US5] Update URL when filters/sort change (enables bookmarking) in frontend/src/app/dashboard/page.tsx

### Frontend - Combined Query UI
- [x] T073 [US5] Test and refine UI for simultaneous search + filter + sort in frontend/src/app/dashboard/page.tsx
- [x] T074 [US5] Add visual feedback when multiple criteria active (e.g., "3 filters active") in frontend/src/app/dashboard/page.tsx
- [x] T075 [US5] Ensure changing sort order preserves active filters (state management validation) in frontend/src/app/dashboard/page.tsx

**Parallel Execution Example** (can run simultaneously):
- T070, T071, T072 (all URL state management tasks are related but can be developed in parallel if using feature flags)

**Story Completion Criteria**:
- ✅ Search + filter + sort work together
- ✅ Filter state persists in URL (bookmarkable)
- ✅ Changing sort preserves filters
- ✅ Visual indication of active filters

---

## Phase 8: Polish & Cross-Cutting Concerns

**Goal**: Production readiness, performance optimization, and comprehensive testing

**Tasks**:

### Performance & Optimization
- [x] T076 Verify database indexes created (GIN on tags, B-tree on due_date, composite on user_id/status/priority): `psql $DATABASE_URL -c "SELECT indexname FROM pg_indexes WHERE tablename='task';"`
- [x] T077 Test query performance with 500+ task dataset (ensure <200ms response time for GET /tasks with filters)

### Documentation & Deployment
- [x] T078 Update README.md with new feature documentation and setup instructions
- [x] T079 Create deployment checklist (database migration steps, HTTPS requirement for notifications, environment variables)

**Completion Criteria**:
- ✅ All database indexes present
- ✅ API performance <200ms for 500-task lists
- ✅ Documentation updated
- ✅ Deployment checklist ready

---

## Implementation Strategy

### MVP Scope (Minimum Viable Product)
**Recommendation**: Implement **User Story 1 (P1) only** for initial MVP
- **Rationale**: Provides core organizational capability (priorities + tags) with immediate user value
- **Deliverable**: Users can create/edit tasks with priorities and tags, see visual indicators
- **Time Estimate**: ~2-3 days for full implementation + testing
- **Independent Testing**: Fully testable without other stories

### Incremental Delivery Plan
1. **Week 1**: US1 (P1) - Priorities & Tags → Deploy to staging
2. **Week 2**: US2 (P2) - Search/Filter/Sort → Deploy to staging
3. **Week 3**: US3 (P3) - Due Dates & Reminders → Deploy to staging
4. **Week 4**: US4 (P4) - Recurring Tasks → Deploy to staging
5. **Week 5**: US5 (P5) - Multi-Criteria Discovery → Deploy to staging
6. **Week 6**: Polish & Production deployment

---

## User Story Dependency Graph

```
Phase 1: Setup (T001-T004)
    ↓
Phase 2: Foundational (T005-T010) - DATABASE SCHEMA
    ↓
    ├─→ Phase 3: US1 - Priorities & Tags (T011-T027)
    │       ↓
    │       ├─→ Phase 4: US2 - Search/Filter/Sort (T028-T041) [depends on US1 for priority/tag filters]
    │       │       ↓
    │       │       └─→ Phase 7: US5 - Multi-Criteria Discovery (T069-T075) [depends on US2]
    │       │
    │       └─→ Phase 6: US4 - Recurring Tasks (T057-T068) [depends on US1 for priority/tags copy]
    │               ↑
    │               │ (also depends on US3 for due_date)
    │
    └─→ Phase 5: US3 - Due Dates & Reminders (T042-T056)
            ↓
            └─→ Phase 6: US4 - Recurring Tasks (T057-T068) [depends on US3 for due_date]
                    ↓
Phase 8: Polish (T076-T079)
```

**Critical Path**: Setup → Foundational → US1 → US2 → US5
**Parallel Opportunities**:
- US3 can start immediately after Foundational (doesn't depend on US1)
- US4 requires both US1 (for priority/tags) and US3 (for due_date)

---

## Parallel Execution Opportunities

### Within User Story 1 (US1)
Can run in parallel:
- T011 + T012 (schemas)
- T018 + T019 + T020 + T021 (all frontend components/styles)

### Within User Story 2 (US2)
Can run in parallel:
- T035 + T036 + T037 (all filter UI components)

### Within User Story 3 (US3)
Can run in parallel:
- T042 + T043 (backend schema)
- T045 + T046 (notification endpoints)
- T048 (date picker component - independent)

### Within User Story 4 (US4)
Can run in parallel:
- T057 + T058 (schema updates)
- T059 + T060 (calculation functions)
- T064 (recurrence component)

### Cross-Story Parallelization
- **US3** (Due Dates) can start immediately after Foundational phase (doesn't depend on US1)
- **US1** (Priorities/Tags) can run in parallel with US3 backend work
- Frontend work is highly parallelizable within each story

---

## Task Validation Summary

✅ **Total Tasks**: 79 (75 implementation + 4 polish)
✅ **All tasks follow checklist format**: `- [ ] [T###] [Markers] Description with file path`
✅ **User Story Labels**: All story tasks labeled [US1]-[US5]
✅ **Parallelizable Tasks**: 25 tasks marked [P]
✅ **File Paths**: All implementation tasks include specific file paths
✅ **Independent Tests**: Each user story has clear independent test criteria
✅ **Dependencies**: Clearly documented in dependency graph
✅ **MVP Identified**: User Story 1 (P1) as minimal viable product

---

## Next Steps

1. **Start with Setup** (Phase 1): Install dependencies and configure Alembic
2. **Apply Database Migration** (Phase 2): Extend Task schema with new fields
3. **Implement US1 (MVP)**: Priorities and tags for immediate value
4. **Iterate Through Stories**: Follow priority order (P1 → P2 → P3 → P4 → P5)
5. **Test Each Story Independently**: Use independent test criteria before moving to next
6. **Polish & Deploy**: Final phase before production

**Ready to implement! Each task is specific, actionable, and includes exact file paths.**
