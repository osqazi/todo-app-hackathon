# Todo Full-Stack Web Application

A production-ready todo list application with advanced task management features, built with FastAPI (Python), Next.js (TypeScript), and PostgreSQL.

## 🎯 Features

### Core Features (Phase I & II)
- ✅ **User Authentication**: Secure signup/signin with Better Auth (JWT-based)
- ✅ **Task Management**: Create, read, update, delete tasks
- ✅ **Task Completion**: Mark tasks as complete with one-click
- ✅ **Rich Task Details**: Title, description, timestamps

### Intermediate Features (Phase III - Part 1)
- ✅ **Priority Levels**: High, medium, low with visual indicators
- ✅ **Tag System**: Organize tasks with custom tags (max 10 per task)
- ✅ **Visual Organization**: Color-coded priorities, tag badges

### Advanced Features (Phase III - Part 2)

#### 🔍 Search & Filter (US2)
- **Smart Search**: Search tasks by title and description
- **Multi-Criteria Filtering**:
  - Completion status (pending/completed)
  - Priority levels (high/medium/low)
  - Tags (OR logic - any matching tag)
  - Due date ranges
  - Overdue tasks
- **Flexible Sorting**: Sort by created_at, due_date, priority, or title
- **URL State Persistence**: Bookmark and share filtered views

#### 📅 Due Dates & Reminders (US3)
- **Due Date/Time**: Set precise deadlines for tasks
- **Browser Notifications**: Get notified when tasks are due
- **Smart Polling**: Checks every 60 seconds for tasks due within 5 minutes
- **Notification Management**: One-time notifications with auto-dismissal

#### 🔄 Recurring Tasks (US4)
- **Recurrence Patterns**: Daily, weekly, monthly
- **Auto-Generation**: Automatically creates next instance on completion
- **Recurrence End Date**: Optional limit for recurring tasks
- **Month-End Handling**: Smart date calculation (Jan 31 → Feb 28/29)
- **Property Inheritance**: Next instance inherits title, description, priority, tags

#### 🎯 Multi-Criteria Discovery (US5)
- **Combined Queries**: Use search + filters + sort simultaneously
- **Bookmarkable URLs**: Share exact filtered views via URL
- **Active Filter Badge**: Visual feedback showing number of active filters
- **State Persistence**: Filters survive page refreshes and browser navigation

## 🏗️ Tech Stack

### Backend
- **Python 3.13+** with UV package manager
- **FastAPI**: Modern async web framework
- **SQLModel**: Type-safe ORM with Pydantic integration
- **PostgreSQL 15+**: Production database (Neon Serverless)
- **Alembic**: Database migrations
- **Better Auth**: Authentication system

### Frontend
- **Next.js 16** (App Router)
- **TypeScript 5+**
- **React 19** with hooks
- **TanStack Query**: Server state management
- **Tailwind CSS**: Utility-first styling
- **react-datepicker**: Date/time selection

## 📋 Prerequisites

### Required
- **Python 3.13+** and **UV** package manager
- **Node.js 18+** and **npm**
- **PostgreSQL 15+** (or Neon Serverless account)

### Installing UV

**Linux/macOS:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows (PowerShell):**
```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd todo
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
uv sync

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and secrets

# Run database migrations
uv run alembic upgrade head

# Start backend server
uv run uvicorn src.main:app --reload --port 8000
```

Backend will be available at: http://localhost:8000

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with backend API URL

# Start development server
npm run dev
```

Frontend will be available at: http://localhost:3000

## 🔧 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@host:5432/database
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key-here
```

## 📊 Database Schema

### Tasks Table
- `id` (INTEGER): Primary key
- `user_id` (TEXT): Foreign key to Better Auth users
- `title` (VARCHAR 500): Task title
- `description` (TEXT): Optional description
- `completed` (BOOLEAN): Completion status
- `created_at` (TIMESTAMP): Creation time
- `updated_at` (TIMESTAMP): Last modification time
- `priority` (ENUM): high/medium/low
- `tags` (ARRAY[VARCHAR 50]): Up to 10 tags
- `due_date` (TIMESTAMP): Optional deadline
- `notification_sent` (BOOLEAN): Notification tracking
- `is_recurring` (BOOLEAN): Recurring task flag
- `recurrence_pattern` (ENUM): daily/weekly/monthly
- `recurrence_end_date` (DATE): Optional end date
- `parent_task_id` (INTEGER): Reference to parent task

### Indexes (Performance Optimized)
- **GIN index** on `tags` for array containment queries
- **B-tree index** on `due_date` for date sorting
- **Composite index** on `user_id`, `completed`, `priority` for filtered queries

## 🎨 Project Structure

```
todo/
├── backend/                    # FastAPI backend
│   ├── src/
│   │   ├── api/               # API routes
│   │   │   ├── tasks.py       # Task CRUD + search/filter
│   │   │   └── notifications.py
│   │   ├── auth/              # Authentication
│   │   ├── db/                # Database config
│   │   ├── models/            # SQLModel models
│   │   ├── repository/        # Data access layer
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── service/           # Business logic
│   │   └── main.py            # App entry point
│   ├── alembic/               # Database migrations
│   └── pyproject.toml
│
├── frontend/                   # Next.js frontend
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── sign-in/       # Authentication
│   │   │   └── sign-up/
│   │   ├── components/        # React components
│   │   │   └── tasks/
│   │   │       ├── TaskList.tsx
│   │   │       ├── TaskForm.tsx
│   │   │       ├── TaskFilters.tsx
│   │   │       ├── SearchBar.tsx
│   │   │       ├── SortSelector.tsx
│   │   │       ├── DateTimePicker.tsx
│   │   │       ├── RecurrenceConfig.tsx
│   │   │       ├── PrioritySelector.tsx
│   │   │       └── TagInput.tsx
│   │   ├── hooks/             # Custom hooks
│   │   │   └── useNotificationPolling.ts
│   │   └── lib/               # Utilities
│   │       ├── api.ts         # API client
│   │       └── auth/
│   └── package.json
│
└── specs/                      # Feature specifications
    └── 003-intermediate-advanced-features/
        ├── spec.md
        ├── plan.md
        └── tasks.md
```

## 📖 API Documentation

### Authentication
- `POST /api/auth/sign-up` - Create new user account
- `POST /api/auth/sign-in` - Sign in and get JWT token

### Tasks
- `GET /api/tasks` - List all tasks with filters, search, sort
  - Query params: `search`, `completed`, `priority[]`, `tags[]`, `due_date_from`, `due_date_to`, `is_overdue`, `sort_by`, `sort_order`
- `POST /api/tasks` - Create new task
- `GET /api/tasks/{id}` - Get task by ID
- `PATCH /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task
- `POST /api/tasks/{id}/complete` - Mark task complete (generates next instance for recurring tasks)

### Notifications
- `GET /api/tasks/due` - Get tasks due within 5 minutes
- `POST /api/tasks/{id}/notification-sent` - Mark notification as sent

## 🧪 Testing

### Manual Testing Checklist

**Basic CRUD:**
- [ ] Create task with all fields
- [ ] View task list
- [ ] Update task details
- [ ] Delete task
- [ ] Mark task complete

**Search & Filter:**
- [ ] Search by title/description
- [ ] Filter by completion status
- [ ] Filter by priority
- [ ] Filter by tags
- [ ] Filter by due date range
- [ ] Filter overdue tasks
- [ ] Combine multiple filters
- [ ] Sort by different fields
- [ ] Copy/paste URL to new tab

**Due Dates & Notifications:**
- [ ] Set due date for task
- [ ] Enable browser notifications
- [ ] Create task due in 2 minutes
- [ ] Verify notification appears
- [ ] Check notification auto-dismiss

**Recurring Tasks:**
- [ ] Create daily recurring task
- [ ] Mark complete and verify next instance
- [ ] Create monthly recurring on Jan 31
- [ ] Verify next instance on Feb 28/29
- [ ] Test recurrence end date

## 🚀 Deployment

### Backend Deployment (Railway/Render)
1. Set environment variables (DATABASE_URL, BETTER_AUTH_SECRET)
2. Run migrations: `alembic upgrade head`
3. Deploy with: `uvicorn src.main:app --host 0.0.0.0 --port $PORT`

### Frontend Deployment (Vercel)
1. Set environment variables (NEXT_PUBLIC_API_URL, BETTER_AUTH_SECRET)
2. Build: `npm run build`
3. Deploy to Vercel (auto-detected Next.js)

### Database Setup (Neon)
1. Create Neon project
2. Copy connection string to DATABASE_URL
3. Run migrations via backend deployment

### HTTPS Requirement
⚠️ **Browser notifications require HTTPS in production**. Ensure your frontend is deployed with SSL/TLS certificate (Vercel provides this automatically).

## 🔐 Security

- JWT-based authentication with Better Auth
- Password hashing with bcrypt
- SQL injection prevention via parameterized queries
- User isolation (all queries filtered by user_id)
- CORS configuration for cross-origin requests
- Environment variables for secrets

## ⚡ Performance

- **Database Indexes**: GIN on tags, B-tree on due_date, composite on user_id/completed/priority
- **React Query Caching**: Intelligent cache invalidation for optimistic updates
- **Debounced Search**: 300ms delay to reduce API calls
- **Pagination**: Support for offset/limit (default 100 items)
- **Target**: <200ms response time for filtered queries with 500+ tasks

## 🤝 Contributing

This project follows Spec-Driven Development (SDD) methodology:
1. Write specification in `specs/`
2. Create implementation plan
3. Break down into testable tasks
4. Implement with test-driven development
5. Document in Prompt History Records (PHRs)

## 📜 License

MIT

## 🙏 Acknowledgments

Built as part of a hackathon learning exercise to explore modern full-stack development patterns, authentication systems, and advanced task management features.
