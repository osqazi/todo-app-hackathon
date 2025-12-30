# Quickstart Guide: Intermediate and Advanced Todo Features

**Feature**: 003-intermediate-advanced-features
**Date**: 2025-12-30
**Audience**: Developers implementing this feature

## Overview

This guide walks through implementing Intermediate (Priorities, Tags, Search, Filter, Sort) and Advanced (Recurring Tasks, Due Dates, Reminders) features for the Todo application.

**Implementation Order**: Follow the dependency sequence to avoid blocking issues.

---

## Prerequisites

**Phase II Must Be Complete**:
- ✅ Next.js 16+ frontend with App Router
- ✅ FastAPI backend with SQLModel
- ✅ Neon Serverless PostgreSQL database
- ✅ Better Auth JWT authentication
- ✅ Basic Task CRUD operations functional

**Development Environment**:
```bash
# Backend
cd backend
python --version  # 3.13+
pip install alembic psycopg2-binary  # If not already installed

# Frontend
cd frontend
node --version  # 18+
npm install react-datepicker
npm install --save-dev @types/react-datepicker
```

---

## Implementation Steps

### Phase 1: Database Schema Extension (Backend)

#### Step 1.1: Setup Alembic

```bash
cd backend

# Initialize Alembic (if not already done)
alembic init alembic

# Configure alembic.ini with Neon DATABASE_URL
# Edit: sqlalchemy.url = postgresql://...
```

#### Step 1.2: Update SQLModel Task Model

**File**: `backend/src/models/task.py`

Add new imports and enums:
```python
from enum import Enum as PyEnum
from sqlmodel import Column, Enum as SQLModelEnum, ARRAY, String
from sqlalchemy.dialects.postgresql import ARRAY as PG_ARRAY

class TaskPriority(str, PyEnum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class RecurrencePattern(str, PyEnum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
```

Extend Task model with new fields (see `data-model.md` for full definition):
```python
class Task(SQLModel, table=True):
    # ... existing fields ...

    # New fields
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, ...)
    tags: list[str] = Field(default_factory=list, sa_column=Column(PG_ARRAY(String(50))))
    due_date: Optional[datetime] = Field(default=None)
    notification_sent: bool = Field(default=False)
    is_recurring: bool = Field(default=False)
    recurrence_pattern: Optional[RecurrencePattern] = Field(default=None, ...)
    recurrence_end_date: Optional[date] = Field(default=None)
    parent_task_id: Optional[int] = Field(default=None, foreign_key="task.id")
```

#### Step 1.3: Generate and Apply Migration

```bash
# Generate migration script
alembic revision --autogenerate -m "Add priorities, tags, due dates, recurrence to Task"

# Review auto-generated migration file in alembic/versions/
# Ensure ENUM types, ARRAY columns, and indexes are correct

# Apply migration to database
alembic upgrade head

# Verify in database
psql $DATABASE_URL
\d task  # Should show new columns
SELECT column_name, data_type FROM information_schema.columns WHERE table_name='task';
```

**Expected Output**: Task table now has `priority`, `tags`, `due_date`, `is_recurring`, `recurrence_pattern`, `recurrence_end_date`, `notification_sent`, `parent_task_id` columns.

---

### Phase 2: Backend API Extensions

#### Step 2.1: Update Pydantic Schemas

**File**: `backend/src/schemas/task.py`

```python
from pydantic import BaseModel, validator
from datetime import datetime, date

class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    priority: str = "medium"  # high | medium | low
    tags: list[str] = []
    due_date: datetime | None = None
    is_recurring: bool = False
    recurrence_pattern: str | None = None  # daily | weekly | monthly
    recurrence_end_date: date | None = None

    @validator('tags')
    def validate_tags(cls, tags):
        if len(tags) > 10:
            raise ValueError("Max 10 tags allowed")
        for tag in tags:
            if not re.match(r'^[a-zA-Z0-9_-]{1,50}$', tag):
                raise ValueError(f"Invalid tag format: {tag}")
        # Check duplicates (case-insensitive)
        if len(tags) != len(set(t.lower() for t in tags)):
            raise ValueError("Duplicate tags not allowed")
        return tags

    @validator('recurrence_pattern')
    def validate_recurrence(cls, pattern, values):
        if values.get('is_recurring') and not pattern:
            raise ValueError("Recurrence pattern required when is_recurring=True")
        return pattern

class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: str | None = None
    tags: list[str] | None = None
    due_date: datetime | None = None
    is_recurring: bool | None = None
    recurrence_pattern: str | None = None
    recurrence_end_date: date | None = None
    status: str | None = None

    # Same validators as TaskCreate
```

#### Step 2.2: Extend GET /tasks Endpoint

**File**: `backend/src/api/tasks.py`

```python
from fastapi import Query

@app.get("/api/{user_id}/tasks")
def get_tasks(
    user_id: str,
    # Search
    search: str | None = None,
    # Filters
    status: list[str] | None = Query(default=None),
    priority: list[str] | None = Query(default=None),
    tags: list[str] | None = Query(default=None),
    due_date_from: datetime | None = None,
    due_date_to: datetime | None = None,
    is_overdue: bool | None = None,
    # Sort
    sort_by: str = "created_at",  # created_at | due_date | priority | title
    sort_order: str = "desc",  # asc | desc
    # Pagination
    limit: int = 1000,
    offset: int = 0,
    # Auth
    current_user: dict = Depends(get_current_user)
):
    # Verify user_id matches JWT
    if current_user['id'] != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Build query
    query = select(Task).where(Task.user_id == user_id)

    # Apply search
    if search:
        query = query.where(
            or_(
                Task.title.ilike(f"%{search}%"),
                Task.description.ilike(f"%{search}%")
            )
        )

    # Apply filters
    if status:
        query = query.where(Task.status.in_(status))

    if priority:
        query = query.where(Task.priority.in_(priority))

    if tags:
        query = query.where(Task.tags.overlap(tags))  # PostgreSQL array overlap

    if due_date_from:
        query = query.where(Task.due_date >= due_date_from)

    if due_date_to:
        query = query.where(Task.due_date <= due_date_to)

    if is_overdue:
        now = datetime.utcnow()
        query = query.where(
            Task.due_date < now,
            Task.status != TaskStatus.COMPLETED
        )

    # Apply sorting
    sort_column = getattr(Task, sort_by)
    if sort_by == "due_date":
        # NULLs last
        query = query.order_by(
            Task.due_date.is_(None),
            sort_column.asc() if sort_order == "asc" else sort_column.desc()
        )
    else:
        query = query.order_by(
            sort_column.asc() if sort_order == "asc" else sort_column.desc()
        )

    # Apply pagination
    query = query.limit(limit).offset(offset)

    tasks = session.exec(query).all()
    total = session.exec(select(func.count()).select_from(query.subquery())).one()

    return {
        "tasks": tasks,
        "meta": {
            "total": total,
            "limit": limit,
            "offset": offset,
            "filters_applied": {...},
            "sort": {"by": sort_by, "order": sort_order}
        }
    }
```

#### Step 2.3: Implement Recurring Task Logic

**File**: `backend/src/services/task_service.py`

```python
from datetime import timedelta
from calendar import monthrange

def complete_task(task_id: int, user_id: str, session: Session):
    """Mark task complete and generate next recurring instance if applicable"""
    task = session.get(Task, task_id)

    if not task or task.user_id != user_id:
        raise HTTPException(404, "Task not found")

    if task.status == TaskStatus.COMPLETED:
        raise HTTPException(409, "Task already completed")

    # Mark complete
    task.status = TaskStatus.COMPLETED
    task.completed_at = datetime.utcnow()
    session.add(task)

    next_instance = None

    # Generate next recurring instance
    if task.is_recurring and task.recurrence_pattern:
        next_due = calculate_next_due_date(
            task.due_date or task.completed_at,
            task.recurrence_pattern
        )

        # Check if within recurrence end date
        if not task.recurrence_end_date or next_due.date() <= task.recurrence_end_date:
            next_instance = Task(
                user_id=task.user_id,
                title=task.title,
                description=task.description,
                priority=task.priority,
                tags=task.tags.copy(),
                due_date=next_due,
                status=TaskStatus.PENDING,
                is_recurring=True,
                recurrence_pattern=task.recurrence_pattern,
                recurrence_end_date=task.recurrence_end_date,
                parent_task_id=task.id,
                notification_sent=False
            )
            session.add(next_instance)

    session.commit()
    session.refresh(task)
    if next_instance:
        session.refresh(next_instance)

    return task, next_instance

def calculate_next_due_date(current: datetime, pattern: RecurrencePattern) -> datetime:
    """Calculate next due date based on recurrence pattern"""
    if pattern == RecurrencePattern.DAILY:
        return current + timedelta(days=1)

    elif pattern == RecurrencePattern.WEEKLY:
        return current + timedelta(weeks=1)

    elif pattern == RecurrencePattern.MONTHLY:
        # Handle month-end edge cases
        next_month = current.month + 1 if current.month < 12 else 1
        next_year = current.year if current.month < 12 else current.year + 1
        max_day = monthrange(next_year, next_month)[1]
        next_day = min(current.day, max_day)
        return current.replace(year=next_year, month=next_month, day=next_day)
```

**API Endpoint**:
```python
@app.post("/api/{user_id}/tasks/{task_id}/complete")
def mark_task_complete(
    user_id: str,
    task_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    completed, next_instance = complete_task(task_id, user_id, session)
    return {
        "completed_task": completed,
        "next_instance": next_instance
    }
```

#### Step 2.4: Notification Endpoints

**File**: `backend/src/api/notifications.py`

```python
@app.get("/api/{user_id}/tasks/due")
def get_due_tasks(
    user_id: str,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Get tasks due within next 5 minutes for notifications"""
    now = datetime.utcnow()
    soon = now + timedelta(minutes=5)

    tasks = session.exec(
        select(Task).where(
            Task.user_id == user_id,
            Task.status != TaskStatus.COMPLETED,
            Task.due_date.between(now, soon),
            Task.notification_sent == False
        )
    ).all()

    return {
        "due_tasks": tasks,
        "count": len(tasks),
        "checked_at": now.isoformat()
    }

@app.post("/api/{user_id}/tasks/{task_id}/notification-sent")
def mark_notification_sent(
    user_id: str,
    task_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Mark that notification has been sent for this task"""
    task = session.exec(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    ).first()

    if not task:
        raise HTTPException(404, "Task not found")

    task.notification_sent = True
    session.add(task)
    session.commit()
    session.refresh(task)

    return {"id": task.id, "notification_sent": True}
```

---

### Phase 3: Frontend UI Components

#### Step 3.1: Install Dependencies

```bash
cd frontend
npm install react-datepicker
npm install --save-dev @types/react-datepicker
```

#### Step 3.2: Priority Selector Component

**File**: `frontend/src/components/PrioritySelector.tsx`

```typescript
"use client";

interface PrioritySelectorProps {
  value: "high" | "medium" | "low";
  onChange: (priority: "high" | "medium" | "low") => void;
}

export function PrioritySelector({ value, onChange }: PrioritySelectorProps) {
  return (
    <div className="priority-selector">
      <label>Priority:</label>
      <select value={value} onChange={(e) => onChange(e.target.value as any)}>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </div>
  );
}
```

#### Step 3.3: Tag Input Component

**File**: `frontend/src/components/TagInput.tsx`

```typescript
"use client";
import { useState } from "react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ tags, onChange }: TagInputProps) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      onChange([...tags, trimmed]);
      setInput("");
    }
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="tag-input">
      <div className="tag-chips">
        {tags.map((tag, i) => (
          <span key={i} className="tag-chip">
            {tag}
            <button onClick={() => removeTag(i)}>&times;</button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && addTag()}
        placeholder="Add tag (press Enter)..."
        maxLength={50}
      />
    </div>
  );
}
```

#### Step 3.4: Search and Filter Bar

**File**: `frontend/src/components/TaskFilters.tsx`

```typescript
"use client";

interface TaskFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedStatuses: string[];
  onStatusChange: (statuses: string[]) => void;
  selectedPriorities: string[];
  onPriorityChange: (priorities: string[]) => void;
  selectedTags: string[];
  onTagChange: (tags: string[]) => void;
  availableTags: string[];
}

export function TaskFilters(props: TaskFiltersProps) {
  return (
    <div className="task-filters">
      {/* Search */}
      <input
        type="search"
        placeholder="Search tasks..."
        value={props.searchTerm}
        onChange={(e) => props.onSearchChange(e.target.value)}
      />

      {/* Status Filter */}
      <div className="filter-group">
        <label>Status:</label>
        {["pending", "in_progress", "completed"].map(status => (
          <label key={status}>
            <input
              type="checkbox"
              checked={props.selectedStatuses.includes(status)}
              onChange={(e) => {
                const updated = e.target.checked
                  ? [...props.selectedStatuses, status]
                  : props.selectedStatuses.filter(s => s !== status);
                props.onStatusChange(updated);
              }}
            />
            {status}
          </label>
        ))}
      </div>

      {/* Priority Filter */}
      <div className="filter-group">
        <label>Priority:</label>
        {["high", "medium", "low"].map(priority => (
          <label key={priority}>
            <input
              type="checkbox"
              checked={props.selectedPriorities.includes(priority)}
              onChange={(e) => {
                const updated = e.target.checked
                  ? [...props.selectedPriorities, priority]
                  : props.selectedPriorities.filter(p => p !== priority);
                props.onPriorityChange(updated);
              }}
            />
            {priority}
          </label>
        ))}
      </div>

      {/* Tag Filter */}
      {/* Similar implementation for tags */}

      {/* Clear Filters */}
      <button onClick={() => {
        props.onSearchChange("");
        props.onStatusChange([]);
        props.onPriorityChange([]);
        props.onTagChange([]);
      }}>
        Clear All Filters
      </button>
    </div>
  );
}
```

#### Step 3.5: Date Picker Component

**File**: `frontend/src/components/DateTimePicker.tsx`

```typescript
"use client";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface DateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
}

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  return (
    <DatePicker
      selected={value}
      onChange={onChange}
      showTimeSelect
      timeFormat="HH:mm"
      timeIntervals={15}
      dateFormat="yyyy-MM-dd HH:mm"
      placeholderText="Select due date & time"
    />
  );
}
```

#### Step 3.6: Notification Polling Hook

**File**: `frontend/src/hooks/useNotificationPolling.ts`

```typescript
"use client";
import { useEffect } from "react";

export function useNotificationPolling(userId: string) {
  useEffect(() => {
    // Request notification permission on first load
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Poll for due tasks every 60 seconds
    const interval = setInterval(async () => {
      if (Notification.permission !== "granted") return;

      const res = await fetch(`/api/${userId}/tasks/due`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      const { due_tasks } = await res.json();

      due_tasks.forEach(async (task: any) => {
        new Notification(task.title, {
          body: task.description?.substring(0, 200) || "",
          tag: `task-${task.id}`,
          icon: "/todo-icon.png"
        });

        // Mark notification sent
        await fetch(`/api/${userId}/tasks/${task.id}/notification-sent`, {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` }
        });
      });
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [userId]);
}
```

---

## Testing Checklist

### Unit Tests (Backend)
- [ ] Test priority enum validation
- [ ] Test tags array validation (max 10, format, duplicates)
- [ ] Test recurrence date calculation logic (daily/weekly/monthly, month-end edge cases)
- [ ] Test notification_sent flag behavior
- [ ] Test user isolation in queries

### Integration Tests
- [ ] Create task with priority, tags, due date
- [ ] Filter tasks by multiple criteria (status + priority + tags)
- [ ] Search tasks by keyword
- [ ] Sort tasks by due_date (verify NULLs last)
- [ ] Complete recurring task → verify next instance generated
- [ ] Check due tasks endpoint returns correct tasks within 5-minute window
- [ ] Update due_date → verify notification_sent reset to false

### Manual Testing
- [ ] Browser notification permission request on first due date set
- [ ] Notification fires at due time (within 60-second polling window)
- [ ] Tag input: Enter key adds tag, X button removes tag
- [ ] Priority selector visual indicator (color/icon)
- [ ] Search updates results in real-time (300ms debounce)
- [ ] Responsive UI on mobile (375px width)

---

## Deployment Steps

1. **Database Migration**:
   ```bash
   cd backend
   alembic upgrade head
   ```

2. **Backend Deployment**:
   - Verify new environment variables (if any)
   - Deploy FastAPI backend (Vercel, Railway, or existing platform)
   - Test `/api/{user_id}/tasks` endpoint with new query params

3. **Frontend Deployment**:
   - Build Next.js app: `npm run build`
   - Deploy to Vercel/Netlify
   - Verify notification permission request works (HTTPS required)

4. **Smoke Test**:
   - Create task with priority="high", tags=["work"], due_date=+5min
   - Verify task appears in list
   - Verify notification fires (wait ~5 minutes)
   - Mark recurring task complete → verify next instance created

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Alembic migration fails with "column already exists" | Check if migration was partially applied. Use `alembic downgrade -1` then re-run |
| Tags filter not working | Ensure GIN index created on tags column. Use `@>` (contains) or `&&` (overlap) operator |
| Notifications not firing | Check HTTPS (required for Notification API). Verify permission granted. Check console for errors |
| Recurring task generates wrong date | Verify timezone handling (store UTC, display local). Check month-end edge case logic |
| Duplicate notifications | Ensure `notification_sent` flag set correctly. Check notification `tag` prevents duplicates |

---

## Next Steps

After completing implementation:
1. Run `/sp.tasks` to generate detailed task breakdown
2. Implement tasks incrementally (test after each)
3. Create PR for code review
4. Deploy to staging for QA testing
5. Monitor production for performance/errors

**Ready to implement!** Follow this guide step-by-step, referring to `data-model.md` and `contracts/api-endpoints.md` for complete specifications.
