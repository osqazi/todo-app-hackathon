# Vercel Deployment Troubleshooting Guide

## Environment Variables Checklist

**CRITICAL**: Vercel does NOT read `.env` files in production. You MUST set these in Vercel dashboard.

### Required Environment Variables

```
NEXT_PUBLIC_APP_URL=https://todo-app-hackathon.vercel.app
```
- **Purpose**: Frontend URL for Better Auth trusted origins
- **Must be HTTPS**: `https://` not `http://`

```
NEXT_PUBLIC_API_URL=https://todo-app-hackathon.onrender.com
```
- **Purpose**: Backend API URL for all HTTP requests
- **Must be HTTPS**: `https://` not `http://`
- **Critical**: If this is `http://`, you'll get "Mixed Content" errors

```
BETTER_AUTH_SECRET=<generate-with-openssl-rand-base64-32>
```
- **Purpose**: JWT signing secret (must match backend)
- **Generate**: `openssl rand -base64 32` (minimum 32 chars)

```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```
- **Purpose**: Better Auth PostgreSQL connection

### Setting Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select project: `todo-app-hackathon`
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - **Name**: Variable name (exactly as shown above)
   - **Value**: The value
   - **Environments**: Select **Production**, **Preview**, and **Development**
5. Click **Save**

### Common Issues & Solutions

#### Issue 1: "Mixed Content: The page was loaded over HTTPS, but requested an insecure resource"

**Cause**: `NEXT_PUBLIC_API_URL` is set to `http://` instead of `https://`

**Solution**:
1. Check Vercel dashboard → Settings → Environment Variables
2. Find `NEXT_PUBLIC_API_URL`
3. Verify it starts with `https://`, not `http://`
4. If wrong, update it and redeploy

**Verification**:
- Open browser console (F12)
- Should see: `DEBUG api.ts: API_URL = https://todo-app-hackathon.onrender.com`
- NOT: `DEBUG api.ts: API_URL = http://todo-app-hackathon.onrender.com`

#### Issue 2: Environment variable not found in build logs

**Cause**: Variable not set in all environments (Production/Preview/Development)

**Solution**:
1. In Vercel dashboard, edit the environment variable
2. Select **All Environments** in the "Environments" dropdown
3. Save and redeploy

#### Issue 3: Build succeeds but runtime errors persist

**Cause**: Browser is serving cached JavaScript with old environment values

**Solutions**:

**Option 1: Hard Refresh**
- Chrome/Edge: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
- Select "Empty Cache and Hard Reload"

**Option 2: Clear Browser Data**
- Open DevTools (F12)
- Application tab → "Clear storage" → "Clear site data"
- Reload page

**Option 3: Incognito/Private Window**
- Open in incognito mode to test without cache
- If works there, it's a cache issue in normal window

**Option 4: Check Network Tab**
- Open DevTools → Network tab
- Filter by "fetch" or "XHR"
- Look at the actual request URL in "Headers" section
- Compare with `DEBUG api.ts: API_URL` console output

#### Issue 4: CORS errors

**Cause**: Backend `FRONTEND_URL` doesn't match frontend URL

**Solution**:
1. Check Render.com dashboard → Environment Variables
2. Verify `FRONTEND_URL=https://todo-app-hackathon.vercel.app`
3. Must be exact match (including trailing slash if any)

#### Issue 5: JWT authentication errors

**Cause**: `BETTER_AUTH_SECRET` mismatched between frontend and backend

**Solution**:
1. Backend: Check Render.com dashboard → Environment Variables
2. Frontend: Check Vercel dashboard → Environment Variables
3. Both must have identical `BETTER_AUTH_SECRET` value

### Verification Checklist

Before reporting an issue, verify:

- [ ] All environment variables set in Vercel dashboard (not just .env file)
- [ ] All environment variables have HTTPS prefix (not HTTP)
- [ ] All environment variables set for Production, Preview, and Development
- [ ] Redeployed after changing environment variables
- [ ] Tried clearing browser cache and hard refresh
- [ ] Checked browser console for `DEBUG api.ts: API_URL` output
- [ ] Checked Network tab for actual HTTP request URL
- [ ] Verified CORS origin matches between frontend and backend

### Debug Output

The frontend now logs the following at startup and runtime:

**Build time** (appears in Vercel build logs):
```
DEBUG auth.ts: NEXT_PUBLIC_APP_URL = https://todo-app-hackathon.vercel.app
DEBUG auth.ts: NEXT_PUBLIC_API_URL = https://todo-app-hackathon.onrender.com
```

**Runtime** (appears in browser console):
```
DEBUG api.ts: API_URL = https://todo-app-hackathon.onrender.com
DEBUG api.ts: Fetching from URL = https://todo-app-hackathon.onrender.com/api/tasks/...
```

If runtime shows `http://`, build-time environment variable was overridden or cached.

### Contact Support

If you've checked all items above and still have issues:

1. Check Vercel deployment logs for any errors
2. Check Render.com logs for any errors
3. Verify both services are deployed and running
4. Provide browser console errors and Network tab request URLs
