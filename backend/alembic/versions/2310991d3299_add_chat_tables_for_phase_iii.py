"""add chat tables for Phase III

Revision ID: 2310991d3299
Revises: b2392c4bb046
Create Date: 2026-01-02 10:17:46.282741

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '2310991d3299'
down_revision: Union[str, Sequence[str], None] = 'b2392c4bb046'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add chat_conversations and chat_messages tables for Phase III AI Chatbot."""

    # Create message_role ENUM type (if not exists)
    op.execute("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_role') THEN CREATE TYPE message_role AS ENUM ('user', 'agent', 'system'); END IF; END $$;")

    # Create chat_conversations table
    op.create_table(
        'chat_conversations',
        sa.Column('conversation_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('conversation_id')
    )

    # Create indexes for chat_conversations
    op.create_index('idx_chat_conversations_user_id', 'chat_conversations', ['user_id'], unique=False)
    op.create_index('idx_chat_conversations_created_at', 'chat_conversations', ['created_at'], unique=False, postgresql_ops={'created_at': 'DESC'})
    op.create_index('idx_chat_conversations_user_created', 'chat_conversations', ['user_id', 'created_at'], unique=False, postgresql_ops={'created_at': 'DESC'})

    # Create chat_messages table
    op.create_table(
        'chat_messages',
        sa.Column('message_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('conversation_id', sa.Integer(), nullable=False),
        sa.Column('role', postgresql.ENUM('user', 'agent', 'system', name='message_role', create_type=False), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('tool_calls', sa.JSON(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['conversation_id'], ['chat_conversations.conversation_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('message_id')
    )

    # Create indexes for chat_messages
    op.create_index('idx_chat_messages_conversation_id', 'chat_messages', ['conversation_id'], unique=False)
    op.create_index('idx_chat_messages_role', 'chat_messages', ['role'], unique=False)
    op.create_index('idx_chat_messages_created_at', 'chat_messages', ['created_at'], unique=False)
    op.create_index('idx_chat_messages_conversation_created', 'chat_messages', ['conversation_id', 'created_at'], unique=False, postgresql_ops={'created_at': 'DESC'})

    # Create trigger function to update conversation.updated_at when message inserted
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

    # Create trigger
    op.execute("""
        CREATE TRIGGER trg_update_conversation_timestamp
        AFTER INSERT ON chat_messages
        FOR EACH ROW
        EXECUTE FUNCTION update_conversation_timestamp();
    """)


def downgrade() -> None:
    """Downgrade schema - Remove chat tables."""
    # Drop trigger
    op.execute("DROP TRIGGER IF EXISTS trg_update_conversation_timestamp ON chat_messages")
    op.execute("DROP FUNCTION IF EXISTS update_conversation_timestamp()")

    # Drop chat_messages table and indexes
    op.drop_index('idx_chat_messages_conversation_created', table_name='chat_messages')
    op.drop_index('idx_chat_messages_created_at', table_name='chat_messages')
    op.drop_index('idx_chat_messages_role', table_name='chat_messages')
    op.drop_index('idx_chat_messages_conversation_id', table_name='chat_messages')
    op.drop_table('chat_messages')

    # Drop chat_conversations table and indexes
    op.drop_index('idx_chat_conversations_user_created', table_name='chat_conversations')
    op.drop_index('idx_chat_conversations_created_at', table_name='chat_conversations')
    op.drop_index('idx_chat_conversations_user_id', table_name='chat_conversations')
    op.drop_table('chat_conversations')

    # Drop ENUM type
    op.execute("DROP TYPE message_role")
