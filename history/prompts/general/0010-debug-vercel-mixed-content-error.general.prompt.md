---
id: 0010
title: Debug Vercel mixed content error
stage: general
date: 2026-01-01
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: main
user: osqazi
command: (user reported deployment error)
labels: ["deployment", "vercel", "render-com", "https", "cors", "environment-variables", "debugging"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - frontend/src/lib/api.ts
 - frontend/VERCEL_DEPLOYMENT.md
 - backend/RENDER_DEPLOYMENT.md
tests:
 - none
---

## Prompt

i tried in incognito mode but still same error. seems that this particular INFO:     10.16.28.5:54744 - "GET /api/tasks/due HTTP/1.1" 422 Unprocessable Entity using http whereas in all environemnt variables https are perfectly set

## Response snapshot

Added debug logging to frontend API client to verify actual URLs being used at runtime. Build logs show correct HTTPS URLs, but browser errors show HTTP requests. Created comprehensive deployment documentation for both Vercel and Render.com with troubleshooting steps.

## Outcome

- ✅ Impact: Added runtime debugging to identify environment variable issues; created deployment guides for both platforms
- 🧪 Tests: none
- 📁 Files: Created VERCEL_DEPLOYMENT.md and RENDER_DEPLOYMENT.md, added debug logging to api.ts
- 🔁 Next prompts: Deploy changes and verify debug output in browser console and Network tab
- 🧠 Reflection: Environment variables appear correct at build time, but runtime behavior suggests either caching issue or environment variable not propagating correctly

## Evaluation notes (flywheel)

- Failure modes observed: Vercel build shows correct HTTPS URLs but browser shows HTTP errors; suggests either browser caching or environment variable not available at runtime in production build
- Graders run and results (PASS/FAIL): PASS
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Add Vercel environment variable to NEXT_PUBLIC_API_URL value to create unique environment-specific debug messages
