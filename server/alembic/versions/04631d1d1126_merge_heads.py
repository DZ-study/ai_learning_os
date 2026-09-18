"""merge heads

Revision ID: 04631d1d1126
Revises: 61b6e9d3da6a, c2f4a8b1d901
Create Date: 2026-09-17 16:11:41.893011

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '04631d1d1126'
down_revision: Union[str, Sequence[str], None] = ('61b6e9d3da6a', 'c2f4a8b1d901')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
