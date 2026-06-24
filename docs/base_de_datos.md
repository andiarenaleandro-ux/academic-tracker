# Base de datos

Este documento describe el esquema completo de la base de datos de Academic Tracker: las tablas, sus columnas, los tipos de datos, las restricciones y las relaciones entre ellas.

---

## Motor de base de datos

Se usa **SQLite**: una base de datos que guarda todo en un único archivo `.db`. No requiere instalar ningún servidor externo. Es ideal para aplicaciones de escritorio donde hay un solo usuario y no hace falta acceso concurrente masivo.

| Entorno | Ruta del archivo |
|---|---|
| Desarrollo | `backend/data/academic_tracker.db` |
| Producción (exe) | `%APPDATA%\AcademicTracker\academic_tracker.db` |

---

## Jerarquía de datos

Las tablas tienen una jerarquía de padre-hijo. Al borrar un registro padre, todos sus hijos se borran automáticamente en cascada (gracias a `cascade="all, delete-orphan"` en SQLAlchemy):

```
carreras
  └── semestres
        └── materias
              ├── evaluaciones
              ├── clases
              ├── config_asistencia
              └── correlatividades
```

---

## Diagrama de relaciones

```
carreras (1) ──────────── (N) semestres
                                  │
                           (1) ──────── (N) materias
                                              │
                                    ┌─────────┼──────────┬──────────────┐
                                    │         │          │              │
                               (N) eval   (N) clases  (1) config   (N) correlatividades
                                                       asistencia    (materia_id → materias.id)
                                                                     (correlativa_id → materias.id)
```

---

## Tablas

### `carreras`

Representa una carrera universitaria o terciaria. Es el nivel raíz de toda la jerarquía.

| Columna | Tipo | Nulo | Default | Descripción |
|---|---|---|---|---|
| `id` | INTEGER | NO | autoincrement | Clave primaria |
| `nombre` | TEXT (200) | NO | — | Nombre de la carrera. Único en toda la tabla. |
| `escala_nota_min` | INTEGER | NO | `0` | Nota mínima posible en la escala de calificación |
| `escala_nota_max` | INTEGER | NO | `10` | Nota máxima posible en la escala |
| `nota_aprobacion` | REAL | NO | `4.0` | Nota mínima para aprobar una materia |

**Restricciones:**
- `nombre` tiene índice UNIQUE: no pueden existir dos carreras con el mismo nombre.

**Ejemplo de fila:**

```
id=1  nombre="Tecnicatura en Datos e IA"  escala_nota_min=0  escala_nota_max=10  nota_aprobacion=4.0
```

---

### `semestres`

Representa un semestre dentro de una carrera. Agrupa las materias que se cursan en ese período.

| Columna | Tipo | Nulo | Default | Descripción |
|---|---|---|---|---|
| `id` | INTEGER | NO | autoincrement | Clave primaria |
| `carrera_id` | INTEGER | NO | — | FK → `carreras.id` |
| `numero` | INTEGER | NO | — | Número de semestre dentro de la carrera (1, 2, 3...) |
| `anio` | INTEGER | NO | — | Año calendario en que se cursa |
| `fecha_inicio` | DATE | NO | — | Fecha de inicio del semestre (formato `YYYY-MM-DD`) |
| `fecha_fin` | DATE | NO | — | Fecha de fin del semestre |

**Restricciones:**
- Clave única compuesta: `(carrera_id, numero, anio)` — no pueden existir dos semestres con el mismo número y año dentro de la misma carrera.
- `carrera_id` tiene FK con eliminación en cascada.

**Ejemplo de fila:**

```
id=1  carrera_id=1  numero=1  anio=2026  fecha_inicio=2026-03-01  fecha_fin=2026-07-31
```

---

### `materias`

Representa una materia dentro de un semestre. Es la tabla central del sistema.

| Columna | Tipo | Nulo | Default | Descripción |
|---|---|---|---|---|
| `id` | INTEGER | NO | autoincrement | Clave primaria |
| `semestre_id` | INTEGER | NO | — | FK → `semestres.id` |
| `nombre` | TEXT (200) | NO | — | Nombre de la materia |
| `codigo` | TEXT (20) | SÍ | NULL | Código identificador (ej: `MAT1`) |
| `creditos` | INTEGER | SÍ | NULL | Cantidad de créditos que vale la materia |
| `profesor` | TEXT (200) | SÍ | NULL | Nombre del profesor |
| `estado` | TEXT (20) | NO | `cursando` | Estado actual de la materia |
| `duracion` | TEXT (20) | SÍ | NULL | Duración del cursado |

**Restricciones:**

`estado` solo acepta estos valores (CheckConstraint):
- `cursando` — actualmente en curso
- `aprobada` — materia aprobada
- `recursando` — se está volviendo a cursar
- `libre` — se rindió libre (sin cursado)
- `pendiente` — todavía no se empezó a cursar

`duracion` solo acepta estos valores o NULL:
- `anual`
- `cuatrimestral`
- `semestral`
- `bimestral`
- `trimestral`

**Ejemplo de fila:**

```
id=5  semestre_id=1  nombre="Matemática I"  codigo="MAT1"  creditos=6
      profesor="Prof. García"  estado="cursando"  duracion="cuatrimestral"
```

---

### `evaluaciones`

Representa una evaluación (parcial, TP, final, etc.) dentro de una materia.

| Columna | Tipo | Nulo | Default | Descripción |
|---|---|---|---|---|
| `id` | INTEGER | NO | autoincrement | Clave primaria |
| `materia_id` | INTEGER | NO | — | FK → `materias.id` (indexado) |
| `tipo` | TEXT (20) | NO | — | Tipo de evaluación |
| `fecha` | DATE | NO | — | Fecha de la evaluación (indexada) |
| `hora` | TIME | SÍ | NULL | Hora de la evaluación (`HH:MM:SS`) |
| `peso` | REAL | NO | `1.0` | Peso relativo en el promedio (0.0 a 1.0) |
| `nota_obtenida` | REAL | SÍ | NULL | Nota real obtenida. NULL = no rendida todavía |
| `nota_simulada` | REAL | SÍ | NULL | Nota hipotética para simular el promedio |
| `notas` | TEXT (500) | SÍ | NULL | Comentarios libres |

**Restricciones:**

`tipo` solo acepta (CheckConstraint):
- `parcial`
- `recuperatorio`
- `tp`
- `final`
- `coloquio`

**Comportamiento automático:** cuando se crea o actualiza una evaluación de tipo `final` con `nota_obtenida` distinta de NULL, el sistema marca automáticamente la materia como `aprobada`.

**Ejemplo de fila:**

```
id=1  materia_id=5  tipo="parcial"  fecha=2026-05-10  hora=19:00:00
      peso=0.4  nota_obtenida=7.5  nota_simulada=NULL  notas="Primer parcial"
```

---

### `clases`

Representa una clase o un horario semanal de una materia. Tiene dos usos:

1. **Registro de asistencia**: `fecha` + `asistio` + `tema` para registrar si el alumno fue a clase ese día.
2. **Horario semanal**: `dia_semana` + `hora_inicio` + `hora_fin` para armar el cronograma semanal.

| Columna | Tipo | Nulo | Default | Descripción |
|---|---|---|---|---|
| `id` | INTEGER | NO | autoincrement | Clave primaria |
| `materia_id` | INTEGER | NO | — | FK → `materias.id` (indexado) |
| `fecha` | DATE | SÍ | NULL | Fecha específica de la clase |
| `asistio` | BOOLEAN | NO | `false` | Si el alumno asistió a esa clase |
| `tema` | TEXT (200) | SÍ | NULL | Tema visto en la clase |
| `notas` | TEXT (500) | SÍ | NULL | Apuntes o comentarios |
| `dia_semana` | INTEGER | SÍ | NULL | Día de la semana (1=Lunes, 7=Domingo) |
| `hora_inicio` | TIME | SÍ | NULL | Hora de inicio del horario semanal |
| `hora_fin` | TIME | SÍ | NULL | Hora de fin del horario semanal |

**Nota:** el cronograma semanal solo consulta filas donde `dia_semana`, `hora_inicio` y `hora_fin` no son NULL.

**Ejemplo de fila (registro de asistencia):**

```
id=1  materia_id=5  fecha=2026-03-05  asistio=true  tema="Números reales"
      dia_semana=NULL  hora_inicio=NULL  hora_fin=NULL
```

**Ejemplo de fila (horario semanal):**

```
id=2  materia_id=5  fecha=NULL  asistio=false  tema=NULL
      dia_semana=2  hora_inicio=19:00:00  hora_fin=21:00:00
```

---

### `config_asistencia`

Configuración de asistencia mínima requerida para una materia. Relación uno a uno con `materias`.

| Columna | Tipo | Nulo | Default | Descripción |
|---|---|---|---|---|
| `materia_id` | INTEGER | NO | — | Clave primaria + FK → `materias.id` |
| `asistencia_minima_pct` | REAL | NO | `75.0` | Porcentaje mínimo de asistencia requerido |

**Nota:** `materia_id` es la clave primaria (no hay campo `id` separado). Eso garantiza que solo puede existir una configuración por materia.

**Ejemplo de fila:**

```
materia_id=5  asistencia_minima_pct=75.0
```

---

### `correlatividades`

Representa que una materia requiere tener aprobada otra como prerequisito.

| Columna | Tipo | Nulo | Default | Descripción |
|---|---|---|---|---|
| `id` | INTEGER | NO | autoincrement | Clave primaria |
| `materia_id` | INTEGER | NO | — | FK → `materias.id` — la materia que tiene el requisito |
| `correlativa_id` | INTEGER | NO | — | FK → `materias.id` — la materia que es requisito |
| `tipo` | TEXT (30) | NO | `""` | Tipo de correlatividad (generalmente vacío) |

**Cómo leer una fila:**

`materia_id=10, correlativa_id=5` significa: "para cursar la materia 10, hay que tener aprobada la materia 5".

**Nota:** ambas columnas apuntan a `materias.id` (dos foreign keys a la misma tabla). Por eso en el modelo se necesita `foreign_keys=[...]` para que SQLAlchemy sepa qué relación es cuál.

**Ejemplo de fila:**

```
id=1  materia_id=10  correlativa_id=5  tipo=""
→ "Para cursar Programación II (id=10), hay que tener aprobada Programación I (id=5)"
```

---

## Índices

Además de las claves primarias y únicas, hay índices secundarios para acelerar las consultas más frecuentes:

| Tabla | Columna indexada | Motivo |
|---|---|---|
| `evaluaciones` | `materia_id` | Filtrar evaluaciones de una materia |
| `evaluaciones` | `fecha` | Ordenar y filtrar por fecha |
| `clases` | `materia_id` | Filtrar clases de una materia |

---

## Sistema de migraciones (Alembic)

Alembic mantiene un registro de qué cambios se aplicaron a la base de datos. Cada cambio es un archivo en `backend/alembic/versions/`.

**Comandos más usados:**

```powershell
# Aplicar todas las migraciones pendientes
cd backend
alembic upgrade head

# Crear una nueva migración después de cambiar un modelo
alembic revision --autogenerate -m "agrega columna X a tabla Y"

# Ver el historial de migraciones aplicadas
alembic history

# Revertir la última migración
alembic downgrade -1
```

La URL de conexión que usa Alembic en desarrollo está en `backend/alembic.ini`:

```ini
sqlalchemy.url = sqlite:///../data/academic_tracker.db
```

---

## Parches de esquema en producción

Además de las migraciones formales de Alembic, `backend/app/main.py` tiene una función `_apply_schema_patches()` que se ejecuta al iniciar la app. Esta función agrega columnas nuevas que pueden no existir en bases de datos creadas con versiones anteriores.

Esto garantiza compatibilidad hacia atrás: si el usuario tenía una versión vieja de la app y actualiza sin correr migraciones, la app igual arranca correctamente.

---

## Notas sobre tipos SQLite

SQLite tiene un sistema de tipos flexible (no estricto):

- `INTEGER` → Python `int`
- `REAL` → Python `float`
- `TEXT` → Python `str`
- `BOOLEAN` → SQLite lo guarda como `0` o `1`, Python lo lee como `True`/`False`
- `DATE` → SQLite lo guarda como texto `YYYY-MM-DD`, SQLAlchemy lo convierte automáticamente a `datetime.date`
- `TIME` → SQLite lo guarda como texto `HH:MM:SS`, SQLAlchemy lo convierte a `datetime.time`
