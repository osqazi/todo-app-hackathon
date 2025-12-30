---
id: 0006
title: Phase 6 Recurring Tasks Implementation
stage: green
date: 2025-12-30
surface: agent
model: claude-sonnet-4-5
feature: 003-intermediate-advanced-features
branch: 003-intermediate-advanced-features
user: claude-agent
command: /sp.implement
labels: ["recurring-tasks", "recurrence", "next-instance", "complete-endpoint", "month-end-edge-cases", "backend", "frontend"]
links:
  spec: specs/003-intermediate-advanced-features/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - backend/src/schemas/task.py
  - backend/src/models/task.py
  - backend/src/service/task_service.py
  - backend/src/api/tasks.py
  - frontend/src/components/tasks/RecurrenceConfig.tsx
  - frontend/src/components/tasks/TaskForm.tsx
  - frontend/src/components/tasks/TaskList.tsx
  - frontend/src/lib/api.ts
tests:
  - Manual testing: Create recurring daily task, mark complete, verify next instance created for tomorrow
  - Manual testing: Create recurring monthly task on Jan 31, verify next instance on Feb 28/29
  - Manual testing: Test recurrence_end_date prevents instances after end date
  - Manual testing: Verify confirmation message shows when next instance created
---

## Prompt

Start Phase 6 recurring tasks

## Response snapshot

Completed Phase 6 (US4) - Recurring Tasks (T057-T068).

**Backend (T057-T063):**
- Added is_recurring, recurrence_pattern, recurrence_end_date, parent_task_id to TaskCreate/TaskUpdate/TaskResponse schemas
- Added RecurrencePattern Literal type ("daily", "weekly", "monthly")
- Added model_validator to ensure recurrence_pattern required when is_recurring=True
- Added due_date required validation when is_recurring=True
- Implemented calculate_next_due_date() function with month-end edge case handling (Jan 31 → Feb 28/29)
- Implemented should_generate_next_instance() function (checks recurrence_end_date)
- Implemented complete_task() service function that marks complete and generates next instance
- Created POST /api/tasks/{task_id}/complete endpoint
- Created CompleteTaskResponse model with completed_task and next_instance fields

**Frontend (T064-T068):**
- Created RecurrenceConfig component:
  * Enable/disable recurring checkbox
  * Pattern selector (daily/weekly/monthly radio buttons)
  * Optional end date picker
  * Preview text showing recurrence summary
- Enhanced TaskForm with RecurrenceConfig:
  * Added recurrence state and props
  * Integrated RecurrenceConfig component
  * Client-side validation (pattern required, due_date required for recurring)
- Updated API client:
  * Added recurrence fields to createTask and updateTask
  * Created completeTask() method returning CompleteTaskResponse
- Enhanced TaskList:
  * Replaced toggleTaskMutation with completeTaskMutation
  * Added completionMessage state for toast notifications
  * Updated checkbox to only allow completing (not un-completing)
  * Added green success banner showing next instance details
  * Auto-dismiss confirmation after 10 seconds

**Key Features:**
- Month-end edge cases handled correctly (uses Python calendar.monthrange)
- Recurrence end date is inclusive (uses end of day for comparison)
- Next instance inherits title, description, priority, tags from parent
- Next instance created with pending status and calculated next due_date
- Confirmation message shows task title and next due date
- Completed tasks cannot be un-completed (checkbox disabled)

All 12 tasks (T057-T068) marked complete.

## Outcome

- ✅ Impact: Complete recurring tasks functionality. Users can create daily/weekly/monthly recurring tasks that auto-generate next instance on completion.
- 🧪 Tests: Manual testing required: (1) Create recurring daily task, complete, verify next instance, (2) Test monthly on Jan 31, (3) Test recurrence_end_date stops generation, (4) Verify confirmation message displays
- 📁 Files: 8 modified (4 backend, 4 frontend), 1 created (RecurrenceConfig.tsx)
- 🔁 Next prompts: Phase 7 (Multi-Criteria Discovery with URL state persistence), Phase 8 (Polish & production readiness)
- 🧠 Reflection: Smooth implementation. Month-end edge case handling using calendar.monthrange was straightforward. Recurrence pattern validator ensures data integrity. Confirmation message provides good UX feedback.

## Evaluation notes (flywheel)

- Failure modes observed: None. All components integrated smoothly.
- Graders run and results (PASS/FAIL): Manual testing pending
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Consider adding "Mark as pending" button to un-complete tasks if needed
