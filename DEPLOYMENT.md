# Deployment Checklist

## Pre-Deployment Requirements

### ✅ Prerequisites
- [ ] PostgreSQL 15+ database provisioned (Neon/Railway/Render)
- [ ] Domain name configured (optional, but recommended for HTTPS)
- [ ] SSL/TLS certificate (required for browser notifications)
- [ ] Backend hosting platform account (Railway/Render/Fly.io)
- [ ] Frontend hosting platform account (Vercel/Netlify)

## Backend Deployment (FastAPI)

### 1. Database Setup

#### Neon Serverless (Recommended)
```bash
# 1. Create Neon project at https://neon.tech
# 2. Copy connection string from dashboard
# 3. Set as DATABASE_URL environment variable
```

**Connection String Format:**
```
postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

#### Railway/Render PostgreSQL
```bash
# 1. Create PostgreSQL addon in platform dashboard
# 2. Copy DATABASE_URL from environment variables
# 3. Database is automatically provisioned
```

### 2. Environment Variables

Set the following in your backend hosting platform:

```env
# Required
DATABASE_URL=postgresql://user:password@host:5432/database
BETTER_AUTH_SECRET=<generate-random-256-bit-key>
BETTER_AUTH_URL=https://your-frontend-domain.com

# Optional (defaults shown)
PORT=8000
ENVIRONMENT=production
LOG_LEVEL=info
```

**Generate BETTER_AUTH_SECRET:**
```bash
# Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# OpenSSL
openssl rand -base64 32
```

### 3. Database Migrations

**Option A: Manual Migration (First Deployment)**
```bash
# Connect to your deployment
uv run alembic upgrade head
```

**Option B: Automatic Migration (In Dockerfile/Start Script)**
```bash
# Add to start script before uvicorn
uv run alembic upgrade head
uvicorn src.main:app --host 0.0.0.0 --port $PORT
```

### 4. Deploy Backend

#### Railway
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Link to backend directory
cd backend
railway up

# 5. Set environment variables in dashboard
```

#### Render
```yaml
# render.yaml
services:
  - type: web
    name: todo-backend
    runtime: python
    buildCommand: "cd backend && uv sync"
    startCommand: "cd backend && uv run alembic upgrade head && uv run uvicorn src.main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: BETTER_AUTH_SECRET
        sync: false
      - key: BETTER_AUTH_URL
        sync: false
```

#### Docker (Optional)
```dockerfile
# backend/Dockerfile
FROM python:3.13-slim

WORKDIR /app

# Install UV
RUN pip install uv

# Copy dependencies
COPY pyproject.toml .
COPY uv.lock .

# Install dependencies
RUN uv sync --frozen

# Copy application
COPY . .

# Run migrations and start server
CMD ["sh", "-c", "uv run alembic upgrade head && uv run uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

### 5. Verify Backend Deployment

```bash
# Health check
curl https://your-backend-url.com/

# Expected: {"status":"ok"}

# Check API docs
curl https://your-backend-url.com/docs

# Test authentication
curl -X POST https://your-backend-url.com/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'
```

## Frontend Deployment (Next.js)

### 1. Environment Variables

Set the following in Vercel/Netlify dashboard:

```env
# Required
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_BETTER_AUTH_URL=https://your-frontend-domain.com
BETTER_AUTH_SECRET=<same-as-backend-secret>

# Optional
NEXT_PUBLIC_APP_NAME=Todo App
NODE_ENV=production
```

⚠️ **Important**: `BETTER_AUTH_SECRET` must match the backend secret exactly.

### 2. Deploy Frontend

#### Vercel (Recommended)
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy from frontend directory
cd frontend
vercel

# 4. Set environment variables in dashboard
# 5. Redeploy with production settings
vercel --prod
```

**Vercel Dashboard:**
1. Go to Settings → Environment Variables
2. Add all required variables
3. Redeploy from Deployments tab

#### Netlify
```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Initialize
cd frontend
netlify init

# 4. Deploy
netlify deploy --prod

# 5. Set environment variables in dashboard
```

**netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3. Configure CORS (Backend)

Update backend CORS settings to allow your frontend domain:

```python
# backend/src/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-frontend-domain.com",
        "https://your-frontend-domain.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4. Verify Frontend Deployment

```bash
# Check homepage
curl https://your-frontend-domain.com

# Check API connectivity (check browser console)
# Should successfully call backend API
```

## Post-Deployment Verification

### ✅ Checklist

**Backend:**
- [ ] Health endpoint returns 200 OK
- [ ] API documentation accessible at `/docs`
- [ ] Database connection successful
- [ ] Migrations applied (check database for `alembic_version` table)
- [ ] Authentication working (sign-up/sign-in)
- [ ] CORS configured for frontend domain

**Frontend:**
- [ ] Homepage loads without errors
- [ ] Sign-up flow works end-to-end
- [ ] Sign-in flow works end-to-end
- [ ] Dashboard loads after authentication
- [ ] Can create tasks
- [ ] Can view/edit/delete tasks
- [ ] Filters and search work
- [ ] Browser notifications work (HTTPS required)

**Database:**
- [ ] All indexes created (check with `\di` in psql)
- [ ] Tasks table has all columns
- [ ] Foreign key constraints work
- [ ] ENUM types created (taskpriority, recurrencepattern)

**Security:**
- [ ] HTTPS enabled on both frontend and backend
- [ ] Environment variables not exposed in client
- [ ] CORS restricted to known domains
- [ ] JWT secrets are secure and match
- [ ] Database credentials secure

## Performance Optimization

### Database Indexes Verification

Connect to your database and run:

```sql
-- List all indexes on tasks table
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'tasks';

-- Expected indexes:
-- 1. tasks_pkey (PRIMARY KEY on id)
-- 2. ix_tasks_user_id (B-tree on user_id)
-- 3. idx_tasks_tags (GIN on tags)
-- 4. idx_tasks_due_date (B-tree on due_date)
-- 5. idx_tasks_user_status_priority (Composite on user_id, completed, priority)
```

### Performance Testing

```bash
# Test with 500+ tasks
# Expected: <200ms response time

time curl "https://your-backend-url.com/api/tasks?limit=100&priority=high&tags=work&sort_by=due_date"
```

## Monitoring & Logging

### Recommended Setup

**Backend Monitoring:**
- Railway/Render built-in metrics
- Sentry for error tracking
- LogRocket for session replay

**Frontend Monitoring:**
- Vercel Analytics (built-in)
- Sentry for error tracking
- Google Analytics for usage

**Database Monitoring:**
- Neon Console metrics
- Query performance tracking
- Connection pool monitoring

## Rollback Procedure

### Backend Rollback

```bash
# Railway/Render: Redeploy previous version from dashboard

# Manual rollback with migrations
uv run alembic downgrade -1  # Rollback one migration
```

### Frontend Rollback

```bash
# Vercel: Revert to previous deployment from dashboard
# Netlify: Revert from Deploys tab
```

### Database Rollback

```bash
# Backup database before migrations
pg_dump $DATABASE_URL > backup.sql

# Restore if needed
psql $DATABASE_URL < backup.sql
```

## Common Issues & Solutions

### Issue: Browser notifications not working

**Solution:**
- Ensure frontend is served over HTTPS
- Check browser notification permissions
- Verify notification polling is enabled
- Check browser console for errors

### Issue: CORS errors

**Solution:**
- Add frontend domain to CORS allowed origins
- Include credentials in CORS settings
- Verify BETTER_AUTH_URL matches frontend domain

### Issue: Database connection fails

**Solution:**
- Verify DATABASE_URL is correct
- Check if database accepts connections from deployment IP
- Ensure SSL mode is enabled (Neon requires `?sslmode=require`)
- Check firewall/security group settings

### Issue: Authentication fails

**Solution:**
- Verify BETTER_AUTH_SECRET matches on frontend and backend
- Check BETTER_AUTH_URL is set to frontend domain
- Clear browser cookies and try again
- Check JWT token in browser dev tools

### Issue: Migrations fail

**Solution:**
- Check if Alembic version table exists
- Verify database user has CREATE permissions
- Run migrations manually first time
- Check migration file for syntax errors

## Maintenance Tasks

### Regular Tasks
- [ ] Monitor error rates (weekly)
- [ ] Review database size and optimize (monthly)
- [ ] Update dependencies (monthly)
- [ ] Backup database (automated daily)
- [ ] Review logs for anomalies (weekly)

### Scaling Considerations
- Database connection pooling (100+ concurrent users)
- CDN for frontend assets (global users)
- Redis caching for API responses (high traffic)
- Read replicas for database (heavy read load)

## Emergency Contacts

- **Backend Issues**: Check Railway/Render status page
- **Frontend Issues**: Check Vercel/Netlify status page
- **Database Issues**: Check Neon status page
- **SSL Issues**: Contact hosting provider support

---

**Last Updated:** 2025-12-30
**Version:** 1.0.0
**Owner:** Development Team
