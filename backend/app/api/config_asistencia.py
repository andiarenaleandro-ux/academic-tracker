from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.config_asistencia import ConfigAsistencia
from app.schemas.config_asistencia import ConfigAsistenciaCreate, ConfigAsistenciaRead

router = APIRouter()


@router.get("/{materia_id}/asistencia", response_model=ConfigAsistenciaRead)
def get_config_asistencia(materia_id: int, db: Session = Depends(get_db)):
    obj = db.query(ConfigAsistencia).filter(ConfigAsistencia.materia_id == materia_id).first()
    if not obj:
        raise HTTPException(404, "Configuración de asistencia no encontrada")
    return obj


@router.put("/{materia_id}/asistencia", response_model=ConfigAsistenciaRead)
def upsert_config_asistencia(materia_id: int, data: ConfigAsistenciaCreate, db: Session = Depends(get_db)):
    obj = db.query(ConfigAsistencia).filter(ConfigAsistencia.materia_id == materia_id).first()
    if obj:
        obj.asistencia_minima_pct = data.asistencia_minima_pct
    else:
        obj = ConfigAsistencia(materia_id=materia_id, asistencia_minima_pct=data.asistencia_minima_pct)
        db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj
