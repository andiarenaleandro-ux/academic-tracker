from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.semestre import Semestre
from app.schemas.semestre import SemestreCreate, SemestreRead, SemestreUpdate
from app.services.base import get_all, get_by_id, create, update, delete

router = APIRouter()


@router.get("", response_model=list[SemestreRead])
def list_semestres(carrera_id: int | None = None, db: Session = Depends(get_db)):
    return get_all(db, Semestre, carrera_id=carrera_id)


@router.post("", response_model=SemestreRead, status_code=201)
def create_semestre(data: SemestreCreate, db: Session = Depends(get_db)):
    return create(db, Semestre, data.model_dump())


@router.get("/{semestre_id}", response_model=SemestreRead)
def get_semestre(semestre_id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, Semestre, semestre_id)
    if not obj:
        raise HTTPException(404, "Semestre no encontrado")
    return obj


@router.patch("/{semestre_id}", response_model=SemestreRead)
def update_semestre(semestre_id: int, data: SemestreUpdate, db: Session = Depends(get_db)):
    obj = get_by_id(db, Semestre, semestre_id)
    if not obj:
        raise HTTPException(404, "Semestre no encontrado")
    return update(db, obj, data.model_dump(exclude_none=True))


@router.delete("/{semestre_id}", status_code=204)
def delete_semestre(semestre_id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, Semestre, semestre_id)
    if not obj:
        raise HTTPException(404, "Semestre no encontrado")
    delete(db, obj)
