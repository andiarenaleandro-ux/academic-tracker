# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos esenciales

```bash
# Instalar dependencias (primera vez)
npm run install:all          # pip install -e . en backend + npm install en frontend

# Desarrollo
npm run dev                  # Backend en :8000 + Frontend en :5173 (concurrently)

# Tests
npm test                     # pytest en backend
cd backend && pytest tests/test_api.py  # un archivo específico
cd backend && pytest tests/test_api.py::test_nombre  # un test específico

# Build frontend para producción
npm run build

# Migraciones de base de datos (ejecutar desde backend/)
alembic upgrade head
alembic revision --autogenerate -m "descripción del cambio"
```

## Arquitectura

**Stack**: FastAPI + SQLAlchemy 2 + SQLite | React 19 + Vite + TypeScript + Radix UI (shadcn pattern) + TanStack Query

### Backend (`backend/`)

- `app/main.py` — FastAPI app; monta el frontend estático si existe `frontend/dist/`
- `app/config.py` — Controla rutas de datos y detección de modo empaquetado (`sys.frozen`); en producción usa `%APPDATA%/AcademicTracker/`
- `app/db.py` — Engine SQLAlchemy, `Base`, `get_db()` como dependencia de FastAPI
- `app/models/` — Modelos SQLAlchemy con `Mapped[]` (estilo 2.0). Jerarquía: `Carrera → Semestre → Materia → Evaluacion / Clase / ConfigAsistencia`
- `app/schemas/` — Pydantic v2 schemas (request/response por recurso)
- `app/api/` — Routers por recurso, todos montados en `api/router.py` bajo `/api`
- `app/services/base.py` — Helpers CRUD genéricos (`get_all`, `get_by_id`, `create`, `update`, `delete`)
- `app/services/analytics.py` — Cálculo de promedios ponderados y estadísticas de carrera
- `app/services/importer.py` — Importación desde Excel (openpyxl) y desde JSON (plan de carrera)
- `desktop.py` — Entry point para modo escritorio: lanza uvicorn en hilo daemon + ventana pywebview

**Estado de Materia**: los valores válidos son `cursando`, `aprobada`, `recursando`, `libre`, `pendiente` (hay un `CheckConstraint` en el modelo).

### Frontend (`frontend/src/`)

- `lib/api.ts` — Wrappers `apiGet/apiPost/apiPatch/apiDelete` que apuntan a `/api` (Vite proxea a `:8000` en dev)
- `hooks/` — Custom hooks por recurso usando TanStack Query (ej. `useMaterias`, `useEvaluaciones`)
- `pages/` — Páginas completas: Dashboard, Materias, MateriaDetail, Evaluaciones, Cronograma, Plan, Correlativas, Import
- `components/ui/` — Componentes Radix UI estilizados con Tailwind (patrón shadcn/ui)
- `components/layout/` — `Layout` + `Sidebar`
- Alias `@` apunta a `frontend/src/`

### Modo desktop vs dev

`sys.frozen` (True cuando empaquetado con PyInstaller) cambia:
- La ruta de datos (dev: `backend/data/`, prod: `%APPDATA%/AcademicTracker/`)
- Si FastAPI sirve el frontend estático
- Si `/docs` y `/redoc` están disponibles (solo en dev)

### Base de datos

SQLite en `backend/data/academic_tracker.db` (dev) o `%APPDATA%/AcademicTracker/academic_tracker.db` (prod). Las tablas se crean al inicio con `Base.metadata.create_all` además de Alembic para migraciones. Los tests usan SQLite en memoria (`:memory:`).

## Build de escritorio (Windows)

Genera `dist/AcademicTracker/AcademicTracker.exe` (modo `--onedir`): carpeta autocontenida, sin Python requerido en la máquina destino.

```powershell
# Desde la raíz del repo (PowerShell)
.\build_desktop.ps1
```

El script hace en orden: build del frontend React → verifica `pywebview`/`pyinstaller` → corre PyInstaller con `academic-tracker.spec`.

**Requisitos previos una sola vez:**
```powershell
pip install pywebview pyinstaller
```

**Archivos clave del empaquetado:**
- `academic-tracker.spec` — spec PyInstaller `--onedir`; incluye `frontend/dist/` y `backend/alembic/` completos
- `build_desktop.ps1` — script de build end-to-end
- `backend/desktop.py` — entry point: encuentra puerto libre, lanza uvicorn en thread daemon, abre ventana pywebview
- `assets/icon.ico` — ícono del ejecutable

**La DB vive fuera del bundle** en `%APPDATA%/AcademicTracker/academic_tracker.db` — los datos persisten entre rebuilds.
