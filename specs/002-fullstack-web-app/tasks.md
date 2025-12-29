# Tasks: Full-Stack Web Todo Application

**Feature**: `002-fullstack-web-app` | **Date**: 2025-12-29
**Input**: Design documents from `/specs/002-fullstack-web-app/`
**Plan**: [plan.md](plan.md) | **Spec**: [spec.md](spec.md) | **Data Model**: [data-model.md](data-model.md) | **Contracts**: [contracts/](contracts/)
**Hackathon Phase**: Phase II

**Tests**: Per Constitution, test specifications are defined before implementation. Tests should be written first and FAIL before implementation.

**Organization**: Tasks organized by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1-US5) - NO label for Setup/Foundational phases
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for both frontend and backend

- [X] T001 Create backend project structure per plan.md (backend/src/api, backend/src/auth, backend/src/models, backend/src/repository, backend/src/service, backend/src/schemas)
- [X] T002 Initialize FastAPI backend with pyproject.toml and dependencies (fastapi, uvicorn, sqlmodel, python-jose, httpx)
- [X] T003 Initialize Next.js 16+ frontend with TypeScript and Tailwind CSS in frontend/ directory
- [X] T004 Configure frontend project structure (src/app, src/components, src/lib, src/hooks, src/context, src/types)
- [X] T005 Create backend requirements.txt with all Python dependencies per quickstart.md
- [X] T006 Create frontend package.json with all Node dependencies (next, react, better-auth, @tanstack/react-query)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Models

- [X] T007 Create database configuration in backend/src/db/engine.py (PostgreSQL connection with pool_pre_ping)
- [X] T008 Create database session dependency in backend/src/db/session.py (AsyncSessionLocal with context manager)
- [X] T009 Create User SQLAlchemy model in backend/src/models/user.py (id, email UNIQUE, password_hash, created_at)
- [X] T010 Create Task SQLAlchemy model in backend/src/models/task.py (id, user_id FK, title, description, completed, created_at, updated_at)
- [X] T011 Create database migration script in backend/src/db/migrate.py (creates users and tasks tables)

### JWT Verification (Backend)

- [X] T012 Install python-jose[cryptography] and httpx for JWT verification
- [X] T013 Create JWKS fetching module in backend/src/auth/jwks.py (fetch_jwks with lru_cache)
- [X] T014 Create JWT verification dependency in backend/src/auth/dependencies.py (verify_jwt_token with signature, issuer, audience, expiry validation)
- [X] T015 Create get_current_user dependency in backend/src/auth/dependencies.py (extracts user_id from verified JWT)

### Better Auth Configuration (Frontend)

- [X] T016 Install better-auth and @better-auth/node packages in frontend
- [X] T017 Create Better Auth configuration in frontend/src/lib/auth.ts (betterAuth with JWT plugin, EdDSA signing, issuer/audience)
- [X] T018 Create Better Auth API route handler in frontend/src/app/api/auth/[...all]/route.ts
- [X] T019 Create auth client with JWT plugin in frontend/src/lib/auth-client.ts (createAuthClient with jwtClient)

### Environment Configuration

- [X] T020 Create backend/.env with DATABASE_URL, BETTER_AUTH_JWKS_URL, BETTER_AUTH_ISSUER, API_AUDIENCE
- [X] T021 Create frontend/.env.local with NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_API_URL, DATABASE_URL, BETTER_AUTH_SECRET

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Account Creation and Authentication (Priority: P1) 🎯 MVP

**Goal**: Users can sign up with email/password, sign in, and have persistent sessions

**Independent Test**: User navigates to signup page, enters valid email and password, creates account, and is redirected to dashboard. User can sign out and sign in again with same credentials.

### Tests for User Story 1

> Write these tests FIRST, ensure they FAIL before implementation

- [X] T022 [P] [US1] Contract test for signup endpoint in backend/tests/contract/test_auth.py
- [X] T023 [P] [US1] Contract test for signin endpoint in backend/tests/contract/test_auth.py
- [X] T024 [P] [US1] Integration test for auth flow in backend/tests/integration/test_auth_flow.py

### Implementation for User Story 1

- [X] T025 [US1] Create signup page in frontend/src/app/sign-up/page.tsx (form with email/password, calls signUp)
- [X] T026 [US1] Create signin page in frontend/src/app/sign-in/page.tsx (form with email/password, calls signIn)
- [X] T027 [US1] Create landing page in frontend/src/app/page.tsx (navigation links to sign-up/signin)
- [X] T028 [US1] Implement auth helpers in frontend/src/lib/auth/helpers.ts (signUp, signIn, signOut, getSession, getToken)
- [X] T029 [US1] Create signout functionality in frontend/src/app/dashboard/layout.tsx (signout button with server action)
- [X] T030 [US1] Add JWT token retrieval to auth client in frontend/src/lib/api.ts (apiClient wrapper with Authorization header)
- [X] T031 [US1] Handle 401 responses globally in frontend/src/lib/api.ts (redirect to signin when token expires)

**Checkpoint**: User Story 1 complete - users can signup, signin, signout with persistent sessions

---

## Phase 4: User Story 2 - Create and View Personal Tasks (Priority: P2)

**Goal**: Authenticated users can create tasks with titles and view their complete task list

**Independent Test**: User creates 3 tasks with different titles, sees them displayed in a list, and verifies all tasks persist after page refresh. Empty state shown when no tasks.

### Tests for User Story 2

> Write these tests FIRST, ensure they FAIL before implementation

- [X] T032 [P] [US2] Contract test for GET /api/tasks in backend/tests/contract/test_tasks.py
- [X] T033 [P] [US2] Contract test for POST /api/tasks in backend/tests/contract/test_tasks.py
- [X] T034 [P] [US2] Integration test for task creation and listing in backend/tests/integration/test_tasks.py

### Implementation for User Story 2

- [X] T035 [P] [US2] Create TaskCreate Pydantic schema in backend/src/schemas/task.py
- [X] T036 [P] [US2] Create TaskResponse Pydantic schema in backend/src/schemas/task.py
- [X] T037 [P] [US2] Create TaskUpdate Pydantic schema in backend/src/schemas/task.py
- [X] T038 [US2] Create task repository in backend/src/repository/task_repository.py (create, get_all_by_user with user_id filter)
- [X] T039 [US2] Create task service in backend/src/service/task_service.py (create_task, get_tasks_for_user with validation)
- [X] T040 [US2] Implement GET /api/tasks endpoint in backend/src/api/tasks.py (list tasks for authenticated user)
- [X] T040a [US2] Implement GET /api/tasks/{task_id} endpoint in backend/src/api/tasks.py (retrieve specific task by ID with ownership check)
- [X] T041 [US2] Implement POST /api/tasks endpoint in backend/src/api/tasks.py (create task with user_id from JWT)
- [X] T042 [US2] Create API client in frontend/src/lib/api.ts (getTasks, createTask, getTask, updateTask, deleteTask, toggleTask functions with JWT)
- [X] T043 [US2] Create dashboard layout in frontend/src/app/dashboard/layout.tsx (auth guard, redirects to signin if not authenticated)
- [X] T044 [US2] Create dashboard page in frontend/src/app/dashboard/page.tsx (renders TaskList component)
- [X] T045 [US2] Create task creation form in frontend/src/components/tasks/TaskForm.tsx (input for title, submit handler)
- [X] T046 [US2] Create task list component in frontend/src/components/tasks/TaskList.tsx (renders task list with checkboxes and delete buttons)
- [X] T047 [US2] Add optimistic updates for task creation in frontend/src/components/tasks/TaskList.tsx using TanStack Query

**Checkpoint**: User Story 2 complete - users can create tasks and view their list

---

## Phase 5: User Story 3 - Update and Delete Existing Tasks (Priority: P3)

**Goal**: Authenticated users can edit task titles and permanently delete tasks

**Independent Test**: User selects an existing task, modifies its title, saves and sees change reflected. User deletes a task and confirms it no longer appears in the list.

### Tests for User Story 3

> Write these tests FIRST, ensure they FAIL before implementation

- [X] T048 [P] [US3] Contract test for PATCH /api/tasks/{task_id} in backend/tests/contract/test_tasks.py
- [X] T049 [P] [US3] Contract test for DELETE /api/tasks/{task_id} in backend/tests/contract/test_tasks.py
- [X] T050 [P] [US3] Integration test for task update and delete in backend/tests/integration/test_tasks.py

### Implementation for User Story 3

- [X] T051 [US3] Task repository has get_by_id, update, delete methods in backend/src/repository/task_repository.py (with ownership check)
- [X] T052 [US3] Task service has update_task, delete_task methods in backend/src/service/task_service.py (with ownership verification)
- [X] T053 [US3] Implement PATCH /api/tasks/{task_id} endpoint in backend/src/api/tasks.py (update task title with ownership verification)
- [X] T054 [US3] Implement DELETE /api/tasks/{task_id} endpoint in backend/src/api/tasks.py (delete task with ownership verification)
- [X] T055 [US3] API client has updateTask, deleteTask functions in frontend/src/lib/api.ts
- [X] T056 [US3] Task list displays tasks with delete buttons in frontend/src/components/tasks/TaskList.tsx
- [ ] T057 [US3] Create task edit mode (inline editing of title) - Optional enhancement
- [ ] T058 [US3] Add delete confirmation dialog - Optional enhancement
- [X] T059 [US3] Add optimistic updates for task delete in frontend/src/components/tasks/TaskList.tsx using TanStack Query

**Checkpoint**: User Story 3 complete - users can update and delete their tasks

---

## Phase 6: User Story 4 - Toggle Task Completion Status (Priority: P4)

**Goal**: Authenticated users can mark tasks as complete/incomplete with visual indicators

**Independent Test**: User toggles any task between complete and incomplete states multiple times. Visual indicators clearly show current status. Status persists across sessions.

### Tests for User Story 4

> Write these tests FIRST, ensure they FAIL before implementation

- [X] T060 [P] [US4] Contract test for POST /api/tasks/{task_id}/toggle in backend/tests/contract/test_tasks.py
- [X] T061 [P] [US4] Integration test for task toggle in backend/tests/integration/test_tasks.py

### Implementation for User Story 4

- [X] T062 [US4] Task repository has toggle method in backend/src/repository/task_repository.py (with ownership check)
- [X] T063 [US4] Task service has toggle_task method in backend/src/service/task_service.py (with ownership verification)
- [X] T064 [US4] Implement POST /api/tasks/{task_id}/toggle endpoint in backend/src/api/tasks.py (toggle completion with ownership verification)
- [X] T065 [US4] API client has toggleTask function in frontend/src/lib/api.ts
- [X] T066 [US4] Task list displays checkboxes for toggling completion in frontend/src/components/tasks/TaskList.tsx
- [X] T067 [US4] Visual completion indicator added (strikethrough and gray text for completed tasks) in frontend/src/components/tasks/TaskList.tsx
- [X] T068 [US4] Optimistic updates for toggle implemented in frontend/src/components/tasks/TaskList.tsx using TanStack Query

**Checkpoint**: User Story 4 complete - users can toggle task completion with visual feedback

---

## Phase 7: User Story 5 - Responsive Multi-Device Access (Priority: P5)

**Goal**: Application works on mobile (320px), tablet (768px), and desktop (1024px+) with touch-friendly controls

**Independent Test**: Application accessed on devices with screen widths from 320px to 1920px. All features accessible. Touch interactions work on mobile/tablet.

### Implementation for User Story 5

- [X] T069 [P] [US5] Implement responsive layout with Tailwind CSS in frontend/src/app/globals.css
- [X] T070 [P] [US5] Task list is mobile-friendly in frontend/src/components/tasks/TaskList.tsx (full width, proper spacing)
- [X] T071 [P] [US5] Task list uses responsive padding and spacing (Tailwind responsive classes)
- [X] T072 [P] [US5] Task list has comfortable click targets with proper spacing and padding
- [X] T073 [US5] Touch targets are properly sized (checkboxes are h-5 w-5, buttons have adequate padding)
- [X] T074 [US5] Sign-up/sign-in forms are mobile-responsive with max-w-md containers in frontend/src/app/sign-up/page.tsx and frontend/src/app/sign-in/page.tsx
- [X] T075 [US5] Dashboard layout has responsive navigation in frontend/src/app/dashboard/layout.tsx (max-w-7xl mx-auto with responsive padding)
- [ ] T076 [US5] Test application on actual mobile device or browser dev tools responsive mode - TODO for validation

**Checkpoint**: User Story 5 complete - application is fully responsive across all device sizes

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T077 [P] Write backend unit tests for models in backend/tests/unit/test_models.py
- [ ] T078 [P] Write backend unit tests for services in backend/tests/unit/test_services.py
- [ ] T079 [P] Write frontend component tests in frontend/tests/ (TaskItem, TaskForm, TaskList)
- [ ] T080 [P] Test multi-user isolation (verify user A cannot see/modify user B's tasks)
- [ ] T080a [P] Verify Task model auto-generates created_at and updates updated_at on modifications in backend/tests/unit/test_models.py
- [ ] T081 [P] Add loading states in frontend (spinners, disable buttons during API calls)
- [ ] T082 Add error handling and toast notifications in frontend (user-friendly error messages)
- [ ] T082a Implement global validation error display pattern for all forms in frontend (signup, signin, task create/edit)
- [ ] T083 [P] Update CLAUDE.md with Phase II guidance
- [ ] T084 [P] Update README.md with Phase II overview and architecture
- [ ] T085 [P] Run quickstart.md validation (verify all setup steps work)
- [ ] T086 [P] Performance testing (verify API responses <500ms p95, page load <3s)
- [ ] T087 [P] Run accessibility audit on all forms (WCAG 2.1 AA compliance check) using axe DevTools or similar

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if team capacity allows)
  - Or sequentially in priority order (P1 → P2 → P3 → P4 → P5)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1 but builds on same foundation
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Uses same task model as US2
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Uses same task model as US2/US3
- **User Story 5 (P5)**: Can start after Foundational (Phase 2) - UI/UX improvements only

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 2

```bash
# Launch all tests for User Story 2 together:
Task: "Contract test for GET /api/tasks in backend/tests/contract/test_tasks.py"
Task: "Contract test for POST /api/tasks in backend/tests/contract/test_tasks.py"
Task: "Integration test for task creation and listing in backend/tests/integration/test_tasks.py"

# Launch all schema tasks for User Story 2 together:
Task: "Create TaskCreate Pydantic schema in backend/src/schemas/task.py"
Task: "Create TaskResponse Pydantic schema in backend/src/schemas/task.py"
Task: "Create TaskUpdate Pydantic schema in backend/src/schemas/task.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently (signup, signin, signout)
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Authentication)
   - Developer B: User Story 2 (Create/View Tasks)
   - Developer C: User Story 3 (Update/Delete Tasks) + User Story 4 (Toggle)
3. Stories complete and integrate independently
4. User Story 5 (Responsive) can be done by anyone throughout

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | 86 |
| **Setup Phase** | 6 tasks |
| **Foundational Phase** | 15 tasks |
| **User Story 1 (P1)** | 10 tasks |
| **User Story 2 (P2)** | 16 tasks |
| **User Story 3 (P3)** | 12 tasks |
| **User Story 4 (P4)** | 9 tasks |
| **User Story 5 (P5)** | 8 tasks |
| **Polish Phase** | 10 tasks |

### Parallel Opportunities

- Phase 1: All 6 tasks can run in parallel
- Phase 2: ~10 tasks marked [P] can run in parallel
- Each User Story: Multiple tasks marked [P] within story
- All User Stories: Can run in parallel after Foundational complete

### Independent Test Criteria

- **US1**: User can signup, signin, signout with persistent sessions
- **US2**: User can create tasks and view list (data persists after refresh)
- **US3**: User can update and delete own tasks (changes persist)
- **US4**: User can toggle completion status (visual feedback, persists)
- **US5**: Application works on mobile/tablet/desktop

### Suggested MVP Scope

**User Story 1 (P1) - Authentication** is the MVP:
- Without authentication, no multi-user isolation possible
- All other stories depend on authenticated users
- First deliverable: Working signup/signin flow
