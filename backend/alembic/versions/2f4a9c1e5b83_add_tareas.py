"""add tareas

Revision ID: 2f4a9c1e5b83
Revises: ae8034525350
Create Date: 2026-08-30 12:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '2f4a9c1e5b83'
down_revision: Union[str, None] = 'ae8034525350'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('tareas',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('materia_id', sa.Integer(), nullable=False),
    sa.Column('titulo', sa.String(length=200), nullable=False),
    sa.Column('tipo', sa.String(length=20), nullable=False),
    sa.Column('semana', sa.Integer(), nullable=False),
    sa.Column('prioridad', sa.String(length=10), nullable=False),
    sa.Column('fecha_limite', sa.Date(), nullable=True),
    sa.Column('completado', sa.Boolean(), nullable=False),
    sa.Column('notas', sa.String(length=500), nullable=True),
    sa.CheckConstraint("prioridad IN ('alta', 'media', 'baja')", name='ck_tarea_prioridad'),
    sa.CheckConstraint("tipo IN ('teoria', 'practica', 'tp', 'entrega', 'examen', 'otro')", name='ck_tarea_tipo'),
    sa.ForeignKeyConstraint(['materia_id'], ['materias.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tareas_materia_id'), 'tareas', ['materia_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_tareas_materia_id'), table_name='tareas')
    op.drop_table('tareas')