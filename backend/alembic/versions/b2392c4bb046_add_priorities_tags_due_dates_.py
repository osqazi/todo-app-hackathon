"""Add priorities tags due dates recurrence to Task

Revision ID: b2392c4bb046
Revises:
Create Date: 2025-12-30 01:37:01.300487

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b2392c4bb046'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add Phase II Part 2 fields to tasks table."""
    # Create ENUM types
    op.execute("CREATE TYPE taskpriority AS ENUM ('HIGH', 'MEDIUM', 'LOW')")
    op.execute("CREATE TYPE recurrencepattern AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY')")

    # Add new columns for priorities and tags (US1)
    op.add_column('tasks', sa.Column('priority', postgresql.ENUM('HIGH', 'MEDIUM', 'LOW', name='taskpriority'), server_default='MEDIUM', nullable=False))
    op.add_column('tasks', sa.Column('tags', postgresql.ARRAY(sa.String(length=50)), server_default='{}', nullable=False))

    # Add new columns for due dates and notifications (US3)
    op.add_column('tasks', sa.Column('due_date', sa.DateTime(), nullable=True))
    op.add_column('tasks', sa.Column('notification_sent', sa.Boolean(), server_default='false', nullable=False))

    # Add new columns for recurring tasks (US4)
    op.add_column('tasks', sa.Column('is_recurring', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('tasks', sa.Column('recurrence_pattern', postgresql.ENUM('DAILY', 'WEEKLY', 'MONTHLY', name='recurrencepattern'), nullable=True))
    op.add_column('tasks', sa.Column('recurrence_end_date', sa.Date(), nullable=True))
    op.add_column('tasks', sa.Column('parent_task_id', sa.Integer(), nullable=True))

    # Add foreign key constraint for parent_task_id
    op.create_foreign_key('fk_tasks_parent_task_id', 'tasks', 'tasks', ['parent_task_id'], ['id'], ondelete='SET NULL')

    # Create indexes for optimal query performance
    # GIN index for tag array containment queries (@> operator)
    op.create_index('idx_tasks_tags', 'tasks', ['tags'], unique=False, postgresql_using='gin')

    # B-tree index for due_date sorting (with NULL-safe ordering)
    op.create_index('idx_tasks_due_date', 'tasks', ['due_date'], unique=False, postgresql_where=sa.text('due_date IS NOT NULL'))

    # Composite index for common filter queries (user_id + completed + priority)
    op.create_index('idx_tasks_user_status_priority', 'tasks', ['user_id', 'completed', 'priority'], unique=False)


def downgrade() -> None:
    """Downgrade schema - Remove Phase II Part 2 fields from tasks table."""
    # Drop indexes
    op.drop_index('idx_tasks_user_status_priority', table_name='tasks')
    op.drop_index('idx_tasks_due_date', table_name='tasks')
    op.drop_index('idx_tasks_tags', table_name='tasks')

    # Drop foreign key constraint
    op.drop_constraint('fk_tasks_parent_task_id', 'tasks', type_='foreignkey')

    # Drop columns
    op.drop_column('tasks', 'parent_task_id')
    op.drop_column('tasks', 'recurrence_end_date')
    op.drop_column('tasks', 'recurrence_pattern')
    op.drop_column('tasks', 'is_recurring')
    op.drop_column('tasks', 'notification_sent')
    op.drop_column('tasks', 'due_date')
    op.drop_column('tasks', 'tags')
    op.drop_column('tasks', 'priority')

    # Drop ENUM types
    op.execute("DROP TYPE recurrencepattern")
    op.execute("DROP TYPE taskpriority")
