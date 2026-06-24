"""add dia_hora to clase

Revision ID: 91530e4419d7
Revises: 7b752e7e9ce2
Create Date: 2026-06-22 21:33:22.903695
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '91530e4419d7'
down_revision: Union[str, None] = '7b752e7e9ce2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('clases', recreate='always') as batch_op:
        batch_op.add_column(sa.Column('dia_semana', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('hora_inicio', sa.Time(), nullable=True))
        batch_op.add_column(sa.Column('hora_fin', sa.Time(), nullable=True))
        batch_op.alter_column('fecha', existing_type=sa.DATE(), nullable=True)
        batch_op.drop_index('ix_clases_fecha')


def downgrade() -> None:
    with op.batch_alter_table('clases', recreate='always') as batch_op:
        batch_op.create_index('ix_clases_fecha', ['fecha'], unique=False)
        batch_op.alter_column('fecha', existing_type=sa.DATE(), nullable=False)
        batch_op.drop_column('hora_fin')
        batch_op.drop_column('hora_inicio')
        batch_op.drop_column('dia_semana')
