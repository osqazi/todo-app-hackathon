# Quickstart Guide: Phase II Full-Stack Web Application

**Feature Branch**: `002-fullstack-web-app`
**Date**: 2025-12-28
**Estimated Setup Time**: 15-20 minutes

## Prerequisites

Before starting, ensure you have the following installed:

- **Python 3.13+**: [Download](https://www.python.org/downloads/)
- **UV Package Manager**: [Install](https://docs.astral.sh/uv/getting-started/installation/)
- **Node.js 20+**: [Download](https://nodejs.org/)
- **pnpm 9+**: `npm install -g pnpm`
- **Git**: [Download](https://git-scm.com/downloads/)
- **Neon Account**: [Sign up](https://neon.tech/) (free tier)

### Verify Installations

```bash
python --version    # Should show 3.13 or higher
uv --version        # Should show 0.5.0 or higher
node --version      # Should show v20.0.0 or higher
pnpm --version      # Should show 9.0.0 or higher
git --version       # Should show 2.30.0 or higher
```

---

## Architecture Overview

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Next.js 16    │ ───> │   FastAPI       │ ───> │ Neon PostgreSQL │
│   (Frontend)    │      │   (Backend)     │      │   (Database)    │
│                 │      │                 │      │                 │
│ - Better Auth   │      │ - SQLModel      │      │ - Serverless    │
│ - TanStack      │      │ - JWT Verify    │      │ - Scale-to-zero │
│   Query         │      │ - User Isolation│      │ - Auto backups  │
└─────────────────┘      └─────────────────┘      └─────────────────┘
         │                        ▲
         │                        │
         └────── JWT Token ───────┘
         (Authorization: Bearer <token>)
```

---

## Quick Start (Fastest Path)

### 1. Clone Repository

```bash
git clone https://github.com/your-username/evolution-of-todo.git
cd evolution-of-todo
git checkout 002-fullstack-web-app
```

### 2. Database Setup (Neon)

1. Go to [Neon Console](https://console.neon.tech/)
2. Create new project: "todo-app"
3. Copy connection string (looks like `postgresql://user:pass@ep-xxx.neon.tech/main`)
4. Save for next step

### 3. Environment Configuration

**Backend (.env)**:
```bash
cd backend
cat > .env << 'EOF'
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/main
BETTER_AUTH_JWKS_URL=http://localhost:3000/api/auth/jwks
BETTER_AUTH_ISSUER=http://localhost:3000
API_AUDIENCE=http://localhost:8000
CORS_ORIGINS=http://localhost:3000
EOF
```

**Frontend (.env.local)**:
```bash
cd ../frontend
cat > .env.local << 'EOF'
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/main
BETTER_AUTH_SECRET=$(openssl rand -hex 32)
BETTER_AUTH_ISSUER=http://localhost:3000
API_AUDIENCE=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
```

**Generate Better Auth Secret**:
```bash
# On macOS/Linux
openssl rand -hex 32

# On Windows (PowerShell)
-join (1..32 | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })

# Copy output and replace $(openssl rand -hex 32) in .env.local
```

### 4. Backend Setup

```bash
cd backend

# Install dependencies
uv pip install -r requirements.txt

# Create database tables
uv run python -m src.db.migrate

# Start backend server
uv run uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend should be running at `http://localhost:8000` (check `http://localhost:8000/docs` for Swagger UI)

### 5. Frontend Setup (New Terminal)

```bash
cd frontend

# Install dependencies
pnpm install

# Start Next.js development server
pnpm dev
```

Frontend should be running at `http://localhost:3000`

### 6. Verify Everything Works

1. Open browser to `http://localhost:3000`
2. Click "Sign Up"
3. Enter email and password
4. Create a task
5. Toggle task completion
6. Sign out and sign in again
7. Verify tasks persist

✅ **Success!** You have a working full-stack authenticated todo application.

---

## Detailed Setup Instructions

### Step 1: Repository Setup

```bash
# Clone repository
git clone https://github.com/your-username/evolution-of-todo.git
cd evolution-of-todo

# Checkout Phase II branch
git checkout 002-fullstack-web-app

# Verify project structure
ls -la
# Should see: backend/, frontend/, specs/, CLAUDE.md, README.md
```

### Step 2: Database Setup (Neon PostgreSQL)

#### Create Neon Project

1. **Sign up/Login**: Go to [https://neon.tech/](https://neon.tech/)
2. **Create Project**:
   - Name: `todo-app`
   - Region: Choose closest to you
   - PostgreSQL version: 16
3. **Get Connection String**:
   - Click "Connection Details"
   - Copy "Connection string" (pooled connection recommended)
   - Format: `postgresql://user:pass@ep-xxx-xxx.region.neon.tech/main?sslmode=require`

#### Configure Database

```bash
# Test connection (optional)
psql "postgresql://user:pass@ep-xxx.neon.tech/main?sslmode=require"

# Expected output:
# psql (16.x)
# SSL connection (protocol: TLSv1.3, cipher: TLS_AES_128_GCM_SHA256, bits: 128, compression: off)
# Type "help" for help.
#
# main=>
```

Type `\q` to exit.

### Step 3: Backend Setup (FastAPI)

#### Install Dependencies

```bash
cd backend

# Create virtual environment with UV
uv venv

# Activate virtual environment
# On macOS/Linux:
source .venv/bin/activate

# On Windows:
.venv\Scripts\activate

# Install dependencies
uv pip install -r requirements.txt
```

**requirements.txt**:
```
fastapi==0.110.0
uvicorn[standard]==0.28.0
sqlmodel==0.0.16
psycopg2-binary==2.9.9
python-jose[cryptography]==3.3.0
httpx==0.27.0
python-dotenv==1.0.1
```

#### Configure Environment

```bash
# Create .env file
cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/main?sslmode=require

# Better Auth JWKS (from Next.js frontend)
BETTER_AUTH_JWKS_URL=http://localhost:3000/api/auth/jwks
BETTER_AUTH_ISSUER=http://localhost:3000
API_AUDIENCE=http://localhost:8000

# CORS (allow frontend origin)
CORS_ORIGINS=http://localhost:3000
EOF
```

**Replace**:
- `DATABASE_URL`: Your Neon connection string

#### Initialize Database

```bash
# Run migrations (creates tables)
uv run python -m src.db.migrate

# Expected output:
# Creating database tables...
# Table 'users' created
# Table 'tasks' created
# Migration complete!
```

#### Start Backend Server

```bash
# Start with hot reload (development)
uv run uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload

# Expected output:
# INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
# INFO:     Started reloader process [xxxxx] using WatchFiles
# INFO:     Started server process [xxxxx]
# INFO:     Waiting for application startup.
# INFO:     Application startup complete.
```

#### Verify Backend

Open browser to:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/health` (should return `{"status": "ok"}`)

### Step 4: Frontend Setup (Next.js)

#### Install Dependencies

```bash
cd frontend

# Install dependencies with pnpm
pnpm install
```

**package.json** (key dependencies):
```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "better-auth": "^1.4.0",
    "@tanstack/react-query": "^5.0.0",
    "tailwindcss": "^3.4.0"
  }
}
```

#### Configure Environment

```bash
# Generate Better Auth secret
SECRET=$(openssl rand -hex 32)

# Create .env.local file
cat > .env.local << EOF
# Database (same as backend)
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/main?sslmode=require

# Better Auth
BETTER_AUTH_SECRET=$SECRET
BETTER_AUTH_ISSUER=http://localhost:3000
API_AUDIENCE=http://localhost:8000

# API URL (for frontend to call backend)
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
```

**Replace**:
- `DATABASE_URL`: Your Neon connection string
- `$SECRET`: Generated secret (or run `openssl rand -hex 32` manually)

#### Start Frontend Server

```bash
# Start Next.js development server
pnpm dev

# Expected output:
#   ▲ Next.js 16.0.0
#   - Local:        http://localhost:3000
#   - Environments: .env.local
#
#  ✓ Ready in 2.5s
```

#### Verify Frontend

Open browser to `http://localhost:3000`:
- Should see landing page with "Sign Up" and "Sign In" buttons
- Click "Sign Up" to test authentication

---

## Testing the Application

### Manual Testing Checklist

#### 1. User Signup
```
1. Navigate to http://localhost:3000
2. Click "Sign Up"
3. Enter email: test@example.com
4. Enter password: TestPass123!
5. Click "Create Account"

✅ Expected: Redirected to dashboard with empty state
```

#### 2. Create Task
```
1. On dashboard, enter task title: "Buy groceries"
2. Enter description: "Milk, eggs, bread"
3. Click "Add Task"

✅ Expected: Task appears in list immediately
```

#### 3. Toggle Task Status
```
1. Click checkbox next to task
2. Observe visual change (strikethrough or checkmark)

✅ Expected: Instant UI update (optimistic update)
```

#### 4. Update Task
```
1. Click "Edit" on task
2. Change title to: "Buy groceries and cook dinner"
3. Click "Save"

✅ Expected: Updated task reflects new title
```

#### 5. Delete Task
```
1. Click "Delete" on task
2. Confirm deletion (if prompt shown)

✅ Expected: Task removed from list
```

#### 6. Persistence Test
```
1. Create 3 tasks
2. Close browser tab
3. Reopen http://localhost:3000
4. Sign in with same credentials

✅ Expected: All 3 tasks still visible
```

#### 7. Multi-User Isolation
```
1. Open incognito window
2. Sign up with different email: test2@example.com
3. Create task: "User 2's task"
4. Switch back to original window
5. Refresh page

✅ Expected: Original user only sees their own tasks
```

### Automated Testing

```bash
# Backend tests
cd backend
uv run pytest tests/ -v

# Frontend tests
cd frontend
pnpm test
```

---

## Project Structure

```
evolution-of-todo/
├── backend/                  # FastAPI backend
│   ├── src/
│   │   ├── domain/          # Data models, exceptions
│   │   │   ├── models.py    # SQLModel schemas (User, Task)
│   │   │   └── exceptions.py # Custom exceptions
│   │   ├── repository/      # Data access layer
│   │   │   └── task_repository.py # User-isolated CRUD
│   │   ├── service/         # Business logic
│   │   │   └── task_service.py # Validation, orchestration
│   │   ├── api/             # HTTP layer
│   │   │   ├── dependencies.py # DI factories
│   │   │   └── routes/
│   │   │       └── tasks.py # Task endpoints
│   │   ├── auth/            # JWT verification
│   │   │   └── jwt_verifier.py
│   │   ├── db/              # Database config
│   │   │   ├── engine.py    # Neon connection
│   │   │   ├── session.py   # Session dependency
│   │   │   └── migrate.py   # Schema initialization
│   │   └── main.py          # FastAPI app entry point
│   ├── tests/               # Backend tests
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Backend environment (gitignored)
│
├── frontend/                # Next.js frontend
│   ├── src/
│   │   ├── app/             # Next.js 16 App Router
│   │   │   ├── page.tsx     # Landing page
│   │   │   ├── dashboard/   # Authenticated pages
│   │   │   │   └── page.tsx
│   │   │   ├── auth/        # Signup/signin pages
│   │   │   │   ├── signup/page.tsx
│   │   │   │   └── signin/page.tsx
│   │   │   └── api/         # API routes (proxies to backend)
│   │   │       └── tasks/route.ts
│   │   ├── components/      # React components
│   │   │   ├── TodoList.tsx
│   │   │   ├── TaskItem.tsx
│   │   │   └── AuthForm.tsx
│   │   ├── lib/             # Utilities
│   │   │   ├── auth.ts      # Better Auth config
│   │   │   └── api-client.ts # API fetch wrapper
│   │   └── styles/          # Tailwind CSS
│   ├── tests/               # Frontend tests
│   ├── package.json         # Node dependencies
│   └── .env.local           # Frontend environment (gitignored)
│
├── specs/                   # Feature specifications
│   └── 002-fullstack-web-app/
│       ├── spec.md          # Requirements
│       ├── plan.md          # Architecture plan
│       ├── research.md      # Decision research
│       ├── data-model.md    # Database schema
│       ├── contracts/       # API contracts
│       ├── quickstart.md    # This file
│       └── tasks.md         # Implementation tasks (generated later)
│
├── CLAUDE.md                # AI agent instructions
└── README.md                # Project overview
```

---

## Common Issues & Troubleshooting

### Issue: "Connection refused" when frontend calls backend

**Solution**:
```bash
# Ensure backend is running
cd backend
uv run uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload

# Verify CORS settings in backend/.env
CORS_ORIGINS=http://localhost:3000
```

### Issue: "Invalid credentials" when signing in

**Solution**:
```bash
# Ensure BETTER_AUTH_SECRET is same in both .env.local files
# Ensure DATABASE_URL points to same Neon database
# Check Better Auth tables exist:
psql "$DATABASE_URL" -c "\dt"

# Should see: users, sessions, verification_tokens, etc.
```

### Issue: "Task not found" for own tasks

**Solution**:
```bash
# Check JWT contains correct user_id:
# 1. Sign in and copy JWT from network tab
# 2. Decode at https://jwt.io/
# 3. Verify "sub" claim matches user ID in database

# Check repository user isolation:
# Ensure TaskRepository receives correct user_id from JWT
```

### Issue: Database connection timeout (Neon)

**Solution**:
```bash
# Neon has scale-to-zero; connection might timeout
# Ensure pool_pre_ping=True in engine config:

# backend/src/db/engine.py
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # ← Add this
    pool_recycle=300
)
```

### Issue: "Module not found" errors

**Solution**:
```bash
# Backend: Ensure virtual environment is activated
source backend/.venv/bin/activate  # macOS/Linux
backend\.venv\Scripts\activate     # Windows

# Frontend: Reinstall dependencies
cd frontend
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## Development Workflow

### Daily Development

```bash
# Terminal 1: Backend
cd backend
source .venv/bin/activate
uv run uvicorn src.main:app --reload

# Terminal 2: Frontend
cd frontend
pnpm dev

# Terminal 3: Database (optional)
psql "$DATABASE_URL"
```

### Making Changes

1. **Update spec**: Edit `specs/002-fullstack-web-app/spec.md` with new requirements
2. **Regenerate plan**: Run `/sp.plan` to update architecture
3. **Update tasks**: Run `/sp.tasks` to generate implementation tasks
4. **Implement**: Follow generated tasks
5. **Test**: Run automated tests and manual checklist
6. **Commit**: `git add . && git commit -m "feat: add feature X"`

### Code Quality

```bash
# Backend linting
cd backend
uv run ruff check src/
uv run ruff format src/

# Frontend linting
cd frontend
pnpm lint
pnpm format
```

---

## Production Deployment

### Environment Variables

**Backend (Production)**:
```env
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/main?sslmode=require
BETTER_AUTH_JWKS_URL=https://todo.example.com/api/auth/jwks
BETTER_AUTH_ISSUER=https://todo.example.com
API_AUDIENCE=https://api.todo.example.com
CORS_ORIGINS=https://todo.example.com
```

**Frontend (Production)**:
```env
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/main?sslmode=require
BETTER_AUTH_SECRET=<production-secret>
BETTER_AUTH_ISSUER=https://todo.example.com
API_AUDIENCE=https://api.todo.example.com
NEXT_PUBLIC_API_URL=https://api.todo.example.com
```

### Deployment Platforms

**Frontend (Vercel)**:
```bash
# Install Vercel CLI
pnpm install -g vercel

# Deploy
cd frontend
vercel

# Set environment variables in Vercel dashboard
```

**Backend (Railway/Render/DigitalOcean)**:
```bash
# Railway
railway login
railway init
railway up

# Render
# Connect GitHub repo and set environment variables

# DigitalOcean App Platform
# Connect GitHub repo and configure via UI
```

---

## Next Steps

1. ✅ Complete quickstart setup
2. ⬜ Run manual testing checklist
3. ⬜ Implement additional features from `spec.md`
4. ⬜ Add automated tests
5. ⬜ Deploy to production
6. ⬜ Move to Phase III (AI Chatbot)

---

## Resources

### Documentation
- [Next.js 16 Docs](https://nextjs.org/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [SQLModel Docs](https://sqlmodel.tiangolo.com/)
- [Better Auth Docs](https://www.better-auth.com/docs)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Neon Docs](https://neon.tech/docs/introduction)

### Support
- **GitHub Issues**: [Report bugs](https://github.com/your-username/evolution-of-todo/issues)
- **Discussions**: [Ask questions](https://github.com/your-username/evolution-of-todo/discussions)
- **Spec-Kit Plus**: [Documentation](https://github.com/specify-kit/spec-kit-plus)

---

**Document created**: 2025-12-28
**Last updated**: 2025-12-28
**Estimated completion time**: 15-20 minutes
