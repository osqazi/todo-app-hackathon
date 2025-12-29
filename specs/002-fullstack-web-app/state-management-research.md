# State Management Research: Next.js 15+ App Router with FastAPI Backend

**Research Date:** 2025-12-28
**Context:** Todo application with Next.js 15+ App Router, FastAPI backend, Better Auth authentication

---

## Executive Summary

**Recommended Approach:** Hybrid pattern combining React Server Components (RSC) for initial data loading with client-side state management (TanStack Query) for interactive mutations and optimistic updates.

**Key Decision:** Use Server Components for read operations and Client Components with TanStack Query for write operations (create/update/delete/toggle).

---

## 1. Architecture Options Analysis

### Option A: Pure Server Components + Server Actions (Recommended for Simple Use Cases)

**Pattern:**
- Fetch data in Server Components using `fetch()` with appropriate caching
- Use Server Actions for mutations (create, update, delete)
- Call `revalidatePath()` or `revalidateTag()` after mutations
- Use `useOptimistic` hook for optimistic UI updates

**Pros:**
- Simpler architecture with less client-side code
- Built-in Next.js caching and revalidation
- No additional dependencies
- Better SEO and initial page load performance
- Reduced bundle size (no React Query/SWR)

**Cons:**
- Limited client-side interactivity patterns
- Harder to implement advanced UX (real-time updates, background refetching)
- Server Actions can't directly call external APIs (need API route proxy)
- Less sophisticated caching strategies compared to TanStack Query
- Full page revalidation can feel heavy for small updates

**Best For:**
- Form-heavy applications
- Apps with mostly CRUD operations
- Projects prioritizing simplicity over advanced UX
- Teams new to React Server Components

---

### Option B: Client Components + TanStack Query (Recommended for Interactive Apps)

**Pattern:**
- Use Server Components for layout and initial shell
- Fetch data in Client Components using TanStack Query
- Mutations use TanStack Query mutations with optimistic updates
- Configure automatic refetching and cache invalidation

**Pros:**
- Advanced caching: garbage collection, selective invalidation, stale-while-revalidate
- Excellent developer experience with DevTools
- Built-in optimistic updates, retry logic, and background refetching
- Large community and ecosystem
- Better for real-time/interactive applications
- Fine-grained control over loading/error states per component

**Cons:**
- Larger bundle size (~16.2KB vs SWR's 5.3KB)
- Additional dependency and learning curve
- More complex setup than pure Server Components
- Requires client-side JavaScript for all data fetching

**Best For:**
- Interactive dashboards
- Real-time applications
- Apps requiring sophisticated caching
- Projects with complex data dependencies
- Teams familiar with React Query patterns

---

### Option C: Hybrid Approach (RECOMMENDED)

**Pattern:**
- Server Components for initial data fetch (SEO, performance)
- Pass initial data to Client Components as props
- TanStack Query for mutations and subsequent fetches
- Use `initialData` or `placeholderData` to hydrate queries

**Pros:**
- Best of both worlds: fast initial load + rich interactivity
- SEO benefits from Server Components
- Advanced UX from TanStack Query
- Flexible architecture that can optimize per feature
- Can progressively enhance from Server to Client

**Cons:**
- Most complex architecture
- Requires careful hydration planning
- Team needs understanding of both paradigms
- Potential for data inconsistency if not managed properly

**Best For:**
- Production applications requiring both performance and UX
- Apps with mixed read-heavy and write-heavy features
- Teams with full-stack expertise
- Our todo application (recommended)

---

## 2. Recommended Architecture for Todo App

### Data Flow Pattern

```
┌─────────────────────────────────────────────────────────┐
│ Server Component (Layout/Page)                          │
│ - Initial auth check (Better Auth)                      │
│ - Fetch initial todos from FastAPI                      │
│ - Pass to Client Component as props                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Client Component (TodoList)                              │
│ - TanStack Query with initialData                       │
│ - Mutations for CRUD operations                         │
│ - Optimistic updates with useOptimistic                 │
│ - Automatic revalidation on focus/reconnect             │
└─────────────────────────────────────────────────────────┘
```

### Implementation Details

#### 1. Server Component (Initial Load)

```tsx
// app/dashboard/page.tsx (Server Component)
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { TodoList } from '@/components/TodoList';

async function getTodos(token: string) {
  const res = await fetch('http://localhost:8000/api/tasks', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    // Next.js cache configuration
    next: {
      tags: ['todos'],
      revalidate: 60 // Revalidate every 60 seconds
    }
  });

  if (!res.ok) throw new Error('Failed to fetch todos');
  return res.json();
}

export default async function DashboardPage() {
  // Get session from Better Auth
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect('/login');
  }

  // Fetch initial todos server-side
  const initialTodos = await getTodos(session.token);

  return (
    <div>
      <h1>My Todos</h1>
      {/* Pass initial data to Client Component */}
      <TodoList initialData={initialTodos} />
    </div>
  );
}
```

#### 2. Client Component with TanStack Query

```tsx
// components/TodoList.tsx (Client Component)
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOptimistic } from 'react';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
}

interface TodoListProps {
  initialData: Todo[];
}

export function TodoList({ initialData }: TodoListProps) {
  const queryClient = useQueryClient();

  // Query with initial data from Server Component
  const { data: todos, isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const res = await fetch('/api/tasks'); // Client-side API route
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    initialData, // Use server-fetched data
    staleTime: 30_000, // Consider fresh for 30s
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Optimistic state for instant UI updates
  const [optimisticTodos, setOptimisticTodos] = useOptimistic(
    todos,
    (state, newTodo: Todo) => [...state, newTodo]
  );

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error('Failed to create');
      return res.json();
    },
    onMutate: async (title) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      // Snapshot previous value
      const previousTodos = queryClient.getQueryData(['todos']);

      // Optimistically update
      const tempId = `temp-${Date.now()}`;
      setOptimisticTodos({
        id: tempId,
        title,
        completed: false,
        created_at: new Date().toISOString(),
      });

      return { previousTodos };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  // Toggle mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error('Failed to toggle');
      return res.json();
    },
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      const previousTodos = queryClient.getQueryData<Todo[]>(['todos']);

      // Optimistically update
      queryClient.setQueryData<Todo[]>(['todos'], (old) =>
        old?.map((todo) =>
          todo.id === id ? { ...todo, completed } : todo
        )
      );

      return { previousTodos };
    },
    onError: (err, variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos);
      }
    },
  });

  return (
    <div>
      {optimisticTodos.map((todo) => (
        <div key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={(e) =>
              toggleMutation.mutate({ id: todo.id, completed: e.target.checked })
            }
          />
          <span>{todo.title}</span>
        </div>
      ))}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          createMutation.mutate(formData.get('title') as string);
          e.currentTarget.reset();
        }}
      >
        <input name="title" placeholder="New todo..." required />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}
```

#### 3. API Route Proxy (for authenticated calls)

```tsx
// app/api/tasks/route.ts (API Route)
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await fetch(`${FASTAPI_URL}/api/tasks`, {
      headers: {
        'Authorization': `Bearer ${session.token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`FastAPI error: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const res = await fetch(`${FASTAPI_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`FastAPI error: ${res.status}`);
    }

    const data = await res.json();

    // Revalidate Next.js cache
    revalidateTag('todos');

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
```

---

## 3. Authentication Flow with Better Auth

### Session Management Pattern

```tsx
// lib/auth.ts
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: {
    // Database config
  },
  plugins: [
    nextCookies() // Essential for Server Components
  ],
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: '7d',
  },
});

// Export session type for TypeScript
export type Session = typeof auth.$Infer.Session;
```

### Middleware for Auth Protection

```tsx
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  // Check session
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
                     request.nextUrl.pathname.startsWith('/signup');

  if (!session && !isAuthPage) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session && isAuthPage) {
    // Redirect to dashboard if already authenticated
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/signup',
  ],
};
```

### JWT Handling in API Routes

Better Auth automatically:
1. Stores JWT in HTTP-only cookies (secure in production)
2. Provides `auth.api.getSession()` helper to extract and verify tokens
3. Handles refresh token rotation
4. Integrates with Next.js cookie system via `nextCookies()` plugin

**Development cookies:** `next-auth.session-token`
**Production cookies:** `__Secure-next-auth.session-token`

---

## 4. TanStack Query vs SWR Decision Matrix

| Feature | TanStack Query | SWR | Winner |
|---------|---------------|-----|--------|
| **Bundle Size** | 16.2KB | 5.3KB | SWR |
| **DevTools** | Excellent built-in | Basic | TanStack Query |
| **Community** | Larger, more plugins | Good, Vercel-backed | TanStack Query |
| **Cache Strategies** | Advanced (GC, selective invalidation) | Basic (stale-while-revalidate) | TanStack Query |
| **Optimistic Updates** | Built-in with rollback | Manual implementation | TanStack Query |
| **Learning Curve** | Moderate | Lower | SWR |
| **Next.js Integration** | Good | Excellent (same org) | SWR |
| **Server Actions Support** | Unclear story | Unclear story | Tie |
| **Production Features** | Pagination, infinite scroll, retry logic | Basic features | TanStack Query |

**Recommendation:** TanStack Query for feature-rich apps, SWR for simple use cases or bundle-size-critical apps.

**Our Choice:** TanStack Query (better for interactive todo app with frequent mutations)

---

## 5. Performance & UX Considerations

### Loading States

```tsx
// Multi-level loading pattern
export default async function DashboardPage() {
  return (
    <Suspense fallback={<TodoListSkeleton />}>
      <TodoListWrapper />
    </Suspense>
  );
}

function TodoListWrapper() {
  const todos = await getTodos(); // Server Component fetch

  return <TodoList initialData={todos} />;
}
```

### Error Boundaries

```tsx
// app/dashboard/error.tsx
'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

### Optimistic Updates Strategy

1. **Immediate UI Update:** Show change instantly
2. **Background Mutation:** Send request to server
3. **Success:** Keep optimistic state
4. **Error:** Rollback to previous state + show error
5. **Revalidate:** Fetch fresh data to ensure consistency

### Cache Invalidation Strategy

```tsx
// Global query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        // Global error handling
        toast.error(error.message);
      },
    },
  },
});
```

---

## 6. Alternative Patterns Considered

### Pure Server Actions Pattern

```tsx
// Server Action (app/actions/todos.ts)
'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function createTodo(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    throw new Error('Unauthorized');
  }

  const title = formData.get('title');

  // Call FastAPI via fetch
  const res = await fetch('http://localhost:8000/api/tasks', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    throw new Error('Failed to create todo');
  }

  // Revalidate the page
  revalidatePath('/dashboard');

  return await res.json();
}
```

```tsx
// Component using Server Action
'use client';

import { createTodo } from '@/app/actions/todos';
import { useOptimistic } from 'react';

export function TodoForm({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo: Todo) => [...state, newTodo]
  );

  async function action(formData: FormData) {
    // Add optimistic todo
    addOptimisticTodo({
      id: `temp-${Date.now()}`,
      title: formData.get('title') as string,
      completed: false,
    });

    // Call Server Action
    await createTodo(formData);
  }

  return (
    <form action={action}>
      <input name="title" required />
      <button type="submit">Add Todo</button>
    </form>
  );
}
```

**Why Not Recommended:**
- Server Actions can't directly call external APIs securely (credentials exposure)
- Requires API route proxy anyway
- Less sophisticated error handling than TanStack Query
- No background refetching or cache management

---

## 7. Security Considerations

### JWT Storage
- **Never store JWT in localStorage** (XSS vulnerability)
- **Use HTTP-only cookies** (Better Auth default)
- **Set Secure flag in production** (HTTPS only)
- **Implement CSRF protection** for mutations

### API Route Security
```tsx
// Rate limiting example
import { ratelimit } from '@/lib/redis';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // Continue with mutation...
}
```

### CORS Configuration (FastAPI)
```python
# FastAPI backend
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Dev
        "https://yourdomain.com",  # Prod
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)
```

---

## 8. Testing Strategy

### Server Component Testing
```tsx
// __tests__/dashboard.test.tsx
import { render } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';

// Mock Better Auth
jest.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(() => Promise.resolve({
        user: { id: '1', email: 'test@example.com' },
        token: 'mock-token',
      })),
    },
  },
}));

test('renders dashboard with todos', async () => {
  const { findByText } = render(await DashboardPage());
  expect(await findByText('My Todos')).toBeInTheDocument();
});
```

### TanStack Query Testing
```tsx
// __tests__/TodoList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TodoList } from '@/components/TodoList';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

test('optimistic update on todo creation', async () => {
  const queryClient = createTestQueryClient();
  const { user } = render(
    <QueryClientProvider client={queryClient}>
      <TodoList initialData={[]} />
    </QueryClientProvider>
  );

  const input = screen.getByPlaceholderText('New todo...');
  await user.type(input, 'Buy milk');
  await user.click(screen.getByText('Add'));

  // Should see optimistic todo immediately
  expect(screen.getByText('Buy milk')).toBeInTheDocument();
});
```

---

## 9. Migration Path & Future Considerations

### Phase 1: MVP (Current)
- Server Components for initial load
- TanStack Query for mutations
- Basic optimistic updates

### Phase 2: Enhanced UX
- Real-time updates via WebSockets or Server-Sent Events
- Offline support with service workers
- Background sync for failed mutations

### Phase 3: Scale
- Edge caching with Vercel/Cloudflare
- Database read replicas
- CDN for static assets
- Redis for session storage

### React 19 Features to Leverage
- **`useActionState`**: Form submissions with pending states
- **`useOptimistic`**: Built-in optimistic updates (already using)
- **`use` hook**: Unwrap promises in components
- **Improved Suspense**: Better streaming and error handling

---

## 10. Final Recommendations

### For Todo Application

**Architecture:** Hybrid (Server Components + TanStack Query)

**Data Fetching:**
- ✅ Server Components for initial page load (SEO, performance)
- ✅ TanStack Query for client-side mutations (UX, optimistic updates)
- ✅ API Routes as proxy to FastAPI (security, authentication)
- ✅ HTTP-only cookies for JWT storage (Better Auth default)

**State Management:**
- ✅ TanStack Query for server state (todos, user data)
- ✅ React useState for local UI state (form inputs, modals)
- ✅ React Context for global UI state (theme, settings) if needed
- ❌ No global state management library (Zustand/Redux) needed for simple todo app

**Authentication:**
- ✅ Better Auth with `nextCookies()` plugin
- ✅ Middleware for route protection
- ✅ `auth.api.getSession()` in Server Components and API Routes
- ✅ JWT in HTTP-only cookies (automatic)

**Performance:**
- ✅ Initial server-side render for fast FCP/LCP
- ✅ Optimistic updates for instant feedback
- ✅ Background refetching for data freshness
- ✅ Suspense boundaries for granular loading states
- ✅ Error boundaries for graceful error handling

**Developer Experience:**
- ✅ TanStack Query DevTools for debugging
- ✅ TypeScript for type safety
- ✅ React Testing Library for component tests
- ✅ Clear separation of Server/Client components

---

## 11. Dependencies Required

```json
{
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-query": "^5.62.11",
    "@tanstack/react-query-devtools": "^5.62.11",
    "better-auth": "^1.1.11",
    "better-auth-next": "^1.1.11"
  },
  "devDependencies": {
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.1",
    "typescript": "^5.7.2"
  }
}
```

---

## 12. Code Examples Repository Structure

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx          # Login page (Server Component)
│   └── signup/
│       └── page.tsx          # Signup page (Server Component)
├── dashboard/
│   ├── layout.tsx            # Dashboard layout (Server Component)
│   ├── page.tsx              # Main dashboard (Server Component)
│   ├── error.tsx             # Error boundary
│   └── loading.tsx           # Loading skeleton
├── api/
│   ├── tasks/
│   │   ├── route.ts          # GET /api/tasks, POST /api/tasks
│   │   └── [id]/
│   │       └── route.ts      # PATCH, DELETE /api/tasks/:id
│   └── auth/
│       └── [...all]/
│           └── route.ts      # Better Auth routes
└── layout.tsx                # Root layout

components/
├── TodoList.tsx              # Client Component (TanStack Query)
├── TodoItem.tsx              # Client Component
├── TodoForm.tsx              # Client Component
├── ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Skeleton.tsx
└── providers/
    └── QueryProvider.tsx     # TanStack Query Provider

lib/
├── auth.ts                   # Better Auth configuration
├── queryClient.ts            # TanStack Query client
└── api/
    └── tasks.ts              # API client functions

middleware.ts                 # Auth protection middleware
```

---

## 13. Key Takeaways

1. **Hybrid is Best**: Combine Server Components (initial load) with Client Components (mutations) for optimal performance and UX

2. **TanStack Query Wins**: For interactive apps, TanStack Query provides better DX and UX than pure Server Actions or SWR

3. **Security First**: Use HTTP-only cookies, API route proxies, and proper CORS configuration

4. **Progressive Enhancement**: Start simple (Server Components), add interactivity (TanStack Query) where needed

5. **React 19 Features**: Leverage `useOptimistic` for instant UI updates with automatic rollback

6. **Type Safety**: TypeScript + TanStack Query + Better Auth provide end-to-end type safety

7. **Testing**: Test Server Components separately from Client Components; use test query clients for TanStack Query tests

8. **Future-Proof**: Architecture supports adding real-time features, offline support, and edge caching later

---

## Sources

### State Management Patterns
- [Getting Started: Server and Client Components | Next.js](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [State Management with Next.js App Router](https://www.pronextjs.dev/tutorials/state-management)
- [Intro to State Management with Next.JS App Router](https://www.pronextjs.dev/tutorials/state-management/intro-to-state-management-with-next-js-app-router)
- [State Management Trends in React 2025: When to Use Zustand, Jotai, XState, or Something Else - Makers' Den](https://makersden.io/blog/react-state-management-in-2025)
- [Understanding state management in Next.js - LogRocket Blog](https://blog.logrocket.com/guide-state-management-next-js/)
- [React Stack Patterns](https://www.patterns.dev/react/react-2026/)

### TanStack Query vs SWR
- [React Query or SWR: Which is best in 2025? - DEV Community](https://dev.to/rigalpatel001/react-query-or-swr-which-is-best-in-2025-2oa3)
- [Next.js SWR vs React Query: Which Data Fetching Wins?](https://www.buttercups.tech/blog/react/nextjs-swr-vs-react-query-which-data-fetching-wins)
- [Is SWR recommended? (and how it fits with Next 15+Server Actions)](https://github.com/vercel/swr/discussions/4095)
- [React Query vs SWR 2025: Data Fetching Performance Comparison](https://markaicode.com/react-query-vs-swr-2025-performance-comparison/)
- [TanStack Query vs RTK Query vs SWR: Which React Data Fetching Library Should You Choose in 2025?](https://medium.com/better-dev-nextjs-react/tanstack-query-vs-rtk-query-vs-swr-which-react-data-fetching-library-should-you-choose-in-2025-4ec22c082f9f)

### Better Auth Integration
- [Next.js integration | Better Auth](https://www.better-auth.com/docs/integrations/next)
- [Guides: Authentication | Next.js](https://nextjs.org/docs/app/guides/authentication)
- [NextAuth.js 2025: Secure Authentication for Next.js Apps](https://strapi.io/blog/nextauth-js-secure-authentication-next-js-guide)
- [Next.js Auth: Top 5 Authentication Solutions for Secure Apps in 2025](https://indie-starter.dev/blog/next-js-auth-top-5-authentication-solutions-for-secure-apps-in-2025)

### FastAPI Backend Integration
- [Combining Next.js and NextAuth with a FastAPI backend](https://tom.catshoek.dev/posts/nextauth-fastapi/)
- [How You can use FastAPI with OAuth2 for authentication and integrate it with a Next.js frontend](https://gist.github.com/ShaikhZayan/ffb16b87baef36519b12c9856856768fca1)
- [Handling Authentication and Authorization with FastAPI and Next.js](https://www.david-crimi.com/blog/user-auth)
- [How to Build a User Authentication Flow with Next.js, FastAPI, and PostgreSQL](https://www.travisluong.com/how-to-build-a-user-authentication-flow-with-next-js-fastapi-and-postgresql/)
- [Next.js FastAPI Template: how to build and deploy scalable apps](https://www.vintasoftware.com/blog/next-js-fastapi-template)

### Optimistic Updates & React 19
- [useOptimistic – React](https://react.dev/reference/react/useOptimistic)
- [React 19 in 2025 — What's New, Why It Matters](https://requestly.com/blog/react-19-in-2025-whats-new-why-it-matters-and-how-to-migrate-from-react-18/)
- [React State Management in 2025: What You Actually Need](https://www.developerway.com/posts/react-state-management-2025)
- [Understanding optimistic UI and React's useOptimistic Hook - LogRocket](https://blog.logrocket.com/understanding-optimistic-ui-react-useoptimistic-hook/)
- [Optimistic Updates | TanStack Query React Docs](https://tanstack.com/query/v4/docs/framework/react/guides/optimistic-updates)

### Server Actions & Revalidation
- [Data Fetching: Server Actions and Mutations | Next.js](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Getting Started: Updating Data | Next.js](https://nextjs.org/docs/app/getting-started/updating-data)
- [NextJS 15.4 Cache + Revalidation Guide (client & server side)](https://medium.com/@riccardo.carretta/nextjs-15-4-cache-revalidation-guide-client-server-side-7f3fe8fe6b3f)
- [Next.js Server Actions: The Complete Guide - Pedro Alonso](https://www.pedroalonso.net/blog/nextjs-server-actions-complete-guide/)
- [Learn Next.js Server Actions and Mutations with Examples 2025](https://codevoweb.com/learn-nextjs-server-actions-and-mutations-with-examples/)

### FastAPI JWT Authentication
- [Authentication and Authorization with FastAPI: A Complete Guide](https://betterstack.com/community/guides/scaling-python/authentication-fastapi/)
- [JWT Authentication in FastAPI 2025 - Secure Production APIs](https://craftyourstartup.com/cys-docs/jwt-authentication-in-fastapi-guide/)
- [Securing FastAPI with JWT Token-based Authentication](https://testdriven.io/blog/fastapi-jwt-auth/)
- [Securing FastAPI Endpoints with OAuth2 and JWT in 2025](https://medium.com/@bhagyarana80/securing-fastapi-endpoints-with-oauth2-and-jwt-in-2025-2c31bb14cb58)
- [Bulletproof JWT Authentication in FastAPI: A Complete Guide](https://medium.com/@ancilartech/bulletproof-jwt-authentication-in-fastapi-a-complete-guide-2c5602a38b4f)
