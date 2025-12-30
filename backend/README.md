---
title: Todo App Backend API
emoji: ✅
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
license: mit
---

# Todo Application Backend API

A full-stack authenticated todo management API built with FastAPI, SQLModel, and PostgreSQL.

## Features

- ✅ Multi-user authentication with JWT
- ✅ CRUD operations for tasks
- ✅ Task priorities (high, medium, low)
- ✅ Tags and categories
- ✅ Due dates and reminders
- ✅ Recurring tasks
- ✅ Search, filter, and sort
- ✅ RESTful API design
- ✅ PostgreSQL database with SQLModel ORM

## API Documentation

Once deployed, access the interactive API documentation at:
- **Swagger UI**: `https://your-space-name.hf.space/docs`
- **ReDoc**: `https://your-space-name.hf.space/redoc`

## Environment Variables Required

Set these in your Hugging Face Space settings:

```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters
FRONTEND_URL=https://your-frontend-url.vercel.app
```

## Endpoints

- `GET /` - API information
- `GET /api/health` - Health check
- `GET /api/tasks/{user_id}/tasks` - List all tasks for user
- `POST /api/tasks/{user_id}/tasks` - Create a new task
- `GET /api/tasks/{task_id}` - Get task by ID
- `PATCH /api/tasks/{task_id}` - Update task
- `DELETE /api/tasks/{task_id}` - Delete task
- `POST /api/tasks/{task_id}/toggle` - Toggle task completion
- `POST /api/tasks/{task_id}/complete` - Complete task (handles recurring)

## Technology Stack

- **Framework**: FastAPI 0.100+
- **ORM**: SQLModel 0.0.14+
- **Database**: PostgreSQL (Neon Serverless)
- **Authentication**: JWT with python-jose
- **Server**: Uvicorn ASGI server
- **Python**: 3.11+

## Local Development

```bash
cd backend
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```

## License

MIT
