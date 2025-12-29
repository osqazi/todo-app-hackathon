# Research: Phase II Full-Stack Web Application

**Feature Branch**: `002-fullstack-web-app`
**Date**: 2025-12-28
**Input**: Architecture planning for multi-user authenticated todo web application

## Executive Summary

This research document consolidates architectural decisions for transforming the Phase I console application into a production-grade full-stack web application with authentication, persistent storage, and multi-user support.

### Key Decisions

1. **Authentication Strategy**: Better Auth with JWT (JWKS-based verification, no shared secrets)
2. **API Design**: User ID extracted from JWT only (not in URL paths)
3. **Frontend State Management**: Hybrid pattern (Server Components + TanStack Query)
4. **Database Access**: Thin repository pattern with user isolation enforcement
5. **Error Handling**: Pydantic validation in FastAPI with custom domain exceptions
6. **Environment Configuration**: Asymmetric key approach (no shared secrets between services)

---

## 1. Authentication Strategy

### Decision: Better Auth with JWT Plugin (JWKS-Based Verification)

**Pattern**: Better Auth (Next.js) → JWT issuance → JWKS verification (FastAPI) → User isolation

#### Rationale

1. **No Shared Secrets**: Asymmetric cryptography (Ed25519) eliminates the security risk of sharing secrets between frontend and backend
2. **Standards-Based**: OAuth 2.0 / OIDC compatible, enabling future third-party integrations
3. **Key Rotation Support**: JWKS allows key rotation without coordinating deployments
4. **Clean Separation**: Next.js handles auth UI/UX, FastAPI only verifies tokens
5. **Scalability**: Stateless tokens enable horizontal scaling without session stores

#### How It Works

```
Better Auth (Next.js)          FastAPI Backend
─────────────────────          ────────────────
Private key (signs JWT) -----> Public key (verifies JWT)
                               ↑
                               Fetched from JWKS endpoint (/api/auth/jwks)
```

**JWT Issuance Flow**:
1. User submits email/password to Better Auth signup/signin endpoint
2. Better Auth validates credentials, creates session (7-14 days)
3. Better Auth issues short-lived JWT (1 hour) signed with Ed25519 private key
4. JWT stored in-memory on client (React Context), session in httpOnly cookie

**JWT Verification Flow**:
1. Client sends JWT in `Authorization: Bearer <token>` header
2. FastAPI fetches JWKS from Better Auth endpoint (cached 1 hour)
3. FastAPI verifies JWT signature using public key from JWKS
4. FastAPI validates claims: `iss` (issuer), `aud` (audience), `exp` (expiry), `sub` (user ID)
5. FastAPI extracts `user_id` from `sub` claim for data isolation

#### Implementation Details

**Better Auth Configuration** (Next.js):
```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins/jwt";

export const auth = betterAuth({
  database: {
    provider: "postgresql",
    url: process.env.DATABASE_URL,
  },
  plugins: [
    jwt({
      jwks: true,  // Enable JWKS endpoint
      algorithm: "EdDSA",  // Ed25519 asymmetric signing
      issuer: process.env.BETTER_AUTH_ISSUER,  // e.g., "https://todo.example.com"
      audience: process.env.API_AUDIENCE,  // e.g., "https://api.todo.example.com"
      expiresIn: "1h",  // Short-lived access tokens
    }),
  ],
});
```

**FastAPI JWT Verification**:
```python
# src/auth/jwt_verifier.py
import os
from functools import lru_cache
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, jwk
import httpx

security = HTTPBearer()

@lru_cache(maxsize=1)
def get_jwks():
    """Fetch JWKS from Better Auth endpoint (cached 1 hour)."""
    jwks_url = os.getenv("BETTER_AUTH_JWKS_URL")
    response = httpx.get(jwks_url, timeout=5.0)
    response.raise_for_status()
    return response.json()

def verify_jwt_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify JWT signature and claims, return payload."""
    try:
        # Find the correct signing key from JWKS
        unverified_header = jwt.get_unverified_header(credentials.credentials)
        jwks = get_jwks()
        signing_key = None

        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                signing_key = jwk.construct(key)
                break

        if not signing_key:
            raise HTTPException(status_code=401, detail="Invalid token key ID")

        # Verify signature and claims
        payload = jwt.decode(
            credentials.credentials,
            signing_key,
            algorithms=["EdDSA"],
            issuer=os.getenv("BETTER_AUTH_ISSUER"),
            audience=os.getenv("API_AUDIENCE"),
        )

        return payload

    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

def get_current_user_id(payload: dict = Depends(verify_jwt_token)) -> int:
    """Extract user_id from verified JWT payload."""
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    return int(user_id)
```

#### Security Considerations

| Aspect | Implementation | Rationale |
|--------|---------------|-----------|
| **JWT Expiry** | 1 hour | Limits damage from token theft while maintaining UX |
| **Session Duration** | 7-14 days | Better Auth session acts as refresh token |
| **Storage** | In-memory (React Context) for JWT, httpOnly cookie for session | Protects against XSS attacks |
| **Token Refresh** | `authClient.token()` generates new JWT from valid session | Seamless UX when JWT expires |
| **Password Hashing** | bcrypt (Better Auth default) | Industry standard for password storage |
| **Key Algorithm** | Ed25519 (EdDSA) | Modern asymmetric algorithm, faster than RSA |

#### Environment Variables

**Next.js (Better Auth)**:
```env
DATABASE_URL=postgresql://...  # Neon PostgreSQL connection
BETTER_AUTH_SECRET=<random-32-byte-secret>  # Internal crypto operations
BETTER_AUTH_ISSUER=https://todo.example.com
API_AUDIENCE=https://api.todo.example.com
```

**FastAPI Backend**:
```env
BETTER_AUTH_JWKS_URL=https://todo.example.com/api/auth/jwks
BETTER_AUTH_ISSUER=https://todo.example.com
API_AUDIENCE=https://api.todo.example.com
DATABASE_URL=postgresql://...  # Same Neon database
```

**Key Point**: No shared secrets! FastAPI never needs `BETTER_AUTH_SECRET`.

#### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| **Shared HS256 Secret** | Security risk (symmetric key shared across services), no key rotation |
| **NextAuth.js** | Better Auth is modern successor with better TypeScript support |
| **FastAPI handles all auth** | Violates separation of concerns, duplicates UI effort |
| **Firebase/Auth0** | Vendor lock-in, not a learning goal for hackathon |
| **Session-based auth** | Requires shared Redis/database, harder to scale horizontally |

#### Risks and Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| JWKS endpoint unavailable | Medium | Aggressive caching (1-hour TTL), Redis fallback in production |
| Token theft via XSS | Medium | CSP headers, input sanitization, short expiry (1 hour) |
| Cannot revoke JWTs immediately | Low | 1-hour expiry acceptable for MVP; Better Auth session can be revoked |
| Clock skew between servers | Low | NTP on both servers, implement leeway in verification |

---

## 2. API Design Pattern

### Decision: Extract user_id from JWT Only (Not in URL Paths)

**Endpoint Structure**:
```
POST   /api/tasks                # Create task for authenticated user
GET    /api/tasks                # List tasks for authenticated user
GET    /api/tasks/{task_id}      # Get specific task (ownership verified)
PATCH  /api/tasks/{task_id}      # Update task (ownership verified)
DELETE /api/tasks/{task_id}      # Delete task (ownership verified)
POST   /api/tasks/{task_id}/toggle  # Toggle completion status
```

**NOT**:
```
/api/users/{user_id}/tasks  ❌ (Avoid this pattern)
```

#### Rationale

1. **Security & Trust Boundary**
   - JWT is cryptographically signed → authoritative source of user identity
   - URL parameters are untrusted → even authenticated users could manipulate `user_id`
   - Defense in depth: If user_id is in URL, must verify it matches JWT anyway (redundant)

2. **REST Conventions & Simplicity**
   - Modern REST APIs favor **resource-centric** design over user-scoped paths
   - Cleaner URLs: `/api/tasks` vs `/api/users/{user_id}/tasks`
   - User context is implicit (from authentication), not explicit (in URL)
   - Principle: "The resource belongs to whoever is authenticated"

3. **Scalability & Maintainability**
   - Stateless authentication: JWT carries user identity, no session lookup needed
   - Easier frontend code: No need to inject `user_id` into every API call
   - Consistent pattern: All protected resources follow same pattern

#### Implementation Example

```python
# src/api/routes/tasks.py
from fastapi import APIRouter, Depends, HTTPException, status
from src.api.dependencies import TaskServiceDep, CurrentUserId
from src.domain.models import TaskCreate, TaskPublic
from src.domain.exceptions import TaskNotFoundError, InvalidTaskError

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

@router.post("/", response_model=TaskPublic, status_code=status.HTTP_201_CREATED)
def create_task(
    *,
    task_service: TaskServiceDep,
    task: TaskCreate
):
    """Create task - user_id automatically scoped from JWT."""
    try:
        return task_service.add_task(task.title, task.description)
    except InvalidTaskError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{task_id}", response_model=TaskPublic)
def get_task(
    *,
    task_service: TaskServiceDep,
    task_id: int
):
    """Get task - ownership verification automatic in repository layer."""
    try:
        return task_service.get_task(task_id)
    except TaskNotFoundError:
        # Return 404 for both non-existent and unauthorized (security by obscurity)
        raise HTTPException(status_code=404, detail="Task not found")
```

**Key Points**:
- No `user_id` parameter in route handler
- User context automatically injected via `TaskServiceDep` dependency chain
- Ownership verification happens at repository layer

#### Error Handling Strategy

**404 vs 403 for Ownership Violations**:

**Recommendation: Use 404** for both non-existent and unauthorized resources.

| Scenario | Status Code | Rationale |
|----------|-------------|-----------|
| Task doesn't exist | 404 Not Found | Standard REST pattern |
| Task exists but user doesn't own it | 404 Not Found | **Prevents resource enumeration attacks** |
| No token or invalid token | 401 Unauthorized | Authentication failed |
| Token expired | 401 Unauthorized | Re-authentication required |

**Why 404 instead of 403?**
- **Security by obscurity**: Prevents attackers from discovering which task IDs exist
- **Better UX**: Same error for "doesn't exist" vs "not yours" (simpler for frontend)
- **Privacy**: Doesn't leak information about other users' data

**Alternative (403)** could be used if transparency is more important than security, but for a multi-user todo app, **404 is the safer choice**.

#### Frontend Integration

```typescript
// lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = await authClient.token();  // Get JWT from Better Auth

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,  // JWT automatically includes user_id
      ...options.headers,
    },
  });

  if (response.status === 401) {
    redirectToLogin();  // Token expired or invalid
  }

  return response.json();
}

// Usage - No user_id needed in URLs!
export async function createTask(title: string) {
  return fetchWithAuth('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export async function getTasks() {
  return fetchWithAuth('/api/tasks');  // Returns only current user's tasks
}
```

---

## 3. Frontend State Management

### Decision: Hybrid Pattern (Server Components + TanStack Query)

**Architecture**: React Server Components (initial load) + TanStack Query (mutations) + API Route Proxy

#### Rationale

1. **Best Performance & UX**
   - Fast server-side initial render for SEO and First Contentful Paint
   - Rich client-side interactivity with optimistic updates
   - Background refetching keeps data fresh without user intervention

2. **Production-Ready**
   - TanStack Query: sophisticated caching, automatic retries, DevTools
   - Optimistic updates make mutations feel instant (< 100ms perceived latency)
   - Built-in error handling and rollback on failure

3. **Secure**
   - JWT stored in httpOnly cookies (Better Auth default)
   - API routes proxy authenticated requests to FastAPI
   - Client JavaScript cannot access session tokens (XSS protection)

4. **Future-Proof**
   - Easy to add real-time updates (WebSocket, SSE)
   - Supports offline functionality and PWA features
   - Scales to complex state management needs

#### Data Flow

```
1. Initial Page Load (Server Component)
   ↓
   Server fetches data with JWT from session cookie
   ↓
   Pre-rendered HTML with initial data sent to client
   ↓
2. Client Hydration (TanStack Query)
   ↓
   Query client initialized with server data
   ↓
3. User Interactions (Client Component)
   ↓
   Mutations with optimistic updates (instant UI feedback)
   ↓
   API route proxies request to FastAPI
   ↓
4. Background Refetching
   ↓
   TanStack Query keeps data fresh (stale-while-revalidate)
```

#### Implementation Patterns

**Server Component (Initial Load)**:
```tsx
// app/dashboard/page.tsx
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TodoList } from '@/components/TodoList';

export default async function DashboardPage() {
  // Extract session from httpOnly cookie (secure)
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect('/login');
  }

  // Fetch initial data server-side with JWT
  const todos = await fetch('http://localhost:8000/api/tasks', {
    headers: { Authorization: `Bearer ${session.token}` },
    next: { tags: ['todos'], revalidate: 60 },  // Cache for 60 seconds
  }).then(res => res.json());

  return <TodoList initialData={todos} />;
}
```

**Client Component (Mutations with Optimistic Updates)**:
```tsx
// components/TodoList.tsx
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function TodoList({ initialData }) {
  const queryClient = useQueryClient();

  // Initialize query with server data
  const { data: todos } = useQuery({
    queryKey: ['todos'],
    queryFn: () => fetch('/api/tasks').then(r => r.json()),
    initialData,  // From Server Component
    staleTime: 30_000,  // Consider fresh for 30 seconds
  });

  // Toggle mutation with optimistic update
  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }) =>
      fetch(`/api/tasks/${id}/toggle`, { method: 'POST' }),

    onMutate: async ({ id, completed }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      // Snapshot previous state for rollback
      const previous = queryClient.getQueryData(['todos']);

      // Optimistically update UI (instant feedback!)
      queryClient.setQueryData(['todos'], (old) =>
        old.map(todo => todo.id === id ? { ...todo, completed } : todo)
      );

      return { previous };
    },

    onError: (err, vars, context) => {
      // Rollback on error
      queryClient.setQueryData(['todos'], context.previous);
    },

    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={e => toggleMutation.mutate({
              id: todo.id,
              completed: e.target.checked,
            })}
          />
          {todo.title}
        </li>
      ))}
    </ul>
  );
}
```

**API Route Proxy (Security Layer)**:
```tsx
// app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function GET() {
  // Extract session from httpOnly cookie
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Proxy to FastAPI with JWT
  const res = await fetch('http://localhost:8000/api/tasks', {
    headers: { Authorization: `Bearer ${session.token}` },
  });

  return NextResponse.json(await res.json());
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const res = await fetch('http://localhost:8000/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.token}`,
    },
    body: JSON.stringify(body),
  });

  return NextResponse.json(await res.json());
}
```

#### Why TanStack Query over SWR?

| Feature | TanStack Query | SWR |
|---------|----------------|-----|
| **Bundle Size** | 13KB | 4KB |
| **Optimistic Updates** | Built-in | Manual |
| **DevTools** | Comprehensive | Basic |
| **Cache Control** | Fine-grained (staleTime, cacheTime, refetchInterval) | Simpler |
| **Mutations** | First-class support | Addon |
| **Ecosystem** | Larger (React Query, Solid Query, Vue Query) | React-focused |

**Verdict**: For an interactive todo app with frequent mutations, TanStack Query's extra 9KB is worth the superior developer experience and built-in optimistic updates.

#### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| **Pure Server Actions** | Can't directly call external APIs securely, less sophisticated caching |
| **Pure Client-Side (no Server Components)** | Worse SEO, slower FCP, doesn't leverage Next.js 15 strengths |
| **Redux/Zustand** | Overkill for server state, TanStack Query is specialized for API data |
| **SWR** | Less features than TanStack Query (no built-in optimistic updates) |

---

## 4. Database Access Pattern

### Decision: Thin Repository Pattern with User Isolation Enforcement

**Pattern**: FastAPI → Service Layer → Repository Layer → SQLModel (Session) → Neon PostgreSQL

#### Rationale

1. **User Isolation Enforcement**: Repository is the **single point of enforcement** for filtering by `user_id`
2. **Testability**: Service layer can be unit tested with mocked repository (no database required)
3. **Phase Evolution**: Clean evolution from Phase I (domain/repository/service/ui) to Phase II
4. **Separation of Concerns**: Business logic (service) separated from data access (repository)
5. **Flexibility**: Repository can be swapped (e.g., add caching layer later) without changing service layer

#### Architecture

```
Route Handler (HTTP layer)
    ↓ Depends(TaskServiceDep)
Service Layer (business logic, validation)
    ↓ Injected TaskRepository
Repository Layer (data access, user isolation)
    ↓ SQLModel queries
Neon PostgreSQL (persistent storage)
```

#### Layer Responsibilities

| Layer | Responsibilities | Examples |
|-------|------------------|----------|
| **Domain** | Data models, custom exceptions | `Task`, `TaskNotFoundError` |
| **Repository** | CRUD operations, user isolation, SQL queries | `create()`, `get_by_id()`, `get_all()` |
| **Service** | Business logic, validation, orchestration | Title validation, status toggling |
| **API** | HTTP handling, request/response mapping, error codes | FastAPI route handlers |

#### User Isolation Pattern

**Single Point of Enforcement**:

```python
# src/repository/task_repository.py
class TaskRepository:
    """Repository with automatic user isolation.

    All queries are scoped to the authenticated user's data.
    This is the SINGLE POINT OF ENFORCEMENT for data isolation.
    """

    def __init__(self, session: Session, user_id: int):
        self._session = session
        self._user_id = user_id  # Captured once, used everywhere

    def get_by_id(self, task_id: int) -> Task:
        """Get task by ID, scoped to current user."""
        statement = select(Task).where(
            Task.id == task_id,
            Task.user_id == self._user_id  # ALWAYS PRESENT - user isolation
        )
        task = self._session.exec(statement).first()
        if task is None:
            raise TaskNotFoundError(task_id)
        return task

    def get_all(self, offset: int = 0, limit: int = 100) -> list[Task]:
        """Get all tasks for current user with pagination."""
        statement = (
            select(Task)
            .where(Task.user_id == self._user_id)  # ALWAYS PRESENT - user isolation
            .offset(offset)
            .limit(limit)
            .order_by(Task.created_at.desc())
        )
        return list(self._session.exec(statement).all())
```

**Why This Pattern?**

1. **Defense in Depth**: Even if service layer has a bug, repository enforces isolation
2. **Impossible to Forget**: Developers cannot accidentally query without `user_id`
3. **Single Point of Change**: If isolation logic changes (e.g., add `org_id`), one place to update
4. **Auditable**: Easy to verify all queries are user-scoped by reviewing one file

#### Session Management (Neon PostgreSQL)

```python
# src/db/engine.py
from sqlmodel import create_engine

DATABASE_URL = os.environ["DATABASE_URL"]

# Neon-specific configuration for serverless PostgreSQL
engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,  # Validate connections before use (handles Neon suspend)
    pool_recycle=300,    # Recycle connections every 5 minutes (match scale-to-zero)
    pool_size=5,         # Keep small for serverless
    max_overflow=10,     # Allow burst connections
)
```

```python
# src/db/session.py
from typing import Generator
from sqlmodel import Session
from src.db.engine import engine

def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency for database session.

    Uses yield to ensure proper cleanup after request.
    """
    with Session(engine) as session:
        yield session
```

#### Dependency Injection Chain

```python
# src/api/dependencies.py
from typing import Annotated
from fastapi import Depends
from src.db.session import get_session
from src.repository.task_repository import TaskRepository
from src.service.task_service import TaskService
from src.auth.jwt_verifier import get_current_user_id

SessionDep = Annotated[Session, Depends(get_session)]
CurrentUserId = Annotated[int, Depends(get_current_user_id)]

def get_task_repository(
    session: SessionDep,
    user_id: CurrentUserId
) -> TaskRepository:
    """Factory for user-scoped TaskRepository."""
    return TaskRepository(session, user_id)

TaskRepositoryDep = Annotated[TaskRepository, Depends(get_task_repository)]

def get_task_service(repository: TaskRepositoryDep) -> TaskService:
    """Factory for TaskService with injected repository."""
    return TaskService(repository)

TaskServiceDep = Annotated[TaskService, Depends(get_task_service)]
```

**Dependency Resolution Flow**:
```
Request with JWT
    ↓
get_current_user_id() extracts user_id from JWT
    ↓
get_session() creates database session
    ↓
get_task_repository(session, user_id) creates user-scoped repository
    ↓
get_task_service(repository) creates service with injected repository
    ↓
Route handler receives TaskServiceDep
```

#### Phase I to Phase II Evolution

| Aspect | Phase I (In-Memory) | Phase II (PostgreSQL) | Change Impact |
|--------|---------------------|----------------------|---------------|
| **Domain** | `dataclass Task` | `SQLModel Task` (table=True) | Minimal (add SQLModel decorators) |
| **Repository** | `dict[int, Task]` storage | `Session` with SQL queries | Moderate (replace dict with SQL) |
| **Service** | Business logic, validation | Same interface | **None** (interface preserved!) |
| **ID Generation** | Manual `_next_id` | PostgreSQL auto-increment | Simplified |
| **User Isolation** | N/A | `user_id` parameter | Added to repository constructor |

**Key Insight**: Service layer is **unchanged** because it depends on repository interface, not implementation.

#### Alternatives Considered

| Approach | Pros | Cons | When to Choose |
|----------|------|------|----------------|
| **Direct SQLModel in routes** | Simpler, fewer files | Scattered user isolation, hard to test | Prototypes, 1-2 developers |
| **Repository pattern (chosen)** | Centralized isolation, testable | More files, boilerplate | Multi-tenant, team projects |
| **Service-only (no repository)** | Middle ground | Couples service to SQLModel | When abstraction is not needed |

---

## 5. Error Handling & Validation

### Decision: Pydantic in FastAPI + Custom Domain Exceptions

**Pattern**: Pydantic models (API validation) + Domain exceptions (business logic) + HTTP error mapping

#### Rationale

1. **Pydantic Strength**: FastAPI's built-in Pydantic integration provides automatic request validation
2. **Separation of Concerns**: API validation (format, types) separate from business validation (rules)
3. **Consistent Error Responses**: Domain exceptions map to standard HTTP status codes
4. **Reusability**: Domain exceptions can be reused from Phase I

#### Implementation

**Pydantic Models for API Validation**:
```python
# src/domain/models.py
from pydantic import Field, field_validator
from sqlmodel import SQLModel

class TaskCreate(SQLModel):
    """Request model for creating tasks."""
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)

    @field_validator('title')
    @classmethod
    def title_must_not_be_whitespace(cls, v: str) -> str:
        if not v.strip():
            raise ValueError('Title cannot be empty or whitespace')
        return v.strip()

class TaskUpdate(SQLModel):
    """Request model for updating tasks."""
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
```

**Domain Exceptions (Reused from Phase I)**:
```python
# src/domain/exceptions.py
class TaskNotFoundError(Exception):
    """Raised when a task is not found."""
    def __init__(self, task_id: int):
        self.task_id = task_id
        super().__init__(f"Task with ID {task_id} not found")

class InvalidTaskError(Exception):
    """Raised when task data is invalid."""
    pass
```

**HTTP Error Mapping**:
```python
# src/api/routes/tasks.py
@router.post("/", response_model=TaskPublic, status_code=201)
def create_task(
    *,
    task_service: TaskServiceDep,
    task: TaskCreate  # Pydantic validates format automatically
):
    try:
        return task_service.add_task(task.title, task.description)
    except InvalidTaskError as e:
        # Business validation error → 400 Bad Request
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{task_id}", response_model=TaskPublic)
def get_task(
    *,
    task_service: TaskServiceDep,
    task_id: int
):
    try:
        return task_service.get_task(task_id)
    except TaskNotFoundError:
        # Not found or unauthorized → 404 Not Found (security by obscurity)
        raise HTTPException(status_code=404, detail="Task not found")
```

#### Error Response Format

**Pydantic Validation Error** (422 Unprocessable Entity):
```json
{
  "detail": [
    {
      "type": "string_too_short",
      "loc": ["body", "title"],
      "msg": "String should have at least 1 character",
      "input": "",
      "ctx": {"min_length": 1}
    }
  ]
}
```

**Business Validation Error** (400 Bad Request):
```json
{
  "detail": "Title cannot be empty"
}
```

**Authentication Error** (401 Unauthorized):
```json
{
  "detail": "Could not validate credentials"
}
```

**Not Found Error** (404 Not Found):
```json
{
  "detail": "Task not found"
}
```

#### Alternatives Considered

| Approach | Why Not Chosen |
|----------|----------------|
| **Additional validation library (Cerberus, Marshmallow)** | Pydantic built-in is sufficient and well-integrated |
| **Global exception handlers** | Simple try/except in routes is clearer for this use case |
| **Result types (Success/Failure)** | Adds complexity; exceptions are Pythonic for error flow |

---

## 6. Environment Configuration

### Decision: Asymmetric Key Approach (No Shared Secrets)

**Pattern**: Better Auth (private key) → JWKS endpoint (public key) ← FastAPI (fetch + verify)

#### Configuration Files

**Next.js (Frontend + Better Auth)**:
```env
# .env.local
DATABASE_URL=postgresql://user:pass@neon.tech/todo
BETTER_AUTH_SECRET=<random-32-byte-hex>  # For internal crypto (not shared!)
BETTER_AUTH_ISSUER=https://todo.example.com
API_AUDIENCE=https://api.todo.example.com
NEXT_PUBLIC_API_URL=https://api.todo.example.com
```

**FastAPI (Backend)**:
```env
# .env
DATABASE_URL=postgresql://user:pass@neon.tech/todo
BETTER_AUTH_JWKS_URL=https://todo.example.com/api/auth/jwks
BETTER_AUTH_ISSUER=https://todo.example.com
API_AUDIENCE=https://api.todo.example.com
CORS_ORIGINS=https://todo.example.com
```

#### Security Best Practices

1. **No Shared Secrets**: `BETTER_AUTH_SECRET` is never shared with FastAPI
2. **HTTPS Only**: All URLs use HTTPS in production (JWT in plain HTTP = security risk)
3. **CORS Restriction**: FastAPI only accepts requests from frontend origin
4. **Environment Isolation**: Different `.env` files for development/staging/production
5. **Secret Rotation**: JWKS supports key rotation without downtime

#### Deployment Considerations

**Vercel (Next.js)**:
- Environment variables set via Vercel dashboard
- Automatic HTTPS for all deployments
- `BETTER_AUTH_ISSUER` = production domain (e.g., `https://todo-app.vercel.app`)

**Backend Deployment** (e.g., Railway, Render, DigitalOcean):
- Environment variables set via platform UI or CLI
- `BETTER_AUTH_JWKS_URL` points to production Next.js domain
- `CORS_ORIGINS` restricted to production frontend domain

---

## Technology Stack Summary

### Frontend
- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript 5+
- **Authentication**: Better Auth 1.4+ with JWT plugin
- **State Management**: TanStack Query 5+ (React Query)
- **Styling**: Tailwind CSS 3+
- **HTTP Client**: Native `fetch` API

### Backend
- **Framework**: FastAPI 0.110+
- **Language**: Python 3.13+
- **ORM**: SQLModel 0.0.16+
- **JWT Verification**: `python-jose[cryptography]` 3.3+
- **HTTP Client**: `httpx` 0.27+ (for JWKS fetching)
- **Database Driver**: `psycopg2-binary` 2.9+ (PostgreSQL adapter)

### Database
- **Provider**: Neon Serverless PostgreSQL
- **Version**: PostgreSQL 16+
- **Features**: Scale-to-zero, automatic backups, branching

### Development Tools
- **Package Manager (Python)**: UV (uv 0.5+)
- **Package Manager (Node)**: pnpm 9+
- **Testing (Backend)**: pytest 8+, pytest-asyncio
- **Testing (Frontend)**: Vitest, React Testing Library
- **Code Quality**: ruff (Python), ESLint (TypeScript)

---

## Next Steps

1. **Update `plan.md`**: Fill Technical Context and Project Structure sections
2. **Phase 1: Generate `data-model.md`**: Define SQLModel schemas
3. **Phase 1: Generate API contracts**: OpenAPI spec for all endpoints
4. **Phase 1: Generate `quickstart.md`**: Setup and run instructions
5. **Phase 1: Update agent context**: Add new technologies to CLAUDE.md
6. **Phase 2: Generate `tasks.md`**: Detailed implementation tasks with test cases

---

## References

### Authentication & JWT
- [Better Auth JWT Plugin Documentation](https://www.better-auth.com/docs/plugins/jwt)
- [FastAPI OAuth2 JWT Tutorial](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)
- [JWT Security Best Practices - Curity](https://curity.io/resources/learn/jwt-best-practices/)

### API Design
- [Best practices for REST API security - Stack Overflow](https://stackoverflow.blog/2021/10/06/best-practices-for-authentication-and-authorization-for-rest-apis/)
- [FastAPI Dependency Injection - PropelAuth](https://www.propelauth.com/post/fastapi-auth-with-dependency-injection)

### State Management
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Next.js 15 Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

### Database & SQLModel
- [SQLModel Documentation](https://sqlmodel.tiangolo.com/)
- [Neon Serverless PostgreSQL](https://neon.tech/docs/introduction)
- [FastAPI with SQLModel - Official Tutorial](https://sqlmodel.tiangolo.com/tutorial/fastapi/)

---

**Research completed**: 2025-12-28
**Next artifact**: `plan.md` (fill Technical Context and Constitution Check)
