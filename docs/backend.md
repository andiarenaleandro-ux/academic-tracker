# Backend — Guía para principiantes

Este documento explica cómo funciona el backend de Academic Tracker: qué tecnologías usa, qué hace cada archivo y cuáles son las funciones más importantes.

---

## ¿Qué es un backend?

El backend es la parte de la aplicación que corre en segundo plano: recibe pedidos del frontend (la pantalla que ve el usuario), consulta o modifica la base de datos, y devuelve una respuesta. El usuario nunca lo ve directamente.

En este proyecto el backend es un **servidor HTTP local** escrito en Python. Cuando abrís el ejecutable, el backend se inicia automáticamente en tu propia computadora y el frontend se conecta a él.

---

## Stack tecnológico

### Python

Lenguaje de programación en el que está escrito todo el backend. Se usa Python 3.11 o superior.

### FastAPI

Framework que permite construir APIs HTTP en Python de forma rápida. Una API es un conjunto de "rutas" (URLs) que el frontend puede llamar para pedir o enviar datos.

Ejemplo: cuando el frontend necesita la lista de materias, hace una petición GET a `/api/materias`. FastAPI recibe esa petición, llama a la función correspondiente y devuelve la respuesta en formato JSON.

FastAPI también genera automáticamente una documentación interactiva en `/docs` (solo disponible en modo desarrollo).

### SQLAlchemy 2.0

Librería que permite hablar con la base de datos usando Python en lugar de SQL crudo. Define las tablas como **clases Python** (llamadas modelos) y las columnas como atributos con tipos (`Mapped[str]`, `Mapped[int]`, etc.).

Cuando escribís `Mapped[str]` el campo es obligatorio (NOT NULL). Cuando escribís `Mapped[str | None]` acepta vacío.

### SQLite

Base de datos liviana que guarda todo en un único archivo `.db`. No requiere instalar ningún servidor externo. Es ideal para aplicaciones de escritorio como esta.

Archivo en desarrollo: `backend/data/academic_tracker.db`
Archivo en producción: `%APPDATA%/AcademicTracker/academic_tracker.db`

### Pydantic v2

Librería de validación de datos. Define los schemas (estructuras) de lo que el frontend puede enviar y recibir. Si el frontend manda un dato con el tipo incorrecto, Pydantic devuelve un error descriptivo automáticamente.

### Alembic

Herramienta de migraciones. Cuando el esquema de la base de datos cambia (se agrega una columna, se crea una tabla), Alembic guarda esos cambios como "migraciones" y los aplica a bases de datos existentes sin borrar los datos.

### uvicorn

Servidor ASGI (servidor web asíncrono para Python) que ejecuta la aplicación FastAPI. Es lo que realmente recibe las conexiones HTTP y las pasa a FastAPI.

Se inicia con: `uvicorn app.main:app --reload` (en desarrollo).

### pywebview

Librería que abre una ventana nativa de Windows usando el motor de WebView2 (el mismo de Edge). La ventana apunta a `http://localhost:<puerto>` donde corre el backend. Esto permite que la app se vea como una app de escritorio aunque internamente sea un sitio web local.

### PyInstaller

Herramienta que empaqueta el código Python junto con todas sus dependencias en un único ejecutable `.exe`. El resultado es `dist/AcademicTracker/AcademicTracker.exe`, que se puede distribuir sin necesitar tener Python instalado.

### openpyxl

Librería para leer y escribir archivos Excel (`.xlsx`) desde Python. Se usa para importar materias y evaluaciones desde planillas.

---

## Archivos del backend

### `backend/desktop.py` — El punto de partida del ejecutable

Este archivo es el primero que se ejecuta cuando el usuario abre el `.exe`. Hace tres cosas en orden:

1. Busca un puerto TCP libre (un número de conexión disponible, como `8000` o `8132`).
2. Inicia el servidor FastAPI en un **hilo daemon** (un proceso paralelo en segundo plano que se cierra automáticamente cuando se cierra la ventana).
3. Espera a que el servidor esté listo y abre la ventana pywebview.

**Funciones principales:**

```
find_free_port() → int
```
Abre un socket temporal, le pide al sistema operativo un puerto libre y lo devuelve. No recibe parámetros.

```
healthcheck(url: str) → None
```
Parámetros:
- `url`: la URL donde debería estar escuchando el servidor (ej. `http://127.0.0.1:8000`)

Hace un bucle que intenta conectarse cada 0.1 segundos, esperando hasta 30 segundos. Si el servidor no responde en ese tiempo lanza una excepción. Sirve para no abrir la ventana antes de que el servidor esté listo.

```
start_server(port: int) → None
```
Parámetros:
- `port`: el número de puerto donde correrá el servidor

Configura e inicia uvicorn con la app FastAPI. Se corre en un hilo separado para no bloquear el resto del programa.

**Clase `DesktopApi`:**

Se expone al JavaScript del WebView mediante `js_api`. Permite que el frontend llame funciones Python directamente desde el navegador. Actualmente implementa:

```
DesktopApi.download_template() → None
```
Descarga la plantilla Excel desde el servidor Python y la guarda en `~/Downloads/`. Existe porque WebView2 bloquea las descargas de archivos generadas por JavaScript; esta función las hace desde Python para evitar esa limitación.

---

### `backend/pyproject.toml` — Dependencias del proyecto

Declara qué librerías externas necesita el backend y sus versiones mínimas. Cuando alguien hace `pip install -e .` desde la carpeta `backend/`, Python instala todo lo que está listado aquí.

También configura pytest: le dice que los tests están en la carpeta `tests/`.

---

### `backend/alembic/` y `alembic.ini` — Migraciones de base de datos

Cuando cambia el esquema de la base de datos (se agrega una columna, por ejemplo), no se puede simplemente cambiar el modelo Python porque la base de datos existente ya tiene filas sin esa columna. Alembic resuelve esto guardando los cambios como "migraciones".

- `alembic.ini`: configuración general, principalmente la URL de conexión a la base de datos.
- `alembic/versions/`: cada archivo es una migración. Tiene una función `upgrade()` que aplica el cambio y una función `downgrade()` que lo revierte.
- `alembic/env.py`: conecta Alembic con los modelos SQLAlchemy del proyecto.

Comando para aplicar todas las migraciones pendientes: `alembic upgrade head`

---

### `backend/app/main.py` — La aplicación FastAPI

Es el núcleo del servidor. Define la app FastAPI y todo lo que sucede al iniciarse.

**Función `lifespan(app)`:**

FastAPI la llama automáticamente al iniciar. Hace dos cosas:
1. `Base.metadata.create_all(bind=engine)` — crea todas las tablas que no existen todavía.
2. `_apply_schema_patches(db)` — agrega columnas nuevas a bases de datos antiguas que pueden no tenerlas (para compatibilidad con instalaciones previas).

**Función `_apply_schema_patches(db: Session)`:**

Parámetros:
- `db`: la sesión de base de datos activa

Ejecuta comandos SQL directamente para agregar columnas que el sistema de migraciones puede no haber aplicado todavía. Garantiza que la base de datos tiene las columnas mínimas necesarias aunque venga de una versión anterior de la app.

**Configuración de CORS:**

CORS (Cross-Origin Resource Sharing) es un mecanismo de seguridad del navegador que bloquea peticiones entre dominios distintos. Como el frontend en desarrollo corre en `:5173` y el backend en `:8000`, se configuran orígenes permitidos para que funcionen juntos.

**Montaje del frontend estático:**

Si existe la carpeta `frontend/dist/` (creada al compilar el frontend), FastAPI la sirve como archivos estáticos. Así en producción no se necesita un servidor Vite separado: FastAPI sirve tanto la API como el HTML/JS/CSS del frontend.

---

### `backend/app/config.py` — Configuración según el entorno

Detecta si la app corre como ejecutable compilado o en modo desarrollo. La diferencia clave es dónde busca los archivos.

**Función `get_data_dir() → Path`:**

No recibe parámetros. Devuelve la carpeta donde se guarda la base de datos:
- Si `sys.frozen` es `True` (estamos en el `.exe`): `%APPDATA%/AcademicTracker/`
- Si no (estamos en desarrollo): `backend/data/`

**Función `get_database_url() → str`:**

No recibe parámetros. Devuelve la URL de conexión a SQLite para SQLAlchemy, por ejemplo `sqlite:///C:/Users/.../academic_tracker.db`.

**Función `get_frontend_dist_path() → Path | None`:**

No recibe parámetros. Devuelve la ruta a `frontend/dist/` si existe, o `None` si no. FastAPI usa este valor para decidir si sirve el frontend estático.

---

### `backend/app/db.py` — Conexión a la base de datos

Configura SQLAlchemy para conectarse a SQLite y define las herramientas que el resto del código usa para hablar con la base de datos.

**`engine`:**

El "motor" de SQLAlchemy. Es la conexión real a la base de datos SQLite. Todo pasa por acá.

**`Base`:**

Clase base de la que heredan todos los modelos (tablas). Cuando se hace `class Materia(Base)`, SQLAlchemy sabe que `Materia` es una tabla.

**Función `get_db()`:**

Es un generador que FastAPI usa como dependencia inyectable. Cuando un endpoint declara `db: Session = Depends(get_db)`, FastAPI llama a esta función, obtiene una sesión de base de datos, se la pasa al endpoint y la cierra automáticamente al terminar.

Esto garantiza que cada petición HTTP tiene su propia sesión y que la sesión siempre se cierra aunque haya un error.

---

### `backend/app/models/` — Tablas de la base de datos

Cada archivo define una tabla usando la sintaxis moderna de SQLAlchemy 2.0. Las columnas se declaran con anotaciones de tipo `Mapped[tipo]`.

Las relaciones entre tablas se declaran con `relationship()`, que permite navegar de un objeto a sus relacionados (ej. `materia.evaluaciones` devuelve la lista de evaluaciones de esa materia). El parámetro `cascade="all, delete-orphan"` hace que al borrar una materia se borren también todas sus evaluaciones automáticamente.

**Jerarquía de modelos:**

```
Carrera  →  Semestre  →  Materia  →  Evaluacion
                                  →  Clase
                                  →  ConfigAsistencia
                                  →  Correlatividad
```

---

### `backend/app/schemas/` — Validación de datos de entrada y salida

Cada recurso tiene schemas Pydantic que definen exactamente qué datos acepta y cuáles devuelve.

- `*Create`: campos que el frontend debe enviar para crear un registro.
- `*Read`: campos que el backend devuelve al consultar (incluye el `id` generado).
- `*Update`: campos opcionales que el frontend puede enviar para modificar un registro existente.

Si el frontend manda un tipo incorrecto (texto donde se espera número, etc.), Pydantic devuelve automáticamente un error 422 con el detalle del campo inválido.

---

### `backend/app/api/` — Los endpoints HTTP

Cada archivo define un "router" FastAPI con las rutas de un recurso. Todos se registran en `router.py` bajo el prefijo `/api`.

#### `carreras.py` — `/api/carreras`

CRUD completo: listar, crear, obtener por ID, actualizar y eliminar carreras.

Al eliminar una carrera (`DELETE /api/carreras/{id}`), SQLAlchemy borra en cascada todos los semestres, materias, evaluaciones y demás datos asociados, gracias al `cascade` definido en los modelos.

#### `semestres.py` — `/api/semestres`

CRUD de semestres. Acepta `carrera_id` como parámetro de filtro.

#### `materias.py` — `/api/materias`

CRUD de materias. Acepta tres filtros opcionales:
- `carrera_id`: filtra por carrera (requiere un JOIN con la tabla semestres porque la materia no tiene el `carrera_id` directamente).
- `semestre_id`: filtra por semestre específico.
- `estado`: filtra por estado (`cursando`, `aprobada`, `pendiente`, etc.).

#### `evaluaciones.py` — `/api/evaluaciones`

CRUD de evaluaciones. Acepta:
- `carrera_id`: requiere doble JOIN (evaluacion → materia → semestre).
- `materia_id`: filtra evaluaciones de una sola materia.

#### `correlativas.py` — `/api/correlatividades`

Gestiona las correlatividades (qué materias son requisito previo de otras). Acepta `carrera_id` como filtro.

#### `cronograma.py` — `/api/cronograma`

Devuelve las clases que tienen horario definido (día de la semana y hora), para armar la grilla semanal del CronogramaPage. Acepta `carrera_id` como filtro.

#### `plan.py` — `/api/plan/setup`

Crea una carrera completa en una sola operación: recibe el nombre de la carrera, la lista de semestres con sus materias y las correlativas, y los crea todos de una vez. Lo usa el wizard de "Nueva carrera".

**Schema `PlanSetup`:**

```
PlanSetup:
  nombre: str            — nombre de la carrera
  duracion_anios: int    — cuántos años dura
  inicio_anio: int       — año de inicio
  materias: list[MateriaSetup]  — materias por semestre
  correlativas: list[CorrelativaSetup]  — relaciones entre materias

MateriaSetup:
  nombre: str       — nombre de la materia
  semestre_idx: int — índice del semestre (0 = primer semestre)

CorrelativaSetup:
  materia_idx: int   — índice de la materia que requiere un prerequisito
  requiere_idx: int  — índice de la materia que es el prerequisito
```

**Función `setup_plan(body: PlanSetup, db: Session)`:**

Llama a `_do_setup()` envuelto en un try/except para devolver el traceback completo en el campo `detail` si algo falla, facilitando el diagnóstico de errores.

#### `analytics.py` — `/api/analytics/promedios`

Calcula y devuelve los promedios de la carrera seleccionada. Solo acepta `carrera_id` como parámetro.

#### `importer.py` — `/api/import`

Tres rutas:
- `POST /api/import/excel` — recibe un archivo Excel y lo importa.
- `POST /api/import/plan` — recibe un JSON con el plan de carrera y lo importa.
- `GET /api/import/template` — devuelve la plantilla Excel con las hojas y columnas esperadas.

---

### `backend/app/services/base.py` — Helpers CRUD genéricos

Funciones reutilizables que realizan operaciones básicas sobre cualquier modelo SQLAlchemy. Los routers las usan para no repetir la misma lógica en cada endpoint.

**`get_all(db, model, **filters) → list`:**

Parámetros:
- `db`: sesión de base de datos
- `model`: la clase del modelo (ej. `Materia`)
- `**filters`: pares clave-valor para filtrar (ej. `semestre_id=3`)

Devuelve todos los registros del modelo que coincidan con los filtros.

**`get_by_id(db, model, id) → objeto | None`:**

Parámetros:
- `db`: sesión de base de datos
- `model`: clase del modelo
- `id`: el ID a buscar

Devuelve el registro con ese ID o `None` si no existe. Si el router recibe `None`, devuelve un error 404.

**`create(db, model, data: dict) → objeto`:**

Parámetros:
- `db`: sesión de base de datos
- `model`: clase del modelo
- `data`: diccionario con los campos y valores del nuevo registro

Crea el registro, lo guarda en la base de datos y lo devuelve con su nuevo `id`.

**`update(db, obj, data: dict) → objeto`:**

Parámetros:
- `db`: sesión de base de datos
- `obj`: el objeto existente a modificar
- `data`: diccionario con solo los campos que cambian

Actualiza únicamente los campos que vienen en `data` (si un campo no viene, no se toca).

**`delete(db, obj) → None`:**

Parámetros:
- `db`: sesión de base de datos
- `obj`: el objeto a eliminar

Borra el registro de la base de datos.

---

### `backend/app/services/analytics.py` — Cálculos de promedios

Calcula los promedios ponderados de las evaluaciones. Un promedio ponderado tiene en cuenta el "peso" de cada evaluación: un parcial que vale el 40% del total contribuye más al promedio que un TP que vale el 10%.

**Función `_promedio_ponderado(notas: list[tuple[float, float]]) → float | None`:**

Parámetros:
- `notas`: lista de pares `(nota, peso)`. Por ejemplo `[(8.0, 40), (6.0, 60)]`.

Calcula `suma(nota × peso) / suma(pesos)`. Si no hay notas devuelve `None`.

**Función `promedios_completos(db: Session, carrera_id: int) → dict`:**

Parámetros:
- `db`: sesión de base de datos
- `carrera_id`: ID de la carrera a analizar

Es la función principal que usan los endpoints. Devuelve un diccionario con:
- `promedio_general_con_aplazos`: promedio de todas las materias incluyendo aplazos (nota 0 para materias reprobadas)
- `promedio_general_sin_aplazos`: solo considera las materias con nota aprobatoria
- `aprobadas`, `cursando`, `pendientes`, `total_materias`: contadores de estado
- `semestres`: lista de promedios desglosados por semestre, cada uno con sus materias y sus promedios individuales

---

### `backend/app/services/importer.py` — Importación desde Excel

Procesa archivos Excel con openpyxl. El Excel tiene hojas con nombres específicos (`Carreras`, `Semestres`, `Materias`, `Evaluaciones`, `Clases`, `Asistencia`). Cada hoja tiene columnas con nombres en la primera fila.

**Función `process_import(file_bytes: bytes, db: Session) → dict`:**

Parámetros:
- `file_bytes`: el contenido del archivo Excel en bytes (tal como lo sube el usuario)
- `db`: sesión de base de datos

Lee el archivo en memoria con `openpyxl.load_workbook()` y procesa cada hoja disponible en orden. Devuelve un resumen con cuántos registros se crearon, actualizaron o fallaron en cada hoja.

**Función `import_plan_json(data: dict, db: Session) → dict`:**

Parámetros:
- `data`: diccionario con el plan de carrera en formato JSON (campos: `carrera`, `semestres`, `correlativas`)
- `db`: sesión de base de datos

Crea la carrera, sus semestres y sus materias a partir del JSON. Las correlatividades se crean solo si ambas materias existen en el plan.

---

### `backend/tests/` — Tests automáticos

**`conftest.py`:**

Define un "fixture" de pytest llamado `client`. Un fixture es una función que pytest ejecuta antes de cada test para preparar el entorno. Este fixture:
1. Crea una base de datos SQLite en memoria (`:memory:`) — no toca el archivo de datos real.
2. Crea todas las tablas en esa base de datos.
3. Crea un cliente HTTP de prueba (`TestClient` de FastAPI/httpx) que se conecta a la app usando esa base de datos.
4. Al terminar el test, descarta todo — cada test empieza con una base de datos limpia.

**`test_api.py`:**

Tests de integración: hacen peticiones HTTP reales al servidor (usando el cliente del fixture) y verifican que las respuestas sean correctas.

**`test_models.py`:**

Tests de los modelos SQLAlchemy: verifican que las relaciones, cascadas y constraints de la base de datos funcionen bien.

**`test_importer.py`:**

Tests del importador de Excel: crean un Excel en memoria, lo pasan al importador y verifican que los datos queden correctamente en la base de datos.

---

## Flujo de una petición típica

```
1. El usuario abre "Materias" en el frontend

2. El hook useMaterias() llama a:
   GET /api/materias?carrera_id=1

3. FastAPI recibe la petición en materias.py:
   - Valida el parámetro carrera_id con Pydantic
   - Llama a get_db() para obtener una sesión de base de datos

4. materias.py construye la consulta SQLAlchemy:
   - Hace JOIN con semestres para filtrar por carrera_id
   - Devuelve la lista de materias

5. SQLAlchemy ejecuta el SQL en SQLite

6. El resultado se serializa como JSON con el schema MateriaRead

7. FastAPI devuelve la respuesta HTTP 200 con el JSON

8. El frontend muestra las materias en pantalla
```
