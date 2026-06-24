from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Carrera
from app.services.analytics import promedios_completos

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/promedios")
def get_promedios(carrera_id: int = Query(1), db: Session = Depends(get_db)):
    carrera = db.get(Carrera, carrera_id)
    if not carrera:
        return {
            "promedio_general_con_aplazos": None,
            "promedio_general_sin_aplazos": None,
            "total_materias": 0,
            "aprobadas": 0,
            "cursando": 0,
            "pendientes": 0,
            "semestres": [],
        }
    return promedios_completos(db, carrera_id)
