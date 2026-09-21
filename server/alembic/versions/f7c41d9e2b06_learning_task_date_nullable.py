"""learning task task_date nullable

task_date 改为非必填，学习计划生成时可以不预排日期。

Revision ID: f7c41d9e2b06
Revises: e5b92c7a3f18
Create Date: 2026-09-21 10:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'f7c41d9e2b06'
down_revision: Union[str, Sequence[str], None] = 'e5b92c7a3f18'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        'learning_tasks',
        'task_date',
        existing_type=sa.Date(),
        nullable=True,
    )


def downgrade() -> None:
    op.execute(
        "UPDATE learning_tasks SET task_date = CURRENT_DATE WHERE task_date IS NULL"
    )
    op.alter_column(
        'learning_tasks',
        'task_date',
        existing_type=sa.Date(),
        nullable=False,
    )
