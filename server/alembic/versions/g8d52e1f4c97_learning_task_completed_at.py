"""learning task drop task_date add completed_at

LearningTask 不再绑定具体日期：删除 task_date，
新增 completed_at（完成任务时由服务端写入）。

Revision ID: g8d52e1f4c97
Revises: f7c41d9e2b06
Create Date: 2026-09-21 11:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'g8d52e1f4c97'
down_revision: Union[str, Sequence[str], None] = 'f7c41d9e2b06'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'learning_tasks',
        sa.Column('completed_at', sa.DateTime(), nullable=True),
    )
    op.drop_column('learning_tasks', 'task_date')


def downgrade() -> None:
    op.add_column(
        'learning_tasks',
        sa.Column('task_date', sa.Date(), nullable=True),
    )
    op.drop_column('learning_tasks', 'completed_at')
