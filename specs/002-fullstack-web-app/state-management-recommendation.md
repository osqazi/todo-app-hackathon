# State Management Recommendation Summary

**Date:** 2025-12-28
**Project:** Todo Application - Next.js 15+ with FastAPI Backend

---

## Executive Decision

**RECOMMENDED ARCHITECTURE:** Hybrid Pattern combining React Server Components with TanStack Query

---

## Quick Decision Matrix

| Use Case | Recommended Approach |
|----------|---------------------|
| **Initial page load** | Server Component with `fetch()` |
| **Create/Update/Delete** | Client Component + TanStack Query mutation |
| **Toggle completion** | Client Component + TanStack Query mutation with optimistic update |
| **Authentication** | Better Auth with HTTP-only cookies + API route proxy |
| **Loading states** | Suspense boundaries + TanStack Query loading states |
| **Error handling** | Error boundaries + TanStack Query error states |

---

## Architecture Flow

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Server Component (app/dashboard/page.tsx)                 │
│    - Check auth with Better Auth                             │
│    - Fetch initial todos from FastAPI via server-side fetch  │
│    - Pass initial data to Client Component                   │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Client Component (components/TodoList.tsx)                │
│    - TanStack Query with initialData from Server Component   │
│    - Mutations for create/update/delete/toggle               │
│    - Optimistic updates with useOptimistic hook              │
│    - Automatic background refetching                         │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. API Routes (app/api/tasks/route.ts)                       │
│    - Proxy to FastAPI backend                                │
│    - Extract JWT from Better Auth session                    │
│    - Add Authorization header to FastAPI requests            │
│    - Handle errors and revalidation                          │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. FastAPI Backend                                           │
│    - Verify JWT token                                        │
│    - Execute database operations                             │
│    - Return JSON response                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## Key Decisions & Rationale

### 1. TanStack Query over SWR
**Decision:** Use TanStack Query for client-side data fetching

**Rationale:**
- Better DevTools for debugging
- Built-in optimistic updates with rollback
- More sophisticated caching (garbage collection, selective invalidation)
- Larger community and ecosystem
- Better for interactive applications
- Worth the extra 11KB for enhanced UX

**Trade-off:** Slightly larger bundle size (16.2KB vs SWR's 5.3KB)

---

### 2. Hybrid Pattern over Pure Server Components
**Decision:** Server Components for initial load, Client Components for mutations

**Rationale:**
- Best of both worlds: fast FCP + rich interactivity
- SEO benefits from server-side rendering
- Advanced UX from TanStack Query (optimistic updates, background refetching)
- Can optimize per feature (use Server Components where appropriate)
- Future-proof for adding real-time features

**Trade-off:** More complex architecture, requires understanding both paradigms

---

### 3. API Route Proxy over Direct Client Calls
**Decision:** Next.js API routes proxy requests to FastAPI

**Rationale:**
- Secure JWT handling (session extraction on server)
- No JWT exposure to client JavaScript
- CORS simplification
- Ability to add rate limiting, logging, transformation
- Next.js cache revalidation integration
- Better error handling and monitoring

**Trade-off:** Extra network hop (client → Next.js API → FastAPI)

---

### 4. HTTP-Only Cookies over localStorage for JWT
**Decision:** Use Better Auth's default HTTP-only cookie storage

**Rationale:**
- Protected from XSS attacks (JavaScript can't access)
- Automatic inclusion in requests
- Better Auth handles rotation and expiration
- Secure flag in production (HTTPS only)
- CSRF protection via Better Auth

**Trade-off:** Can't access token in client JavaScript (not a problem with our architecture)

---

## Implementation Checklist

### Phase 1: Setup
- [ ] Install dependencies (`@tanstack/react-query`, `better-auth`)
- [ ] Configure Better Auth with `nextCookies()` plugin
- [ ] Set up TanStack Query provider in root layout
- [ ] Create middleware for route protection

### Phase 2: Server Components
- [ ] Create dashboard page as Server Component
- [ ] Implement `getTodos()` server-side fetch function
- [ ] Add Suspense boundaries for loading states
- [ ] Add error boundaries for error handling
- [ ] Pass initial data to Client Component

### Phase 3: Client Components
- [ ] Create TodoList Client Component
- [ ] Set up TanStack Query with `initialData`
- [ ] Implement mutations (create, toggle, delete)
- [ ] Add optimistic updates with `useOptimistic`
- [ ] Configure cache invalidation strategies

### Phase 4: API Routes
- [ ] Create `/api/tasks` GET and POST handlers
- [ ] Create `/api/tasks/[id]` PATCH and DELETE handlers
- [ ] Add session validation in each route
- [ ] Implement error handling and logging
- [ ] Add revalidation calls after mutations

### Phase 5: Testing & Polish
- [ ] Add loading skeletons
- [ ] Implement error messages and retry logic
- [ ] Test optimistic updates and rollback
- [ ] Add TanStack Query DevTools (dev only)
- [ ] Write unit tests for components
- [ ] Test authentication flow end-to-end

---

## Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| **First Contentful Paint** | < 1.5s | Server Component initial render |
| **Time to Interactive** | < 3s | Minimal client-side JS, code splitting |
| **Mutation Response** | Instant (optimistic) | `useOptimistic` hook |
| **Background Refetch** | Every 30s | TanStack Query `staleTime` |
| **Cache Hit Rate** | > 80% | Smart cache invalidation |

---

## Security Checklist

- [x] JWT in HTTP-only cookies (Better Auth default)
- [x] Secure flag in production (Better Auth default)
- [ ] CSRF protection enabled
- [ ] Rate limiting on API routes
- [ ] Input validation on all mutations
- [ ] SQL injection prevention (FastAPI ORM)
- [ ] XSS prevention (React default escaping)
- [ ] CORS properly configured (FastAPI)
- [ ] Secrets in environment variables
- [ ] No sensitive data in client logs

---

## Common Patterns Reference

### Pattern 1: Server Component Data Fetch
```tsx
// app/dashboard/page.tsx
export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/login');

  const todos = await fetch('http://localhost:8000/api/tasks', {
    headers: { Authorization: `Bearer ${session.token}` },
    next: { tags: ['todos'], revalidate: 60 }
  }).then(res => res.json());

  return <TodoList initialData={todos} />;
}
```

### Pattern 2: TanStack Query with Optimistic Updates
```tsx
// components/TodoList.tsx
const toggleMutation = useMutation({
  mutationFn: async ({ id, completed }) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed }),
    });
    return res.json();
  },
  onMutate: async ({ id, completed }) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] });
    const previous = queryClient.getQueryData(['todos']);

    queryClient.setQueryData(['todos'], (old) =>
      old.map(todo => todo.id === id ? { ...todo, completed } : todo)
    );

    return { previous };
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['todos'], context.previous);
  },
});
```

### Pattern 3: API Route Proxy
```tsx
// app/api/tasks/route.ts
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const res = await fetch('http://localhost:8000/api/tasks', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error('FastAPI error');

  revalidateTag('todos');
  return NextResponse.json(await res.json());
}
```

---

## Alternatives Considered

### ❌ Pure Server Actions
**Why Not:**
- Server Actions can't directly call external APIs securely
- Requires API route proxy anyway
- Less sophisticated caching than TanStack Query
- Harder to implement advanced UX patterns

### ❌ Pure Client-Side Rendering
**Why Not:**
- Worse SEO (no initial server render)
- Slower First Contentful Paint
- Requires client-side auth check (flash of wrong content)
- Doesn't leverage Server Components benefits

### ❌ SWR instead of TanStack Query
**Why Not:**
- Less sophisticated caching strategies
- No built-in optimistic updates
- Smaller community and ecosystem
- Unclear integration story with Server Actions

---

## Migration Path

### Current (Phase I Console App)
- Python console application
- In-memory data storage
- No authentication

### Next (Phase II Web App MVP)
- Next.js 15+ frontend
- FastAPI backend
- Better Auth authentication
- Server Components + TanStack Query
- HTTP-only cookie JWT storage

### Future Enhancements
- Real-time updates (WebSockets/SSE)
- Offline support (Service Workers)
- Progressive Web App (PWA)
- Edge caching (Vercel/Cloudflare)
- Database read replicas
- Redis session storage

---

## Success Criteria

### Functional
- ✅ Users can view their todos on page load (Server Component)
- ✅ Users can create todos with instant feedback (optimistic update)
- ✅ Users can toggle completion with instant feedback
- ✅ Users can delete todos with instant feedback
- ✅ Authentication required for all operations
- ✅ Logout clears session and redirects

### Performance
- ✅ FCP < 1.5s
- ✅ TTI < 3s
- ✅ Mutations feel instant (< 100ms perceived)
- ✅ Background refetching every 30s
- ✅ No unnecessary re-renders

### Security
- ✅ JWT in HTTP-only cookies
- ✅ No XSS vulnerabilities
- ✅ CSRF protection enabled
- ✅ Rate limiting on mutations
- ✅ Input validation on all forms

### Developer Experience
- ✅ TypeScript end-to-end
- ✅ Clear separation of concerns (Server/Client)
- ✅ Easy to test components
- ✅ DevTools for debugging
- ✅ Fast local development

---

## Next Steps

1. **Review this recommendation** with team
2. **Create detailed spec** for Phase II web app
3. **Set up development environment** (Next.js + FastAPI)
4. **Implement authentication** (Better Auth)
5. **Build MVP** following hybrid pattern
6. **Test and iterate** based on feedback

---

## Questions & Answers

**Q: Why not use Server Actions for everything?**
A: Server Actions can't securely call external APIs and require API route proxies anyway. TanStack Query provides better caching, optimistic updates, and developer experience for interactive mutations.

**Q: Is TanStack Query overkill for a simple todo app?**
A: For a true MVP, yes. But we're building a production-quality reference implementation that can scale to more complex features. The patterns learned here apply to larger applications.

**Q: Why proxy through Next.js API routes instead of calling FastAPI directly?**
A: Security. We need to extract the JWT from HTTP-only cookies (which client JavaScript can't access) and attach it to FastAPI requests. This also allows rate limiting, logging, and cache revalidation.

**Q: Can we add real-time updates later?**
A: Yes! The hybrid architecture supports adding WebSockets or Server-Sent Events for real-time todo updates across devices without major refactoring.

**Q: What about offline support?**
A: TanStack Query has built-in support for offline mutations via the persistence plugin. We can add service workers later for full offline PWA support.

---

## Resources

- Full research document: `state-management-research.md`
- Next.js docs: https://nextjs.org/docs/app
- TanStack Query docs: https://tanstack.com/query/latest
- Better Auth docs: https://www.better-auth.com/docs
- React 19 docs: https://react.dev
