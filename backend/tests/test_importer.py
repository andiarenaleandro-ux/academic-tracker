from io import BytesIO
from datetime import date

import openpyxl
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app
from app.models import Carrera, Semestre, Materia


def _build_xlsx(sheets: dict[str, list[list]]) -> bytes:
    wb = openpyxl.Workbook()
    wb.remove(wb.active)
    for name, rows in sheets.items():
        ws = wb.create_sheet(name)
        for row in rows:
            ws.append(row)
    buf = BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf.read()


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestSession = sessionmaker(bind=engine)
    test_db = TestSession()

    def override_get_db():
        try:
            yield test_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
    test_db.close()


class TestImporter:
    def test_import_full(self, client):
        data = _build_xlsx({
            "Carreras": [
                ["nombre", "escala_nota_min", "escala_nota_max", "nota_aprobacion"],
                ["Lic. Datos", 0, 10, 4.0],
            ],
            "Semestres": [
                ["numero", "anio", "fecha_inicio", "fecha_fin", "carrera"],
                [1, 2024, "2024-03-01", "2024-07-15", "Lic. Datos"],
            ],
            "Materias": [
                ["nombre", "semestre", "creditos", "profesor", "estado"],
                ["Álgebra", "1-2024", 8, "Pérez", "aprobada"],
            ],
            "Evaluaciones": [
                ["materia", "tipo", "fecha", "peso", "nota_obtenida", "notas"],
                ["Álgebra", "parcial", "2024-04-15", 0.3, 7.0, "Primer parcial"],
                ["Álgebra", "final", "2024-06-20", 0.4, 8.0, ""],
            ],
            "Clases": [
                ["materia", "fecha", "asistio", "tema"],
                ["Álgebra", "2024-03-10", "TRUE", "Introducción"],
            ],
            "Asistencia": [
                ["materia", "asistencia_minima_pct"],
                ["Álgebra", 75],
            ],
        })

        resp = client.post("/api/import", files={"file": ("test.xlsx", data, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")})
        assert resp.status_code == 200
        body = resp.json()
        assert body["ok"] is True
        assert body["creados"] == 7  # 1 carrera + 1 semestre + 1 materia + 2 eval + 1 clase + 1 config
        assert body["errores"] == 0

        resp = client.get("/api/carreras")
        assert len(resp.json()) == 1
        resp = client.get("/api/materias")
        assert len(resp.json()) == 1
        resp = client.get("/api/evaluaciones")
        assert len(resp.json()) == 2

    def test_import_missing_sheet(self, client):
        data = _build_xlsx({
            "Materias": [
                ["nombre", "semestre"],
                ["M1", "1-2024"],
            ],
        })
        resp = client.post("/api/import", files={"file": ("test.xlsx", data, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")})
        assert resp.status_code == 200
        # Sin carrera ni semestre, la materia falla por referencia
        body = resp.json()
        assert body["ok"] is False
        assert body["errores"] > 0

    def test_import_invalid_file(self, client):
        resp = client.post("/api/import", files={"file": ("test.txt", b"not an excel", "text/plain")})
        assert resp.status_code == 400

    def test_import_update_existing(self, client):
        # Primero crear datos base
        client.post("/api/carreras", json={"nombre": "C"})
        client.post("/api/semestres", json={
            "carrera_id": 1, "numero": 1, "anio": 2024,
            "fecha_inicio": "2024-03-01", "fecha_fin": "2024-07-15",
        })
        client.post("/api/materias", json={"semestre_id": 1, "nombre": "M"})

        # Import con update
        data = _build_xlsx({
            "Carreras": [["nombre", "nota_aprobacion"], ["C", 5.0]],
            "Semestres": [["numero", "anio", "fecha_inicio", "fecha_fin", "carrera"], [1, 2024, "2024-03-01", "2024-07-15", "C"]],
            "Materias": [["nombre", "semestre", "estado"], ["M", "1-2024", "aprobada"]],
        })
        resp = client.post("/api/import", files={"file": ("test.xlsx", data, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")})
        assert resp.status_code == 200
        body = resp.json()
        assert body["detalle"]["carreras"]["actualizados"] == 1
        assert body["detalle"]["materias"]["actualizados"] == 1

        resp = client.get("/api/carreras/1")
        assert resp.json()["nota_aprobacion"] == 5.0
