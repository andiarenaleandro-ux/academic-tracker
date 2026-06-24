# Guía de desarrollo

Esta guía explica cómo preparar el entorno desde cero, correr la aplicación en modo desarrollo, ejecutar tests y hacer cambios al esquema de la base de datos.

---

## Requisitos previos

Antes de empezar necesitás tener instalado:

| Herramienta | Versión mínima | Para qué se usa |
|---|---|---|
| Python | 3.11 | Correr el backend FastAPI |
| Node.js | 18 | Correr y compilar el frontend React |
| npm | 9 | Gestionar paquetes del frontend |
| Git | cualquiera | Control de versiones |

Para verificar que estén instalados:

```powershell
python --version    # ej: Python 3.13.0
node --version      # ej: v22.0.0
npm --version       # ej: 10.0.0
git --version
```

---

## Instalación inicial (una sola vez)

### 1. Clonar el repositorio

```powershell
git clone <URL-del-repo>
cd Academic_Tracker_ISSD
```

### 2. Instalar todas las dependencias

Desde la raíz del proyecto:

```powershell
npm run install:all
```

Ese comando está definido en el `package.json` raíz y hace dos cosas en secuencia:
1. `cd backend && pip install -e .` — instala las dependencias Python listadas en `backend/pyproject.toml` (FastAPI, SQLAlchemy, uvicorn, etc.)
2. `cd frontend && npm install` — instala los paquetes Node listados en `frontend/package.json` (React, Vite, Tailwind, etc.)

El flag `-e` en `pip install -e .` instala el paquete en modo "editable": Python puede importar el código directamente desde la carpeta `backend/app/` sin hacer una copia, lo que es ideal para desarrollo.

---

## Correr la aplicación en modo desarrollo

```powershell
npm run dev
```

Esto levanta **dos servidores al mismo tiempo** usando la librería `concurrently`:

| Servidor | Puerto | Qué hace |
|---|---|---|
| Backend (uvicorn) | `:8000` | FastAPI con hot-reload: detecta cambios en `.py` y se reinicia solo |
| Frontend (Vite) | `:5173` | Servidor de desarrollo de React con recarga instantánea al guardar |

Abrí el navegador en `http://localhost:5173`. Las peticiones a `/api/...` que hace el frontend se redirigen automáticamente a `:8000` gracias al proxy configurado en `vite.config.ts`.

Para detener ambos servidores: `Ctrl + C`.

---

## Estructura de archivos de datos en desarrollo

La base de datos SQLite se crea automáticamente la primera vez que corrés `npm run dev`:

```
backend/
  data/
    academic_tracker.db    ← la base de datos (creada al iniciar)
```

Si querés empezar con una base de datos limpia, simplemente borrá ese archivo y la próxima vez que inicie el backend lo crea de nuevo vacío.

---

## Documentación interactiva de la API

Con el backend corriendo, la documentación autogenerada por FastAPI está disponible en:

- `http://localhost:8000/docs` — Swagger UI (podés probar todos los endpoints desde el navegador)
- `http://localhost:8000/redoc` — ReDoc (versión de solo lectura más legible)

Esta documentación solo está disponible en modo desarrollo, no en el ejecutable.

---

## Ejecutar los tests

### Todos los tests del backend

```powershell
npm test
```

O equivalentemente:

```powershell
cd backend
pytest
```

### Un archivo de tests específico

```powershell
cd backend
pytest tests/test_api.py
```

### Un test específico por nombre

```powershell
cd backend
pytest tests/test_api.py::test_create_carrera
```

### Ver output detallado

```powershell
cd backend
pytest -v
```

### Cómo funcionan los tests

Los tests usan una **base de datos SQLite en memoria** (`:memory:`), definida en `backend/tests/conftest.py`. Esto significa:
- Cada test empieza con una base de datos vacía y limpia.
- No tocan la base de datos real de desarrollo.
- Son muy rápidos (sin disco).

El fixture `db_session` crea el motor SQLite, crea todas las tablas, devuelve la sesión al test y la cierra al terminar.

---

## Migraciones de base de datos

Las migraciones son la forma de modificar el esquema de la base de datos (agregar columnas, crear tablas) sin perder los datos existentes.

### ¿Cuándo hacen falta?

- Cuando agregás una columna nueva a un modelo SQLAlchemy.
- Cuando creás una tabla nueva.
- Cuando cambiás un tipo de dato o una constraint.

### Aplicar migraciones pendientes

```powershell
cd backend
alembic upgrade head
```

`head` significa "la migración más reciente". Alembic compara el estado actual de la base de datos contra las migraciones y aplica solo las que faltan.

### Crear una nueva migración

Después de modificar un modelo en `backend/app/models/`:

```powershell
cd backend
alembic revision --autogenerate -m "descripcion del cambio"
```

Esto compara el esquema actual de la base de datos con los modelos SQLAlchemy y genera automáticamente un archivo en `backend/alembic/versions/` con las instrucciones para aplicar (función `upgrade`) y revertir (función `downgrade`) el cambio.

**Importante**: siempre revisá el archivo generado antes de aplicarlo. `--autogenerate` detecta la mayoría de los cambios pero puede equivocarse en casos complejos (renombrar columnas, por ejemplo).

### Revertir la última migración

```powershell
cd backend
alembic downgrade -1
```

### Ver el historial de migraciones

```powershell
cd backend
alembic history
```

---

## Variables de entorno

El backend respeta estas variables de entorno opcionales:

| Variable | Efecto |
|---|---|
| `ACADEMIC_TRACKER_DATA_DIR` | Sobreescribe la carpeta donde se guarda la base de datos y los logs. Útil para pruebas con una base de datos separada. |
| `ACADEMIC_TRACKER_PORT` | Lo escribe `desktop.py` para que otros procesos sepan en qué puerto está el servidor. No se necesita setear manualmente. |

Ejemplo para apuntar a una base de datos de prueba:

```powershell
$env:ACADEMIC_TRACKER_DATA_DIR = "C:\temp\at_test"
cd backend
uvicorn app.main:app --reload --port 8000
```

---

## Build del ejecutable

Cuando los cambios están listos para distribuir:

```powershell
.\build_desktop.ps1
```

Ver `docs/build_exe.md` para el detalle completo del proceso.

---

## Flujo de trabajo típico para agregar una funcionalidad

1. **Modificar el modelo** si hace falta una columna nueva (`backend/app/models/`)
2. **Crear la migración**: `alembic revision --autogenerate -m "..."` y aplicarla: `alembic upgrade head`
3. **Agregar o modificar el schema Pydantic** (`backend/app/schemas/`)
4. **Agregar o modificar el endpoint** en el router correspondiente (`backend/app/api/`)
5. **Agregar o modificar el hook** en el frontend (`frontend/src/hooks/`)
6. **Modificar la página** que consume el hook (`frontend/src/pages/`)
7. **Correr los tests**: `npm test`
8. **Verificar en el navegador** con `npm run dev`

---

## Solución de problemas comunes

**El backend no levanta (error de importación)**

```
ModuleNotFoundError: No module named 'app'
```

Verificá que instalaste las dependencias del backend con `pip install -e .` desde la carpeta `backend/`. El flag `-e` es necesario para que Python encuentre el paquete `app`.

**El frontend no conecta con el backend**

Verificá que ambos servidores estén corriendo. El frontend en `:5173` necesita que el backend esté en `:8000` para que el proxy funcione. Si los dos están corriendo y sigue fallando, revisá que `vite.config.ts` apunte a `http://localhost:8000`.

**Error de migración al iniciar**

Si el backend tira error al crear tablas, puede que haya una inconsistencia entre el esquema de la base de datos y los modelos. Probá:

```powershell
cd backend
alembic upgrade head
```

O si querés empezar desde cero: borrá `backend/data/academic_tracker.db` y reiniciá el backend.

**Puerto 8000 ya está en uso**

```
ERROR: [Errno 10048] error while attempting to bind on address ('127.0.0.1', 8000)
```

Otro proceso está usando el puerto 8000. Podés cambiar el puerto:

```powershell
cd backend
uvicorn app.main:app --reload --port 8001
```

Y en `vite.config.ts` actualizar el target del proxy a `http://localhost:8001`.
