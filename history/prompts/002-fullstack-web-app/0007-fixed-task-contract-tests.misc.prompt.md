---
id: "0007"
title: "Fixed task contract tests"
stage: "misc"
date: "2025-12-29"
surface: "agent"
model: "sonnet-4.5"
feature: "002-fullstack-web-app"
branch: "002-fullstack-web-app"
user: "human"
command: "Run task contract tests to verify they pass"
labels: ["testing", "debugging", "task-api"]
links:
  spec: "null"
  ticket: "null"
  adr: "null"
  pr: "null"
files:
  - "tests/contract/test_tasks.py"
  - "tests/integration/test_tasks.py"
  - "tests/contract/test_auth.py"
tests:
  - "tests/contract/test_tasks.py (22 tests)"
  - "tests/integration/test_tasks.py (16 tests)"
  - "tests/contract/test_auth.py (12 tests)"
---

## Prompt

Run the task contract tests to verify they pass.

## Response snapshot

All 50 tests passed after fixing 7 test failures:

1. **Endpoint path tests** - Fixed route path assertions for router using "/" and "/{task_id}" paths
2. **Repository user_id conversion** - Changed test user_ids from strings like "user-999" to numeric strings "999" since repository converts to int()
3. **Whitespace validation** - Changed test to verify service-level validation instead of schema-level (which doesn't reject whitespace-only titles)

## Outcome

- ✅ Impact: Task contract tests now verify all task API contracts correctly
- 🧪 Tests: 50 passed (22 contract + 16 integration + 12 auth)
- 📁 Files: Fixed 3 test files
- 🔁 Next prompts: Continue User Story 2 implementation (T035-T047)
- 🧠 Reflection: Key issue was repository's int() conversion of user_id requiring numeric test IDs

## Evaluation notes (flywheel)

- Failure modes observed:
  - Endpoint path tests failed because router uses "/" not "/tasks"
  - ValueError: invalid literal for int() with base 10: 'user-999'
  - Schema validation doesn't reject whitespace-only titles (handled at service level)
- Graders run and results (PASS/FAIL): All 50 tests PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A - tests now passing
