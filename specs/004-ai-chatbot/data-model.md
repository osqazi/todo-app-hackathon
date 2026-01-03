# Data Model: AI Chatbot Conversation Storage

**Feature**: 004-ai-chatbot
**Date**: 2026-01-02
**Database**: PostgreSQL 15+ (Neon Serverless)

## Overview

This document defines the database schema for storing AI chatbot conversations and messages. The schema extends the existing Phase II database (tasks, users, auth tables) with two new tables for conversation persistence.

**Design Principles**:
- **Additive-only**: No modifications to existing tables
- **Per-user isolation**: All conversations linked to authenticated user
- **Audit trail**: Full history of user messages, agent responses, and tool calls
- **Performance**: Optimized indexes for conversation retrieval
- **Future-proof**: JSON fields for extensible metadata

---

## Entity: ChatConversation

**Purpose**: Represents a conversation session between a user and the AI assistant.

### SQLModel Schema

```python
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .chat_message import ChatMessage
    from .user import User

class ChatConversation(SQLModel, table=True):
    __tablename__ = "chat_conversations"

    # Primary Key
    conversation_id: int | None = Field(default=None, primary_key=True)

    # Foreign Keys
    user_id: str = Field(foreign_key="users.id", index=True, nullable=False)

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False, index=True)
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        sa_column_kwargs={"onupdate": datetime.utcnow}
    )

    # Relationships
    messages: list["ChatMessage"] = Relationship(
        back_populates="conversation",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    user: "User" = Relationship(back_populates="conversations")
```

### Table Schema (PostgreSQL DDL)

```sql
CREATE TABLE chat_conversations (
    conversation_id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_created_at ON chat_conversations(created_at DESC);

-- Composite index for user's recent conversations
CREATE INDEX idx_chat_conversations_user_created
    ON chat_conversations(user_id, created_at DESC);

-- Trigger to update updated_at on message insert
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_conversations
    SET updated_at = CURRENT_TIMESTAMP
    WHERE conversation_id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_conversation_timestamp
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();
```

### Attributes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `conversation_id` | SERIAL (int) | PRIMARY KEY | Auto-incrementing conversation identifier |
| `user_id` | VARCHAR | NOT NULL, FOREIGN KEY → users.id, INDEXED | Owner of the conversation (Better Auth user ID) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now(), INDEXED | When conversation was started |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT now(), ON UPDATE now() | Last message timestamp (auto-updated by trigger) |

### Indexes

1. **Primary**: `conversation_id` (auto-created with PRIMARY KEY)
2. **Foreign**: `user_id` (for user conversation lookup)
3. **Temporal**: `created_at DESC` (for recent conversations)
4. **Composite**: `(user_id, created_at DESC)` (optimized query: "get user's recent conversations")

**Query Patterns**:
- Get all conversations for user (most recent first): `WHERE user_id = ? ORDER BY created_at DESC`
- Get specific conversation: `WHERE conversation_id = ?`
- Count user's conversations: `SELECT COUNT(*) WHERE user_id = ?`

### Relationships

- **Has many**: `ChatMessage` (one-to-many, cascade delete)
- **Belongs to**: `User` (many-to-one)

### Validation Rules

1. `user_id` must reference existing user in `users` table
2. `created_at` must be ≤ `updated_at`
3. Cannot delete conversation if messages exist (handled by cascade)
4. `updated_at` automatically updated when new message inserted (via trigger)

### State Transitions

**N/A** - Conversations have no explicit state (active/archived/deleted). State is implicit:
- **Active**: `updated_at` within last 24 hours
- **Inactive**: `updated_at` > 24 hours ago
- **Deleted**: Row removed (soft delete not implemented in Phase III)

### Sample Data

```sql
INSERT INTO chat_conversations (user_id, created_at, updated_at) VALUES
('user_abc123', '2026-01-02 10:00:00', '2026-01-02 10:15:30'),
('user_abc123', '2026-01-02 14:30:00', '2026-01-02 14:45:00'),
('user_xyz789', '2026-01-02 09:00:00', '2026-01-02 09:10:00');
```

---

## Entity: ChatMessage

**Purpose**: Represents a single message in a conversation (user input, agent response, or system message).

### SQLModel Schema

```python
from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import Enum, JSON
from datetime import datetime
from typing import TYPE_CHECKING
import enum

if TYPE_CHECKING:
    from .chat_conversation import ChatConversation

class MessageRole(str, enum.Enum):
    """Enum for message roles."""
    USER = "user"
    AGENT = "agent"
    SYSTEM = "system"

class ChatMessage(SQLModel, table=True):
    __tablename__ = "chat_messages"

    # Primary Key
    message_id: int | None = Field(default=None, primary_key=True)

    # Foreign Keys
    conversation_id: int = Field(
        foreign_key="chat_conversations.conversation_id",
        index=True,
        nullable=False
    )

    # Content
    role: MessageRole = Field(
        sa_column=Column(Enum(MessageRole), nullable=False, index=True)
    )
    content: str = Field(nullable=False)  # TEXT type in PostgreSQL

    # Tool Tracking (JSONB)
    tool_calls: dict | None = Field(
        default=None,
        sa_column=Column(JSON)  # PostgreSQL JSONB
    )

    # Metadata (JSONB)
    metadata: dict | None = Field(
        default=None,
        sa_column=Column(JSON)  # For streaming state, reasoning, errors, etc.
    )

    # Timestamp
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        index=True
    )

    # Relationships
    conversation: "ChatConversation" = Relationship(back_populates="messages")
```

### Table Schema (PostgreSQL DDL)

```sql
-- Enum type for message roles
CREATE TYPE message_role AS ENUM ('user', 'agent', 'system');

CREATE TABLE chat_messages (
    message_id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES chat_conversations(conversation_id) ON DELETE CASCADE,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    tool_calls JSONB,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_role ON chat_messages(role);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at ASC);

-- Composite index for conversation message ordering
CREATE INDEX idx_chat_messages_conv_created
    ON chat_messages(conversation_id, created_at ASC);

-- GIN index for tool_calls JSONB queries (if needed for analytics)
CREATE INDEX idx_chat_messages_tool_calls_gin ON chat_messages USING GIN(tool_calls)
    WHERE tool_calls IS NOT NULL;

-- Check constraint for non-empty content
ALTER TABLE chat_messages
    ADD CONSTRAINT chk_content_not_empty CHECK (char_length(content) > 0);
```

### Attributes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `message_id` | SERIAL (int) | PRIMARY KEY | Auto-incrementing message identifier |
| `conversation_id` | INTEGER | NOT NULL, FOREIGN KEY → chat_conversations.conversation_id, INDEXED | Parent conversation |
| `role` | ENUM | NOT NULL, INDEXED | Message sender: 'user', 'agent', or 'system' |
| `content` | TEXT | NOT NULL, CHECK (length > 0) | Message text content |
| `tool_calls` | JSONB | NULLABLE | Array of tool calls made during agent response (see schema below) |
| `metadata` | JSONB | NULLABLE | Additional data: streaming state, reasoning steps, error info (see schema below) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now(), INDEXED | When message was created |

### tool_calls JSONB Schema

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "tool_name": {"type": "string"},
      "arguments": {"type": "object"},
      "result": {"type": "object"},
      "status": {"type": "string", "enum": ["success", "error"]},
      "error_message": {"type": "string"}
    },
    "required": ["tool_name", "arguments"]
  }
}
```

**Example**:
```json
[
  {
    "tool_name": "create_task",
    "arguments": {"title": "Buy groceries", "priority": "high"},
    "result": {"task_id": 42, "title": "Buy groceries", "completed": false},
    "status": "success"
  },
  {
    "tool_name": "search_tasks",
    "arguments": {"query": "meeting", "filters": {"priority": "high"}},
    "result": {"tasks": [...], "total": 5},
    "status": "success"
  }
]
```

### metadata JSONB Schema

```json
{
  "type": "object",
  "properties": {
    "streaming_state": {"type": "string", "enum": ["started", "streaming", "completed"]},
    "reasoning_steps": {
      "type": "array",
      "items": {"type": "string"}
    },
    "error_info": {
      "type": "object",
      "properties": {
        "error_type": {"type": "string"},
        "error_message": {"type": "string"},
        "recovery_action": {"type": "string"}
      }
    },
    "intent_detected": {"type": "string"},
    "confidence_score": {"type": "number"}
  }
}
```

**Example**:
```json
{
  "streaming_state": "completed",
  "reasoning_steps": [
    "User wants to create a high-priority task",
    "Calling create_task tool with title and priority",
    "Task created successfully with ID 42"
  ],
  "intent_detected": "create_task",
  "confidence_score": 0.95
}
```

### Indexes

1. **Primary**: `message_id` (auto-created with PRIMARY KEY)
2. **Foreign**: `conversation_id` (for conversation message lookup)
3. **Filter**: `role` (for filtering user/agent messages)
4. **Temporal**: `created_at ASC` (for chronological ordering)
5. **Composite**: `(conversation_id, created_at ASC)` (optimized query: "get conversation messages in order")
6. **JSON**: GIN index on `tool_calls` (for analytics queries like "which tools are used most")

**Query Patterns**:
- Get all messages for conversation (chronological): `WHERE conversation_id = ? ORDER BY created_at ASC`
- Get last N messages: `WHERE conversation_id = ? ORDER BY created_at DESC LIMIT N`
- Get agent messages with tool calls: `WHERE role = 'agent' AND tool_calls IS NOT NULL`
- Count messages per role: `SELECT role, COUNT(*) WHERE conversation_id = ? GROUP BY role`

### Relationships

- **Belongs to**: `ChatConversation` (many-to-one)

### Validation Rules

1. `conversation_id` must reference existing conversation
2. `role` must be one of: 'user', 'agent', 'system'
3. `content` must not be empty (enforced by CHECK constraint)
4. `tool_calls` must be valid JSON array if present
5. `metadata` must be valid JSON object if present
6. `created_at` must be >= parent conversation's `created_at`

### State Transitions

**N/A** - Messages are immutable once created. No state changes.

### Sample Data

```sql
INSERT INTO chat_messages (conversation_id, role, content, tool_calls, metadata, created_at) VALUES
(1, 'user', 'Add a task to buy groceries', NULL, NULL, '2026-01-02 10:00:00'),
(1, 'agent', 'I''ve created a new task "Buy groceries" with ID 42.',
 '[{"tool_name": "create_task", "arguments": {"title": "Buy groceries"}, "result": {"task_id": 42}, "status": "success"}]',
 '{"intent_detected": "create_task", "confidence_score": 0.95}',
 '2026-01-02 10:00:05'),
(1, 'user', 'Show me all my high-priority tasks', NULL, NULL, '2026-01-02 10:05:00'),
(1, 'agent', 'You have 3 high-priority tasks: ...',
 '[{"tool_name": "list_tasks", "arguments": {"priority": "high"}, "result": {"tasks": [...], "total": 3}, "status": "success"}]',
 '{"intent_detected": "list_tasks", "confidence_score": 0.92}',
 '2026-01-02 10:05:03');
```

---

## Relationship Diagram

```
users (existing)
  ├── id (PK)
  └── ...

chat_conversations
  ├── conversation_id (PK)
  ├── user_id (FK → users.id)
  ├── created_at
  └── updated_at

chat_messages
  ├── message_id (PK)
  ├── conversation_id (FK → chat_conversations.conversation_id)
  ├── role (ENUM: user/agent/system)
  ├── content (TEXT)
  ├── tool_calls (JSONB)
  ├── metadata (JSONB)
  └── created_at

Relationships:
  users 1 ─────< ∞ chat_conversations
  chat_conversations 1 ─────< ∞ chat_messages
```

---

## Migration Script

**File**: `backend/alembic/versions/004_add_chat_tables.py`

```python
"""Add chat_conversations and chat_messages tables

Revision ID: 004_add_chat_tables
Revises: 003_intermediate_features
Create Date: 2026-01-02 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, ENUM

# revision identifiers, used by Alembic.
revision = '004_add_chat_tables'
down_revision = '003_intermediate_features'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create message_role ENUM type
    message_role_enum = ENUM('user', 'agent', 'system', name='message_role', create_type=True)
    message_role_enum.create(op.get_bind(), checkfirst=True)

    # Create chat_conversations table
    op.create_table(
        'chat_conversations',
        sa.Column('conversation_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('conversation_id')
    )
    op.create_index('idx_chat_conversations_user_id', 'chat_conversations', ['user_id'])
    op.create_index('idx_chat_conversations_created_at', 'chat_conversations', [sa.text('created_at DESC')])
    op.create_index('idx_chat_conversations_user_created', 'chat_conversations', ['user_id', sa.text('created_at DESC')])

    # Create chat_messages table
    op.create_table(
        'chat_messages',
        sa.Column('message_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('conversation_id', sa.Integer(), nullable=False),
        sa.Column('role', message_role_enum, nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('tool_calls', JSONB, nullable=True),
        sa.Column('metadata', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.CheckConstraint('char_length(content) > 0', name='chk_content_not_empty'),
        sa.ForeignKeyConstraint(['conversation_id'], ['chat_conversations.conversation_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('message_id')
    )
    op.create_index('idx_chat_messages_conversation_id', 'chat_messages', ['conversation_id'])
    op.create_index('idx_chat_messages_role', 'chat_messages', ['role'])
    op.create_index('idx_chat_messages_created_at', 'chat_messages', [sa.text('created_at ASC')])
    op.create_index('idx_chat_messages_conv_created', 'chat_messages', ['conversation_id', sa.text('created_at ASC')])
    op.execute('CREATE INDEX idx_chat_messages_tool_calls_gin ON chat_messages USING GIN(tool_calls) WHERE tool_calls IS NOT NULL')

    # Create trigger to update conversation.updated_at when message inserted
    op.execute("""
        CREATE OR REPLACE FUNCTION update_conversation_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
            UPDATE chat_conversations
            SET updated_at = CURRENT_TIMESTAMP
            WHERE conversation_id = NEW.conversation_id;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    op.execute("""
        CREATE TRIGGER trg_update_conversation_timestamp
        AFTER INSERT ON chat_messages
        FOR EACH ROW
        EXECUTE FUNCTION update_conversation_timestamp();
    """)

def downgrade() -> None:
    # Drop trigger and function
    op.execute('DROP TRIGGER IF EXISTS trg_update_conversation_timestamp ON chat_messages')
    op.execute('DROP FUNCTION IF EXISTS update_conversation_timestamp()')

    # Drop indexes
    op.drop_index('idx_chat_messages_tool_calls_gin', 'chat_messages')
    op.drop_index('idx_chat_messages_conv_created', 'chat_messages')
    op.drop_index('idx_chat_messages_created_at', 'chat_messages')
    op.drop_index('idx_chat_messages_role', 'chat_messages')
    op.drop_index('idx_chat_messages_conversation_id', 'chat_messages')
    op.drop_index('idx_chat_conversations_user_created', 'chat_conversations')
    op.drop_index('idx_chat_conversations_created_at', 'chat_conversations')
    op.drop_index('idx_chat_conversations_user_id', 'chat_conversations')

    # Drop tables
    op.drop_table('chat_messages')
    op.drop_table('chat_conversations')

    # Drop ENUM type
    message_role_enum = ENUM('user', 'agent', 'system', name='message_role')
    message_role_enum.drop(op.get_bind(), checkfirst=True)
```

---

## Performance Considerations

1. **Index Strategy**:
   - Composite index `(user_id, created_at DESC)` optimizes "recent conversations" query
   - Composite index `(conversation_id, created_at ASC)` optimizes "messages in chronological order" query
   - GIN index on `tool_calls` JSONB enables analytics queries without full table scan

2. **Query Optimization**:
   - Use `LIMIT` and `OFFSET` for pagination of conversations and messages
   - Fetch only necessary columns (avoid `SELECT *` for large JSONB fields)
   - Use `COUNT(*)` with proper indexes for conversation/message counts

3. **Data Growth**:
   - Estimated 100 conversations/user/year * 10,000 users = 1M conversations/year
   - Average 10 messages/conversation = 10M messages/year
   - JSONB fields typically 200-500 bytes → ~5 GB/year growth
   - Indexes add ~30% overhead → ~6.5 GB total/year
   - Neon Serverless PostgreSQL scales automatically

4. **Cleanup Strategy** (Future Phase):
   - Consider archiving conversations older than 6 months
   - Implement soft delete (add `deleted_at` column) if needed
   - Background job to compress/export old conversations

---

## Testing Queries

```sql
-- Get user's 20 most recent conversations
SELECT conversation_id, created_at, updated_at
FROM chat_conversations
WHERE user_id = 'user_abc123'
ORDER BY created_at DESC
LIMIT 20;

-- Get all messages for a conversation (chronological)
SELECT message_id, role, content, created_at
FROM chat_messages
WHERE conversation_id = 1
ORDER BY created_at ASC;

-- Get conversation with message count
SELECT c.conversation_id, c.created_at, COUNT(m.message_id) as message_count
FROM chat_conversations c
LEFT JOIN chat_messages m ON c.conversation_id = m.conversation_id
WHERE c.user_id = 'user_abc123'
GROUP BY c.conversation_id, c.created_at
ORDER BY c.created_at DESC;

-- Get agent messages with tool calls
SELECT message_id, content, tool_calls
FROM chat_messages
WHERE role = 'agent' AND tool_calls IS NOT NULL
LIMIT 10;

-- Analytics: Most used tools
SELECT
    jsonb_array_elements(tool_calls)->>'tool_name' as tool_name,
    COUNT(*) as usage_count
FROM chat_messages
WHERE tool_calls IS NOT NULL
GROUP BY tool_name
ORDER BY usage_count DESC;
```

---

## Next Steps

1. **Run migration**: `alembic upgrade head`
2. **Generate API contracts**: See `/contracts` directory
3. **Implement SQLModel models**: `backend/src/models/chat_conversation.py` and `chat_message.py`
4. **Create service layer**: `backend/src/services/conversation_service.py`
5. **Write unit tests**: Test model validation, constraints, relationships

**Data Model Complete** ✅
