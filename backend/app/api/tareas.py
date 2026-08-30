from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.tarea import Tarea
from app.models.materia import Materia
from app.models.semestre import Semestre
from app.schemas.tarea import TareaCreate, TareaRead, TareaUpdate
from app.services.base import get_by_id, create, update, delete

router = APIRouter()


@router.get("", response_model=list[TareaRead])
def list_tareas(
    materia_id: int | None = None,
    carrera_id: int | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(Tarea)
    if carrera_id is not None:
        q = (q.join(Materia, Tarea.materia_id == Materia.id)
              .join(Semestre, Materia.semestre_id == Semestre.id)
              .filter(Semestre.carrera_id == carrera_id))
    if materia_id is not None:
        q = q.filter(Tarea.materia_id == materia_id)
    return q.order_by(Tarea.completado.asc(), Tarea.semana.asc(), Tarea.fecha_limite.asc().nulls_first()).all()


@router.post("", response_model=TareaRead, status_code=201)
def create_tarea(data: TareaCreate, db: Session = Depends(get_db)):
    return create(db, Tarea, data.model_dump())


@router.get("/{tarea_id}", response_model=TareaRead)
def get_tarea(tarea_id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, Tarea, tarea_id)
    if not obj:
        raise HTTPException(404, "Tarea no encontrada")
    return obj


@router.patch("/{tarea_id}", response_model=TareaRead)
def update_tarea(tarea_id: int, data: TareaUpdate, db: Session = Depends(get_db)):
    obj = get_by_id(db, Tarea, tarea_id)
    if not obj:
        raise HTTPException(404, "Tarea no encontrada")
    return update(db, obj, data.model_dump(exclude_none=True))


@router.delete("/{tarea_id}", status_code=204)
def delete_tarea(tarea_id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, Tarea, tarea_id)
    if not obj:
        raise HTTPException(404, "Tarea no encontrada")
    delete(db, obj)