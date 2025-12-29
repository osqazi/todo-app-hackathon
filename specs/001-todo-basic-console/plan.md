# Implementation Plan: Todo In-Memory Python Console App - Basic Level

**Branch**: `001-todo-basic-console` | **Date**: 2025-12-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-todo-basic-console/spec.md`

**Note**: This plan follows the research-concurrent strategy outlined in the planning prompt, documenting architectural decisions with just-in-time research.

## Summary

Build a command-line todo application implementing 5 Basic Level CRUD operations (Add, Delete, Update, View, Mark Complete) using in-memory storage with Python 3.13+ and UV package manager. The application follows a layered architecture (Console → Controller → Service → Repository → Model) emphasizing clean separation of concerns, spec-driven development methodology, and comprehensive error handling for hackathon learning objectives.

## Technical Context

**Language/Version**: Python 3.13+
**Primary Dependencies**: UV (package manager), Python standard library only (no external packages for Phase I)
**Storage**: In-memory only (Python dict/list data structures - no persistence)
**Testing**: pytest (optional for Phase I - manual testing acceptable), unittest.mock for I/O testing
**Target Platform**: Cross-platform console (Windows/Linux/macOS terminals)
**Project Type**: Single console application
**Performance Goals**: Sub-second response for all operations with up to 100 tasks, < 1 second startup time
**Constraints**: < 100ms operation latency, < 50MB memory usage, graceful handling of 100-200 tasks
**Scale/Scope**: Single-user local application, 5 core features (Add/Delete/Update/View/Mark Complete), ~500-1000 LOC estimated

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle Alignment

| Constitution Principle | Plan Alignment | Evidence |
|------------------------|----------------|----------|
| **Basic Level Feature Implementation** | ✅ PASS | All 5 features (Add, Delete, Update, View, Mark Complete) are primary requirements in spec and included in architecture |
| **Spec-Driven Development Methodology** | ✅ PASS | Following Spec-Kit Plus workflow: constitution → spec → plan → tasks → implementation with PHR tracking |
| **In-Memory State Management** | ✅ PASS | Technical Context specifies in-memory storage using Python dict/list; no persistence layer planned |
| **Comprehensive Error Handling** | ✅ PASS | Error handling strategy planned for all layers; input validation at controller level; user-friendly error messages |
| **Python Best Practices** | ✅ PASS | UV package manager specified; Python 3.13+ required; PEP 8 compliance planned; proper module structure with layered architecture |
| **Cross-Platform Console Compatibility** | ✅ PASS | Target platform: cross-platform console (Windows/Linux/macOS); using Python standard library for portability |

### Technology Constraints Check

| Constraint | Status | Notes |
|------------|--------|-------|
| **UV Package Manager** | ✅ MET | Primary dependency management tool specified |
| **Python 3.13+** | ✅ MET | Language version requirement met |
| **Claude Code Integration** | ✅ MET | CLAUDE.md planned as deliverable; PHR tracking throughout |
| **Spec-Kit Plus Integration** | ✅ MET | Following SDD workflow with constitution, spec, plan, tasks artifacts |
| **Python Project Structure** | ✅ MET | Layered architecture planned with proper module organization |

### Success Criteria Check

| Criterion | Planning Status | Validation Approach |
|-----------|-----------------|---------------------|
| **Implement 5 Basic Features** | ✅ PLANNED | Each feature mapped to user story in spec; acceptance criteria defined |
| **Working Console Application** | ✅ PLANNED | Console interface layer designed; menu system architecture specified |
| **Proper Functionality** | ✅ PLANNED | Manual acceptance testing planned for all 15 acceptance scenarios from spec |

**GATE RESULT**: ✅ PASS - All constitutional principles aligned, constraints met, success criteria addressable with planned architecture

## Project Structure

### Documentation (this feature)

```text
specs/001-todo-basic-console/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

**Selected Structure**: Single project with layered architecture (Option 1)

```text
todo/
├── .specify/
│   ├── memory/
│   │   └── constitution.md          # Project principles
│   └── templates/
├── specs/
│   └── 001-todo-basic-console/
│       ├── spec.md
│       ├── plan.md                  # This file
│       ├── research.md              # Research findings
│       ├── data-model.md            # Domain model
│       ├── quickstart.md            # Setup guide
│       ├── contracts/               # (N/A for console app)
│       └── tasks.md                 # Implementation tasks
├── src/
│   ├── __init__.py
│   ├── main.py                      # Application entry point
│   ├── domain/                      # Domain layer (models)
│   │   ├── __init__.py
│   │   ├── task.py                  # Task entity/dataclass
│   │   └── exceptions.py            # Custom domain exceptions
│   ├── repository/                  # Data layer
│   │   ├── __init__.py
│   │   └── task_repository.py       # In-memory storage & CRUD
│   ├── service/                     # Business logic layer
│   │   ├── __init__.py
│   │   └── task_service.py          # Task operations & validation
│   └── ui/                          # Presentation layer
│       ├── __init__.py
│       ├── console.py               # Console I/O formatting
│       └── controller.py            # Command routing & menu
├── tests/                           # (Optional for Phase I)
│   ├── __init__.py
│   ├── unit/
│   │   ├── test_domain.py
│   │   ├── test_repository.py
│   │   └── test_service.py
│   └── integration/
│       └── test_task_workflow.py
├── .gitignore
├── README.md                        # Setup & usage instructions
├── CLAUDE.md                        # Claude Code context
└── pyproject.toml                   # UV project configuration
```

**Structure Decision**: Selected layered architecture (domain/repository/service/ui) for clear separation of concerns. This structure supports:
- **Domain layer**: Pure business entities and rules (no I/O dependencies)
- **Repository layer**: In-memory storage abstraction (dict-based implementation)
- **Service layer**: Orchestrates business logic and validation
- **UI layer**: Console interaction and presentation (isolated for testability)

**Rationale**:
- Testability: Each layer can be tested independently with mocks
- Maintainability: Clear responsibility boundaries prevent coupling
- Extensibility: Future persistence (Phase II) only requires repository swap
- Learning: Demonstrates professional Python project organization for hackathon participants

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations detected** - All architecture aligns with constitutional principles. Layered structure appropriate for learning objectives and maintainability goals.

## Architecture Overview

### System Layers

```
┌─────────────────────────────────────────────────────────┐
│                Console Interface (ui/console.py)         │
│               Menu display, I/O formatting               │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│             Command Controller (ui/controller.py)        │
│          Menu routing, input validation, errors          │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│            Task Service (service/task_service.py)        │
│       Business logic, validation, orchestration          │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│        Repository (repository/task_repository.py)        │
│         In-memory storage (dict), CRUD, ID gen           │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Task Model (domain/task.py)                 │
│        @dataclass: id, title, description, status        │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

**Add Task Flow**:
```
User Input → Controller.get_input("title") 
  → Service.add_task(title, desc) 
  → Repository.create(title, desc) 
  → Task(id=auto, title, desc, completed=False)
  → Console.display_success("Task {id} added")
```

**View Tasks Flow**:
```
User Choice → Controller._view_tasks()
  → Service.list_tasks()
  → Repository.get_all()
  → list[Task]
  → Console.display_tasks(tasks)
```

### Key Architectural Decisions

#### 1. In-Memory Data Structure: `dict[int, Task]`
**Decision**: Use dictionary with task ID as key
**Alternatives**: List, OrderedDict, custom collection
**Rationale**: O(1) lookup/delete/update, insertion order preserved (Python 3.7+)
**Impact**: All repository operations, performance characteristics
**ADR**: Recommended (`/sp.adr task-storage-structure`)

#### 2. ID Generation: Sequential Integer Counter
**Decision**: Start at 1, increment on each create
**Alternatives**: UUID, timestamp-based, hash-based
**Rationale**: Human-readable, deterministic, meets spec requirement
**Impact**: User experience (console display), testing
**ADR**: Documented in plan (no separate ADR needed)

#### 3. Status Representation: Boolean
**Decision**: `completed: bool` (False = incomplete, True = complete)
**Alternatives**: Enum, string, multiple booleans
**Rationale**: Simplest for Phase I toggle behavior, easy to extend later
**Impact**: Task model, toggle logic, display formatting
**ADR**: Documented in plan (no separate ADR needed)

#### 4. Error Handling: Exceptions
**Decision**: Use custom exceptions (`TaskNotFoundError`, `InvalidTaskError`)
**Alternatives**: Return codes, Result/Either pattern
**Rationale**: Pythonic (EAFP), clear separation of normal/error flow
**Impact**: All layers, error propagation strategy
**ADR**: Documented in plan

#### 5. Module Organization: Layered Architecture
**Decision**: domain/repository/service/ui separation
**Alternatives**: Flat structure, feature-based modules
**Rationale**: Clear responsibilities, testability, extensibility
**Impact**: Import structure, testing strategy, future enhancements
**ADR**: Recommended (`/sp.adr project-structure`)

#### 6. Testing Approach: Manual + Optional Automated
**Decision**: Manual acceptance tests required, unit tests optional
**Alternatives**: Full TDD, manual only, integration-focused
**Rationale**: Hackathon time constraints, learning objectives
**Impact**: Development workflow, time allocation
**ADR**: Recommended (`/sp.adr testing-strategy`)

## Implementation Plan

### Phase 0: Setup (30 min)
- Install Python 3.13+ and UV
- Initialize project structure
- Configure pyproject.toml
- Create directory tree

### Phase 1: Domain Layer (1 hour)
- Implement Task dataclass (domain/task.py)
- Define exceptions (domain/exceptions.py)
- Add type hints and docstrings

### Phase 2: Repository Layer (1.5 hours)
- Implement TaskRepository class
- CRUD operations with dict storage
- ID generation logic
- Error handling

### Phase 3: Service Layer (1.5 hours)
- Implement TaskService class
- Business logic and validation
- Error handling and propagation

### Phase 4: UI Layer (2 hours)
- Implement ConsoleUI class (formatting)
- Implement Controller class (menu, routing)
- Event loop and command handling

### Phase 5: Integration (30 min)
- Create main.py entry point
- Wire dependencies
- End-to-end testing

### Phase 6: Testing & Documentation (2 hours)
- Execute 15 acceptance scenarios
- Test edge cases
- Write README.md and CLAUDE.md

**Total**: ~9 hours

## Acceptance Criteria

From spec (all must pass):

### Feature 1: Add Task
- [x] User can add with title and description
- [x] Auto-generated unique ID
- [x] Defaults to incomplete
- [x] Confirmation with ID shown
- [x] Empty title rejected
- [x] Description optional

### Feature 2: Delete Task
- [x] Delete by ID
- [x] Confirmation shown
- [x] Invalid ID shows error
- [x] Permanent deletion
- [x] List updates immediately

### Feature 3: Update Task
- [x] Update title/description by ID
- [x] Status preserved
- [x] Invalid ID shows error
- [x] Confirmation with new values
- [x] Empty title rejected

### Feature 4: View All Tasks
- [x] List shows ID, title, status
- [x] Completed tasks distinguished
- [x] Empty list shows message
- [x] Consistent order
- [x] Description shown/accessible

### Feature 5: Mark Complete/Incomplete
- [x] Toggle status by ID
- [x] Immediate reflection
- [x] Invalid ID shows error
- [x] Confirmation shows new status
- [x] Idempotent operation

## Performance & Quality

### Performance Targets
- Operation latency: < 100ms for 100 tasks
- Startup time: < 1 second
- Memory usage: < 50MB

### Code Quality
- PEP 8 compliance
- Type hints for public API
- Docstrings for classes/methods
- No hardcoded values
- Comprehensive error handling

## References

Astral. (2024). UV: An extremely fast Python package installer and resolver. https://astral.sh/uv

Python Packaging Authority. (2024). Python Packaging User Guide. https://packaging.python.org/

Python Software Foundation. (2024). PEP 8 - Style Guide for Python Code. https://peps.python.org/pep-0008/

---

## Next Steps

1. ✅ Plan complete - Review architectural decisions
2. ⏭️ Create ADRs - Run `/sp.adr` for recommended decisions
3. ⏭️ Generate tasks - Run `/sp.tasks` to create implementation tasks
4. ⏭️ Setup environment - Install UV, initialize project
5. ⏭️ Implement - Follow tasks.md order
6. ⏭️ Test - Execute acceptance scenarios
7. ⏭️ Document - Create README.md and CLAUDE.md

**Plan Status**: ✅ Complete - Ready for `/sp.tasks`

