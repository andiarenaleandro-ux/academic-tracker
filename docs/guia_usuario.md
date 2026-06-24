# Guía de usuario

Cómo usar Academic Tracker para hacer seguimiento de tu carrera.

---

## Abrir la app

Hacé doble clic en `AcademicTracker.exe`. La primera vez tarda unos segundos mientras arranca el servidor interno. Si Windows muestra un aviso de seguridad, hacé clic en **Más información → Ejecutar de todas formas**.

---

## Primera vez: crear tu carrera

Al abrir la app sin datos vas a ver la pantalla de bienvenida. Hacé clic en **Crear mi primera carrera** para abrir el asistente de 3 pasos.

### Paso 1 — Nombre y año de inicio

Ingresá el nombre de tu carrera y el año en que empezaste (o vas a empezar). El año define cuándo comienza el primer semestre.

### Paso 2 — Plan de estudios

Definí cuántos semestres tiene la carrera e ingresá las materias de cada uno. Para cada materia podés indicar:
- **Nombre** (obligatorio)
- **Código** — identificador corto, ej. `MAT1`
- **Duración** — cuatrimestral, anual, semestral, etc.

Hacé clic en el encabezado de cada semestre para expandirlo y agregar materias con **+ Agregar materia**. Podés dejar semestres vacíos y completarlos después.

### Paso 3 — Correlativas

Para cada materia, podés marcar cuáles son sus requisitos previos (correlativas). Hacé clic en el nombre de una materia anterior para activarla como requisito. Podés saltearte este paso y configurarlo después desde la página **Correlativas**.

### Finalizar

Hacé clic en **Crear carrera**. La app te lleva directamente al Dashboard con tu nueva carrera.

---

## Navegar entre secciones

Abrí el menú lateral con el botón **☰** (arriba a la izquierda). Desde ahí podés ir a:

- **Dashboard** — resumen general de tu carrera
- **Materias** — lista completa de materias
- **Evaluaciones** — todas las evaluaciones
- **Cronograma** — horarios semanales de clases
- **Plan** — vista del plan de estudios completo
- **Correlativas** — requisitos previos de cada materia

---

## Manejar múltiples carreras

Si tenés más de una carrera, el selector en la parte superior del menú lateral te permite cambiar entre ellas. Todo el contenido (materias, evaluaciones, cronograma) cambia automáticamente según la carrera seleccionada.

Para agregar una carrera nueva hacé clic en **Nueva carrera** en la parte inferior del menú.

Para eliminar la carrera activa hacé clic en **Eliminar carrera** (debajo del selector). La app te pide confirmación antes de borrar. Al eliminar se borran también todos los semestres, materias, evaluaciones y clases asociadas.

---

## Dashboard

Muestra un resumen de tu avance en la carrera activa:

- **Avance de carrera** — porcentaje de materias aprobadas sobre el total
- **Promedio general** — promedio con y sin aplazos
- **Contadores** — cuántas materias aprobaste, estás cursando o tenés pendientes
- **Próximas evaluaciones** — evaluaciones con fecha futura, ordenadas por fecha
- **Gráficos por semestre** — barras con el promedio de cada materia

---

## Materias

Lista todas las materias de la carrera activa con filtros por semestre y por estado.

### Filtros disponibles

- **Semestre** — muestra solo las materias de ese semestre
- **Estado** — muestra solo materias en el estado seleccionado

### Agregar una materia manualmente

Hacé clic en **+ Nueva** (arriba a la derecha). Completá el nombre, código, semestre y estado inicial. Guardá con **Crear**.

### Cambiar el estado de una materia

Hacé clic en el nombre de la materia para ir a su detalle, y usá el selector de estado arriba del título. Los estados posibles son:

| Estado | Significado |
|---|---|
| `Cursando` | La estás cursando actualmente |
| `Pendiente` | Todavía no la empezaste |
| `Aprobada` | La aprobaste |
| `Recursando` | La estás volviendo a cursar |
| `Libre` | La rendiste libre (sin cursado) |

### Nota final

La columna "Nota final" muestra el promedio ponderado de todas las evaluaciones con nota cargada. Aparece en verde si es mayor o igual a la nota de aprobación, en rojo si no.

### Correlativas bloqueadas

Si una materia está pendiente y tiene correlativas sin aprobar, su badge muestra **Bloqueada** en lugar del estado real. Eso te avisa que no podés cursarla todavía.

### Eliminar una materia

Hacé clic en **Eliminar** en la fila de la materia. Se borra junto con todas sus evaluaciones, clases y configuración de asistencia.

---

## Detalle de una materia

Hacé clic en el nombre de cualquier materia para abrir su detalle. Tiene dos pestañas:

### Pestaña Evaluaciones

Tabla con todas las evaluaciones de esa materia. Para cada evaluación se muestra el tipo, fecha, hora, peso, nota obtenida, nota simulada y comentarios.

**Agregar una evaluación:** hacé clic en **+ Evaluación**. Completá:
- **Tipo**: Parcial, Recuperatorio, TP, Final o Coloquio
- **Fecha** (obligatorio)
- **Hora** (opcional)
- **Peso**: cuánto pesa esta evaluación en el promedio (0.0 a 1.0). Un parcial que vale el 40% del total se pone como `0.4`.
- **Nota obtenida**: la nota real. Dejala vacía si todavía no la rendiste.
- **Nota simulada**: una nota hipotética para ver cómo impactaría en el promedio sin haberla rendido.
- **Comentarios**: notas libres.

**Editar una evaluación:** hacé clic en **Editar** en la fila correspondiente.

**Nota especial:** si cargás un Final con nota obtenida, la materia se marca automáticamente como **Aprobada**.

### Pestaña Horarios

Permite definir los días y horarios en que se dicta la materia. Esos horarios aparecen en el Cronograma semanal.

**Agregar un horario:** hacé clic en **+ Horario**. Elegí el día de la semana, la hora de inicio y la hora de fin.

Una materia puede tener varios horarios (ej: martes y jueves).

---

## Evaluaciones

Vista global de todas las evaluaciones de la carrera. Tiene filtros por materia y por año. Útil para ver qué evaluaciones tenés próximamente o revisar el historial.

---

## Cronograma semanal

Grilla visual de lunes a domingo con los horarios de todas las materias que tengan horarios definidos. Cada materia tiene un color diferente. Los bloques muestran el nombre y el rango horario.

Para que una materia aparezca acá, tenés que definir sus horarios en **Detalle de materia → Horarios**.

---

## Plan de estudios

Vista tipo kanban con una columna por semestre. Muestra todas las materias organizadas visualmente.

**Hacer clic en una materia** resalta:
- La materia seleccionada
- Sus correlativas requeridas (prerequisitos)
- Las materias que la requieren a ella como prerequisito

Abajo aparece un panel con el detalle de las correlativas de la materia seleccionada. Desde ahí también podés ir al detalle de cada materia.

---

## Correlativas

Cards agrupadas por semestre. Cada card muestra:
- El nombre de la materia
- La lista de sus requisitos previos con el estado de cada uno
- Un punto verde si la correlativa está aprobada, rojo si no

Útil para saber si estás en condiciones de cursar una materia o no.

---

## Importar datos desde Excel

Si ya tenés datos en una planilla, podés importarlos masivamente.

### Descargar la plantilla

En la pantalla de inicio, desde el menú lateral o en la página de importación, descargá la plantilla Excel. Tiene hojas preconfiguradas con los campos esperados y filas de ejemplo.

En el ejecutable de escritorio, la descarga se guarda automáticamente en tu carpeta `Descargas` con el nombre `plantilla_academic_tracker.xlsx`.

### Completar la plantilla

La plantilla tiene 6 hojas. Completá solo las que necesitás (podés dejar las que no usás vacías excepto el encabezado):

| Hoja | Qué contiene |
|---|---|
| `Carreras` | Una fila por carrera |
| `Semestres` | Semestres de cada carrera |
| `Materias` | Materias de cada semestre |
| `Evaluaciones` | Evaluaciones de cada materia |
| `Clases` | Registros de asistencia |
| `Asistencia` | Porcentaje mínimo de asistencia por materia |

**Importante:** el orden importa. Primero completá `Carreras`, luego `Semestres`, luego `Materias`, y así. Si una fila hace referencia a algo que no existe (ej: una materia de un semestre que no está en la hoja Semestres), esa fila genera un error pero el resto se importa igual.

### Subir el archivo

Guardá la plantilla completada y subila desde la página de importación.

---

## Consejos de uso

**Peso de las evaluaciones:** si todas las evaluaciones tienen peso `1.0` (el default), el promedio es simple. Si querés promedios ponderados, asigná pesos proporcionales: un parcial que vale 40% va con peso `0.4`, un final que vale 60% con `0.6`.

**Nota simulada:** usá la nota simulada para proyectar escenarios. "Si saco 8 en el final, ¿cuál sería mi promedio?" Cargá el 8 en nota simulada y fijate en el Dashboard cómo quedaría.

**Correlativas:** mantenerlas actualizadas te permite ver en el Plan qué materias podés cursar y cuáles están bloqueadas por prerequisitos no aprobados.
