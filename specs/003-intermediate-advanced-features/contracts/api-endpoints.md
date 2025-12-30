# API Contracts: Intermediate and Advanced Todo Features

**Feature**: 003-intermediate-advanced-features
**Date**: 2025-12-30
**Base URL**: `/api/{user_id}/tasks`
**Authentication**: JWT Bearer token (Better Auth)

## Overview

All endpoints extend the existing Phase II Task API with new query parameters, request fields, and response fields to support priorities, tags, search, filter, sort, recurring tasks, and due date reminders.

### Authentication

All endpoints require JWT authentication via Better Auth. The `user_id` path parameter MUST match the authenticated user's ID from the JWT token.

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Security Enforcement**:
- Backend validates JWT signature using `BETTER_AUTH_SECRET`
- Backend extracts `user_id` from JWT
- Backend rejects requests where path `{user_id}` ≠ JWT `user_id`

---

## Endpoints

### 1. Get Tasks (List/Filter/Search/Sort)

**Extended Endpoint**: `GET /api/{user_id}/tasks`

**Description**: Retrieve user's tasks with optional search, filtering, and sorting.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | Yes | Authenticated user's ID (must match JWT) |

**Query Parameters** (all optional):
| Parameter | Type | Default | Description | Example |
|-----------|------|---------|-------------|---------|
| `search` | string | null | Case-insensitive substring search in title/description | `?search=meeting` |
| `status` | string[] | null | Filter by one or more statuses (comma-separated or multiple params) | `?status=pending&status=in_progress` |
| `priority` | string[] | null | Filter by one or more priorities (comma-separated or multiple params) | `?priority=high&priority=medium` |
| `tags` | string[] | null | Filter by tags (tasks containing ANY of these tags) | `?tags=work&tags=urgent` |
| `due_date_from` | string (ISO 8601) | null | Filter tasks with due_date >= this value | `?due_date_from=2025-12-30T00:00:00Z` |
| `due_date_to` | string (ISO 8601) | null | Filter tasks with due_date <= this value | `?due_date_to=2026-01-31T23:59:59Z` |
| `is_overdue` | boolean | null | Filter overdue tasks (due_date < now, status != completed) | `?is_overdue=true` |
| `sort_by` | string | `created_at` | Field to sort by (`created_at`, `due_date`, `priority`, `title`, `updated_at`) | `?sort_by=due_date` |
| `sort_order` | string | `desc` | Sort direction (`asc` or `desc`) | `?sort_order=asc` |
| `limit` | integer | 1000 | Max number of results (future pagination support) | `?limit=50` |
| `offset` | integer | 0 | Offset for pagination (future support) | `?offset=100` |

**Request Example**:
```http
GET /api/user_abc123/tasks?search=report&priority=high&sort_by=due_date&sort_order=asc HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "tasks": [
    {
      "id": 42,
      "user_id": "user_abc123",
      "title": "Q4 Financial Report",
      "description": "Complete quarterly financial analysis and projections",
      "status": "pending",
      "priority": "high",
      "tags": ["work", "finance", "urgent"],
      "due_date": "2025-12-31T17:00:00Z",
      "notification_sent": false,
      "is_recurring": false,
      "recurrence_pattern": null,
      "recurrence_end_date": null,
      "parent_task_id": null,
      "created_at": "2025-12-28T10:00:00Z",
      "updated_at": "2025-12-30T08:00:00Z",
      "completed_at": null
    },
    {
      "id": 57,
      "title": "Weekly Status Report",
      "description": "Team status update email draft",
      "status": "in_progress",
      "priority": "high",
      "tags": ["work", "recurring"],
      "due_date": "2025-12-30T15:00:00Z",
      "is_recurring": true,
      "recurrence_pattern": "weekly",
      "recurrence_end_date": "2026-06-30",
      "parent_task_id": 49,
      "created_at": "2025-12-23T09:00:00Z",
      "updated_at": "2025-12-30T09:30:00Z",
      "completed_at": null
    }
  ],
  "meta": {
    "total": 2,
    "limit": 1000,
    "offset": 0,
    "filters_applied": {
      "search": "report",
      "priority": ["high"]
    },
    "sort": {
      "by": "due_date",
      "order": "asc"
    }
  }
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `tasks` | array | Array of Task objects matching filters |
| `meta.total` | integer | Total count of matching tasks |
| `meta.limit` | integer | Applied limit |
| `meta.offset` | integer | Applied offset |
| `meta.filters_applied` | object | Echo of applied filters |
| `meta.sort` | object | Applied sort settings |

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Authenticated user_id doesn't match path user_id
- `400 Bad Request`: Invalid query parameters (e.g., invalid date format, unknown sort field)

---

### 2. Create Task

**Extended Endpoint**: `POST /api/{user_id}/tasks`

**Description**: Create a new task with extended fields (priority, tags, due date, recurrence).

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | Yes | Authenticated user's ID (must match JWT) |

**Request Body**:
```json
{
  "title": "Weekly team standup",
  "description": "Prepare updates and blockers for team meeting",
  "priority": "medium",
  "tags": ["work", "meetings"],
  "due_date": "2025-12-31T10:00:00Z",
  "is_recurring": true,
  "recurrence_pattern": "weekly",
  "recurrence_end_date": "2026-06-30"
}
```

**Request Fields**:
| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `title` | string | Yes | - | 1-200 characters |
| `description` | string | No | null | 0-2000 characters |
| `priority` | string | No | `"medium"` | One of: `high`, `medium`, `low` |
| `tags` | string[] | No | `[]` | Max 10 tags, each 1-50 chars, alphanumeric + `-_` |
| `due_date` | string (ISO 8601) | No | null | Future date or within 1 year past |
| `is_recurring` | boolean | No | `false` | - |
| `recurrence_pattern` | string | No | null | Required if `is_recurring=true`. One of: `daily`, `weekly`, `monthly` |
| `recurrence_end_date` | string (ISO date) | No | null | Must be >= `due_date` if both set |
| `status` | string | No | `"pending"` | One of: `pending`, `in_progress`, `completed` |

**Response** (201 Created):
```json
{
  "id": 123,
  "user_id": "user_abc123",
  "title": "Weekly team standup",
  "description": "Prepare updates and blockers for team meeting",
  "status": "pending",
  "priority": "medium",
  "tags": ["work", "meetings"],
  "due_date": "2025-12-31T10:00:00Z",
  "notification_sent": false,
  "is_recurring": true,
  "recurrence_pattern": "weekly",
  "recurrence_end_date": "2026-06-30",
  "parent_task_id": null,
  "created_at": "2025-12-30T12:00:00Z",
  "updated_at": "2025-12-30T12:00:00Z",
  "completed_at": null
}
```

**Validation Errors** (400 Bad Request):
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Title must be between 1 and 200 characters"
    },
    {
      "field": "tags",
      "message": "Tags must be 1-50 characters, alphanumeric with hyphens/underscores. Max 10 tags. No duplicates."
    },
    {
      "field": "recurrence_pattern",
      "message": "Recurrence pattern required when task is recurring"
    }
  ]
}
```

---

### 3. Update Task

**Extended Endpoint**: `PATCH /api/{user_id}/tasks/{task_id}`

**Description**: Update an existing task. All fields are optional (partial update).

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | Yes | Authenticated user's ID (must match JWT) |
| `task_id` | integer | Yes | Task ID to update |

**Request Body** (all fields optional):
```json
{
  "title": "Updated title",
  "priority": "high",
  "tags": ["work", "urgent", "high-priority"],
  "due_date": "2026-01-15T14:00:00Z",
  "is_recurring": false
}
```

**Special Behaviors**:
- Updating `due_date` resets `notification_sent = false`
- Changing `is_recurring` from `true` to `false` clears `recurrence_pattern` and `recurrence_end_date`
- Updating `recurrence_pattern` or `recurrence_end_date` does NOT affect already-generated child instances

**Response** (200 OK):
```json
{
  "id": 123,
  "user_id": "user_abc123",
  "title": "Updated title",
  "description": "Prepare updates and blockers for team meeting",
  "status": "pending",
  "priority": "high",
  "tags": ["work", "urgent", "high-priority"],
  "due_date": "2026-01-15T14:00:00Z",
  "notification_sent": false,
  "is_recurring": false,
  "recurrence_pattern": null,
  "recurrence_end_date": null,
  "parent_task_id": null,
  "created_at": "2025-12-30T12:00:00Z",
  "updated_at": "2025-12-30T13:45:00Z",
  "completed_at": null
}
```

**Error Responses**:
- `404 Not Found`: Task ID doesn't exist or doesn't belong to authenticated user
- `400 Bad Request`: Validation errors

---

### 4. Mark Task Complete

**Extended Endpoint**: `POST /api/{user_id}/tasks/{task_id}/complete`

**Description**: Mark task as complete. If recurring, automatically generates next instance.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | Yes | Authenticated user's ID (must match JWT) |
| `task_id` | integer | Yes | Task ID to mark complete |

**Request Body**: Empty (`{}`)

**Response** (200 OK - Non-Recurring Task):
```json
{
  "completed_task": {
    "id": 123,
    "status": "completed",
    "completed_at": "2025-12-30T14:00:00Z",
    ...other fields...
  },
  "next_instance": null
}
```

**Response** (200 OK - Recurring Task):
```json
{
  "completed_task": {
    "id": 123,
    "status": "completed",
    "completed_at": "2025-12-30T14:00:00Z",
    "is_recurring": true,
    "recurrence_pattern": "weekly",
    ...other fields...
  },
  "next_instance": {
    "id": 124,
    "user_id": "user_abc123",
    "title": "Weekly team standup",
    "description": "Prepare updates and blockers for team meeting",
    "status": "pending",
    "priority": "medium",
    "tags": ["work", "meetings"],
    "due_date": "2026-01-07T10:00:00Z",
    "notification_sent": false,
    "is_recurring": true,
    "recurrence_pattern": "weekly",
    "recurrence_end_date": "2026-06-30",
    "parent_task_id": 123,
    "created_at": "2025-12-30T14:00:00Z",
    "updated_at": "2025-12-30T14:00:00Z",
    "completed_at": null
  }
}
```

**Special Cases**:
- If recurrence end date reached, `next_instance` is `null` and message includes: `"Recurrence completed - end date reached"`
- If task already completed, returns `409 Conflict`

---

### 5. Delete Task

**Existing Endpoint** (unchanged): `DELETE /api/{user_id}/tasks/{task_id}`

**Description**: Delete a task. No changes from Phase II.

**Special Behavior for Recurring Tasks**:
- Deleting a parent task (original recurring task) sets `parent_task_id = NULL` on all child instances (they become standalone tasks)
- Deleting a child instance does NOT affect other instances

---

### 6. Get Due Tasks (For Notifications)

**New Endpoint**: `GET /api/{user_id}/tasks/due`

**Description**: Retrieve tasks due within the next 5 minutes (for notification polling).

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | Yes | Authenticated user's ID (must match JWT) |

**Query Parameters**: None (uses fixed 5-minute window)

**Response** (200 OK):
```json
{
  "due_tasks": [
    {
      "id": 42,
      "title": "Q4 Financial Report",
      "description": "Complete quarterly financial analysis...",
      "due_date": "2025-12-30T14:03:00Z",
      "priority": "high",
      "notification_sent": false,
      ...other fields...
    }
  ],
  "count": 1,
  "checked_at": "2025-12-30T14:00:00Z"
}
```

**Logic**:
- Returns tasks where:
  - `user_id` matches authenticated user
  - `status != completed`
  - `due_date` between `now()` and `now() + 5 minutes`
  - `notification_sent == false`

**Usage**: Frontend polls this endpoint every 60 seconds, sends browser notifications for returned tasks, then calls `Mark Notification Sent` endpoint.

---

### 7. Mark Notification Sent

**New Endpoint**: `POST /api/{user_id}/tasks/{task_id}/notification-sent`

**Description**: Mark that a notification has been sent for this task (prevents duplicate notifications).

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | Yes | Authenticated user's ID (must match JWT) |
| `task_id` | integer | Yes | Task ID |

**Request Body**: Empty (`{}`)

**Response** (200 OK):
```json
{
  "id": 42,
  "notification_sent": true,
  "updated_at": "2025-12-30T14:00:30Z"
}
```

**Note**: This flag is reset to `false` when `due_date` is updated.

---

### 8. Get User's Unique Tags

**New Endpoint**: `GET /api/{user_id}/tags`

**Description**: Retrieve all unique tags used by the user (for autocomplete/filter UI).

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | Yes | Authenticated user's ID (must match JWT) |

**Response** (200 OK):
```json
{
  "tags": [
    "work",
    "personal",
    "urgent",
    "meetings",
    "recurring",
    "finance",
    "admin"
  ],
  "count": 7
}
```

**Logic**: Extract all unique tags from user's tasks using PostgreSQL `unnest()` on the tags array.

---

## Request/Response Models (TypeScript)

### Task Model
```typescript
interface Task {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  priority: "high" | "medium" | "low";
  tags: string[];
  due_date: string | null;  // ISO 8601 datetime
  notification_sent: boolean;
  is_recurring: boolean;
  recurrence_pattern: "daily" | "weekly" | "monthly" | null;
  recurrence_end_date: string | null;  // ISO 8601 date
  parent_task_id: number | null;
  created_at: string;  // ISO 8601 datetime
  updated_at: string;  // ISO 8601 datetime
  completed_at: string | null;  // ISO 8601 datetime
}

interface TaskListResponse {
  tasks: Task[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    filters_applied: Record<string, any>;
    sort: {
      by: string;
      order: "asc" | "desc";
    };
  };
}

interface CompleteTaskResponse {
  completed_task: Task;
  next_instance: Task | null;
}

interface DueTasksResponse {
  due_tasks: Task[];
  count: number;
  checked_at: string;  // ISO 8601 datetime
}

interface TagsResponse {
  tags: string[];
  count: number;
}

interface ValidationError {
  error: string;
  details: Array<{
    field: string;
    message: string;
  }>;
}
```

### Create/Update Request Models
```typescript
interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: "high" | "medium" | "low";
  tags?: string[];
  due_date?: string;  // ISO 8601
  is_recurring?: boolean;
  recurrence_pattern?: "daily" | "weekly" | "monthly";
  recurrence_end_date?: string;  // ISO 8601 date
  status?: "pending" | "in_progress" | "completed";
}

interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: "high" | "medium" | "low";
  tags?: string[];
  due_date?: string;
  is_recurring?: boolean;
  recurrence_pattern?: "daily" | "weekly" | "monthly";
  recurrence_end_date?: string;
  status?: "pending" | "in_progress" | "completed";
}
```

---

## Common HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 OK | Success | GET, PATCH, POST (non-creation) requests successful |
| 201 Created | Resource created | POST /tasks created new task |
| 400 Bad Request | Invalid input | Validation errors, malformed JSON, invalid query params |
| 401 Unauthorized | Authentication required | Missing or invalid JWT token |
| 403 Forbidden | Access denied | Authenticated user doesn't match path user_id |
| 404 Not Found | Resource not found | Task ID doesn't exist or doesn't belong to user |
| 409 Conflict | State conflict | Attempting to complete already-completed task |
| 500 Internal Server Error | Server error | Unexpected server-side failure |

---

## Backwards Compatibility

All new fields have defaults or are nullable, ensuring existing Phase II clients continue to work:

- **Priority**: Defaults to `"medium"` if not provided
- **Tags**: Defaults to empty array `[]`
- **Due Date**: Nullable, existing tasks have `null`
- **Recurrence**: Defaults to `is_recurring=false`
- **New Query Params**: Optional, existing `GET /tasks` behavior unchanged when not provided

Existing Phase II task CRUD operations continue to work without modification.
