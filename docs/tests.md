# Tests

Cómo están organizados los tests del backend, cómo correrlos y cómo agregar nuevos.

---

## Stack de testing

| Librería | Rol |
|---|---|
| **pytest** | Runner de tests. Descubre y ejecuta los archivos `test_*.py` |
| **httpx** | Cliente HTTP async usado internamente por `TestClient` de FastAPI |
| **SQLite `:memory:`** | Base de datos en memoria, aislada por test. No toca el archivo real |
| **FastAPI TestClient** | Cliente HTTP síncrono que llama a los endpoints sin levantar un servidor real |

---

## Estructura de la carpeta de tests

```
backend/tests/
├── conftest.py       ← fixtures compartidos (sesión de BD, cliente HTTP)
├── test_models.py    ← tests de modelos SQLAlchemy (tablas, relaciones, constraints)
├── test_api.py       ← tests de integración de los endpoints HTTP
└── test_importer.py  ← tests del importador de Excel
```

---

## Cómo correr los tests

### Todos los tests

```powershell
# Desde la raíz del proyecto
npm test

# O directamente desde la carpeta backend
cd backend
pytest
```

### Un archivo específico

```powershell
cd backend
pytest tests/test_api.py
```

### Un test o clase específica

```powershell
cd backend
pytest tests/test_api.py::TestCarreras
pytest tests/test_api.py::TestCarreras::test_create_and_list
```

### Con output detallado

```powershell
cd backend
pytest -v
```

### Ver prints dentro de los tests

```powershell
cd backend
pytest -s
```

### Combinado: verbose + prints

```powershell
cd backend
pytest -vs
```

---

## `conftest.py` — Fixtures base

Un **fixture** en pytest es una función que prepara el entorno para un test. Se declara con `@pytest.fixture` y se recibe como parámetro en el test.

### Fixture `db_session` (en `conftest.py`)

```python
@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine)()
    yield session
    session.close()
```

- Crea un engine SQLite en memoria (`:memory:`) — los datos solo existen mientras el test corre.
- Crea todas las tablas con `create_all`.
- Devuelve la sesión al test con `yield` (lo que viene después de `yield` se ejecuta al terminar el test, como un `finally`).
- Cierra la sesión al terminar.

Se usa en `test_models.py` para probar los modelos directamente sin HTTP.

### Fixture `client` (en `test_api.py` y `test_importer.py`)

```python
@pytest.fixture
def client():
    engine = create_engine("sqlite:///:memory:", ...)
    Base.metadata.create_all(bind=engine)
    test_db = TestSession()

    def override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
    test_db.close()
```

Hace algo más: usa `app.dependency_overrides` para reemplazar la función `get_db` de FastAPI por una versión que devuelve la base de datos en memoria. Así cada petición HTTP del test usa la BD de prueba en lugar de la real.

`TestClient(app)` permite hacer peticiones HTTP directamente al app FastAPI sin levantar un servidor real: `client.get("/api/carreras")`, `client.post("/api/materias", json={...})`, etc.

---

## `test_models.py` — Tests de modelos

Prueban que los modelos SQLAlchemy funcionan correctamente a nivel de base de datos: que se pueden crear registros, que las relaciones funcionan y que los constraints se respetan.

### `test_create_carrera`

Verifica que al crear una `Carrera` se asigna un `id` y que los valores por defecto (`escala_nota_min=0`, etc.) se aplican correctamente.

### `test_create_full_hierarchy`

Crea la jerarquía completa: Carrera → Semestre → Materia → Evaluacion + Clase + ConfigAsistencia. Verifica que las relaciones ORM funcionan (ej: `materia.evaluaciones` devuelve la evaluación creada, `materia.semestre.numero` devuelve el número del semestre padre).

### `test_materia_estado_check`

Verifica que el `CheckConstraint` de `estado` funciona: intentar guardar una materia con `estado="invalido"` lanza `IntegrityError`.

---

## `test_api.py` — Tests de integración HTTP

Prueban los endpoints a través de peticiones HTTP reales (contra la BD en memoria). Están organizados en clases por recurso.

### Patrón común

La mayoría de las clases tienen un método `_setup(client)` que crea los datos base necesarios (una carrera + un semestre) para poder crear una materia, evaluación, etc. Esto evita repetir el código de setup en cada test.

```python
def _setup(self, client):
    c = client.post("/api/carreras", json={"nombre": "C"}).json()
    s = client.post("/api/semestres", json={...}).json()
    return c, s
```

### `TestCarreras`

| Test | Qué verifica |
|---|---|
| `test_create_and_list` | POST devuelve 201 con los datos correctos; GET lista la carrera creada |
| `test_get_not_found` | GET de ID inexistente devuelve 404 |
| `test_update` | PATCH cambia el nombre correctamente |
| `test_delete` | DELETE devuelve 204 y la carrera desaparece de la lista |

### `TestMaterias`

| Test | Qué verifica |
|---|---|
| `test_full_crud` | Ciclo completo: crear, leer, actualizar estado, eliminar |
| `test_filter_by_estado` | El filtro `?estado=aprobada` devuelve solo las materias con ese estado |

### `TestEvaluaciones`

| Test | Qué verifica |
|---|---|
| `test_create_and_update` | Crea evaluación con nota, actualiza nota simulada, filtra por `materia_id` |

### `TestClases`

| Test | Qué verifica |
|---|---|
| `test_create` | Crea una clase con fecha y asistencia, verifica que aparece en el listado |
| `test_update_asistio` | PATCH cambia el campo `asistio` de false a true |

### `TestConfigAsistencia`

| Test | Qué verifica |
|---|---|
| `test_upsert` | PUT crea la configuración si no existe; GET la devuelve correctamente |
| `test_get_not_found` | GET de materia sin config devuelve 404 |

---

## `test_importer.py` — Tests del importador Excel

Prueban el flujo de importación de datos desde archivos Excel.

### Helper `_build_xlsx(sheets)`

Función auxiliar que construye un archivo Excel en memoria a partir de un dict:

```python
data = _build_xlsx({
    "Carreras": [
        ["nombre", "escala_nota_min"],   # fila de encabezados
        ["Mi Carrera", 0],               # fila de datos
    ],
})
```

Devuelve los bytes del archivo listo para enviarlo con `client.post("/api/import", files={"file": ...})`.

### `test_import_full`

Importa un Excel completo con las 6 hojas (Carreras, Semestres, Materias, Evaluaciones, Clases, Asistencia). Verifica que `ok=True`, que el total de creados es correcto (7 registros) y que los datos aparecen en los endpoints correspondientes.

### `test_import_missing_sheet`

Importa un Excel con solo la hoja `Materias` pero sin la hoja `Semestres`. Como las materias referencian un semestre que no existe, el import falla con errores a nivel de fila. Verifica que `ok=False` y `errores > 0`.

### `test_import_invalid_file`

Intenta importar un archivo `.txt` en lugar de `.xlsx`. Verifica que el endpoint devuelve 400.

### `test_import_update_existing`

Crea datos por API, luego importa un Excel que referencia los mismos registros. Verifica que el importador actualiza (no duplica) los registros existentes.

---

## Cómo agregar un test nuevo

### 1. Decidir en qué archivo va

- ¿Probás un modelo directamente (sin HTTP)? → `test_models.py`, usá el fixture `db_session`
- ¿Probás un endpoint? → `test_api.py`, usá el fixture `client`
- ¿Probás la importación Excel? → `test_importer.py`

### 2. Agregar a una clase existente o crear una nueva

Si el nuevo test es para un recurso que ya tiene tests, agregalo a la clase correspondiente:

```python
class TestMaterias:
    def test_mi_nuevo_caso(self, client):
        _, s = self._setup(client)
        # ... tu test
```

### 3. Estructura básica de un test de API

```python
def test_algo(self, client):
    # 1. Setup: crear datos necesarios
    c = client.post("/api/carreras", json={"nombre": "Test"}).json()

    # 2. Acción: llamar al endpoint que querés probar
    resp = client.post("/api/semestres", json={
        "carrera_id": c["id"],
        "numero": 1,
        "anio": 2026,
        "fecha_inicio": "2026-03-01",
        "fecha_fin": "2026-07-31",
    })

    # 3. Assert: verificar el resultado
    assert resp.status_code == 201
    data = resp.json()
    assert data["numero"] == 1
    assert data["carrera_id"] == c["id"]
```

### 4. Correr solo el test nuevo para verificarlo

```powershell
cd backend
pytest tests/test_api.py::TestMaterias::test_mi_nuevo_caso -vs
```

---

## Cobertura actual

| Área | Qué está cubierto |
|---|---|
| Modelos | Creación, relaciones ORM, constraints de estado |
| Carreras | CRUD completo, 404 en get/update/delete |
| Materias | CRUD completo, filtro por estado |
| Evaluaciones | Crear, actualizar, filtrar por materia |
| Clases | Crear, actualizar asistencia |
| Config asistencia | Upsert, 404 |
| Importador | Import completo, errores de referencia, archivo inválido, update |

**No cubierto actualmente:** analytics/promedios, correlatividades, cronograma, plan/setup, filtro por `carrera_id`.
