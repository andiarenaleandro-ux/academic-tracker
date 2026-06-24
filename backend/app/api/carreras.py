from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.carrera import Carrera
from app.schemas.carrera import CarreraCreate, CarreraRead, CarreraUpdate
from app.services.base import get_all, get_by_id, create, update, delete

router = APIRouter()


@router.get("", response_model=list[CarreraRead])
def list_carreras(db: Session = Depends(get_db)):
    return get_all(db, Carrera)


@router.post("", response_model=CarreraRead, status_code=201)
def create_carrera(data: CarreraCreate, db: Session = Depends(get_db)):
    return create(db, Carrera, data.model_dump())


@router.get("/{carrera_id}", response_model=CarreraRead)
def get_carrera(carrera_id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, Carrera, carrera_id)
    if not obj:
        raise HTTPException(404, "Carrera no encontrada")
    return obj


@router.patch("/{carrera_id}", response_model=CarreraRead)
def update_carrera(carrera_id: int, data: CarreraUpdate, db: Session = Depends(get_db)):
    obj = get_by_id(db, Carrera, carrera_id)
    if not obj:
        raise HTTPException(404, "Carrera no encontrada")
    return update(db, obj, data.model_dump())


@router.delete("/{carrera_id}", status_code=204)
def delete_carrera(carrera_id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, Carrera, carrera_id)
    if not obj:
        raise HTTPException(404, "Carrera no encontrada")
    delete(db, obj)
