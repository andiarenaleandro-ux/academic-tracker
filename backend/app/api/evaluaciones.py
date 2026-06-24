from datetime import time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.evaluacion import Evaluacion
from app.models.materia import Materia
from app.models.semestre import Semestre
from app.schemas.evaluacion import EvaluacionCreate, EvaluacionRead, EvaluacionUpdate
from app.services.base import get_by_id, create, update, delete


def _parse_hora(v: str | None) -> time | None:
    if not v:
        return None
    try:
        parts = v.split(":")
        return time(int(parts[0]), int(parts[1]))
    except (ValueError, IndexError):
        return None

router = APIRouter()


def _auto_aprobar(db: Session, evaluacion: Evaluacion) -> None:
    """Si es un final con nota, marca la materia como aprobada."""
    if evaluacion.tipo == "final" and evaluacion.nota_obtenida is not None:
        materia = db.get(Materia, evaluacion.materia_id)
        if materia and materia.estado != "aprobada":
            materia.estado = "aprobada"
            db.commit()


@router.get("", response_model=list[EvaluacionRead])
def list_evaluaciones(
    materia_id: int | None = None,
    carrera_id: int | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(Evaluacion)
    if carrera_id is not None:
        q = (q.join(Materia, Evaluacion.materia_id == Materia.id)
              .join(Semestre, Materia.semestre_id == Semestre.id)
              .filter(Semestre.carrera_id == carrera_id))
    if materia_id is not None:
        q = q.filter(Evaluacion.materia_id == materia_id)
    return q.all()


@router.post("", response_model=EvaluacionRead, status_code=201)
def create_evaluacion(data: EvaluacionCreate, db: Session = Depends(get_db)):
    payload = data.model_dump()
    payload["hora"] = _parse_hora(data.hora)
    obj = create(db, Evaluacion, payload)
    _auto_aprobar(db, obj)
    return obj


@router.get("/{evaluacion_id}", response_model=EvaluacionRead)
def get_evaluacion(evaluacion_id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, Evaluacion, evaluacion_id)
    if not obj:
        raise HTTPException(404, "Evaluación no encontrada")
    return obj


@router.patch("/{evaluacion_id}", response_model=EvaluacionRead)
def update_evaluacion(evaluacion_id: int, data: EvaluacionUpdate, db: Session = Depends(get_db)):
    obj = get_by_id(db, Evaluacion, evaluacion_id)
    if not obj:
        raise HTTPException(404, "Evaluación no encontrada")
    payload = data.model_dump(exclude_none=True)
    if "hora" in payload:
        payload["hora"] = _parse_hora(data.hora)
    obj = update(db, obj, payload)
    _auto_aprobar(db, obj)
    return obj


@router.delete("/{evaluacion_id}", status_code=204)
def delete_evaluacion(evaluacion_id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, Evaluacion, evaluacion_id)
    if not obj:
        raise HTTPException(404, "Evaluación no encontrada")
    delete(db, obj)
