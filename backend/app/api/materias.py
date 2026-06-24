from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.materia import Materia
from app.models.semestre import Semestre
from app.schemas.materia import MateriaCreate, MateriaRead, MateriaUpdate
from app.services.base import get_by_id, create, update, delete

router = APIRouter()


@router.get("", response_model=list[MateriaRead])
def list_materias(
    semestre_id: int | None = None,
    estado: str | None = None,
    carrera_id: int | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(Materia)
    if carrera_id is not None:
        q = q.join(Semestre, Materia.semestre_id == Semestre.id).filter(Semestre.carrera_id == carrera_id)
    if semestre_id is not None:
        q = q.filter(Materia.semestre_id == semestre_id)
    if estado is not None:
        q = q.filter(Materia.estado == estado)
    return q.all()


@router.post("", response_model=MateriaRead, status_code=201)
def create_materia(data: MateriaCreate, db: Session = Depends(get_db)):
    return create(db, Materia, data.model_dump())


@router.get("/{materia_id}", response_model=MateriaRead)
def get_materia(materia_id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, Materia, materia_id)
    if not obj:
        raise HTTPException(404, "Materia no encontrada")
    return obj


@router.patch("/{materia_id}", response_model=MateriaRead)
def update_materia(materia_id: int, data: MateriaUpdate, db: Session = Depends(get_db)):
    obj = get_by_id(db, Materia, materia_id)
    if not obj:
        raise HTTPException(404, "Materia no encontrada")
    return update(db, obj, data.model_dump(exclude_none=True))


@router.delete("/{materia_id}", status_code=204)
def delete_materia(materia_id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, Materia, materia_id)
    if not obj:
        raise HTTPException(404, "Materia no encontrada")
    delete(db, obj)
