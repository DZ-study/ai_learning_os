"""add_lesson_contents

Revision ID: 3d37af5cb42e
Revises: 04631d1d1126
Create Date: 2026-09-18 16:14:09.877238

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '3d37af5cb42e'
down_revision: Union[str, Sequence[str], None] = '04631d1d1126'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'lesson_contents',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False, comment='课时内容ID'),
        sa.Column('lesson_id', sa.Integer(), nullable=False, comment='课时ID'),
        sa.Column('blocks', postgresql.JSONB(astext_type=sa.Text()), nullable=False, comment='内容块'),
        sa.Column('version', sa.Integer(), nullable=False, comment='内容版本'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, comment='更新时间'),
        sa.ForeignKeyConstraint(['lesson_id'], ['learning_tasks.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_lesson_contents_lesson_id'), 'lesson_contents', ['lesson_id'], unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_lesson_contents_lesson_id'), table_name='lesson_contents')
    op.drop_table('lesson_contents')
