# Research Findings: Todo In-Memory Python Console App

**Feature**: 001-todo-basic-console
**Date**: 2025-12-27
**Research Strategy**: Just-in-time research following research-concurrent approach

---

## Overview

This document consolidates all research findings from the planning phase, documenting decisions made with supporting evidence and rationale.

---

## UV Package Manager

### Research Question
What is UV and how does it compare to traditional Python package management?

### Findings
- **What**: Modern Python package installer and resolver written in Rust
- **Speed**: 10-100x faster than pip for dependency resolution
- **Compatibility**: Drop-in replacement for pip, works with PyPI
- **Project Management**: Supports `pyproject.toml` standard
- **Commands**:
  - `uv init` - Initialize new project
  - `uv add <package>` - Add dependency
  - `uv sync` - Install all dependencies
  - `uv run <command>` - Run in UV environment

### Decision
Use UV as primary package manager for this project

### Rationale
- Specified in constitution as required technology
- Modern, fast alternative to pip
- Good learning opportunity for hackathon participants
- Compatible with standard Python packaging

### Source
Astral. (2024). UV: An extremely fast Python package installer and resolver. https://astral.sh/uv

---

## Python Project Structure

### Research Question
What is the recommended package structure for a Python console application?

### Findings
**Standard Python Package Layout**:
```
project/
├── src/
│   └── package_name/
│       ├── __init__.py
│       ├── module1.py
│       └── module2.py
├── tests/
├── pyproject.toml
└── README.md
```

**Layered Architecture Pattern**:
- **Domain Layer**: Business entities and rules (no external dependencies)
- **Repository Layer**: Data access abstraction
- **Service Layer**: Business logic orchestration
- **Presentation Layer**: UI/CLI interface

### Decision
Use layered architecture with domain/repository/service/ui organization

### Rationale
- Clear separation of concerns enables independent testing
- Each layer has single responsibility
- Easy to swap implementations (e.g., repository for persistence later)
- Aligns with professional Python practices
- Educational value for hackathon learning objectives

### Source
Python Packaging Authority. (2024). Python Packaging User Guide. https://packaging.python.org/

---

## In-Memory Data Structures

### Research Question
Which Python data structure is optimal for in-memory task storage?

### Options Evaluated

#### Option 1: Dictionary (`dict[int, Task]`)
- **Pros**: O(1) lookup/insert/delete, insertion order preserved (Python 3.7+)
- **Cons**: Slightly more memory than list
- **Best for**: ID-based access patterns

#### Option 2: List (`list[Task]`)
- **Pros**: Simple, ordered, slightly less memory
- **Cons**: O(n) lookup by ID, O(n) deletion
- **Best for**: Sequential access patterns

#### Option 3: OrderedDict
- **Pros**: Explicit ordering guarantee
- **Cons**: Redundant since Python 3.7+ dicts maintain order
- **Best for**: Legacy Python versions

### Performance Analysis

For 100 tasks with ID-based operations:
- Dict lookup: O(1) ≈ 1 operation
- List lookup: O(n) ≈ 50 operations average
- Dict delete: O(1) ≈ 1 operation
- List delete: O(n) ≈ 50 operations + list shift

### Decision
Use `dict[int, Task]` for primary storage

### Rationale
- All CRUD operations are ID-based (FR-005, FR-006, FR-007)
- O(1) performance meets < 100ms requirement for 100 tasks
- Insertion order preserved for consistent "View All" (Python 3.7+)
- Simpler repository implementation (no index management)

### Source
Python Software Foundation. (2024). Python Data Structures. https://docs.python.org/3/tutorial/datastructures.html

---

## Task Domain Model

### Research Question
How should the Task entity be implemented in Python?

### Options Evaluated

#### Option 1: @dataclass
```python
from dataclasses import dataclass
from datetime import datetime

@dataclass
class Task:
    id: int
    title: str
    description: str
    completed: bool
    created_at: datetime
```
- **Pros**: Auto-generates `__init__`, `__repr__`, `__eq__`, type hints built-in
- **Cons**: Mutable by default (can use `frozen=True`)

#### Option 2: NamedTuple
```python
from typing import NamedTuple
from datetime import datetime

class Task(NamedTuple):
    id: int
    title: str
    description: str
    completed: bool
    created_at: datetime
```
- **Pros**: Immutable, lightweight
- **Cons**: Difficult to update (requires creating new instance)

#### Option 3: Plain Class
```python
class Task:
    def __init__(self, id, title, description, completed, created_at):
        self.id = id
        # ... manual assignment
```
- **Pros**: Full control
- **Cons**: Boilerplate code, no automatic methods

### Decision
Use `@dataclass` with default mutability

### Rationale
- Clean syntax with type hints
- Auto-generated methods reduce boilerplate
- Mutable instances simplify updates (toggle status, edit title/description)
- Standard modern Python pattern
- Good IDE support for autocompletion

### Source
Python Software Foundation. (2024). dataclasses - Data Classes. https://docs.python.org/3/library/dataclasses.html

---

## ID Generation Strategy

### Research Question
How to generate unique task IDs without a database?

### Options Evaluated

#### Option 1: Sequential Integer Counter
- **Implementation**: Start at 1, increment on each create
- **Pros**: Human-readable, deterministic, testable
- **Cons**: Predictable (not a concern for single-user app)

#### Option 2: UUID4
```python
import uuid
task_id = str(uuid.uuid4())
```
- **Pros**: Universally unique, no collision risk
- **Cons**: Not human-readable (`"550e8400-e29b-41d4-a716-446655440000"`), harder to type in console

#### Option 3: Timestamp-based
```python
task_id = int(time.time() * 1000)  # milliseconds
```
- **Pros**: Sortable by creation time
- **Cons**: Collision risk if tasks created in same millisecond

### Decision
Sequential integer counter starting at 1

### Rationale
- Spec explicitly requires: "starting from 1, incrementing sequentially" (FR-002)
- Human-readable for console display ("Task 5" vs "Task 550e8400...")
- Easy to type for update/delete/toggle operations
- Deterministic behavior simplifies testing
- No collision risk in single-user, single-process app

---

## Status Representation

### Research Question
How to represent task completion status?

### Options Evaluated

#### Option 1: Boolean
```python
completed: bool  # False = incomplete, True = complete
```
- **Pros**: Simple, direct toggle logic
- **Cons**: Not extensible to multiple statuses

#### Option 2: Enum
```python
from enum import Enum

class TaskStatus(Enum):
    PENDING = "pending"
    COMPLETED = "completed"
```
- **Pros**: Type-safe, extensible, self-documenting
- **Cons**: More complex for simple toggle

#### Option 3: String
```python
status: str  # "pending" or "completed"
```
- **Pros**: Flexible, readable in storage
- **Cons**: No type safety, prone to typos

### Decision
Boolean (`completed: bool`) for Phase I

### Rationale
- Spec only requires complete/incomplete (two states)
- Simplest implementation for toggle behavior (FR-004)
- Directly maps to console indicators: `False = [ ]`, `True = [X]`
- Easy to migrate to Enum in Phase II if new statuses added
- Minimal cognitive overhead for learning objectives

---

## Error Handling Strategy

### Research Question
What error handling approach fits Python console applications?

### Options Evaluated

#### Option 1: Exceptions
```python
class TaskNotFoundError(Exception):
    pass

def get_task(task_id):
    if task_id not in tasks:
        raise TaskNotFoundError(f"Task {task_id} not found")
    return tasks[task_id]
```
- **Pros**: Pythonic (EAFP), clear separation of normal/error flow
- **Cons**: Can be overused

#### Option 2: Return Codes
```python
def get_task(task_id):
    if task_id not in tasks:
        return None, "Task not found"
    return tasks[task_id], None
```
- **Pros**: Explicit error handling
- **Cons**: Not idiomatic Python, easy to ignore errors

#### Option 3: Result/Either Pattern
```python
from typing import Union

Result = Union[Task, Error]

def get_task(task_id) -> Result:
    ...
```
- **Pros**: Functional programming style
- **Cons**: Unfamiliar to Python developers, adds complexity

### Decision
Custom exceptions with user-friendly messages

### Rationale
- **EAFP (Easier to Ask for Forgiveness than Permission)** - Python philosophy
- Clean separation: try/except at controller layer, raise in repository/service
- Custom exceptions (`TaskNotFoundError`, `InvalidTaskError`) provide context
- Easy to map exceptions to user messages at UI boundary
- Standard Python practice for error conditions

### Implementation
```python
# domain/exceptions.py
class TaskNotFoundError(Exception):
    def __init__(self, task_id: int):
        self.task_id = task_id
        super().__init__(f"Task ID {task_id} not found")

class InvalidTaskError(Exception):
    pass
```

---

## Testing Strategy

### Research Question
What testing approach balances quality with hackathon time constraints?

### Options Evaluated

#### Option 1: Manual Testing Only
- **Time**: Minimal setup, immediate start
- **Coverage**: Requires discipline for comprehensive testing
- **Confidence**: Lower, relies on manual execution

#### Option 2: Full TDD with pytest
- **Time**: Significant upfront investment (setup + writing tests)
- **Coverage**: High, tests written before implementation
- **Confidence**: High, automated regression prevention

#### Option 3: Hybrid (Manual + Selective Automated)
- **Time**: Moderate (optional test setup, manual as primary)
- **Coverage**: Critical paths automated, full flow manual
- **Confidence**: Medium-high

### Decision
Hybrid approach - Manual acceptance testing required, automated tests optional

### Rationale
- **Hackathon constraints**: 4-8 hour timeline prioritizes working code over test suite
- **Learning objectives**: Understand test design through manual scenarios
- **Risk mitigation**: Critical business logic (repository CRUD) can be unit tested if time allows
- **Acceptance criteria**: 15 scenarios from spec provide comprehensive manual test plan
- **Flexibility**: Developers can add pytest if comfortable, not mandatory

### Manual Test Plan
Execute all 15 acceptance scenarios from spec:
- Add task: 4 scenarios
- Delete task: 4 scenarios
- Update task: 5 scenarios
- View tasks: 4 scenarios
- Mark complete: 4 scenarios

### Optional Automated Tests
- Repository unit tests (CRUD operations)
- Service validation tests
- Integration tests (service + repository)

---

## Console Menu Patterns

### Research Question
Should we use a library for console menus or build custom?

### Options Evaluated

#### Option 1: Custom Implementation
```python
while True:
    print("=== Todo App ===")
    print("1. Add Task")
    print("2. View All Tasks")
    choice = input("Enter choice: ")
    if choice == "1":
        add_task()
```
- **Pros**: No dependencies, full control, simple
- **Cons**: Manual input handling

#### Option 2: questionary Library
```python
import questionary
choice = questionary.select(
    "What do you want to do?",
    choices=["Add Task", "View All", "Exit"]
).ask()
```
- **Pros**: Interactive, arrow-key navigation, polished UX
- **Cons**: External dependency, harder to test I/O

#### Option 3: click Framework
```python
import click

@click.command()
@click.option('--add', help='Add a task')
def cli(add):
    ...
```
- **Pros**: Robust CLI framework, widely used
- **Cons**: Different interaction model (flags vs menu)

### Decision
Custom implementation (no library)

### Rationale
- **Constitution constraint**: "Minimize external packages; prefer Python standard library"
- **Simplicity**: Menu logic is straightforward (< 50 lines)
- **Testability**: Easier to mock stdin/stdout without library coupling
- **Learning**: Demonstrates basic console I/O patterns
- **Cross-platform**: Avoids potential terminal compatibility issues

---

## Summary of Key Decisions

| Decision Area | Choice | Rationale |
|---------------|--------|-----------|
| **Package Manager** | UV | Constitution requirement, modern tooling |
| **Project Structure** | Layered (domain/repo/service/ui) | Separation of concerns, testability |
| **Data Structure** | `dict[int, Task]` | O(1) operations, ID-based access |
| **Task Model** | `@dataclass` | Clean syntax, auto-methods, type hints |
| **ID Generation** | Sequential integer (1, 2, 3...) | Spec requirement, human-readable |
| **Status** | `bool` (completed) | Simple toggle, meets Phase I needs |
| **Error Handling** | Custom exceptions | Pythonic, clear flow separation |
| **Testing** | Manual + optional automated | Balances quality with time constraints |
| **Console Menu** | Custom (no library) | No dependencies, simple, testable |

---

## Knowledge Gaps Resolved

- [x] UV project initialization and workflow
- [x] Python 3.13+ compatibility (all features compatible)
- [x] Console menu implementation patterns
- [x] In-memory storage performance characteristics
- [x] ID generation without external dependencies
- [x] Error handling in console applications
- [x] Testing strategies for I/O-heavy apps

---

## Next Steps

1. Create data-model.md with detailed Task entity specification
2. Create quickstart.md with UV setup instructions
3. Run `/sp.tasks` to generate implementation tasks
4. Begin implementation following layered architecture

---

**Research Status**: ✅ Complete - All planning unknowns resolved with evidence-based decisions
