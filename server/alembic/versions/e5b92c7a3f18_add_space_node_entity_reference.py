"""add space node entity reference

SpaceNode 只负责 Canvas 节点，通过 entity_type + entity_id 引用业务实体
（goal_plan / goal_item / learning_task），不建立 polymorphic ForeignKey。
旧数据保持 entity_type = null, entity_id = null。

Revision ID: e5b92c7a3f18
Revises: 3d37af5cb42e
Create Date: 2026-09-20 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'e5b92c7a3f18'
down_revision: Union[str, Sequence[str], None] = '3d37af5cb42e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'space_nodes',
        sa.Column('entity_type', sa.String(length=50), nullable=True),
    )
    op.add_column(
        'space_nodes',
        sa.Column('entity_id', sa.Integer(), nullable=True),
    )
    # A business entity can have at most one Canvas node.  The partial index
    # keeps legacy nodes without an entity reference unaffected.
    op.create_index(
        'uq_space_nodes_entity_ref',
        'space_nodes',
        ['entity_type', 'entity_id'],
        unique=True,
        postgresql_where=sa.text(
            "entity_type IS NOT NULL AND entity_id IS NOT NULL"
        ),
    )


def downgrade() -> None:
    op.drop_index('uq_space_nodes_entity_ref', table_name='space_nodes')
    op.drop_column('space_nodes', 'entity_id')
    op.drop_column('space_nodes', 'entity_type')
