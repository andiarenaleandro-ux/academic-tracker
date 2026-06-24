from datetime import date

import pytest
from sqlalchemy.exc import IntegrityError

from app.models import (
    Carrera,
    Semestre,
    Materia,
    Evaluacion,
    Clase,
    ConfigAsistencia,
)


def test_create_carrera(db_session):
    c = Carrera(nombre="Lic. Ciencia de Datos")
    db_session.add(c)
    db_session.commit()

    assert c.id is not None
    assert c.escala_nota_min == 0
    assert c.escala_nota_max == 10
    assert c.nota_aprobacion == 4.0
    assert c.nombre == "Lic. Ciencia de Datos"


def test_create_full_hierarchy(db_session):
    carrera = Carrera(nombre="Lic. Ciencia de Datos")
    db_session.add(carrera)
    db_session.commit()

    semestre = Semestre(
        carrera_id=carrera.id,
        numero=1,
        anio=2024,
        fecha_inicio=date(2024, 3, 1),
        fecha_fin=date(2024, 7, 15),
    )
    db_session.add(semestre)
    db_session.commit()

    materia = Materia(
        semestre_id=semestre.id,
        nombre="Álgebra",
        creditos=8,
        profesor="Pérez",
        estado="aprobada",
    )
    db_session.add(materia)
    db_session.commit()

    evaluacion = Evaluacion(
        materia_id=materia.id,
        tipo="parcial",
        fecha=date(2024, 4, 15),
        peso=0.3,
        nota_obtenida=7.0,
    )
    db_session.add(evaluacion)
    db_session.commit()

    clase = Clase(
        materia_id=materia.id,
        fecha=date(2024, 3, 10),
        asistio=True,
        tema="Introducción",
    )
    db_session.add(clase)
    db_session.commit()

    config = ConfigAsistencia(materia_id=materia.id, asistencia_minima_pct=75.0)
    db_session.add(config)
    db_session.commit()

    assert materia.nombre == "Álgebra"
    assert materia.semestre.numero == 1
    assert materia.estado == "aprobada"
    assert len(materia.evaluaciones) == 1
    assert len(materia.clases) == 1
    assert materia.config_asistencia is not None
    assert materia.config_asistencia.asistencia_minima_pct == 75.0
    assert evaluacion.nota_obtenida == 7.0


def test_materia_estado_check(db_session):
    c = Carrera(nombre="Carrera Test")
    db_session.add(c)
    db_session.commit()

    s = Semestre(
        carrera_id=c.id, numero=1, anio=2024,
        fecha_inicio=date(2024, 3, 1), fecha_fin=date(2024, 7, 15),
    )
    db_session.add(s)
    db_session.commit()

    m = Materia(semestre_id=s.id, nombre="Test", estado="invalido")
    db_session.add(m)
    with pytest.raises(IntegrityError):
        db_session.commit()
