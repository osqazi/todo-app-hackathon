# Data Model: Todo In-Memory Python Console App

**Feature**: 001-todo-basic-console
**Date**: 2025-12-27
**Status**: Designed (awaiting implementation)

---

## Overview

This document specifies the domain model for the Todo application, focusing on the Task entity and its relationships, validation rules, and state transitions.

---

## Entities

### Task

**Description**: Represents a single todo item with title, optional description, completion status, and metadata.

**Implementation**: Python `@dataclass` with type hints

#### Attributes

| Attribute | Type | Required | Default | Validation | Description |
|-----------|------|----------|---------|------------|-------------|
| `id` | `int` | Yes | Auto-generated | Must be positive integer >= 1 | Unique identifier for CRUD operations |
| `title` | `str` | Yes | N/A | Cannot be empty after strip(), max 200 chars | Primary task description |
| `description` | `str` | No | `""` | No validation (any string) | Optional detailed description |
| `completed` | `bool` | Yes | `False` | Must be boolean | Completion status (False=incomplete, True=complete) |
| `created_at` | `datetime` | Yes | Auto-generated | Must be UTC timezone-aware | Timestamp of task creation |

#### Python Implementation

```python
from dataclasses import dataclass
from datetime import datetime, timezone

@dataclass
class Task:
    """Represents a single todo task.

    Attributes:
        id: Unique identifier (auto-generated, starting at 1)
        title: Task title (required, non-empty, max 200 chars)
        description: Optional task description (default: empty string)
        completed: Completion status (default: False for incomplete)
        created_at: UTC timestamp of task creation (auto-generated)
    """
    id: int
    title: str
    description: str = ""
    completed: bool = False
    created_at: datetime = None  # Set in __post_init__

    def __post_init__(self):
        """Initialize created_at if not provided."""
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)
```

---

## Validation Rules

### Title Validation

**Rule**: Title must not be empty after stripping whitespace

**Enforcement Layer**: Service layer (`task_service.py`)

**Implementation**:
```python
def _validate_title(title: str) -> None:
    """Validate task title.

    Raises:
        InvalidTaskError: If title is empty or only whitespace
    """
    if not title.strip():
        raise InvalidTaskError("Title cannot be empty")
    if len(title) > 200:
        raise InvalidTaskError("Title too long (max 200 characters)")
```

**Error Response**: `InvalidTaskError("Title cannot be empty")`

**User Message**: `"✗ Error: Title cannot be empty"`

### ID Validation

**Rule**: ID must be positive integer and exist in storage

**Enforcement Layer**: Repository layer (`task_repository.py`)

**Implementation**:
```python
def get_by_id(self, task_id: int) -> Task:
    """Retrieve task by ID.

    Args:
        task_id: Task ID to retrieve

    Returns:
        Task object

    Raises:
        TaskNotFoundError: If task_id not found in storage
    """
    if task_id not in self._tasks:
        raise TaskNotFoundError(task_id)
    return self._tasks[task_id]
```

**Error Response**: `TaskNotFoundError(task_id)`

**User Message**: `"✗ Error: Task ID {task_id} not found"`

### Description Validation

**Rule**: No validation required (any string allowed, including empty)

**Enforcement Layer**: None

**Rationale**: Description is optional detail, no business constraints

---

## State Transitions

### Task Lifecycle

```
┌──────────────┐
│ Task Created │ ← Initial state
│ completed=F  │
└──────┬───────┘
       │
       │ User: Mark Complete
       ▼
┌──────────────┐
│   Completed  │
│ completed=T  │
└──────┬───────┘
       │
       │ User: Mark Incomplete (toggle)
       ▼
┌──────────────┐
│  Incomplete  │
│ completed=F  │
└──────────────┘
       ▲
       │ Can toggle indefinitely
       └──────────────────────┘
```

### Valid Transitions

| From State | Action | To State | Implementation |
|------------|--------|----------|----------------|
| Created (F) | Mark Complete | Completed (T) | `task.completed = True` |
| Completed (T) | Mark Incomplete | Incomplete (F) | `task.completed = False` |
| Incomplete (F) | Mark Complete | Completed (T) | `task.completed = True` |
| Completed (T) | Mark Complete | Completed (T) | Idempotent (no change) |

### Toggle Logic

**Implementation**:
```python
def toggle_status(self, task_id: int) -> Task:
    """Toggle task completion status.

    Args:
        task_id: ID of task to toggle

    Returns:
        Updated task with toggled status

    Raises:
        TaskNotFoundError: If task_id not found
    """
    task = self.get_by_id(task_id)  # May raise TaskNotFoundError
    task.completed = not task.completed
    return task
```

**Behavior**:
- Incomplete → Complete
- Complete → Incomplete
- Idempotent: Calling twice returns to original state

---

## Relationships

### Task Entity (No relationships in Phase I)

**Note**: Phase I implements a single entity model with no relationships.

**Future Phases** (out of scope for Phase I):
- Task → Category (many-to-one)
- Task → Tags (many-to-many)
- Task → User (many-to-one for multi-user)
- Task → Subtasks (one-to-many for task decomposition)

---

## Data Storage Schema

### In-Memory Storage Structure

**Repository Implementation**: Dictionary-based storage

```python
class TaskRepository:
    def __init__(self):
        self._tasks: dict[int, Task] = {}
        self._next_id: int = 1
```

**Storage Format**:
```python
{
    1: Task(id=1, title="Buy groceries", description="Milk, eggs", completed=False, created_at=...),
    2: Task(id=2, title="Write docs", description="", completed=True, created_at=...),
    3: Task(id=3, title="Fix bug", description="Handle edge case", completed=False, created_at=...)
}
```

**Key Properties**:
- **Key**: Task ID (int)
- **Value**: Task object (full dataclass instance)
- **Ordering**: Insertion order preserved (Python 3.7+ dict guarantee)
- **Lookup**: O(1) by ID
- **Iteration**: O(n) for all tasks (used in "View All")

---

## ID Generation Strategy

### Sequential Counter

**Algorithm**: Start at 1, increment on each create

**Implementation**:
```python
def create(self, title: str, description: str = "") -> Task:
    """Create and store a new task.

    Args:
        title: Task title (required, validated)
        description: Optional task description

    Returns:
        Newly created task with auto-generated ID
    """
    task = Task(
        id=self._next_id,
        title=title,
        description=description,
        completed=False,
        created_at=datetime.now(timezone.utc)
    )
    self._tasks[self._next_id] = task
    self._next_id += 1
    return task
```

**Guarantees**:
- **Uniqueness**: Each ID used exactly once
- **Monotonicity**: IDs always increase (1, 2, 3, ...)
- **No gaps**: IDs are sequential with no skipped values
- **Determinism**: Same creation order produces same IDs

**Edge Cases**:
- **Empty list**: First task gets ID 1
- **After deletions**: Next ID continues from counter (no ID reuse)
- **Integer overflow**: Not a concern for Phase I (max ~2 billion tasks)

---

## Display Formatting

### Console Display Format

**List View**:
```
[ID] [Status] Title
    Description: <description>
```

**Status Indicators**:
- Incomplete: `[ ]`
- Complete: `[X]`

**Example Output**:
```
=== All Tasks ===

[1] [ ] Buy groceries
    Description: Milk, eggs, bread

[2] [X] Write documentation
    Description: README with setup instructions

[3] [ ] Fix critical bug
    Description: Memory leak in auth module
```

**Title Truncation** (for very long titles):
```python
def format_title(title: str, max_length: int = 70) -> str:
    """Format title for console display with truncation.

    Args:
        title: Full task title
        max_length: Maximum display length (default 70 chars)

    Returns:
        Formatted title (truncated with "..." if > max_length)
    """
    if len(title) <= max_length:
        return title
    return title[:max_length-3] + "..."
```

---

## Data Constraints

### Hard Constraints (Enforced by Code)

| Constraint | Enforcement | Error |
|------------|-------------|-------|
| Title not empty | Service layer validation | `InvalidTaskError` |
| Title max 200 chars | Service layer validation | `InvalidTaskError` |
| ID must exist for updates/deletes | Repository lookup | `TaskNotFoundError` |
| ID must be positive integer | Type system (int type hint) | `ValueError` on parse |
| Completed must be boolean | Type system (bool type hint) | N/A |

### Soft Constraints (Recommendations)

| Constraint | Rationale | Handling |
|------------|-----------|----------|
| Description < 500 chars | Readability in console | No error, truncate display |
| Task count < 1000 | Performance target | No limit, warn if slow |
| Title < 70 chars | Fits in 80-char terminal | No error, truncate display |

---

## Testing Scenarios

### Domain Model Tests

**Test Category**: Unit tests for Task dataclass

1. **Task Creation**:
   - Create task with all fields
   - Create task with minimal fields (title only)
   - Verify auto-generated ID
   - Verify auto-generated created_at (UTC)
   - Verify default values (completed=False, description="")

2. **Task Validation**:
   - Empty title rejected
   - Whitespace-only title rejected
   - Title > 200 chars rejected
   - Empty description allowed
   - Very long description allowed

3. **Status Toggle**:
   - Toggle incomplete to complete
   - Toggle complete to incomplete
   - Idempotent toggle (twice returns to original)

4. **Data Integrity**:
   - Task equality (two tasks with same ID are equal)
   - Task string representation (useful __repr__)
   - Task immutability (if using frozen dataclass)

### Repository Tests

**Test Category**: Unit tests for TaskRepository

1. **CRUD Operations**:
   - Create task and verify ID generation
   - Read task by ID
   - Read all tasks (empty list, single task, multiple tasks)
   - Update task title and/or description
   - Delete task by ID
   - Toggle task status

2. **Error Handling**:
   - Get non-existent ID raises TaskNotFoundError
   - Update non-existent ID raises TaskNotFoundError
   - Delete non-existent ID raises TaskNotFoundError
   - Toggle non-existent ID raises TaskNotFoundError

3. **Edge Cases**:
   - Create task with very long title (truncated in display, stored full)
   - Create 100+ tasks (performance validation)
   - Delete all tasks (empty list state)
   - Update task to empty title (rejected by service)

---

## Migration Path (Future Phases)

### Phase II: Persistence

**Changes Required**:
- Add database schema (SQLite, PostgreSQL)
- Update Task dataclass with ORM annotations (SQLAlchemy, SQLModel)
- Implement persistent TaskRepository
- Add data migration scripts

**Backward Compatibility**:
- In-memory implementation remains as fallback
- Task entity structure unchanged (same attributes)
- Service layer unchanged (repository interface abstraction)

### Phase III: Advanced Features

**Potential Enhancements**:
- Add `priority` field (int: 1=high, 2=medium, 3=low)
- Add `category` field (str: "work", "personal", etc.)
- Add `due_date` field (datetime, optional)
- Add `tags` relationship (many-to-many)
- Add `parent_task_id` for subtasks (self-referential)

**Migration Strategy**:
- Use Enum for status instead of bool
- Add nullable fields initially (default None)
- Backfill existing tasks with sensible defaults

---

## Summary

### Entity Count
- **1 Entity**: Task

### Attribute Count (Task)
- **5 Attributes**: id, title, description, completed, created_at

### Validation Rules
- **2 Mandatory**: Title not empty, ID exists
- **1 Optional**: Title max length (soft limit)

### State Transitions
- **2 States**: Incomplete, Complete
- **1 Operation**: Toggle (bidirectional)

### Storage Structure
- **Data Structure**: `dict[int, Task]`
- **Performance**: O(1) CRUD operations

---

**Data Model Status**: ✅ Complete - Ready for implementation in domain/task.py
