# Referencia de la API

Todos los endpoints HTTP de Academic Tracker. La API se monta bajo el prefijo `/api`. En desarrollo está disponible la documentación interactiva en `http://localhost:8000/docs`.

---

## Convenciones generales

- **Base URL**: `/api` (en desarrollo: `http://localhost:8000/api`)
- **Formato**: JSON para request body y responses
- **Autenticación**: ninguna (la app solo escucha en `localhost`)
- **Errores**: el cuerpo tiene siempre `{ "detail": "mensaje de error" }`

### Códigos de estado más usados

| Código | Significado |
|---|---|
| `200 OK` | Consulta exitosa |
| `201 Created` | Registro creado exitosamente |
| `204 No Content` | Eliminación exitosa (sin cuerpo en la respuesta) |
| `400 Bad Request` | Parámetros inválidos |
| `404 Not Found` | Registro no encontrado |
| `422 Unprocessable Entity` | Error de validación Pydantic (campos incorrectos) |
| `500 Internal Server Error` | Error inesperado del servidor |

---

## Carreras

### `GET /api/carreras`

Lista todas las carreras.

**Respuesta `200`:**

```json
[
  {
    "id": 1,
    "nombre": "Tecnicatura en Datos e IA",
    "escala_nota_min": 0,
    "escala_nota_max": 10,
    "nota_aprobacion": 4.0
  }
]
```

---

### `POST /api/carreras`

Crea una nueva carrera.

**Body:**

```json
{
  "nombre": "Tecnicatura en Datos e IA",
  "escala_nota_min": 0,
  "escala_nota_max": 10,
  "nota_aprobacion": 4.0
}
```

Campos opcionales: `escala_nota_min` (default `0`), `escala_nota_max` (default `10`), `nota_aprobacion` (default `4.0`).

**Respuesta `201`:** el objeto carrera creado con su `id`.

---

### `GET /api/carreras/{carrera_id}`

Obtiene una carrera por ID.

**Respuesta `200`:** objeto carrera. `404` si no existe.

---

### `PATCH /api/carreras/{carrera_id}`

Actualiza campos de una carrera. Solo enviar los campos que cambian.

**Body (todos opcionales):**

```json
{
  "nombre": "Nuevo nombre",
  "nota_aprobacion": 6.0
}
```

**Respuesta `200`:** objeto carrera actualizado.

---

### `DELETE /api/carreras/{carrera_id}`

Elimina una carrera y **en cascada** todos sus semestres, materias, evaluaciones, clases, correlativas y configuraciones de asistencia.

**Respuesta `204`:** sin cuerpo.

---

## Semestres

### `GET /api/semestres`

Lista semestres. Acepta filtro por carrera.

**Query params:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `carrera_id` | int (opcional) | Filtrar semestres de una carrera |

**Respuesta `200`:**

```json
[
  {
    "id": 1,
    "carrera_id": 1,
    "numero": 1,
    "anio": 2026,
    "fecha_inicio": "2026-03-01",
    "fecha_fin": "2026-07-31"
  }
]
```

---

### `POST /api/semestres`

Crea un semestre.

**Body:**

```json
{
  "carrera_id": 1,
  "numero": 1,
  "anio": 2026,
  "fecha_inicio": "2026-03-01",
  "fecha_fin": "2026-07-31"
}
```

**Respuesta `201`:** objeto semestre creado.

---

### `GET /api/semestres/{semestre_id}`

Obtiene un semestre por ID. `404` si no existe.

---

### `PATCH /api/semestres/{semestre_id}`

Actualiza un semestre. Solo enviar campos que cambian.

---

### `DELETE /api/semestres/{semestre_id}`

Elimina un semestre y en cascada todas sus materias (y lo que de ellas depende).

**Respuesta `204`.**

---

## Materias

### `GET /api/materias`

Lista materias con filtros opcionales.

**Query params:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `carrera_id` | int (opcional) | Filtra por carrera (JOIN a semestres) |
| `semestre_id` | int (opcional) | Filtra por semestre específico |
| `estado` | string (opcional) | Filtra por estado (`cursando`, `aprobada`, etc.) |

**Respuesta `200`:**

```json
[
  {
    "id": 5,
    "semestre_id": 1,
    "nombre": "Matemática I",
    "codigo": "MAT1",
    "creditos": 6,
    "profesor": "Prof. García",
    "estado": "cursando",
    "duracion": "cuatrimestral"
  }
]
```

---

### `POST /api/materias`

Crea una materia.

**Body:**

```json
{
  "semestre_id": 1,
  "nombre": "Matemática I",
  "codigo": "MAT1",
  "creditos": 6,
  "profesor": "Prof. García",
  "estado": "cursando",
  "duracion": "cuatrimestral"
}
```

Campos opcionales: `codigo`, `creditos`, `profesor`, `duracion`. `estado` default `"cursando"`.

**Respuesta `201`:** objeto materia creado.

---

### `GET /api/materias/{materia_id}`

Obtiene una materia por ID. `404` si no existe.

---

### `PATCH /api/materias/{materia_id}`

Actualiza una materia. Solo enviar campos que cambian.

**Uso frecuente:** cambiar el estado.

```json
{ "estado": "aprobada" }
```

---

### `DELETE /api/materias/{materia_id}`

Elimina una materia y en cascada evaluaciones, clases, config asistencia y correlatividades.

**Respuesta `204`.**

---

### `GET /api/materias/{materia_id}/asistencia`

Obtiene la configuración de asistencia de una materia.

**Respuesta `200`:**

```json
{
  "materia_id": 5,
  "asistencia_minima_pct": 75.0
}
```

`404` si no hay configuración definida para esa materia.

---

### `PUT /api/materias/{materia_id}/asistencia`

Crea o actualiza la configuración de asistencia (upsert: si existe la actualiza, si no la crea).

**Body:**

```json
{
  "asistencia_minima_pct": 80.0
}
```

**Respuesta `200`:** objeto config asistencia.

---

## Evaluaciones

### `GET /api/evaluaciones`

Lista evaluaciones con filtros opcionales.

**Query params:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `carrera_id` | int (opcional) | Filtra por carrera (doble JOIN: evaluacion → materia → semestre) |
| `materia_id` | int (opcional) | Filtra por materia específica |

**Respuesta `200`:**

```json
[
  {
    "id": 1,
    "materia_id": 5,
    "tipo": "parcial",
    "fecha": "2026-05-10",
    "hora": "19:00:00",
    "peso": 0.4,
    "nota_obtenida": 7.5,
    "nota_simulada": null,
    "notas": "Primer parcial"
  }
]
```

---

### `POST /api/evaluaciones`

Crea una evaluación.

**Body:**

```json
{
  "materia_id": 5,
  "tipo": "parcial",
  "fecha": "2026-05-10",
  "hora": "19:00",
  "peso": 0.4,
  "nota_obtenida": 7.5,
  "nota_simulada": null,
  "notas": "Primer parcial"
}
```

- `tipo` debe ser uno de: `parcial`, `recuperatorio`, `tp`, `final`, `coloquio`
- `hora` formato `"HH:MM"` (opcional)
- `peso` entre `0.0` y `1.0` (default `1.0`)
- `nota_obtenida` y `nota_simulada` opcionales

**Comportamiento especial:** si `tipo` es `"final"` y `nota_obtenida` no es null, la materia asociada se marca automáticamente como `"aprobada"`.

**Respuesta `201`:** objeto evaluación creado.

---

### `GET /api/evaluaciones/{evaluacion_id}`

Obtiene una evaluación por ID. `404` si no existe.

---

### `PATCH /api/evaluaciones/{evaluacion_id}`

Actualiza una evaluación. Solo enviar campos que cambian.

---

### `DELETE /api/evaluaciones/{evaluacion_id}`

Elimina una evaluación. **Respuesta `204`.**

---

## Clases / Horarios

### `GET /api/clases`

Lista clases.

**Query params:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `materia_id` | int (opcional) | Filtra clases de una materia |

**Respuesta `200`:**

```json
[
  {
    "id": 1,
    "materia_id": 5,
    "fecha": "2026-03-05",
    "asistio": true,
    "tema": "Números reales",
    "notas": null,
    "dia_semana": null,
    "hora_inicio": null,
    "hora_fin": null
  }
]
```

---

### `POST /api/clases`

Crea una clase (registro de asistencia o definición de horario).

**Body para registro de asistencia:**

```json
{
  "materia_id": 5,
  "fecha": "2026-03-05",
  "asistio": true,
  "tema": "Números reales",
  "notas": null
}
```

**Body para definición de horario semanal:**

```json
{
  "materia_id": 5,
  "dia_semana": 2,
  "hora_inicio": "19:00",
  "hora_fin": "21:00"
}
```

- `dia_semana`: 1=Lunes, 2=Martes, ..., 7=Domingo
- `hora_inicio` / `hora_fin`: formato `"HH:MM"`

Todos los campos son opcionales excepto `materia_id`.

**Respuesta `201`:** objeto clase creado.

---

### `GET /api/clases/{clase_id}`

Obtiene una clase por ID. `404` si no existe.

---

### `PATCH /api/clases/{clase_id}`

Actualiza una clase.

---

### `DELETE /api/clases/{clase_id}`

Elimina una clase. **Respuesta `204`.**

---

## Cronograma

### `GET /api/cronograma`

Devuelve las clases que tienen horario semanal definido (con `dia_semana`, `hora_inicio` y `hora_fin`). Ordenadas por día y hora.

**Query params:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `carrera_id` | int (opcional) | Filtra por carrera |

**Respuesta `200`:**

```json
[
  {
    "materia_id": 5,
    "materia_nombre": "Matemática I",
    "materia_color": "#3b82f6",
    "dia_semana": 2,
    "hora_inicio": "19:00",
    "hora_fin": "21:00"
  }
]
```

- `materia_color`: color hexadecimal asignado automáticamente en base al `materia_id` (rotación entre 10 colores predefinidos)
- `dia_semana`: 1=Lunes ... 7=Domingo

---

## Correlatividades

### `GET /api/correlatividades`

Devuelve todas las materias con la lista de sus correlativas (prerequisitos). Útil para construir el grafo de correlativas.

**Query params:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `carrera_id` | int (opcional) | Filtra por carrera |

**Respuesta `200`:**

```json
[
  {
    "id": 10,
    "nombre": "Programación II",
    "estado": "pendiente",
    "semestre_numero": 2,
    "correlativas": [
      {
        "id": 5,
        "nombre": "Programación I",
        "tipo": "",
        "estado": "aprobada"
      }
    ]
  }
]
```

- Materias sin correlativas tienen `"correlativas": []`
- El campo `tipo` generalmente es `""` (vacío)

---

### `POST /api/correlatividades`

Crea una correlatividad entre dos materias.

**Body:**

```json
{
  "materia_id": 10,
  "correlativa_id": 5,
  "tipo": ""
}
```

- `materia_id`: la materia que necesita el prerequisito
- `correlativa_id`: la materia que es prerequisito
- `tipo`: campo libre, generalmente `""` (vacío)

**Respuesta `201`:** objeto correlatividad creado.

---

## Analytics

### `GET /api/analytics/promedios`

Calcula promedios ponderados de la carrera.

**Query params:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `carrera_id` | int (requerido, default `1`) | La carrera a analizar |

**Respuesta `200`:**

```json
{
  "promedio_general_con_aplazos": 6.42,
  "promedio_general_sin_aplazos": 7.15,
  "total_materias": 12,
  "aprobadas": 5,
  "cursando": 3,
  "pendientes": 4,
  "semestres": [
    {
      "numero": 1,
      "promedio_con_aplazos": 7.00,
      "promedio_sin_aplazos": 7.50,
      "materias": [
        {
          "id": 5,
          "nombre": "Matemática I",
          "promedio": 7.5,
          "estado": "aprobada"
        }
      ]
    }
  ]
}
```

- `promedio_con_aplazos`: incluye materias con nota 0 (aplazos) en el cálculo
- `promedio_sin_aplazos`: solo materias con nota aprobatoria
- `promedio` de materia: `null` si no tiene evaluaciones con nota cargada

Si `carrera_id` no existe, devuelve todos los campos en 0/null en lugar de un error 404.

---

## Plan de estudios (wizard)

### `POST /api/plan/setup`

Crea una carrera completa en una sola operación: carrera + semestres + materias + correlatividades. Lo usa el wizard de "Nueva carrera".

**Body:**

```json
{
  "nombre_carrera": "Tecnicatura en Datos e IA",
  "nota_aprobacion": 4.0,
  "escala_nota_min": 0,
  "escala_nota_max": 10,
  "num_semestres": 4,
  "anio_inicio": 2026,
  "materias": [
    {
      "nombre": "Matemática I",
      "codigo": "MAT1",
      "creditos": 6,
      "duracion": "cuatrimestral",
      "semestre_num": 1
    },
    {
      "nombre": "Programación I",
      "semestre_num": 1
    },
    {
      "nombre": "Matemática II",
      "semestre_num": 2
    }
  ],
  "correlativas": [
    {
      "materia_idx": 2,
      "requiere_idx": 0
    }
  ]
}
```

- `num_semestres`: entre 1 y 20
- `anio_inicio`: año del primer semestre. Los semestres impares empiezan en marzo, los pares en agosto.
- `materias[].semestre_num`: a qué semestre pertenece la materia (1 = primer semestre)
- `correlativas[].materia_idx`: índice en el array `materias` de la materia que necesita el prerequisito
- `correlativas[].requiere_idx`: índice en el array `materias` de la materia que es prerequisito

Todas las materias se crean con estado `"pendiente"`.

**Respuesta `201`:**

```json
{
  "ok": true,
  "carrera_id": 3,
  "materias_creadas": 3
}
```

En caso de error, devuelve `500` con el traceback completo en el campo `detail` para facilitar el diagnóstico.

---

## Importación

### `POST /api/import`

Importa datos desde un archivo Excel. El archivo debe tener hojas con los nombres exactos: `Carreras`, `Semestres`, `Materias`, `Evaluaciones`, `Clases`, `Asistencia`.

**Body:** `multipart/form-data` con el archivo en el campo `file`.

Ejemplo con curl:

```bash
curl -X POST http://localhost:8000/api/import \
  -F "file=@mi_planilla.xlsx"
```

**Respuesta `200`:**

```json
{
  "ok": true,
  "creados": 15,
  "errores": 0,
  "detalle": {
    "carreras": { "creados": 1, "actualizados": 0, "errores": [] },
    "semestres": { "creados": 2, "actualizados": 0, "errores": [] },
    "materias": { "creados": 8, "actualizados": 0, "errores": [] },
    "evaluaciones": { "creados": 4, "actualizados": 0, "errores": [] },
    "clases": { "creados": 0, "actualizados": 0, "errores": [] },
    "asistencia": { "creados": 0, "actualizados": 0, "errores": [] }
  }
}
```

`ok` es `false` si hubo algún error. Los errores son a nivel de fila (no abortan el import completo).

---

### `POST /api/import/plan`

Importa un plan de carrera desde JSON. Alternativa más simple al Excel para crear la estructura básica de una carrera.

**Body:**

```json
{
  "carrera": "Mi Carrera",
  "semestres": [
    { "numero": 1, "materias": ["Matemática I", "Programación I"] },
    { "numero": 2, "materias": ["Matemática II", "Programación II"] }
  ],
  "correlativas": [
    { "materia": "Matemática II", "requisitos": ["Matemática I"] },
    { "materia": "Programación II", "requisitos": ["Programación I"] }
  ]
}
```

**Respuesta `200`:**

```json
{
  "ok": true,
  "creados": 4,
  "errores": 0,
  "detalle": {
    "carrera": "Mi Carrera",
    "materias_creadas": 4,
    "correlativas_creadas": 2
  }
}
```

---

### `GET /api/import/template`

Descarga la plantilla Excel con las hojas y columnas esperadas, con filas de ejemplo.

**Respuesta `200`:** archivo `.xlsx` como descarga.

- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename=plantilla_academic_tracker.xlsx`

En el ejecutable de escritorio, esta descarga la maneja `DesktopApi.download_template()` (Python) porque WebView2 bloquea las descargas iniciadas desde JavaScript.

---

## Health check

### `GET /api/health`

Endpoint de verificación de estado. Lo usa `desktop.py` al arrancar para saber si el servidor ya está listo antes de abrir la ventana.

**Respuesta `200`:**

```json
{ "status": "ok" }
```
