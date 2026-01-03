# Phase 5: Multi-Turn Conversation Context - Test Scenarios

**Status**: ✅ Implemented
**Date**: 2026-01-02
**Tasks Completed**: T042-T045 (Backend), T048 (New Conversation button)

## Implementation Summary

Phase 5 enhances the AI chatbot's ability to maintain context across multiple messages in a conversation. The implementation includes:

### Backend Features (Already Implemented)
1. **Conversation History Loading** (backend/src/services/conversation_service.py:63-99)
   - Loads last 20 messages from database
   - Formats for OpenAI Agents SDK
   - Chronological ordering

2. **Message Persistence** (backend/src/services/conversation_service.py:100-140)
   - Saves user and agent messages
   - Stores tool calls in JSONB
   - Automatic conversation creation

3. **Agent Context Integration** (backend/src/agents/agent_runner.py:16-72)
   - Passes conversation history to agent
   - Maintains authentication context
   - Proper cleanup after execution

4. **Enhanced Agent Instructions** (backend/src/agents/todo_agent.py:73-98)
   - Context awareness guidelines
   - Pronoun resolution ("it", "that", "the first one")
   - Implicit reference handling
   - Clarification strategies

### Frontend Features
1. **Conversation Persistence** (frontend/src/components/chat/ChatInterface.tsx)
   - Maintains conversation_id across messages
   - Automatic message display
   - "New Conversation" button (line 127-145)

### Database Schema
- `chat_conversations` table - Conversation sessions per user
- `chat_messages` table - Individual messages with roles and tool calls
- Indexes on conversation_id, created_at for performance

---

## Test Scenarios

### Test Suite 1: Pronoun Resolution (T049)

**Objective**: Verify the agent correctly resolves pronouns to task IDs

#### Test 1.1: "It" Reference After Create
```
Conversation:
User: "Add a task to call the dentist"
Agent: Creates task #42
User: "Set it to high priority"

Expected:
- Agent updates task #42 with priority="high"
- Response confirms "Updated task #42 to high priority"
```

#### Test 1.2: "That Task" Reference
```
Conversation:
User: "Create a task to review the quarterly report"
Agent: Creates task #55
User: "Change that task to 'Review Q4 financial report'"

Expected:
- Agent updates task #55 title
- Response confirms update with new title
```

#### Test 1.3: "This One" Reference
```
Conversation:
User: "I need to schedule a team meeting next Monday"
Agent: Creates task #67 with due date
User: "Mark this one as high priority"

Expected:
- Agent updates task #67 priority
- Context maintained from previous message
```

---

### Test Suite 2: List Position References (T049)

**Objective**: Verify the agent can reference tasks by position in previous lists

#### Test 2.1: "The First One"
```
Conversation:
User: "Show me my work tasks"
Agent: Lists tasks: #15 (Call client), #18 (Review PR), #22 (Team meeting)
User: "Mark the first one as done"

Expected:
- Agent marks task #15 (Call client) as complete
- Response confirms "Marked task #15 (Call client) as complete"
```

#### Test 2.2: "The Second Task"
```
Conversation:
User: "What are my high-priority tasks?"
Agent: Lists: #10 (Submit report), #25 (Client presentation), #30 (Code review)
User: "Delete the second task"

Expected:
- Agent deletes task #25 (Client presentation)
- Confirms deletion
```

#### Test 2.3: "The Last One"
```
Conversation:
User: "Show tasks due today"
Agent: Lists 4 tasks
User: "Change the last one to tomorrow"

Expected:
- Agent updates the 4th task's due date to tomorrow
- Confirms with task ID and new due date
```

---

### Test Suite 3: Conversation History Persistence (T050)

**Objective**: Verify conversations persist across browser sessions

#### Test 3.1: Resume After Refresh
```
Session 1:
User: "Add task to buy groceries"
Agent: Creates task #100
User: Refreshes browser

Session 2 (same conversation_id):
User: "Mark it as done"

Expected:
- Conversation history loads
- Agent remembers task #100 context
- Marks task #100 as complete
```

#### Test 3.2: Multiple Conversations
```
Conversation A:
User: "Add work task to review PR"
Agent: Creates task #50

Conversation B (new):
User: "Add personal task to call mom"
Agent: Creates task #51

Back to Conversation A:
User: "Mark it as done"

Expected:
- Agent marks task #50 (from Conversation A context)
- Does NOT mark task #51
```

---

### Test Suite 4: Implicit References (T049)

**Objective**: Verify the agent handles implicit follow-up commands

#### Test 4.1: Immediate Follow-Up After Create
```
Conversation:
User: "Create a task to submit expense report"
Agent: Creates task #88
User: "Add a due date of Friday 5 PM"

Expected:
- Agent updates task #88 with due_date
- No explicit task ID needed
```

#### Test 4.2: Follow-Up After List
```
Conversation:
User: "Show incomplete tasks"
Agent: Lists 5 tasks
User: "Complete all of them"

Expected:
- Agent asks for confirmation: "Are you sure you want to mark 5 tasks as complete?"
- After confirmation, marks all 5 tasks complete
```

#### Test 4.3: Context Across Multiple Turns
```
Conversation:
User: "Add a task to prepare presentation"
Agent: Creates task #77
User: "Make it high priority"
Agent: Updates task #77 priority
User: "And set due date to next Wednesday"

Expected:
- Agent still remembers task #77 context
- Updates due date
- Confirms full task details
```

---

### Test Suite 5: Clarification Handling (T051)

**Objective**: Verify the agent asks for clarification when context is ambiguous

#### Test 5.1: Missing Context
```
Conversation:
[New conversation, no previous context]
User: "Mark it as done"

Expected:
- Agent responds: "I'm not sure which task you're referring to. Could you provide the task ID or describe the task?"
```

#### Test 5.2: Ambiguous List Reference
```
Conversation:
User: "Show work tasks"
Agent: Lists 3 work tasks
User: "Show personal tasks"
Agent: Lists 2 personal tasks
User: "Delete the first one"

Expected:
- Agent asks: "You mentioned 'the first one' - do you mean from your work tasks or personal tasks?"
```

#### Test 5.3: Destructive Operation Confirmation
```
Conversation:
User: "Show all incomplete tasks"
Agent: Lists 10 tasks
User: "Delete them all"

Expected:
- Agent asks: "Are you sure you want to delete these 10 tasks? This cannot be undone."
- Waits for confirmation before executing
```

---

### Test Suite 6: Conversation Memory Limits

**Objective**: Verify system handles conversation history limits gracefully

#### Test 6.1: Long Conversation (20+ messages)
```
Setup: Have a conversation with 25 messages

Expected:
- System loads last 20 messages (as per CHATBOT_MAX_CONVERSATION_HISTORY)
- Recent context maintained
- Older messages not loaded (but still in database)
```

#### Test 6.2: New Conversation Button
```
Action:
1. Have conversation with task creation
2. Click "New Conversation" button
3. Try to reference previous task with "it"

Expected:
- New conversation starts with fresh context
- Agent does not remember previous conversation's tasks
- Asks for clarification when "it" is mentioned
```

---

## Acceptance Criteria Checklist

### ✅ Phase 5 Complete When:

- [ ] Pronouns ("it", "that", "this") correctly resolve to recently mentioned tasks
- [ ] List position references ("first one", "second task", "last one") work correctly
- [ ] Conversation history persists across browser refreshes
- [ ] New conversations start with clean context
- [ ] Multiple conversations maintain separate contexts
- [ ] Agent asks for clarification when context is ambiguous
- [ ] Destructive operations (delete all, complete all) require confirmation
- [ ] Conversation memory limit (20 messages) respected
- [ ] Follow-up commands work without repeating task IDs
- [ ] Context maintained for 3+ consecutive related messages

### 🔍 Implementation Status

#### Backend (✅ Complete)
- [x] ConversationService with history loading (backend/src/services/conversation_service.py)
- [x] Message persistence with tool_calls (backend/src/models/chat_message.py)
- [x] Agent runner with conversation history integration (backend/src/agents/agent_runner.py)
- [x] Enhanced agent instructions for context awareness (backend/src/agents/todo_agent.py)

#### Frontend (✅ Complete)
- [x] Conversation ID management (frontend/src/components/chat/ChatInterface.tsx:31)
- [x] Message display with conversation history (frontend/src/components/chat/ChatInterface.tsx:149-191)
- [x] "New Conversation" button (frontend/src/components/chat/ChatInterface.tsx:140-145)

#### Database (✅ Complete)
- [x] chat_conversations table (migration 2310991d3299)
- [x] chat_messages table with JSONB tool_calls (migration 2310991d3299)
- [x] Indexes for performance (conversation_id, created_at)

---

## Manual Testing Checklist

To test Phase 5:

1. ✅ Start backend: `cd backend && uv run python -m uvicorn src.main:app --reload`
2. ✅ Start frontend: `cd frontend && npm run dev`
3. ✅ Navigate to http://localhost:3000/chat
4. Test conversation context:
   - Create a task, then say "Set it to high priority"
   - List tasks, then say "Complete the first one"
   - Have a multi-turn conversation and verify context is maintained
5. Test "New Conversation" button clears context
6. Refresh browser and verify conversation history loads

---

## Known Limitations

1. **LLM Context Window**: OpenAI's context window is large, but extremely long conversations (100+ messages) may lose early context
2. **Ambiguity Resolution**: Agent relies on LLM's ability to track context; may occasionally need clarification
3. **Cross-Conversation References**: Agent cannot reference tasks from a different conversation (by design)

---

## Next Phase

After Phase 5 testing is complete, proceed to:
- **Phase 6**: Advanced Task Operations (T052-T059)
  - Full Phase II attribute support via chat
  - Complex task creation with all attributes
  - Enhanced search and filtering

---

**Implementation Complete**: 2026-01-02
**Ready for Testing**: Yes
**Blockers**: None
