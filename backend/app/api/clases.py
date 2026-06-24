from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.clase import Clase
from app.schemas.clase import ClaseCreate, ClaseRead, ClaseUpdate
from app.services.base import get_all, get_by_id, create, update, delete

router = APIRouter()


@router.get("", response_model=list[ClaseRead])
def list_clases(materia_id: int | None = None, db: Session = Depends(get_db)):
    return get_all(db, Clase, materia_id=materia_id)


@router.post("", response_model=ClaseRead, status_code=201)
def create_clase(data: ClaseCreate, db: Session = Depends(get_db)):
    return create(db, Clase, data.model_dump())


@router.get("/{clase_id}", response_model=ClaseRead)
def get_clase(clase_id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, Clase, clase_id)
    if not obj:
        raise HTTPException(404, "Clase no encontrada")
    return obj


@router.patch("/{clase_id}", response_model=ClaseRead)
def update_clase(clase_id: int, data: ClaseUpdate, db: Session = Depends(get_db)):
    obj = get_by_id(db, Clase, clase_id)
    if not obj:
        raise HTTPException(404, "Clase no encontrada")
    return update(db, obj, data.model_dump(exclude_none=True))


@router.delete("/{clase_id}", status_code=204)
def delete_clase(clase_id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, Clase, clase_id)
    if not obj:
        raise HTTPException(404, "Clase no encontrada")
    delete(db, obj)
