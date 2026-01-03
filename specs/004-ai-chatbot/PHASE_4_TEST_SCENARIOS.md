# Phase 4: Natural Language Understanding - Test Scenarios

**Status**: ✅ Implemented
**Date**: 2026-01-02
**Tasks Completed**: T034-T037

## Implementation Summary

Phase 4 enhances the AI chatbot's natural language understanding capabilities by updating the agent instructions in `backend/src/agents/todo_agent.py` to handle:

1. **Synonym Variations** - Multiple phrasings for the same action
2. **Implicit Date Parsing** - Natural date expressions like "tomorrow", "next Monday"
3. **Multi-Step Commands** - Multiple tasks in one request
4. **Informal Queries** - Casual language understanding
5. **Context Clues** - Inferring attributes from natural language

## Test Scenarios

### Test Suite 1: Synonym Variations (T038)

**Objective**: Verify the agent recognizes different phrasings for the same operation

#### Test 1.1: CREATE Synonyms
```
Commands to test (all should create a task):
1. "Add a task to review the report"
2. "Create a task to review the report"
3. "New task: review the report"
4. "I need to review the report"
5. "Remember to review the report"
6. "Don't forget to review the report"

Expected: Each creates a task with title containing "review the report"
```

#### Test 1.2: VIEW Synonyms
```
Commands to test (all should list tasks):
1. "Show me my tasks"
2. "List my tasks"
3. "View my tasks"
4. "What tasks do I have?"
5. "Display my tasks"
6. "Get my tasks"

Expected: Each returns the task list
```

#### Test 1.3: UPDATE Synonyms
```
Pre-condition: Task #X exists
Commands to test:
1. "Update task X to 'New title'"
2. "Edit task X to 'New title'"
3. "Change task X to 'New title'"
4. "Modify task X to 'New title'"

Expected: Each updates the task title
```

#### Test 1.4: DELETE Synonyms
```
Pre-condition: Task #X exists
Commands to test:
1. "Delete task X"
2. "Remove task X"
3. "Get rid of task X"
4. "Trash task X"

Expected: Each deletes the task
```

#### Test 1.5: COMPLETE Synonyms
```
Pre-condition: Incomplete task #X exists
Commands to test:
1. "Complete task X"
2. "Finish task X"
3. "Mark task X as done"
4. "Task X is done"

Expected: Each marks the task as complete
```

---

### Test Suite 2: Implicit Date Parsing (T039)

**Objective**: Verify the agent correctly parses natural date expressions

#### Test 2.1: Relative Days
```
Test date: 2026-01-02 (today)

Commands to test:
1. "I need to buy milk tomorrow"
   Expected: Task created with due_date="2026-01-03T23:59:00"

2. "Buy milk in 3 days"
   Expected: Task created with due_date="2026-01-05T23:59:00"

3. "Buy milk next week"
   Expected: Task created with due_date="2026-01-09T23:59:00" (7 days)
```

#### Test 2.2: Weekday References
```
Test date: 2026-01-02 (Friday)

Commands to test:
1. "Schedule meeting next Monday"
   Expected: due_date="2026-01-05T23:59:00" (next Monday)

2. "Call client next Tuesday at 2 PM"
   Expected: due_date="2026-01-06T14:00:00"

3. "Submit report by end of day Friday"
   Expected: due_date="2026-01-09T23:59:00" (next Friday)
```

#### Test 2.3: Time Specifications
```
Commands to test:
1. "Meeting at 3:30 PM tomorrow"
   Expected: due_date="2026-01-03T15:30:00"

2. "Call at 9 AM"
   Expected: due_date="2026-01-02T09:00:00" (today if no date specified)
```

---

### Test Suite 3: Multi-Step Commands (T040)

**Objective**: Verify the agent can create multiple tasks from one request

#### Test 3.1: Comma-Separated List
```
Command: "Add three tasks: review code, send email, schedule meeting"

Expected:
- Creates 3 separate tasks
- Titles: "Review code", "Send email", "Schedule meeting"
- Response confirms all 3 tasks created with IDs
```

#### Test 3.2: Explicit Count
```
Command: "Create tasks for cleaning, shopping, and cooking"

Expected:
- Creates 3 tasks
- Each with appropriate title
```

#### Test 3.3: Complex Multi-Step
```
Command: "I need to call John tomorrow, email Sarah on Monday, and meet with team next Friday"

Expected:
- Creates 3 tasks with:
  * Task 1: "Call John", due_date=tomorrow
  * Task 2: "Email Sarah", due_date=next Monday
  * Task 3: "Meet with team", due_date=next Friday
```

---

### Test Suite 4: Informal Queries (T041)

**Objective**: Verify the agent understands casual language

#### Test 4.1: Casual List Requests
```
Commands to test (all should list incomplete tasks):
1. "What's on my plate today?"
   Expected: Lists tasks due today only

2. "What do I need to do?"
   Expected: Lists all incomplete tasks

3. "What's left?"
   Expected: Lists all incomplete tasks
```

#### Test 4.2: Category Queries
```
Pre-condition: Tasks exist with tag "work"

Command: "Show me my work stuff"
Expected: Lists tasks with tag="work"
```

#### Test 4.3: Priority Queries
```
Pre-condition: High-priority tasks exist

Command: "Any urgent tasks?"
Expected: Lists tasks with priority="high"
```

---

### Test Suite 5: Context Clues (Integrated)

**Objective**: Verify the agent infers attributes from natural language

#### Test 5.1: Priority Inference
```
Commands to test:
1. "Add an urgent task to call the client"
   Expected: Creates task with priority="high"

2. "Important: submit quarterly report"
   Expected: Creates task with priority="high"

3. "Low priority: organize desk"
   Expected: Creates task with priority="low"
```

#### Test 5.2: Tag Inference
```
Commands to test:
1. "Add a work task to review PR"
   Expected: Creates task with tags=["work"]

2. "Personal errand: pick up dry cleaning"
   Expected: Creates task with tags=["personal"]
```

#### Test 5.3: Combined Attributes
```
Command: "Create an urgent work task to submit expense report by Friday 5 PM"

Expected:
- Title: "Submit expense report"
- Priority: "high"
- Tags: ["work"]
- Due date: "2026-01-03T17:00:00" (this Friday at 5 PM)
```

---

## Acceptance Criteria Checklist

### ✅ Phase 4 Complete When:

- [ ] All CREATE synonym variations work correctly (6 variations tested)
- [ ] All VIEW synonym variations work correctly (6 variations tested)
- [ ] All UPDATE/DELETE/COMPLETE synonyms work correctly (15+ variations)
- [ ] Relative date expressions parse correctly ("tomorrow", "in 3 days", "next week")
- [ ] Weekday references parse correctly ("next Monday", "Friday evening")
- [ ] Time specifications parse correctly ("at 2 PM", "at 3:30 PM")
- [ ] Multi-step commands create all requested tasks
- [ ] Informal queries return appropriate results
- [ ] Priority is inferred from keywords ("urgent", "important", "low priority")
- [ ] Tags are inferred from category mentions ("work task", "personal errand")
- [ ] Complex commands with multiple attributes work correctly

### ⚠️ Known Limitations

1. **Date Calculations**: Agent relies on OpenAI's date understanding. May need current date context in prompts.
2. **Ambiguity Handling**: For very ambiguous requests, agent should ask for clarification
3. **Non-English**: Currently English-only (as specified in constraints)

---

## Manual Testing Checklist

To test Phase 4:

1. ✅ Start backend: `cd backend && uv run python -m uvicorn src.main:app --reload`
2. ✅ Start frontend: `cd frontend && npm run dev`
3. ✅ Navigate to http://localhost:3000/chat
4. Run each test scenario above
5. Verify agent responses match expected behavior

---

## Next Phase

After Phase 4 testing is complete, proceed to:
- **Phase 5**: Multi-Turn Conversation Context (T042-T051)
  - Context reference ("it", "the first one")
  - Conversation history loading
  - Resume conversations across sessions

---

**Implementation Complete**: 2026-01-02
**Ready for Testing**: Yes
**Blockers**: None
