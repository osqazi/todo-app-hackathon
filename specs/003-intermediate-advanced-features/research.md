# Research: Intermediate and Advanced Todo Features

**Feature**: 003-intermediate-advanced-features
**Date**: 2025-12-30
**Purpose**: Document technology decisions, best practices research, and architectural choices for implementing priorities, tags, search, filter, sort, recurring tasks, and due date reminders

## Research Questions & Decisions

### 1. Priority & Tags Data Modeling

**Question**: How should we model priority (enum vs string) and tags (SQLModel Array vs separate join table)?

**Decision**:
- **Priority**: Use Python Enum mapped to PostgreSQL ENUM type via SQLModel
- **Tags**: Use PostgreSQL ARRAY column type via SQLModel's `list[str]` field type

**Rationale**:
- **Priority as Enum**:
  - Limited, fixed set of values (high, medium, low)
  - Type safety at Python and database level
  - Prevents invalid priority values
  - Better query performance than string validation
  - Native PostgreSQL ENUM support

- **Tags as Array**:
  - Simpler schema (no additional table/joins)
  - PostgreSQL has excellent array support with GIN indexes
  - Allows efficient filtering with `@>` (contains) operator
  - Reduces query complexity compared to many-to-many join
  - For this scale (per-user task lists), array performance is superior
  - Easy serialization to/from JSON for API responses

**Alternatives Considered**:
- **Priority as String**: More flexible but requires runtime validation, no type safety, prone to typos/inconsistency
- **Tags as Separate Table**: Normalized approach enables tag reuse and prevents duplicates across tasks, but:
  - Adds complexity (many-to-many relationship, join table)
  - Requires additional queries/joins for filtering
  - Overkill for per-user scoped tags (no global tag management needed)
  - Harder to enforce per-user tag isolation

**Implementation Notes**:
```python
# SQLModel with Enum
from enum import Enum as PyEnum
from sqlmodel import Field, Enum as SQLEnum

class TaskPriority(str, PyEnum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class Task(SQLModel, table=True):
    priority: TaskPriority = Field(
        default=TaskPriority.MEDIUM,
        sa_column=Column(SQLEnum(TaskPriority))
    )
    tags: list[str] = Field(default_factory=list, sa_column=Column(ARRAY(String)))
```

**Index Strategy**:
- Create GIN index on tags array for fast containment queries: `CREATE INDEX idx_tasks_tags ON tasks USING GIN (tags);`
- B-tree index on priority for filtering: Already efficient with ENUM

---

### 2. Search & Filter Implementation

**Question**: Should we use PostgreSQL full-text search or LIKE queries? Client-side vs server-side filtering?

**Decision**:
- **Search**: Use case-insensitive ILIKE queries for title and description
- **Filter**: Server-side filtering with dynamic query building
- **Hybrid**: Return full dataset for small result sets (<200 tasks), enable client-side refinement for real-time UX

**Rationale**:
- **ILIKE over Full-Text Search**:
  - Simpler implementation (no tsvector setup, no trigger maintenance)
  - Substring matching aligns with user expectations ("meet" matches "meeting")
  - Good performance for per-user task lists (typically <1000 tasks)
  - PostgreSQL ILIKE with indexes is sufficient for this scale
  - Full-text search overkill for simple title/description matching

- **Server-Side Filtering**:
  - Enforces per-user isolation at database layer (security)
  - Leverages database indexes (priority, due_date, tags)
  - Consistent filtering logic (no client/server divergence)
  - Enables future pagination without inconsistency
  - Required for date range filters (database has timezone-aware date comparison)

- **Hybrid Approach**:
  - Initial load: Server applies user_id isolation + security filters
  - Client-side: Real-time search/filter refinement on loaded dataset for responsiveness
  - Debounced search input (300ms) to reduce re-renders
  - Server round-trip only when filters change (status, priority, tags, date range)

**Alternatives Considered**:
- **PostgreSQL Full-Text Search**: More powerful but complex setup (tsvector, triggers, ranking), not needed for simple substring search
- **Pure Client-Side Filtering**: Security risk (must fetch all tasks first), doesn't leverage database indexes, high memory usage for large lists
- **Pure Server-Side with Pagination**: More scalable but adds latency for every filter change, complex pagination state management

**Implementation Notes**:
```python
# FastAPI endpoint with dynamic filtering
@app.get("/api/{user_id}/tasks")
def get_tasks(
    user_id: str,
    search: str | None = None,
    status: list[TaskStatus] | None Query(default=None),
    priority: list[TaskPriority] | None = Query(default=None),
    tags: list[str] | None = Query(default=None),
    due_date_from: datetime | None = None,
    due_date_to: datetime | None = None,
):
    query = select(Task).where(Task.user_id == user_id)

    if search:
        query = query.where(
            or_(
                Task.title.ilike(f"%{search}%"),
                Task.description.ilike(f"%{search}%")
            )
        )

    if status:
        query = query.where(Task.status.in_(status))

    if priority:
        query = query.where(Task.priority.in_(priority))

    if tags:
        # PostgreSQL array contains operator
        query = query.where(Task.tags.contains(tags))

    if due_date_from:
        query = query.where(Task.due_date >= due_date_from)

    if due_date_to:
        query = query.where(Task.due_date <= due_date_to)

    return query.all()
```

**Performance Optimizations**:
- Index on user_id (already exists for isolation)
- Composite index on (user_id, status, priority) for common filter combinations
- GIN index on tags array
- B-tree index on due_date for range queries

---

### 3. Sort Mechanism

**Question**: Should sorting happen server-side or client-side?

**Decision**: **Server-side sorting with client-side caching**

**Rationale**:
- **Server-Side Benefits**:
  - Consistent sort order across all clients
  - Leverages database indexes (due_date, created_at, priority)
  - Enables efficient pagination in future (sorted page windows)
  - Simplifies client state management
  - Works with filtered datasets without client re-sorting overhead

- **Client-Side Caching**:
  - Once sorted data is fetched, client can toggle ascending/descending without server round-trip
  - Store sort direction in URL query params or local state
  - Re-fetch only when filters change or new tasks added

**Alternatives Considered**:
- **Pure Client-Side Sorting**:
  - Pros: Instant sort direction toggle, no network latency
  - Cons: Doesn't work well with server-side pagination, must re-sort on every filter change, complex for multi-column sort

- **Dynamic Client/Server Hybrid**:
  - Pros: Optimizes for both small and large datasets
  - Cons: Complex logic to decide when to switch, state synchronization issues

**Implementation Notes**:
```python
# FastAPI with ORDER BY
@app.get("/api/{user_id}/tasks")
def get_tasks(
    user_id: str,
    sort_by: str = "created_at",  # due_date | priority | title | created_at
    sort_order: str = "asc",  # asc | desc
    ...filters...
):
    query = select(Task).where(Task.user_id == user_id)
    # ...apply filters...

    sort_column = getattr(Task, sort_by)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    # Null handling for due_date sorting
    if sort_by == "due_date":
        query = query.order_by(
            Task.due_date.is_(None),  # NULLs last
            sort_column.asc() if sort_order == "asc" else sort_column.desc()
        )

    return query.all()
```

**Null Handling**:
- Tasks without due dates always appear last when sorting by due_date (regardless of asc/desc)
- Use `NULLS LAST` clause or two-column ORDER BY

---

### 4. Recurring Tasks Logic

**Question**: Should we pre-generate future task instances or generate on-the-fly when tasks are marked complete?

**Decision**: **Generate on completion (lazy generation)**

**Rationale**:
- **On-Completion Generation**:
  - Simpler implementation (no background jobs, no cron scheduler)
  - Accurate recurrence (based on actual completion date, not planned due date)
  - No storage bloat from pre-generated future tasks
  - User sees only current/active task instances
  - Handles pattern changes easily (edit recurrence settings without orphaned future tasks)

- **User Experience**:
  - Marking recurring task complete triggers immediate creation of next instance
  - Next instance inherits: title, description, priority, tags, recurrence settings
  - Next instance gets: new due_date (calculated from pattern), status = "pending"
  - Clear UX: "Task completed! Next instance scheduled for [date]"

**Alternatives Considered**:
- **Pre-Generation**:
  - Pros: User sees future tasks in advance, can plan around them
  - Cons: Storage overhead, complex cleanup on pattern changes, background job complexity, potential for orphaned tasks

- **Hybrid (Generate N Future Instances)**:
  - Pros: Balance between visibility and complexity
  - Cons: Still requires background cleanup, ambiguous UX (which instances are "real"?)

**Implementation Notes**:
```python
# SQLModel fields
class Task(SQLModel, table=True):
    is_recurring: bool = Field(default=False)
    recurrence_pattern: str | None = Field(default=None)  # "daily" | "weekly" | "monthly"
    recurrence_end_date: date | None = Field(default=None)
    parent_task_id: int | None = Field(default=None, foreign_key="task.id")  # Track lineage

# Recurrence generation logic
def complete_task(task_id: int, user_id: str):
    task = get_task(task_id, user_id)
    task.status = TaskStatus.COMPLETED
    task.completed_at = datetime.utcnow()
    session.add(task)

    if task.is_recurring and should_generate_next_instance(task):
        next_task = Task(
            user_id=task.user_id,
            title=task.title,
            description=task.description,
            priority=task.priority,
            tags=task.tags,
            is_recurring=task.is_recurring,
            recurrence_pattern=task.recurrence_pattern,
            recurrence_end_date=task.recurrence_end_date,
            due_date=calculate_next_due_date(task.due_date, task.recurrence_pattern),
            status=TaskStatus.PENDING,
            parent_task_id=task.id
        )
        session.add(next_task)

    session.commit()
    return task, next_task if task.is_recurring else None

def calculate_next_due_date(current_due: datetime, pattern: str) -> datetime:
    if pattern == "daily":
        return current_due + timedelta(days=1)
    elif pattern == "weekly":
        return current_due + timedelta(weeks=1)
    elif pattern == "monthly":
        # Handle month-end edge cases (Jan 31 -> Feb 28/29)
        return (current_due.replace(day=1) + timedelta(days=32)).replace(day=current_due.day)

def should_generate_next_instance(task: Task) -> bool:
    if not task.is_recurring or not task.due_date:
        return False

    if task.recurrence_end_date:
        next_due = calculate_next_due_date(task.due_date, task.recurrence_pattern)
        return next_due <= task.recurrence_end_date

    return True
```

**Edge Cases**:
- Monthly recurrence on 31st: If next month has <31 days, use last day of month
- Recurrence without due date: Use completion timestamp as baseline for next instance
- End date validation: Prevent recurrence_end_date < due_date on creation

---

### 5. Due Date Reminders: Notification Strategy

**Question**: Browser Notification API with foreground polling or Service Worker? Or defer real-time push to later phase?

**Decision**: **Browser Notification API with foreground polling (60-second interval)**

**Rationale**:
- **Foreground Polling**:
  - Simpler implementation (no Service Worker registration, no background sync)
  - Works reliably when app is open in browser tab
  - 60-second polling acceptable for "due date" granularity (not real-time chat)
  - Avoids Service Worker complexity (scope issues, debugging, browser compatibility)
  - Can upgrade to Service Worker in Phase III if needed

- **Browser Notification API**:
  - Native browser notifications (no backend push service required)
  - Request permission on first due date set (clear UX trigger)
  - Show task title + description snippet in notification
  - Handle permission denial gracefully (show in-app banner)

- **Why Not Service Worker**:
  - Service Workers add significant complexity (registration, update lifecycle, debugging)
  - Requires HTTPS in production (already met, but adds testing complexity locally)
  - Background sync is overkill for due date reminders (not real-time messaging)
  - Foreground polling covers 90% use case (users have app open when working)

**Alternatives Considered**:
- **Service Worker with Background Sync**:
  - Pros: Works when tab is closed, more reliable notifications
  - Cons: Complex setup, harder to debug, browser compatibility issues, requires Web Push API + backend in future

- **No Notifications (In-App Only)**:
  - Pros: Simplest implementation
  - Cons: Doesn't meet user need for timely reminders, low engagement

- **Server-Side Push (Web Push API + Backend)**:
  - Pros: True push notifications, works when app closed
  - Cons: Requires backend push service setup, VAPID keys, subscription management, out of scope for Phase II

**Implementation Notes**:
```typescript
// Frontend: Notification permission request
async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("Notifications not supported");
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

// Frontend: Polling for due tasks
let notificationInterval: NodeJS.Timeout;

function startNotificationPolling() {
  notificationInterval = setInterval(async () => {
    const dueTasks = await fetchDueTasks(); // API call

    dueTasks.forEach(task => {
      if (Notification.permission === "granted") {
        new Notification(task.title, {
          body: task.description.substring(0, 200),
          icon: "/todo-icon.png",
          tag: `task-${task.id}`, // Prevent duplicate notifications
          requireInteraction: false
        });

        // Mark notification as sent (API call to prevent re-firing)
        markNotificationSent(task.id);
      }
    });
  }, 60000); // 60 seconds
}

// Frontend: Stop polling on unmount
function stopNotificationPolling() {
  if (notificationInterval) {
    clearInterval(notificationInterval);
  }
}
```

```python
# Backend: Fetch tasks due within next 5 minutes
@app.get("/api/{user_id}/tasks/due")
def get_due_tasks(user_id: str):
    now = datetime.utcnow()
    soon = now + timedelta(minutes=5)

    query = select(Task).where(
        Task.user_id == user_id,
        Task.status != TaskStatus.COMPLETED,
        Task.due_date.between(now, soon),
        Task.notification_sent == False  # New field
    )

    return query.all()

@app.post("/api/{user_id}/tasks/{task_id}/notification-sent")
def mark_notification_sent(user_id: str, task_id: int):
    task = get_task(task_id, user_id)
    task.notification_sent = True
    session.commit()
    return {"status": "ok"}
```

**New Database Fields**:
- `notification_sent: bool = Field(default=False)` to prevent duplicate notifications
- Reset to `False` when due_date is updated

---

### 6. Database Migrations

**Question**: Should we use SQLModel's native migration support or integrate Alembic?

**Decision**: **Alembic integration for production-grade migrations**

**Rationale**:
- **Alembic Advantages**:
  - Industry-standard migration tool for SQLAlchemy/SQLModel
  - Auto-generates migration scripts from model changes
  - Supports rollback/downgrade migrations
  - Better for production (version tracking, team collaboration)
  - Handles complex schema changes (data transformations, multi-step migrations)
  - Already in ecosystem (FastAPI + SQLModel projects commonly use Alembic)

- **SQLModel Native**:
  - Simpler for prototypes (SQLModel.metadata.create_all())
  - No migration history tracking
  - No rollback support
  - Not suitable for production databases

**Implementation Notes**:
```bash
# Setup Alembic
pip install alembic
alembic init alembic

# Configure alembic.ini
# Set sqlalchemy.url to Neon DATABASE_URL

# Generate migration
alembic revision --autogenerate -m "Add priority, tags, due_date, recurrence fields to Task"

# Apply migration
alembic upgrade head

# Rollback if needed
alembic downgrade -1
```

```python
# Migration file example (auto-generated)
def upgrade():
    op.add_column('task', sa.Column('priority', sa.Enum('high', 'medium', 'low'), nullable=False, server_default='medium'))
    op.add_column('task', sa.Column('tags', postgresql.ARRAY(sa.String()), nullable=True))
    op.add_column('task', sa.Column('due_date', sa.DateTime(timezone=True), nullable=True))
    op.add_column('task', sa.Column('is_recurring', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('task', sa.Column('recurrence_pattern', sa.String(), nullable=True))
    op.add_column('task', sa.Column('recurrence_end_date', sa.Date(), nullable=True))
    op.add_column('task', sa.Column('notification_sent', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('task', sa.Column('parent_task_id', sa.Integer(), nullable=True))

    # Indexes
    op.create_index('idx_tasks_tags', 'task', ['tags'], postgresql_using='gin')
    op.create_index('idx_tasks_due_date', 'task', ['due_date'])
    op.create_index('idx_tasks_user_status_priority', 'task', ['user_id', 'status', 'priority'])

def downgrade():
    op.drop_index('idx_tasks_user_status_priority', 'task')
    op.drop_index('idx_tasks_due_date', 'task')
    op.drop_index('idx_tasks_tags', 'task')
    op.drop_column('task', 'parent_task_id')
    op.drop_column('task', 'notification_sent')
    op.drop_column('task', 'recurrence_end_date')
    op.drop_column('task', 'recurrence_pattern')
    op.drop_column('task', 'is_recurring')
    op.drop_column('task', 'due_date')
    op.drop_column('task', 'tags')
    op.drop_column('task', 'priority')
```

---

### 7. UI Library Choices

**Question**: Should we use pure React or integrate lightweight third-party components for date pickers, tag inputs, etc.?

**Decision**: **Use focused, lightweight third-party components where complex**

**Components**:
1. **Date/Time Picker**: `react-datepicker` (13KB gzipped)
   - Mature, accessible, customizable
   - Built-in timezone handling
   - Keyboard navigation support
   - Alternative: `date-fns` + headless UI (more control, more work)

2. **Tag Input**: `react-tag-input` or build custom with `@dnd-kit/core` for drag-drop
   - Simple tag creation/deletion
   - Autocomplete from existing tags
   - Visual tag chips with remove button
   - Alternative: Custom implementation with `<input>` + array state (simpler, less features)

3. **Multi-Select Filters**: Custom implementation with checkboxes
   - No library needed (simple checkbox list)
   - Better control over styling and behavior
   - Lightweight (<1KB custom code)

4. **Priority Selector**: Custom radio buttons or `<select>` dropdown
   - No library needed (3 fixed options)
   - Semantic HTML with styling

5. **Notifications**: Native Browser Notification API (no library)

**Rationale**:
- **Date Picker Justification**: Date/time selection is complex (calendar UI, time input, timezone handling). React-datepicker is battle-tested and accessible. Custom implementation would take 10+ hours for same quality.

- **Tag Input Justification**: Tag input with autocomplete and chip UI has UX nuance. react-tag-input provides this out-of-box. Custom implementation viable but lower ROI.

- **Keep It Lean**: Avoid heavy component libraries (Material-UI, Ant Design). Target <50KB total added dependencies.

**Alternatives Considered**:
- **Headless UI Libraries (Radix, Headless UI)**: More control, but requires more CSS work. Good for custom design systems, overkill here.
- **Full Component Libraries (MUI, Chakra)**: Too heavy (100KB+), opinionated styling, not needed for 5-10 components.
- **Pure Custom**: Maximum control, but time-intensive for date picker. Reasonable for priority/tag selectors.

**Implementation Notes**:
```typescript
// Date picker example
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function TaskForm() {
  const [dueDate, setDueDate] = useState<Date | null>(null);

  return (
    <DatePicker
      selected={dueDate}
      onChange={(date) => setDueDate(date)}
      showTimeSelect
      timeFormat="HH:mm"
      timeIntervals={15}
      dateFormat="yyyy-MM-dd HH:mm"
      placeholderText="Select due date"
    />
  );
}

// Custom tag input example
function TagInput({ tags, setTags }: { tags: string[], setTags: (tags: string[]) => void }) {
  const [input, setInput] = useState("");

  const addTag = () => {
    if (input.trim() && !tags.includes(input.trim())) {
      setTags([...tags, input.trim()]);
      setInput("");
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="tag-chips">
        {tags.map((tag, i) => (
          <span key={i} className="tag-chip">
            {tag}
            <button onClick={() => removeTag(i)}>×</button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && addTag()}
        placeholder="Add tag..."
      />
    </div>
  );
}
```

---

## Best Practices Summary

### SQLModel with PostgreSQL
- **Source**: SQLModel official docs, PostgreSQL documentation
- Use Enum for fixed-value fields (priority, status)
- Use ARRAY columns for multi-value fields (tags) when no normalization needed
- Create appropriate indexes (GIN for arrays, B-tree for scalars, composite for multi-column filters)
- Use Alembic for migrations in production

### FastAPI Query Patterns
- **Source**: FastAPI documentation, SQLAlchemy best practices
- Use query parameters for filters (`Query(default=None)`)
- Build dynamic queries with `select().where()` chaining
- Handle NULL values explicitly in sorting (NULLS LAST)
- Return Pydantic models for type-safe API responses
- Use dependency injection for database sessions

### Next.js 16 App Router
- **Source**: Next.js 16 documentation
- Use Server Components for initial data fetch (SEO, performance)
- Use Client Components for interactive filters/search ("use client")
- Implement optimistic UI updates for better UX
- Store filter/sort state in URL search params for bookmarkability

### Browser Notification API
- **Source**: MDN Web Docs - Notification API
- Request permission at contextual moment (first due date set)
- Handle permission denial gracefully (don't block functionality)
- Use notification tags to prevent duplicates
- Include meaningful title and body (task info)
- Poll at reasonable interval (60s, not 1s)

### Date/Time Handling
- **Source**: date-fns documentation, PostgreSQL timezone docs
- Store all dates in UTC at database level
- Convert to user's browser timezone for display
- Use ISO 8601 format for API communication
- Handle timezone edge cases (DST transitions)

### Accessibility
- **Source**: WCAG 2.1 Level AA, ARIA best practices
- Semantic HTML for filters (checkboxes, radio buttons, labels)
- Keyboard navigation for tag input (Enter to add, Backspace to remove)
- Screen reader announcements for dynamic content (search results count)
- Color is not the only priority indicator (use icons + color)

---

## Technology Stack Confirmation

| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| Backend Language | Python | 3.13+ | Existing Phase II stack |
| Backend Framework | FastAPI | Latest | Existing Phase II stack, async support |
| ORM | SQLModel | Latest | Existing Phase II stack, type-safe |
| Database | PostgreSQL (Neon) | 15+ | Existing Phase II stack, ARRAY/ENUM support |
| Migrations | Alembic | Latest | Production-grade migration management |
| Frontend Framework | Next.js | 16+ | Existing Phase II stack, App Router |
| UI Language | TypeScript | 5+ | Type safety, existing in Phase II |
| Date Picker | react-datepicker | 4.x | Mature, accessible, lightweight |
| Tag Input | Custom | N/A | Simple implementation, full control |
| Notifications | Browser API | Native | No dependencies, direct browser integration |
| Authentication | Better Auth | Latest | Existing Phase II, JWT tokens |
| Testing (Backend) | pytest | Latest | Python standard for FastAPI |
| Testing (Frontend) | Jest + Testing Library | Latest | React standard, existing in Phase II |

---

## Open Questions

None - all research questions resolved. Ready for Phase 1: Design & Contracts.
