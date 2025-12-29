# Tasks: Todo In-Memory Python Console App - Basic Level

**Input**: Design documents from `/specs/001-todo-basic-console/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: Not required for Phase I per spec (manual acceptance testing only)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md, this project uses a **single project** structure with layered architecture:
- `src/` - Source code at repository root
- `src/domain/` - Domain layer (models, exceptions)
- `src/repository/` - Data layer (in-memory storage)
- `src/service/` - Business logic layer
- `src/ui/` - Presentation layer (console, controller)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and UV configuration

- [X] T001 Initialize Python project with UV (`uv init`)
- [X] T002 [P] Create project directory structure per plan.md
- [X] T003 [P] Configure pyproject.toml with project metadata

**Checkpoint**: Project skeleton ready for development

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core domain models and exceptions that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create Task dataclass in src/domain/task.py
- [X] T005 [P] Create custom exceptions (TaskNotFoundError, InvalidTaskError) in src/domain/exceptions.py
- [X] T006 [P] Create __init__.py files for all packages (src/, domain/, repository/, service/, ui/)
- [X] T007 Implement TaskRepository class with CRUD operations in src/repository/task_repository.py
- [X] T008 Implement TaskService class with business logic in src/service/task_service.py
- [X] T009 [P] Create ConsoleUI class with display formatting in src/ui/console.py

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Add and View Tasks (Priority: P1) 🎯 MVP

**Goal**: Allow users to capture todo items and see them listed with status indicators

**Independent Test**: Launch app, add 2-3 tasks with titles/descriptions, view list, confirm all tasks appear with unique IDs and "incomplete" status

### Implementation for User Story 1

- [X] T010 [US1] Implement add_task menu handler in src/ui/controller.py
- [X] T011 [US1] Implement view_all_tasks menu handler in src/ui/controller.py
- [X] T012 [US1] Add input prompts for title and description in console.py
- [X] T013 [US1] Add task list display formatting with status indicators ([ ], [X]) in console.py
- [X] T014 [US1] Add empty list message display ("No tasks yet") in console.py
- [X] T015 [US1] Add success/confirmation message formatting in console.py
- [X] T016 [US1] Add error message formatting in console.py

**Checkpoint**: User Story 1 fully functional - users can add tasks and view the task list

---

## Phase 4: User Story 2 - Mark Tasks Complete/Incomplete (Priority: P2)

**Goal**: Enable progress tracking by toggling task completion status

**Independent Test**: Add a task, mark it complete (status changes to "[X]"), view updated list, toggle back to incomplete (status changes to "[ ]")

### Implementation for User Story 2

- [X] T017 [US2] Implement toggle_status menu handler in src/ui/controller.py
- [X] T018 [US2] Add ID input prompt with validation for mark complete in console.py
- [X] T019 [US2] Add toggle confirmation message display in console.py
- [X] T020 [US2] Handle TaskNotFoundError for invalid toggle IDs

**Checkpoint**: User Story 2 fully functional - users can track task completion

---

## Phase 5: User Story 3 - Update Task Details (Priority: P3)

**Goal**: Allow modification of task titles and descriptions

**Independent Test**: Create a task, update its title from "Old Title" to "New Title" and/or description, view task to confirm changes persisted

### Implementation for User Story 3

- [X] T021 [US3] Implement update_task menu handler in src/ui/controller.py
- [X] T022 [US3] Add update prompts (ID, new title, new description) in console.py
- [X] T023 [US3] Add "press Enter to skip" functionality for partial updates
- [X] T024 [US3] Add update confirmation message display in console.py
- [X] T025 [US3] Handle TaskNotFoundError and InvalidTaskError for updates

**Checkpoint**: User Story 3 fully functional - users can modify task details

---

## Phase 6: User Story 4 - Delete Tasks (Priority: P3)

**Goal**: Allow removal of tasks no longer relevant

**Independent Test**: Create 3 tasks, delete task ID 2, view list to confirm only tasks 1 and 3 remain

### Implementation for User Story 4

- [X] T026 [US4] Implement delete_task menu handler in src/ui/controller.py
- [X] T027 [US4] Add ID input prompt for delete operation in console.py
- [X] T028 [US4] Add delete confirmation message display in console.py
- [X] T029 [US4] Handle TaskNotFoundError for invalid delete IDs

**Checkpoint**: User Story 4 fully functional - users can remove unwanted tasks

---

## Phase 7: Integration & Main Entry Point

**Purpose**: Wire all components together and create the application loop

- [X] T030 Implement Controller class with main menu loop in src/ui/controller.py
- [X] T031 Add menu display with all 6 options (Add, View, Update, Delete, Mark Complete, Exit) in console.py
- [X] T032 Add menu input validation (handle invalid selections) in controller.py
- [X] T033 Add graceful exit handling in controller.py
- [X] T034 Create main.py entry point with dependency wiring in src/main.py
- [X] T035 Add KeyboardInterrupt (Ctrl+C) handling for graceful shutdown

**Checkpoint**: Application fully integrated and runnable via `uv run python src/main.py`

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validation, edge cases, and documentation

- [X] T036 [P] Validate empty title rejection during add/update
- [X] T037 [P] Validate invalid ID format handling (non-numeric input)
- [X] T038 [P] Validate long title display truncation in list view
- [X] T039 Run all 15 acceptance scenarios from spec.md (manual testing)
- [X] T040 [P] Create README.md with setup and usage instructions
- [X] T041 [P] Update CLAUDE.md with project context

**Checkpoint**: Application polished, validated, and documented

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - User stories can proceed in priority order (P1 → P2 → P3)
  - Or in parallel if staffed by multiple developers
- **Integration (Phase 7)**: Depends on at least US1 (P1) being complete; can expand as stories complete
- **Polish (Phase 8)**: Depends on all user stories and integration being complete

### User Story Dependencies

| User Story | Priority | Depends On | Independently Testable |
|------------|----------|------------|------------------------|
| US1: Add & View | P1 | Foundational only | ✅ Yes - MVP |
| US2: Mark Complete | P2 | Foundational + US1 (needs tasks to exist) | ✅ Yes |
| US3: Update | P3 | Foundational + US1 (needs tasks to exist) | ✅ Yes |
| US4: Delete | P3 | Foundational + US1 (needs tasks to exist) | ✅ Yes |

### Within Each Phase/Story

- Models before repositories
- Repositories before services
- Services before UI handlers
- UI handlers before integration
- Commit after each task or logical group

### Parallel Opportunities

**Within Phase 1 (Setup)**:
- T002, T003 can run in parallel after T001

**Within Phase 2 (Foundational)**:
- T005, T006, T009 can run in parallel after T004
- T007 and T008 are sequential (T008 depends on T007)

**Within User Story Phases**:
- Most tasks within a story are sequential (building on each other)
- Stories US2, US3, US4 can run in parallel once US1 is complete

**Within Phase 8 (Polish)**:
- T036, T037, T038 can run in parallel
- T040, T041 can run in parallel

---

## Parallel Example: Phase 2 Foundational

```bash
# First, complete the Task model:
Task: T004 - Create Task dataclass in src/domain/task.py

# Then launch these in parallel:
Task: T005 - Create custom exceptions in src/domain/exceptions.py
Task: T006 - Create __init__.py files for all packages
Task: T009 - Create ConsoleUI class in src/ui/console.py

# Finally, complete sequential dependencies:
Task: T007 - Implement TaskRepository (depends on T004)
Task: T008 - Implement TaskService (depends on T007)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T009)
3. Complete Phase 3: User Story 1 (T010-T016)
4. Complete Phase 7 (partial): Basic main.py with Add/View only
5. **STOP and VALIDATE**: Test US1 independently
6. Demo/deliver MVP with add and view functionality

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → MVP ready! (Add/View)
3. Add User Story 2 → Test independently → Progress tracking added
4. Add User Story 3 → Test independently → Edit capability added
5. Add User Story 4 → Test independently → Delete capability added
6. Polish → Full acceptance testing → Documentation

### Suggested MVP Scope

For shortest time to working demo: **Stop after User Story 1**
- Users can add tasks with title/description
- Users can view all tasks with status indicators
- Delivers immediate value for basic task capture

---

## Task Summary

| Phase | Task Count | Parallelizable |
|-------|------------|----------------|
| Phase 1: Setup | 3 | 2 |
| Phase 2: Foundational | 6 | 3 |
| Phase 3: US1 (P1) | 7 | 0 |
| Phase 4: US2 (P2) | 4 | 0 |
| Phase 5: US3 (P3) | 5 | 0 |
| Phase 6: US4 (P3) | 4 | 0 |
| Phase 7: Integration | 6 | 0 |
| Phase 8: Polish | 6 | 5 |
| **Total** | **41** | **10** |

### Tasks per User Story

- **US1 (Add & View)**: 7 tasks
- **US2 (Mark Complete)**: 4 tasks
- **US3 (Update)**: 5 tasks
- **US4 (Delete)**: 4 tasks
- **Shared/Infrastructure**: 21 tasks

---

## Notes

- Tests are optional per spec - manual acceptance testing planned
- All tasks follow checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`
- Each user story is independently testable after Foundational phase
- Stop at any checkpoint to validate and demo
- Commit after each task or logical group
- Performance target: < 100ms for all operations with 100 tasks
