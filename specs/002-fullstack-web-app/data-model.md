# Data Model: Phase II Full-Stack Web Application

**Feature Branch**: `002-fullstack-web-app`
**Date**: 2025-12-28
**Input**: Feature specification requirements and research decisions

## Overview

This document defines the database schema and data models for the multi-user todo application using SQLModel (combines SQLAlchemy + Pydantic) with Neon Serverless PostgreSQL.

### Design Principles

1. **User Isolation**: All task data includes `user_id` foreign key for multi-tenancy
2. **Audit Trail**: Creation and modification timestamps on all mutable entities
3. **Type Safety**: Pydantic models provide runtime validation and API contracts
4. **Progressive Evolution**: Extends Phase I domain models with persistence layer

---

## Entity Relationship Diagram

```
┌─────────────────┐
│     User        │
├─────────────────┤
│ id: int (PK)    │
│ email: str (UK) │
│ password_hash   │
│ created_at      │
└────────┬────────┘
         │
         │ 1:N (one user has many tasks)
         │
         ↓
┌─────────────────┐
│     Task        │
├─────────────────┤
│ id: int (PK)    │
│ user_id: int FK │◄─── Foreign key enforces relationship
│ title: str      │
│ description     │
│ completed: bool │
│ created_at      │
│ updated_at      │
└─────────────────┘
```

---

## 1. User Entity

### Purpose
Represents an authenticated user account with secure credential storage.

### Table: `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| `email` | VARCHAR(320) | NOT NULL, UNIQUE, INDEX | User's email address (RFC 5321 max length) |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password (managed by Better Auth) |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Account creation timestamp |

### SQLModel Definition

```python
# src/domain/models.py
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel

class User(SQLModel, table=True):
    """User account with secure authentication.

    Managed by Better Auth - application code typically does not directly
    create or modify user records (handled by auth library).
    """
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(
        sa_column_kwargs={"unique": True},
        max_length=320,
        index=True,
        description="User's email address (unique identifier for signin)"
    )
    password_hash: str = Field(
        max_length=255,
        description="Bcrypt hashed password (never plaintext)"
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Account creation timestamp (UTC)"
    )
```

### Validation Rules

- **Email Format**: Must be valid email format (validated by Pydantic `EmailStr` or Better Auth)
- **Email Uniqueness**: No duplicate emails allowed (enforced by database UNIQUE constraint)
- **Password Storage**: Only bcrypt hashes stored; plaintext passwords never persisted
- **Password Strength**: Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number (enforced by Better Auth)

### Indexes

- **Primary Key**: `id` (automatic index)
- **Email Index**: For fast signin lookups (`WHERE email = ?`)

### Relationships

- **Tasks**: One user has many tasks (1:N relationship via `task.user_id` foreign key)

---

## 2. Task Entity

### Purpose
Represents a single todo item belonging to a specific user.

### Table: `tasks`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique task identifier |
| `user_id` | INTEGER | NOT NULL, FOREIGN KEY → `users.id`, INDEX | Owner of the task |
| `title` | VARCHAR(500) | NOT NULL | Task title (1-500 characters) |
| `description` | TEXT | DEFAULT '' | Optional task description (max 2000 chars) |
| `completed` | BOOLEAN | NOT NULL, DEFAULT FALSE | Completion status |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Task creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NULL | Last modification timestamp |

### SQLModel Definition

```python
# src/domain/models.py
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel

class TaskBase(SQLModel):
    """Shared task properties for create/update requests."""
    title: str = Field(
        min_length=1,
        max_length=500,
        description="Task title (required, 1-500 characters)"
    )
    description: str = Field(
        default="",
        max_length=5000,
        description="Task description (optional, max 2000 characters)"
    )

class Task(TaskBase, table=True):
    """Task database model with user ownership and audit fields."""
    __tablename__ = "tasks"

    # Primary key
    id: Optional[int] = Field(default=None, primary_key=True)

    # Foreign key (user ownership)
    user_id: int = Field(
        foreign_key="users.id",
        index=True,
        description="ID of user who owns this task"
    )

    # Task state
    completed: bool = Field(
        default=False,
        description="Whether task is completed (True) or incomplete (False)"
    )

    # Audit timestamps
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Task creation timestamp (UTC)"
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        description="Last modification timestamp (UTC), NULL if never modified"
    )

class TaskCreate(TaskBase):
    """Request model for creating tasks.

    Omits id, user_id (injected from JWT), completed (defaults False),
    and timestamps (auto-generated).
    """
    pass

class TaskUpdate(SQLModel):
    """Request model for updating tasks.

    All fields optional to support partial updates.
    """
    title: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=500
    )
    description: Optional[str] = Field(
        default=None,
        max_length=5000
    )

class TaskPublic(TaskBase):
    """Response model for task data.

    Omits user_id (implicit from authentication context) for security.
    """
    id: int
    completed: bool
    created_at: datetime
    updated_at: Optional[datetime]
```

### Validation Rules

- **Title Required**: Cannot be NULL, empty string, or whitespace-only (enforced by Pydantic + service layer)
- **Title Length**: 1-500 characters after trimming whitespace
- **Description Optional**: Defaults to empty string if not provided
- **Description Length**: Maximum 2000 characters
- **Completed Default**: New tasks default to incomplete (`completed = False`)
- **Updated Timestamp**: Set to current UTC time whenever title, description, or completed changes

### Indexes

- **Primary Key**: `id` (automatic index)
- **User ID Index**: For fast user-scoped queries (`WHERE user_id = ?`)
- **Composite Index** (optional optimization): `(user_id, created_at DESC)` for paginated lists

### Relationships

- **User**: Each task belongs to exactly one user (N:1 relationship via `user_id` foreign key)

### Foreign Key Behavior

```sql
ALTER TABLE tasks
ADD CONSTRAINT fk_tasks_user_id
FOREIGN KEY (user_id) REFERENCES users(id)
ON DELETE CASCADE;  -- Delete all tasks when user is deleted
```

**Rationale**: If a user account is deleted, their tasks should also be deleted (cascade delete).

---

## 3. State Transitions

### Task Lifecycle

```
[New Task]
    ↓ (create)
[Incomplete] ←──────┐
    ↓ (toggle)      │ (toggle)
[Complete]   ───────┘
    ↓ (delete)
[Deleted]
```

### State Machine

| Current State | Action | New State | Validation |
|---------------|--------|-----------|------------|
| N/A | Create | Incomplete | Title required, non-empty |
| Incomplete | Toggle | Complete | None |
| Complete | Toggle | Incomplete | None |
| Incomplete | Update | Incomplete | Title required if provided |
| Complete | Update | Complete | Title required if provided |
| Any | Delete | Deleted | User must own task |

### Business Rules

1. **Creation**: Tasks always start in incomplete state (`completed = False`)
2. **Toggle**: Completion status can be toggled indefinitely
3. **Update**: Completion status is independent of title/description updates
4. **Deletion**: Soft delete is not implemented; tasks are permanently removed
5. **Ownership**: Users can only create, read, update, delete, or toggle their own tasks

---

## 4. Field Specifications

### Timestamp Fields

All timestamps use **UTC timezone** to avoid ambiguity in distributed systems.

```python
# Correct: Use timezone-aware datetimes
datetime.now(timezone.utc)

# Incorrect: Naive datetimes cause issues
datetime.now()  # Don't use this!
```

**Storage**: PostgreSQL `TIMESTAMP WITH TIME ZONE` (stores in UTC, displays in local timezone)

### String Fields

| Field | Min Length | Max Length | Trimming | Empty String Allowed |
|-------|-----------|------------|----------|----------------------|
| `user.email` | 3 | 320 | Yes | No |
| `task.title` | 1 | 200 | Yes | No |
| `task.description` | 0 | 2000 | Yes | Yes (defaults to "") |

**Trimming Strategy**: All string inputs are trimmed before validation and storage.

```python
# Service layer validation
def add_task(self, title: str, description: str = "") -> Task:
    title = title.strip()
    description = description.strip()

    if not title:
        raise InvalidTaskError("Title cannot be empty")

    return self._repository.create(title, description)
```

### Boolean Fields

- **Storage**: PostgreSQL `BOOLEAN` (true/false, not 0/1)
- **Default**: `completed` defaults to `False` (incomplete)
- **JSON Serialization**: Lowercase `true`/`false` (JavaScript convention)

---

## 5. Query Patterns

### User Isolation Enforcement

**Critical Rule**: ALL task queries MUST include `user_id` filter.

```python
# Correct: User isolation enforced
statement = select(Task).where(
    Task.id == task_id,
    Task.user_id == current_user_id  # REQUIRED
)

# Incorrect: Missing user isolation (SECURITY VULNERABILITY!)
statement = select(Task).where(Task.id == task_id)  # DON'T DO THIS
```

### Common Queries

**List All Tasks for User** (with pagination):
```python
statement = (
    select(Task)
    .where(Task.user_id == user_id)
    .order_by(Task.created_at.desc())
    .offset(offset)
    .limit(limit)
)
```

**Get Specific Task** (with ownership verification):
```python
statement = select(Task).where(
    Task.id == task_id,
    Task.user_id == user_id  # Returns None if user doesn't own task
)
task = session.exec(statement).first()
if not task:
    raise TaskNotFoundError(task_id)  # Same error for not found or unauthorized
```

**Toggle Completion Status**:
```python
# Fetch with ownership check
task = get_task_by_id_and_user(task_id, user_id)

# Update
task.completed = not task.completed
task.updated_at = datetime.now(timezone.utc)
session.add(task)
session.commit()
```

**Update Task Fields**:
```python
task = get_task_by_id_and_user(task_id, user_id)

if title is not None:
    task.title = title
if description is not None:
    task.description = description
task.updated_at = datetime.now(timezone.utc)

session.add(task)
session.commit()
```

### Index Usage

**Efficient Queries** (use indexes):
- `WHERE user_id = ?` → Uses `user_id` index
- `WHERE id = ?` → Uses primary key index
- `WHERE user_id = ? AND id = ?` → Uses both indexes

**Inefficient Queries** (no index):
- `WHERE title LIKE '%search%'` → Full table scan (search not in Phase II scope)
- `WHERE completed = ?` without `user_id` → Scans all tasks across all users

---

## 6. Data Constraints Summary

### Database-Level Constraints

| Constraint | Type | Enforcement | Purpose |
|------------|------|-------------|---------|
| `users.email` UNIQUE | Uniqueness | Database | Prevent duplicate accounts |
| `tasks.user_id` FOREIGN KEY | Referential Integrity | Database | Ensure task belongs to valid user |
| `tasks.user_id` NOT NULL | Required | Database | Every task must have an owner |
| `tasks.title` NOT NULL | Required | Database | Task title is mandatory |
| `tasks.completed` DEFAULT FALSE | Default Value | Database | New tasks are incomplete |

### Application-Level Validation

| Validation | Layer | Implementation | Purpose |
|------------|-------|----------------|---------|
| Title min 1 char | Pydantic | `Field(min_length=1)` | Prevent empty titles |
| Title max 200 chars | Pydantic | `Field(max_length=500)` | Prevent excessively long titles |
| Email format | Pydantic/Better Auth | `EmailStr` validator | Ensure valid email format |
| Password strength | Better Auth | Configurable rules | Enforce security policy |
| Title not whitespace | Service | `if not title.strip()` | Prevent whitespace-only titles |

### Defense-in-Depth Strategy

1. **Client-Side**: HTML5 form validation (UX, not security)
2. **API Layer**: Pydantic models validate request format
3. **Service Layer**: Business rules (title not empty, length limits)
4. **Database Layer**: Constraints enforce critical invariants (NOT NULL, FOREIGN KEY)

---

## 7. Migration Strategy

### Initial Schema Creation

```sql
-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(320) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Create tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_user_created ON tasks(user_id, created_at DESC);  -- Optional
```

### SQLModel Auto-Migration (Development Only)

```python
# src/main.py
from sqlmodel import SQLModel, create_engine
from src.domain.models import User, Task

engine = create_engine(DATABASE_URL)

# Creates all tables if they don't exist (dev only!)
SQLModel.metadata.create_all(engine)
```

**Warning**: `create_all()` does not handle schema changes (adding/removing columns). For production, use Alembic migrations.

### Future: Alembic Migrations (Phase III/IV)

```bash
# Initialize Alembic
alembic init alembic

# Generate migration from model changes
alembic revision --autogenerate -m "Add tasks table"

# Apply migration
alembic upgrade head
```

---

## 8. Performance Considerations

### Neon Serverless Optimizations

1. **Connection Pooling**: Small pool size (5-10 connections) for serverless architecture
2. **Scale-to-Zero**: Neon suspends after inactivity; `pool_pre_ping=True` validates connections
3. **Query Optimization**: Always include `user_id` in WHERE clauses (uses index)
4. **Limit Results**: Use pagination (offset/limit) for large result sets

### Pagination Pattern

```python
# Efficient: Offset + limit
def get_all_tasks(user_id: int, offset: int = 0, limit: int = 100) -> list[Task]:
    statement = (
        select(Task)
        .where(Task.user_id == user_id)
        .order_by(Task.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return session.exec(statement).all()

# Call with pagination
tasks = get_all_tasks(user_id=1, offset=0, limit=20)  # First 20 tasks
```

### Index Cardinality

| Index | Cardinality | Selectivity | Use Case |
|-------|-------------|-------------|----------|
| `users.id` (PK) | High (unique) | Very high | Single user lookup |
| `users.email` (UNIQUE) | High (unique) | Very high | Signin |
| `tasks.id` (PK) | High (unique) | Very high | Single task lookup |
| `tasks.user_id` | Medium | Medium-High | User's tasks |
| `tasks.completed` | Low (2 values) | Low | Not indexed (not selective) |

**Rule**: Index columns with high selectivity (many unique values) that appear in WHERE clauses.

---

## 9. Testing Data

### Seed Data (Development)

```python
# tests/fixtures/seed_data.py
from datetime import datetime, timezone
from src.domain.models import User, Task

# Test users
user1 = User(
    id=1,
    email="alice@example.com",
    password_hash="$2b$12$...",  # bcrypt hash of "password123"
    created_at=datetime(2025, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
)

user2 = User(
    id=2,
    email="bob@example.com",
    password_hash="$2b$12$...",
    created_at=datetime(2025, 1, 2, 12, 0, 0, tzinfo=timezone.utc)
)

# Test tasks
tasks = [
    Task(id=1, user_id=1, title="Buy groceries", description="Milk, eggs, bread", completed=False),
    Task(id=2, user_id=1, title="Write blog post", description="", completed=True),
    Task(id=3, user_id=2, title="Call dentist", description="Schedule cleaning", completed=False),
]
```

### Test Scenarios

| Scenario | User | Tasks | Purpose |
|----------|------|-------|---------|
| Empty User | alice@example.com | 0 tasks | Test empty state UI |
| Single Task | bob@example.com | 1 task (incomplete) | Test basic CRUD |
| Multiple Tasks | charlie@example.com | 10 tasks (mix of complete/incomplete) | Test list rendering |
| User Isolation | alice, bob | Each has own tasks | Test multi-user isolation |

---

## 10. Security Considerations

### SQL Injection Prevention

**SQLModel** automatically uses parameterized queries (safe from SQL injection):

```python
# Safe: SQLModel uses parameter binding
statement = select(Task).where(Task.title == user_input)

# Unsafe: String concatenation (DON'T DO THIS)
query = f"SELECT * FROM tasks WHERE title = '{user_input}'"  # VULNERABLE
```

### User Isolation Enforcement

**Repository Pattern** centralizes user isolation:

```python
class TaskRepository:
    def __init__(self, session: Session, user_id: int):
        self._user_id = user_id  # User context baked in

    def get_all(self):
        # ALWAYS filters by self._user_id
        return session.exec(
            select(Task).where(Task.user_id == self._user_id)
        ).all()
```

**Why This Works**:
- Repository is instantiated per-request with authenticated user's ID
- Impossible to query other users' data without bypassing repository (would require code bug)
- Single point of enforcement (easy to audit)

### Password Security

- **Never Store Plaintext**: Only bcrypt hashes in database
- **Better Auth Handles**: Password hashing, salting, and verification
- **No Direct Access**: Application code never sees passwords after initial signup/signin

---

## Summary

### Entity Count
- **2 tables**: `users`, `tasks`
- **1 foreign key**: `tasks.user_id → users.id`
- **3 indexes**: `users.email`, `tasks.user_id`, `tasks(user_id, created_at)`

### Key Principles
1. **User Isolation**: Every task query includes `user_id` filter
2. **Audit Trail**: `created_at` and `updated_at` timestamps on tasks
3. **Type Safety**: Pydantic models provide validation and API contracts
4. **Progressive Evolution**: Builds on Phase I domain models

### Next Steps
1. Generate API contracts in `contracts/` directory
2. Create migration scripts (if using Alembic)
3. Implement repository layer with user isolation
4. Add integration tests for multi-user scenarios

---

**Document created**: 2025-12-28
**Next artifact**: `contracts/` (API specifications)
