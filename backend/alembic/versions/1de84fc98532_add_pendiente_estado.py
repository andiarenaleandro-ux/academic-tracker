"""add pendiente estado

Revision ID: 1de84fc98532
Revises: b23c34b4f379
Create Date: 2026-06-22 20:29:57.400142
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '1de84fc98532'
down_revision: Union[str, None] = 'b23c34b4f379'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('materias', recreate='always') as batch_op:
        batch_op.drop_constraint('ck_materia_estado', type_='check')
        batch_op.create_check_constraint(
            "ck_materia_estado",
            "estado IN ('cursando', 'aprobada', 'recursando', 'libre', 'pendiente')"
        )


def downgrade() -> None:
    with op.batch_alter_table('materias', recreate='always') as batch_op:
        batch_op.drop_constraint('ck_materia_estado', type_='check')
        batch_op.create_check_constraint(
            "ck_materia_estado",
            "estado IN ('cursando', 'aprobada', 'recursando', 'libre')"
        )
