from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from app.models import Semestre, Materia, Evaluacion


NOTA_APROBACION = 4.0


def _promedio_ponderado(evaluaciones: list[Evaluacion]) -> float | None:
    notas = [e for e in evaluaciones if e.nota_obtenida is not None]
    if not notas:
        return None
    suma_pesos = sum(e.peso for e in notas)
    if suma_pesos == 0:
        return None
    total = sum(e.nota_obtenida * e.peso for e in notas)
    return round(total / suma_pesos, 2)


def promedios_generales(db: Session, carrera_id: int) -> dict:
    evaluaciones = (
        db.execute(
            select(Evaluacion)
            .join(Materia)
            .join(Semestre)
            .where(
                Semestre.carrera_id == carrera_id,
                Evaluacion.nota_obtenida.isnot(None),
            )
            .options(joinedload(Evaluacion.materia).joinedload(Materia.semestre))
        )
        .unique()
        .scalars()
        .all()
    )

    con_aplazos = _promedio_ponderado(evaluaciones)
    sin_aplazos = _promedio_ponderado([e for e in evaluaciones if e.nota_obtenida >= NOTA_APROBACION])

    return {
        "promedio_general_con_aplazos": con_aplazos,
        "promedio_general_sin_aplazos": sin_aplazos,
    }


def resumen_materias(db: Session, carrera_id: int) -> dict:
    materias = (
        db.execute(
            select(Materia)
            .join(Semestre)
            .where(Semestre.carrera_id == carrera_id)
            .options(joinedload(Materia.semestre))
        )
        .unique()
        .scalars()
        .all()
    )

    total = len(materias)
    aprobadas = sum(1 for m in materias if m.estado == "aprobada")
    cursando = sum(1 for m in materias if m.estado == "cursando")
    pendientes = sum(1 for m in materias if m.estado == "pendiente")

    return {
        "total_materias": total,
        "aprobadas": aprobadas,
        "cursando": cursando,
        "pendientes": pendientes,
    }


def promedios_por_semestre(db: Session, carrera_id: int) -> list[dict]:
    semestres = (
        db.execute(
            select(Semestre)
            .where(Semestre.carrera_id == carrera_id)
            .order_by(Semestre.numero)
            .options(
                joinedload(Semestre.materias).joinedload(Materia.evaluaciones)
            )
        )
        .unique()
        .scalars()
        .all()
    )

    resultado = []
    for sem in semestres:
        materias_data = []
        for mat in sem.materias:
            evals = [e for e in mat.evaluaciones if e.nota_obtenida is not None]
            prom = _promedio_ponderado(evals)
            materias_data.append({
                "id": mat.id,
                "nombre": mat.nombre,
                "promedio": prom,
                "estado": mat.estado,
            })

        # Promedio del semestre: todos los promedios ponderados de materias
        evals_sem = [
            e for m in sem.materias for e in m.evaluaciones
            if e.nota_obtenida is not None
        ]
        prom_con = _promedio_ponderado(evals_sem)
        prom_sin = _promedio_ponderado([
            e for e in evals_sem if e.nota_obtenida >= NOTA_APROBACION
        ])

        resultado.append({
            "numero": sem.numero,
            "promedio_con_aplazos": prom_con,
            "promedio_sin_aplazos": prom_sin,
            "materias": materias_data,
        })

    return resultado


def promedios_completos(db: Session, carrera_id: int) -> dict:
    generales = promedios_generales(db, carrera_id)
    resumen = resumen_materias(db, carrera_id)
    semestres = promedios_por_semestre(db, carrera_id)
    return {**generales, **resumen, "semestres": semestres}
