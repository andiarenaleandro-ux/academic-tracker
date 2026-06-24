import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app


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


class TestCarreras:
    def test_create_and_list(self, client):
        resp = client.post("/api/carreras", json={"nombre": "Lic. Datos"})
        assert resp.status_code == 201
        data = resp.json()
        assert data["nombre"] == "Lic. Datos"
        assert data["escala_nota_min"] == 0
        assert data["escala_nota_max"] == 10
        assert data["nota_aprobacion"] == 4.0

        resp = client.get("/api/carreras")
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_get_not_found(self, client):
        resp = client.get("/api/carreras/999")
        assert resp.status_code == 404

    def test_update(self, client):
        resp = client.post("/api/carreras", json={"nombre": "A"})
        cid = resp.json()["id"]
        resp = client.patch(f"/api/carreras/{cid}", json={"nombre": "B"})
        assert resp.status_code == 200
        assert resp.json()["nombre"] == "B"

    def test_delete(self, client):
        resp = client.post("/api/carreras", json={"nombre": "X"})
        cid = resp.json()["id"]
        resp = client.delete(f"/api/carreras/{cid}")
        assert resp.status_code == 204
        resp = client.get("/api/carreras")
        assert len(resp.json()) == 0


class TestMaterias:
    def _setup(self, client):
        c = client.post("/api/carreras", json={"nombre": "C"}).json()
        s = client.post("/api/semestres", json={
            "carrera_id": c["id"], "numero": 1, "anio": 2024,
            "fecha_inicio": "2024-03-01", "fecha_fin": "2024-07-15",
        }).json()
        return c, s

    def test_full_crud(self, client):
        _, s = self._setup(client)
        resp = client.post("/api/materias", json={
            "semestre_id": s["id"], "nombre": "Álgebra", "estado": "cursando",
        })
        assert resp.status_code == 201
        mid = resp.json()["id"]

        resp = client.get(f"/api/materias/{mid}")
        assert resp.json()["nombre"] == "Álgebra"

        resp = client.patch(f"/api/materias/{mid}", json={"estado": "aprobada"})
        assert resp.json()["estado"] == "aprobada"

        resp = client.delete(f"/api/materias/{mid}")
        assert resp.status_code == 204

    def test_filter_by_estado(self, client):
        _, s = self._setup(client)
        client.post("/api/materias", json={"semestre_id": s["id"], "nombre": "M1", "estado": "cursando"})
        client.post("/api/materias", json={"semestre_id": s["id"], "nombre": "M2", "estado": "aprobada"})
        resp = client.get("/api/materias", params={"estado": "aprobada"})
        assert len(resp.json()) == 1


class TestEvaluaciones:
    def _setup(self, client):
        c = client.post("/api/carreras", json={"nombre": "C"}).json()
        s = client.post("/api/semestres", json={
            "carrera_id": c["id"], "numero": 1, "anio": 2024,
            "fecha_inicio": "2024-03-01", "fecha_fin": "2024-07-15",
        }).json()
        m = client.post("/api/materias", json={"semestre_id": s["id"], "nombre": "M"}).json()
        return c, s, m

    def test_create_and_update(self, client):
        _, _, m = self._setup(client)
        resp = client.post("/api/evaluaciones", json={
            "materia_id": m["id"], "tipo": "parcial", "fecha": "2024-04-15",
            "peso": 0.3, "nota_obtenida": 7.0,
        })
        assert resp.status_code == 201
        eid = resp.json()["id"]

        resp = client.patch(f"/api/evaluaciones/{eid}", json={"nota_simulada": 8.0})
        assert resp.json()["nota_simulada"] == 8.0

        resp = client.get("/api/evaluaciones", params={"materia_id": m["id"]})
        assert len(resp.json()) == 1


class TestClases:
    def _setup(self, client):
        c = client.post("/api/carreras", json={"nombre": "C"}).json()
        s = client.post("/api/semestres", json={
            "carrera_id": c["id"], "numero": 1, "anio": 2024,
            "fecha_inicio": "2024-03-01", "fecha_fin": "2024-07-15",
        }).json()
        m = client.post("/api/materias", json={"semestre_id": s["id"], "nombre": "M"}).json()
        return c, s, m

    def test_create(self, client):
        _, _, m = self._setup(client)
        resp = client.post("/api/clases", json={
            "materia_id": m["id"], "fecha": "2024-03-10", "asistio": True,
        })
        assert resp.status_code == 201
        resp = client.get("/api/clases", params={"materia_id": m["id"]})
        assert len(resp.json()) == 1

    def test_update_asistio(self, client):
        _, _, m = self._setup(client)
        resp = client.post("/api/clases", json={
            "materia_id": m["id"], "fecha": "2024-03-10", "asistio": False,
        })
        cid = resp.json()["id"]
        resp = client.patch(f"/api/clases/{cid}", json={"asistio": True})
        assert resp.json()["asistio"] is True


class TestConfigAsistencia:
    def _setup(self, client):
        c = client.post("/api/carreras", json={"nombre": "C"}).json()
        s = client.post("/api/semestres", json={
            "carrera_id": c["id"], "numero": 1, "anio": 2024,
            "fecha_inicio": "2024-03-01", "fecha_fin": "2024-07-15",
        }).json()
        m = client.post("/api/materias", json={"semestre_id": s["id"], "nombre": "M"}).json()
        return c, s, m

    def test_upsert(self, client):
        _, _, m = self._setup(client)
        resp = client.put(f"/api/materias/{m['id']}/asistencia", json={"asistencia_minima_pct": 80.0})
        assert resp.status_code == 200
        assert resp.json()["asistencia_minima_pct"] == 80.0

        resp = client.get(f"/api/materias/{m['id']}/asistencia")
        assert resp.json()["asistencia_minima_pct"] == 80.0

    def test_get_not_found(self, client):
        resp = client.get("/api/materias/999/asistencia")
        assert resp.status_code == 404
