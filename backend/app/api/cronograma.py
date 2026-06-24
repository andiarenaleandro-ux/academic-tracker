from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db import get_db
from app.models.clase import Clase
from app.models.materia import Materia
from app.models.semestre import Semestre

router = APIRouter()

COLORES = [
    "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#a855f7",
    "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
]


def color_para_materia(materia_id: int) -> str:
    return COLORES[materia_id % len(COLORES)]


class CronogramaItem(BaseModel):
    materia_id: int
    materia_nombre: str
    materia_color: str
    dia_semana: int
    hora_inicio: str
    hora_fin: str


@router.get("", response_model=list[CronogramaItem])
def get_cronograma(carrera_id: int | None = None, db: Session = Depends(get_db)):
    stmt = (
        select(Clase, Materia.nombre)
        .join(Materia, Clase.materia_id == Materia.id)
        .where(Clase.dia_semana.isnot(None))
        .where(Clase.hora_inicio.isnot(None))
        .where(Clase.hora_fin.isnot(None))
    )
    if carrera_id is not None:
        stmt = stmt.join(Semestre, Materia.semestre_id == Semestre.id).where(Semestre.carrera_id == carrera_id)
    stmt = stmt.order_by(Clase.dia_semana, Clase.hora_inicio)
    rows = db.execute(stmt).all()
    return [
        CronogramaItem(
            materia_id=clase.materia_id,
            materia_nombre=nombre,
            materia_color=color_para_materia(clase.materia_id),
            dia_semana=clase.dia_semana,
            hora_inicio=clase.hora_inicio.strftime("%H:%M"),
            hora_fin=clase.hora_fin.strftime("%H:%M"),
        )
        for clase, nombre in rows
    ]
