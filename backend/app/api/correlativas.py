from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.db import get_db
from app.models import Materia, Correlatividad
from app.models.semestre import Semestre

router = APIRouter(tags=["correlatividades"])


class CorrelativaCreate(BaseModel):
    materia_id: int
    correlativa_id: int
    tipo: str = ""


@router.post("/correlatividades", status_code=201)
def create_correlatividad(data: CorrelativaCreate, db: Session = Depends(get_db)):
    obj = Correlatividad(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/correlatividades")
def get_correlatividades(carrera_id: int | None = None, db: Session = Depends(get_db)):
    q = (
        db.query(Materia)
        .options(joinedload(Materia.correlatividades).joinedload(Correlatividad.correlativa), joinedload(Materia.semestre))
    )
    if carrera_id is not None:
        q = q.join(Semestre, Materia.semestre_id == Semestre.id).filter(Semestre.carrera_id == carrera_id)
    materias = q.order_by(Materia.id).all()

    result = []
    for m in materias:
        correlativas = []
        for c in m.correlatividades:
            correlativas.append({
                "id": c.correlativa.id,
                "nombre": c.correlativa.nombre,
                "tipo": c.tipo,
                "estado": c.correlativa.estado,
            })
        result.append({
            "id": m.id,
            "nombre": m.nombre,
            "estado": m.estado,
            "semestre_numero": m.semestre.numero,
            "correlativas": correlativas,
        })

    return result
