from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.carrera import Carrera
from app.models.semestre import Semestre
from app.models.materia import Materia
from app.models.correlatividad import Correlatividad

router = APIRouter()


class MateriaSetup(BaseModel):
    nombre: str
    codigo: str | None = None
    creditos: int | None = None
    duracion: str | None = None
    semestre_num: int


class CorrelativaSetup(BaseModel):
    materia_idx: int
    requiere_idx: int


class PlanSetup(BaseModel):
    nombre_carrera: str
    nota_aprobacion: float = 4.0
    escala_nota_min: int = 0
    escala_nota_max: int = 10
    num_semestres: int
    anio_inicio: int
    materias: list[MateriaSetup] = []
    correlativas: list[CorrelativaSetup] = []


@router.post("/plan/setup", status_code=201)
def setup_plan(data: PlanSetup, db: Session = Depends(get_db)):
    try:
        return _do_setup(data, db)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}\n{traceback.format_exc()}")


def _do_setup(data: PlanSetup, db: Session):
    if data.num_semestres < 1 or data.num_semestres > 20:
        raise HTTPException(400, "num_semestres debe estar entre 1 y 20")

    carrera = Carrera(
        nombre=data.nombre_carrera,
        nota_aprobacion=data.nota_aprobacion,
        escala_nota_min=data.escala_nota_min,
        escala_nota_max=data.escala_nota_max,
    )
    db.add(carrera)
    db.flush()

    semestres: dict[int, Semestre] = {}
    for i in range(1, data.num_semestres + 1):
        year_offset = (i - 1) // 2
        year = data.anio_inicio + year_offset
        if i % 2 == 1:
            fecha_inicio = date(year, 3, 1)
            fecha_fin = date(year, 7, 31)
        else:
            fecha_inicio = date(year, 8, 1)
            fecha_fin = date(year, 12, 15)
        sem = Semestre(
            carrera_id=carrera.id,
            numero=i,
            anio=year,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
        )
        db.add(sem)
        db.flush()
        semestres[i] = sem

    created: list[Materia] = []
    for m in data.materias:
        sem = semestres.get(m.semestre_num)
        if not sem:
            raise HTTPException(400, f"Semestre {m.semestre_num} fuera de rango")
        materia = Materia(
            semestre_id=sem.id,
            nombre=m.nombre,
            codigo=m.codigo,
            creditos=m.creditos,
            duracion=m.duracion,
            estado="pendiente",
        )
        db.add(materia)
        db.flush()
        created.append(materia)

    for rel in data.correlativas:
        if rel.materia_idx >= len(created) or rel.requiere_idx >= len(created):
            continue
        db.add(Correlatividad(
            materia_id=created[rel.materia_idx].id,
            correlativa_id=created[rel.requiere_idx].id,
            tipo="",
        ))

    db.commit()
    return {"ok": True, "carrera_id": carrera.id, "materias_creadas": len(created)}
