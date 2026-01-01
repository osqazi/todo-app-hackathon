---
id: 0009
title: Move all hardcoded credentials to environment variables
stage: general
date: 2026-01-01
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: main
user: osqazi
command: (user request)
labels: ["environment-variables", "configuration", "deployment", "security", "vercel", "render-com"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - backend/.env.local
 - backend/.env
 - backend/.env.example
 - backend/.gitignore
 - backend/src/main.py
 - backend/src/db/engine.py
 - backend/src/auth/jwks.py
 - backend/src/auth/dependencies.py
 - frontend/.env.local
 - frontend/.env
 - frontend/.env.example
 - frontend/.env.local.example
 - frontend/src/lib/auth.ts
 - frontend/src/lib/auth/helpers.ts
 - frontend/src/lib/api.ts
 - .gitignore
tests:
 - none
---

## Prompt

for backend and frontend, move all the hardcoded credentials and urls to .env

Also keep .env.local to be work for localhost and .env to be worked on production deployed on vercel at https://todo-app-hackathon.vercel.app (frontend) and render.com at https://todo-app-hackathon.onrender.com (backend)

## Response snapshot

Updated all backend and frontend code to remove hardcoded credentials and URLs. Created environment configuration files for both localhost (.env.local) and production (.env). All code now validates required environment variables at startup and throws clear error messages if missing.

## Outcome

- ✅ Impact: All hardcoded credentials and URLs moved to environment variables with clear separation between localhost and production configurations
- 🧪 Tests: none
- 📁 Files: Created/updated 16 files across backend and frontend, including .env files, code updates, and .gitignore configuration
- 🔁 Next prompts: Set BETTER_AUTH_SECRET in Vercel environment variables for production
- 🧠 Reflection: Environment validation at startup prevents silent failures with clear error messages pointing to correct file locations

## Evaluation notes (flywheel)

- Failure modes observed: Edit tool had issues with exact string matching in auth/helpers.ts due to whitespace differences, resolved by rewriting entire file
- Graders run and results (PASS/FAIL): PASS
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Add CI/CD pre-commit hooks to validate environment variables are set before deployment
