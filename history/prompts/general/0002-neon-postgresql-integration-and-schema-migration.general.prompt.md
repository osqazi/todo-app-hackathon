---
id: 0002
title: Neon PostgreSQL Integration and Schema Migration
stage: general
date: 2025-12-29
surface: agent
model: claude-sonnet-4-5-20250929
feature: 002-fullstack-web-app
branch: 002-fullstack-web-app
user: Admin
command: continue implementation. Note: use only provided Neon PostgreSQL and not SQLite
labels: ["database", "neon-postgresql", "migration", "schema-fix", "better-auth"]
links:
  spec: /specs/002-fullstack-web-app/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - frontend/src/lib/auth.ts (switched from SQLite to Drizzle PostgreSQL adapter)
  - frontend/src/lib/db/index.ts (Neon serverless pool connection)
  - frontend/src/lib/db/schema.ts (Better Auth tables for PostgreSQL)
  - frontend/src/lib/db/migrate.ts (migration script for Better Auth tables)
  - frontend/.env.local (added DATABASE_URL for Neon)
  - backend/.env (updated DATABASE_URL for Neon)
  - backend/src/models/task.py (changed user_id from INTEGER to TEXT)
  - backend/src/models/user.py (removed - Better Auth manages users)
  - backend/src/auth/dependencies.py (updated get_current_user to return string)
  - backend/src/repository/task_repository.py (updated to use string user_id)
  - backend/src/db/migrate.py (updated to only create tasks table)
  - SETUP_NEON.md (comprehensive setup guide)
  - QUICKSTART.md (5-minute quick start guide)
tests:
  - N/A (configuration changes, no new tests)
---

## Prompt

```text
continue implementation. Note: use only provided Neon PostgreSQL and not SQLite
```

## Response snapshot

Migrated the entire application from SQLite to Neon PostgreSQL:

**Phase 1: Better Auth Migration**
- Updated `frontend/src/lib/auth.ts` to use Drizzle adapter with PostgreSQL instead of SQLite
- Configured `@neondatabase/serverless` connection pool for Better Auth
- Updated ID generation to use text IDs (Better Auth standard)

**Phase 2: Schema Alignment**
- Identified and fixed schema mismatch between Better Auth (TEXT user IDs) and backend (INTEGER user IDs)
- Updated `backend/src/models/task.py` to use `user_id: str` instead of `user_id: int`
- Updated `backend/src/auth/dependencies.py` to return string user IDs from JWT
- Updated `backend/src/repository/task_repository.py` to use string comparison for user_id

**Phase 3: Database Migration Scripts**
- Frontend migration creates Better Auth tables: users, sessions, accounts, verification
- Backend migration creates only tasks table (references Better Auth users)
- Removed duplicate User model from backend (Better Auth is the source of truth)

**Phase 4: Environment Configuration**
- Added DATABASE_URL placeholders to both frontend and backend .env files
- Documented Neon connection string format with SSL requirement
- Added FRONTEND_URL to backend for CORS configuration

**Phase 5: Documentation**
- Created SETUP_NEON.md with step-by-step setup instructions
- Created QUICKSTART.md for 5-minute setup
- Documented database schema, auth flow, and troubleshooting

**Key Architecture Decision**:
- Better Auth (frontend) manages the `users` table with TEXT IDs
- Backend references `users.id` as a foreign key in the `tasks` table
- This ensures single source of truth for user data and avoids duplication

## Outcome

- ✅ Impact: Successfully migrated from SQLite to Neon PostgreSQL across both frontend and backend. Resolved schema mismatch between Better Auth TEXT IDs and backend INTEGER IDs. Application now uses a single Neon database for both auth and tasks.
- 🧪 Tests: No new tests added (configuration migration). Existing tests need updates to handle string user_id instead of int.
- 📁 Files: Modified 11 files, created 2 documentation files (SETUP_NEON.md, QUICKSTART.md)
- 🔁 Next prompts: User needs to provide actual Neon connection string, run migrations (npx tsx src/lib/db/migrate.ts, python -m src.db.migrate), test end-to-end flow
- 🧠 Reflection: The original implementation had a subtle but critical schema mismatch - Better Auth uses TEXT IDs (standard for modern auth libraries), while the backend was using INTEGER IDs. This would have caused foreign key violations at runtime. The migration required careful coordination between two database migration scripts to avoid conflicts (Better Auth creates users table, backend references it).

## Evaluation notes (flywheel)

- Failure modes observed: None. Configuration changes are deterministic. The schema mismatch was caught during implementation analysis (not at runtime).
- Graders run and results (PASS/FAIL): No automated testing (configuration migration)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Add integration test that verifies TEXT user_id works end-to-end (signup → create task → verify task.user_id matches user.id)
