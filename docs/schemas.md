# Schemas Pydantic

Los schemas definen la forma exacta de los datos que entran y salen de la API. FastAPI los usa para validar automáticamente los requests y serializar las responses. Están en `backend/app/schemas/`.

---

## ¿Qué es Pydantic?

Pydantic es una librería de validación de datos. Un schema es una clase Python que describe qué campos tiene un objeto, qué tipos tienen y cuáles son opcionales.

Cuando el frontend envía un JSON al backend, FastAPI lo pasa por el schema correspondiente:
- Si un campo requerido falta → error 422 automático con detalle del campo
- Si un tipo no coincide (texto donde se espera número) → error 422
- Si un valor viola un `@field_validator` → error 422 con el mensaje del validador

---

## Patrón general

Cada recurso tiene tres schemas:

| Schema | Uso | Tiene `id` |
|---|---|---|
| `*Create` | Body del POST para crear | No |
| `*Update` | Body del PATCH para modificar (todos opcionales) | No |
| `*Read` | Respuesta de GET (lo que devuelve la API) | Sí |

Los schemas `*Read` tienen `model_config = ConfigDict(from_attributes=True)` que permite a Pydantic leer los datos directamente desde un objeto SQLAlchemy (en lugar de un dict).

---

## Carreras — `schemas/carrera.py`

### `CarreraCreate`

```python
nombre: str                    # requerido
escala_nota_min: int = 0       # opcional, default 0
escala_nota_max: int = 10      # opcional, default 10
nota_aprobacion: float = 4.0   # opcional, default 4.0
```

### `CarreraUpdate`

Todos los campos son opcionales (se envía solo lo que cambia):

```python
nombre: str | None = None
escala_nota_min: int | None = None
escala_nota_max: int | None = None
nota_aprobacion: float | None = None
```

### `CarreraRead`

```python
id: int
nombre: str
escala_nota_min: int
escala_nota_max: int
nota_aprobacion: float
```

---

## Semestres — `schemas/semestre.py`

### `SemestreCreate`

```python
carrera_id: int           # requerido — FK a la carrera padre
numero: int               # requerido — número de semestre (1, 2, 3...)
anio: int                 # requerido — año calendario
fecha_inicio: date        # requerido — formato "YYYY-MM-DD"
fecha_fin: date           # requerido — formato "YYYY-MM-DD"
```

### `SemestreUpdate`

```python
numero: int | None = None
anio: int | None = None
fecha_inicio: date | None = None
fecha_fin: date | None = None
```

Nota: `carrera_id` no se puede cambiar en un update (no está en `SemestreUpdate`).

### `SemestreRead`

```python
id: int
carrera_id: int
numero: int
anio: int
fecha_inicio: date
fecha_fin: date
```

---

## Materias — `schemas/materia.py`

### `MateriaCreate`

```python
semestre_id: int                  # requerido
nombre: str                       # requerido
codigo: str | None = None         # opcional — código corto ej. "MAT1"
creditos: int | None = None       # opcional
profesor: str | None = None       # opcional
estado: str = "cursando"          # opcional, default "cursando"
duracion: str | None = None       # opcional
```

**Validaciones automáticas:**

`estado` solo acepta: `cursando`, `aprobada`, `recursando`, `libre`, `pendiente`

`duracion` solo acepta: `anual`, `cuatrimestral`, `semestral`, `bimestral`, `trimestral` (o `null`)

Si se envía un valor no permitido, Pydantic devuelve 422 con el mensaje de error del validador.

### `MateriaUpdate`

```python
nombre: str | None = None
codigo: str | None = None
creditos: int | None = None
profesor: str | None = None
estado: str | None = None      # validado igual que en Create
duracion: str | None = None    # validado igual que en Create
```

### `MateriaRead`

```python
id: int
semestre_id: int
nombre: str
codigo: str | None
creditos: int | None
profesor: str | None
estado: str
duracion: str | None
```

---

## Evaluaciones — `schemas/evaluacion.py`

### `EvaluacionCreate`

```python
materia_id: int                      # requerido
tipo: str                            # requerido — validado
fecha: date                          # requerido — "YYYY-MM-DD"
hora: str | None = None              # opcional — "HH:MM"
peso: float = 1.0                    # opcional, default 1.0
nota_obtenida: float | None = None   # opcional
nota_simulada: float | None = None   # opcional
notas: str | None = None             # opcional — comentarios libres
```

**Validaciones:**

`tipo` solo acepta: `parcial`, `recuperatorio`, `tp`, `final`, `coloquio`

`hora` se recibe como string `"HH:MM"` y el endpoint lo convierte a `time` antes de guardarlo. En la respuesta vuelve como `"HH:MM:SS"`.

### `EvaluacionUpdate`

```python
tipo: str | None = None          # validado igual que en Create
fecha: date | None = None
hora: str | None = None
peso: float | None = None
nota_obtenida: float | None = None
nota_simulada: float | None = None
notas: str | None = None
```

### `EvaluacionRead`

```python
id: int
materia_id: int
tipo: str
fecha: date
hora: time | None          # tipo Python time, serializado como "HH:MM:SS"
peso: float
nota_obtenida: float | None
nota_simulada: float | None
notas: str | None
```

---

## Clases — `schemas/clase.py`

### `ClaseCreate`

```python
materia_id: int                     # requerido
fecha: date | None = None           # opcional — fecha de la clase ("YYYY-MM-DD")
asistio: bool = False               # opcional, default False
tema: str | None = None             # opcional — tema visto
notas: str | None = None            # opcional — apuntes
dia_semana: int | None = None       # opcional — 1=Lunes ... 7=Domingo
hora_inicio: time | None = None     # opcional — "HH:MM"
hora_fin: time | None = None        # opcional — "HH:MM"
```

Solo `materia_id` es requerido. Los demás campos son opcionales según el uso (registro de asistencia vs. definición de horario semanal).

### `ClaseUpdate`

```python
fecha: date | None = None
asistio: bool | None = None
tema: str | None = None
notas: str | None = None
dia_semana: int | None = None
hora_inicio: time | None = None
hora_fin: time | None = None
```

### `ClaseRead`

```python
id: int
materia_id: int
fecha: date | None
asistio: bool
tema: str | None
notas: str | None
dia_semana: int | None
hora_inicio: time | None
hora_fin: time | None
```

---

## Configuración de asistencia — `schemas/config_asistencia.py`

### `ConfigAsistenciaCreate`

```python
asistencia_minima_pct: float    # requerido — porcentaje entre 0.0 y 100.0
```

No tiene `materia_id` en el body porque se toma del path parameter (`PUT /api/materias/{materia_id}/asistencia`).

### `ConfigAsistenciaRead`

```python
materia_id: int
asistencia_minima_pct: float
```

No hay `ConfigAsistenciaUpdate` porque el endpoint usa PUT (reemplaza todo el objeto). Para actualizar, simplemente se vuelve a hacer PUT con el nuevo valor.

---

## Correlatividades — definido inline en `api/correlativas.py`

A diferencia del resto, el schema de correlatividades está definido directamente en el router y no en un archivo de schemas separado:

### `CorrelativaCreate`

```python
materia_id: int        # la materia que necesita el prerequisito
correlativa_id: int    # la materia que es el prerequisito
tipo: str = ""         # generalmente vacío
```

La response de `GET /api/correlatividades` no usa un schema Pydantic formal — el endpoint construye el JSON directamente con un dict personalizado que incluye la lista de correlativas anidadas. Ver `api_referencia.md` para el formato exacto de respuesta.

---

## Schemas del wizard — definidos en `api/plan.py`

El endpoint `POST /api/plan/setup` usa sus propios schemas:

### `MateriaSetup`

```python
nombre: str                    # requerido
codigo: str | None = None
creditos: int | None = None
duracion: str | None = None
semestre_num: int              # requerido — a qué semestre pertenece (1, 2, 3...)
```

### `CorrelativaSetup`

```python
materia_idx: int    # índice en el array de materias de la materia que necesita prerequisito
requiere_idx: int   # índice en el array de materias del prerequisito
```

### `PlanSetup`

```python
nombre_carrera: str
nota_aprobacion: float = 4.0
escala_nota_min: int = 0
escala_nota_max: int = 10
num_semestres: int                      # entre 1 y 20
anio_inicio: int
materias: list[MateriaSetup] = []
correlativas: list[CorrelativaSetup] = []
```

---

## Schemas del importador — definidos en `api/importer.py`

Solo para `POST /api/import/plan` (importar plan desde JSON):

### `SemestrePlan`

```python
numero: int
materias: list[str]    # lista de nombres de materias
```

### `CorrelativaRel`

```python
materia: str           # nombre de la materia que necesita el prerequisito
requisitos: list[str]  # nombres de las materias prerequisito
```

### `PlanImport`

```python
carrera: str = "Mi Carrera"
semestres: list[SemestrePlan]
correlativas: list[CorrelativaRel] = []
```

---

## Qué pasa cuando falla la validación

Si el frontend envía datos inválidos, FastAPI devuelve automáticamente un `422 Unprocessable Entity` con este formato:

```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "estado"],
      "msg": "Value error, estado must be one of {'cursando', 'aprobada', 'recursando', 'libre', 'pendiente'}",
      "input": "activo"
    }
  ]
}
```

- `loc`: dónde está el error (`body` + nombre del campo)
- `msg`: el mensaje del validador
- `input`: el valor que se envió y que falló
