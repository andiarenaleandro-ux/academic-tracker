# Arquitectura del proyecto

Academic Tracker es una aplicación de escritorio para Windows construida con **FastAPI** en el backend y **React** en el frontend. Corre como un proceso local: el backend levanta un servidor HTTP en un puerto libre y el frontend se sirve desde ese mismo servidor como archivos estáticos. La ventana de la app es un WebView2 (via `pywebview`) que apunta a `localhost`.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Python 3.13, FastAPI, SQLAlchemy 2.0, SQLite, Alembic |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Radix UI, TanStack Query |
| Desktop | PyInstaller (`--onedir`), pywebview / WebView2 |

---

## Estructura de carpetas

```
Academic_Tracker_ISSD/
├── assets/                  # Recursos del ejecutable
├── backend/                 # Todo el código Python
│   ├── alembic/             # Migraciones de base de datos
│   ├── app/                 # Aplicación FastAPI
│   │   ├── api/             # Routers HTTP por recurso
│   │   ├── models/          # Modelos SQLAlchemy (tablas)
│   │   ├── schemas/         # Schemas Pydantic (validación)
│   │   └── services/        # Lógica de negocio y helpers
│   └── tests/               # Tests automáticos (pytest)
├── docs/                    # Documentación del proyecto
├── frontend/                # Todo el código TypeScript/React
│   └── src/
│       ├── components/      # Componentes reutilizables
│       ├── context/         # Estado global (React Context)
│       ├── hooks/           # Hooks de acceso a datos
│       ├── lib/             # Utilidades (cliente HTTP)
│       └── pages/           # Páginas de la aplicación
├── build_desktop.ps1        # Script de build del ejecutable
└── academic-tracker.spec    # Configuración de PyInstaller
```

---

## Raíz del proyecto

| Archivo | Función |
|---|---|
| `package.json` | Scripts npm que corren backend y frontend en paralelo: `npm run dev` levanta ambos, `npm test` corre pytest |
| `build_desktop.ps1` | Script PowerShell de build end-to-end: compila el frontend con Vite, luego empaqueta todo con PyInstaller generando `dist/AcademicTracker/AcademicTracker.exe` |
| `academic-tracker.spec` | Configuración de PyInstaller: define qué archivos incluir en el bundle (`frontend/dist/`, `alembic/`), el entry point (`backend/desktop.py`) y el modo `--onedir` |
| `assets/icon.ico` | Ícono del ejecutable de Windows |
| `CLAUDE.md` | Instrucciones y contexto para Claude Code al trabajar en este repositorio |

---

## Backend (`backend/`)

### `desktop.py`

Entry point del ejecutable. Al iniciarse:
1. Busca un puerto TCP libre en el sistema
2. Lanza el servidor uvicorn en un hilo daemon (en segundo plano)
3. Abre una ventana pywebview que apunta a `http://localhost:<puerto>`

También define la clase `DesktopApi`, que se expone al JavaScript del WebView mediante `js_api`. Actualmente implementa `download_template()`: descarga la plantilla Excel desde el backend Python y la guarda en `~/Downloads/`, resolviendo la limitación de WebView2 que bloquea las descargas programáticas desde JavaScript.

### `pyproject.toml`

Declara las dependencias Python del proyecto (FastAPI, SQLAlchemy, openpyxl, etc.) y la configuración de pytest para los tests.

### `alembic/` y `alembic.ini`

Sistema de migraciones de base de datos. Cada migración es un archivo en `alembic/versions/` que describe cómo evolucionar el esquema (agregar columnas, tablas, etc.) sin perder datos existentes. Se ejecuta con `alembic upgrade head`.

---

### `backend/app/` — La aplicación FastAPI

#### `main.py`

Punto de entrada de FastAPI. Se encarga de:
- Crear la instancia de la app con su configuración (CORS, docs solo en dev)
- Registrar todos los routers bajo el prefijo `/api`
- Servir el frontend React como archivos estáticos cuando existe `frontend/dist/` (modo producción)
- En el evento de startup (`lifespan`): crear las tablas con `Base.metadata.create_all` y aplicar parches de esquema para bases de datos existentes que pueden faltar columnas nuevas

#### `config.py`

Detecta si la app está corriendo como ejecutable compilado (`sys.frozen = True` en PyInstaller) o en modo desarrollo. Según esto, devuelve las rutas correctas para la base de datos y para el directorio del frontend:
- **Desarrollo**: `backend/data/academic_tracker.db`
- **Producción**: `%APPDATA%/AcademicTracker/academic_tracker.db`

#### `db.py`

Configura el engine de SQLAlchemy apuntando a SQLite, define la clase base `Base` de la que heredan todos los modelos, y expone `get_db()` como dependencia inyectable de FastAPI para obtener sesiones de base de datos.

---

### `backend/app/models/` — Modelos de base de datos

Definen las tablas usando la sintaxis moderna de SQLAlchemy 2.0 con anotaciones de tipo (`Mapped[]`). Los modelos forman una jerarquía con eliminación en cascada: al borrar una carrera se eliminan automáticamente todos sus datos asociados.

```
Carrera
  └── Semestre
        └── Materia
              ├── Evaluacion
              ├── Clase
              ├── ConfigAsistencia
              └── Correlatividad
```

| Modelo | Tabla | Contenido |
|---|---|---|
| `Carrera` | `carreras` | Nombre, escala de notas, nota de aprobación |
| `Semestre` | `semestres` | Número, año, fechas de inicio y fin |
| `Materia` | `materias` | Nombre, código, estado (cursando/aprobada/etc.), duración |
| `Evaluacion` | `evaluaciones` | Tipo, fecha, peso, nota obtenida, nota simulada |
| `Clase` | `clases` | Fecha, asistencia, tema, horario semanal |
| `ConfigAsistencia` | `config_asistencia` | Porcentaje mínimo de asistencia requerido |
| `Correlatividad` | `correlatividades` | Relación entre materias (requisito previo) |

---

### `backend/app/schemas/` — Validación de datos

Schemas Pydantic v2 organizados por recurso. Cada recurso generalmente tiene tres schemas:
- `*Create` — campos requeridos para crear un nuevo registro
- `*Read` — campos que se devuelven en las respuestas de la API
- `*Update` — campos opcionales para modificar un registro existente

---

### `backend/app/api/` — Endpoints HTTP

Cada archivo define un router FastAPI para un recurso. Todos se montan en `router.py` bajo el prefijo `/api`.

| Archivo | Prefijo | Función |
|---|---|---|
| `carreras.py` | `/api/carreras` | CRUD de carreras |
| `semestres.py` | `/api/semestres` | CRUD de semestres; filtra por `carrera_id` |
| `materias.py` | `/api/materias` | CRUD de materias; filtra por `carrera_id`, `semestre_id`, `estado` |
| `evaluaciones.py` | `/api/evaluaciones` | CRUD de evaluaciones; filtra por `carrera_id`, `materia_id` |
| `clases.py` | `/api/clases` | CRUD de clases; filtra por `materia_id` |
| `correlativas.py` | `/api/correlatividades` | Gestión de correlativas; filtra por `carrera_id` |
| `cronograma.py` | `/api/cronograma` | Devuelve clases con horario para armar la grilla semanal; filtra por `carrera_id` |
| `analytics.py` | `/api/analytics/promedios` | Calcula promedios ponderados por materia, semestre y carrera |
| `plan.py` | `/api/plan/setup` | Crea una carrera completa (semestres + materias + correlativas) en una sola operación; lo usa el wizard |
| `importer.py` | `/api/import` | Importa materias y evaluaciones desde un archivo Excel; genera la plantilla descargable |
| `config_asistencia.py` | `/api/materias/{id}/asistencia` | Configuración de asistencia por materia |

---

### `backend/app/services/` — Lógica de negocio

| Archivo | Función |
|---|---|
| `base.py` | Helpers CRUD genéricos (`get_all`, `get_by_id`, `create`, `update`, `delete`) que operan sobre cualquier modelo SQLAlchemy |
| `analytics.py` | Calcula promedios ponderados por peso de evaluación, agrupa por semestre, y computa estadísticas globales de la carrera (aprobadas, cursando, pendientes) |
| `importer.py` | Lee archivos Excel con openpyxl e importa materias y evaluaciones; también lee planes de carrera en formato JSON |

---

### `backend/tests/`

Tests automáticos con pytest.

| Archivo | Contenido |
|---|---|
| `conftest.py` | Fixture que crea un cliente HTTP de prueba con una base de datos SQLite en memoria (`:memory:`), aislada por test |
| `test_api.py` | Tests de los endpoints HTTP (integración) |
| `test_models.py` | Tests de los modelos y sus relaciones |
| `test_importer.py` | Tests del importador de Excel |

---

## Frontend (`frontend/`)

### Archivos de configuración

| Archivo | Función |
|---|---|
| `index.html` | Shell HTML de la SPA; contiene el `<div id="root">` donde React monta la app |
| `vite.config.ts` | Configura el servidor de desarrollo: proxy de `/api` hacia `:8000` (el backend local) y alias `@` apuntando a `src/` |
| `tailwind.config.js` | Configuración de Tailwind CSS con los colores y variantes del proyecto |
| `tsconfig.json` | Configuración TypeScript con paths para el alias `@` |

---

### `frontend/src/` — Código fuente React

#### `main.tsx`

Punto de entrada de la aplicación React. Monta el componente raíz `<App>` dentro de `<QueryClientProvider>` de TanStack Query y `<BrowserRouter>` de React Router.

#### `App.tsx`

Define el árbol de rutas de la aplicación con React Router. Envuelve todo en `<CarreraProvider>` para que el contexto de carrera esté disponible globalmente. Contiene también el componente `Home`, la pantalla de bienvenida que se muestra al abrir la app.

#### `index.css`

Estilos globales: importa las directivas de Tailwind y define variables CSS base.

---

### `frontend/src/context/`

#### `CarreraContext.tsx`

Estado global de la carrera seleccionada. Es el centro del manejo multi-carrera:
- Fetcha la lista de todas las carreras al iniciar
- Persiste el `carreraId` activo en `localStorage` para recordarlo entre sesiones
- Cuando se cambia de carrera, invalida todas las queries de TanStack Query para forzar un refetch con el nuevo filtro
- Expone `useDeleteCarrera()`, un mutation hook que llama a `DELETE /api/carreras/{id}`

---

### `frontend/src/lib/`

#### `api.ts`

Cuatro funciones que envuelven `fetch` para comunicarse con el backend:
- `apiGet<T>(path)` — GET
- `apiPost<T>(path, body)` — POST con JSON; extrae el campo `detail` de errores HTTP para mostrar el mensaje del servidor
- `apiPatch<T>(path, body)` — PATCH con JSON
- `apiDelete(path)` — DELETE

La URL base es `/api`, que en desarrollo el proxy de Vite redirige a `:8000`, y en producción el mismo servidor FastAPI responde.

---

### `frontend/src/hooks/`

Un hook por recurso de datos, todos construidos sobre TanStack Query. El patrón es: el hook llama a `useCarreraContext()` para obtener el `carreraId` activo, lo incluye en el `queryKey` (para que el caché sea independiente por carrera) y lo pasa como `carrera_id` en los parámetros de la URL.

| Hook | Recurso | Nota |
|---|---|---|
| `useMaterias` / `useMateria` | Materias | Soporta filtros adicionales por `semestre_id` y `estado` |
| `useEvaluaciones` | Evaluaciones | Filtro opcional por `materia_id` |
| `useSemestres` | Semestres | Filtra por carrera activa |
| `useCorrelativas` | Correlatividades | Devuelve materias con sus requisitos previos |
| `useClases` / `useCronograma` | Clases | `useCronograma` devuelve solo clases con horario definido |
| `useAnalytics` | Promedios | Llama a `/analytics/promedios?carrera_id=...` |
| `useCarrera` | — | Re-exporta `useCarreraContext` para uso simplificado |

---

### `frontend/src/pages/`

Cada página es un componente React que combina hooks de datos con UI.

| Página | Ruta | Función |
|---|---|---|
| `DashboardPage` | `/dashboard` | Resumen general: barra de avance, promedios, contadores de estado, próximas evaluaciones y gráficos de barras por semestre |
| `MateriasPage` | `/materias` | Tabla de materias con filtros por semestre y estado; modal para agregar una materia nueva manualmente |
| `MateriaDetailPage` | `/materias/:id` | Vista de detalle de una materia: evaluaciones individuales (con notas), registro de clases y configuración de asistencia |
| `EvaluacionesPage` | `/evaluaciones` | Tabla de todas las evaluaciones con filtros por materia y año |
| `CronogramaPage` | `/cronograma` | Grilla semanal (lunes a domingo, 17:00 a 22:30) que muestra los horarios de clases como bloques de color |
| `PlanPage` | `/plan` | Vista tipo kanban con columnas por semestre; al hacer clic en una materia resalta sus correlativas y dependencias |
| `CorrelativasPage` | `/correlativas` | Cards agrupadas por semestre que muestran los requisitos previos de cada materia y su estado de aprobación |
| `NuevaCarreraPage` | `/nueva-carrera` | Wizard de 3 pasos: (1) nombre y año de inicio, (2) cantidad de semestres y materias, (3) correlativas entre materias |
| `ImportPage` | `/import` | Descarga de plantilla Excel e importación de datos; en modo desktop usa `window.pywebview.api.download_template()` para guardar el archivo |

---

### `frontend/src/components/`

#### `layout/`

| Componente | Función |
|---|---|
| `Layout.tsx` | Wrapper que combina el `Sidebar` con el área de contenido principal; todas las páginas con navegación lo usan |
| `Sidebar.tsx` | Barra lateral con: logo/nombre de la app, selector desplegable de carrera activa, enlaces de navegación, botón "Nueva carrera" y opción de eliminar la carrera actual (con confirmación inline) |

#### `ui/`

Componentes de interfaz genéricos construidos sobre Radix UI y estilizados con Tailwind. Siguen el patrón shadcn/ui: cada componente es un archivo independiente que se puede copiar y modificar.

| Componente | Función |
|---|---|
| `Button` | Botón con variantes (`default`, `ghost`) |
| `Card` / `CardContent` | Contenedor con borde y fondo |
| `Dialog` / `DialogHeader` | Modal accesible |
| `Badge` | Etiqueta de estado con color según valor |
| `Table` / `THead` / `TBody` / `Th` / `Td` | Tabla con estilos consistentes |
| `Input` | Campo de texto |
| `Label` | Etiqueta de formulario |
| `Select` | Selector desplegable |
| `Tabs` | Pestañas |

---

## Flujo de datos

```
Usuario interactúa con una Page
  → Page llama a un Hook (ej: useMaterias)
    → Hook lee carreraId de CarreraContext
    → Hook llama a apiGet("/materias?carrera_id=X") via TanStack Query
      → FastAPI recibe GET /api/materias?carrera_id=X
        → Router materias.py filtra con JOIN a semestres
          → SQLAlchemy consulta SQLite
            → Resultado sube de vuelta hasta el componente
```

Al cambiar de carrera en el Sidebar, `setCarreraId()` actualiza el contexto y llama a `queryClient.invalidateQueries()`, lo que hace que todos los hooks recarguen sus datos filtrando por la nueva carrera.

---

## Modos de ejecución

### Desarrollo
```bash
npm run dev
```
Levanta el backend con uvicorn en `:8000` (con hot-reload) y el frontend con Vite en `:5173`. Vite proxea `/api` al backend. La base de datos se crea en `backend/data/`.

### Producción (ejecutable)
```powershell
.\build_desktop.ps1
```
1. Compila el frontend con `vite build` → genera `frontend/dist/`
2. Empaqueta todo con PyInstaller → genera `dist/AcademicTracker/AcademicTracker.exe`

Al ejecutar el `.exe`, `desktop.py` toma el control: levanta FastAPI (que sirve el frontend estático desde `frontend/dist/`) y abre la ventana pywebview. La base de datos vive en `%APPDATA%/AcademicTracker/` para persistir entre actualizaciones del ejecutable.
