# Frontend — Guía para principiantes

Este documento explica cómo funciona el frontend de Academic Tracker: qué tecnologías usa, qué hace cada archivo y cuáles son los conceptos más importantes para entenderlo.

---

## ¿Qué es un frontend?

El frontend es todo lo que el usuario ve en pantalla: botones, tablas, formularios, colores. Es el código que corre en el navegador (o en la ventana WebView2 del ejecutable). Se comunica con el backend a través de peticiones HTTP para pedir o enviar datos.

En este proyecto el frontend es una **SPA** (Single Page Application): es una sola página HTML que React actualiza dinámicamente sin recargar. Cuando el usuario navega entre "Dashboard" y "Materias", no hay recarga de página — React simplemente muestra un componente diferente.

---

## Stack tecnológico

### TypeScript

Es JavaScript con tipos. Permite detectar errores antes de ejecutar el código: si una función espera un número y le pasás texto, TypeScript avisa en el editor. Todo el código del frontend está en TypeScript (extensión `.ts` o `.tsx`).

### React 19

Librería de interfaz de usuario de Meta. La idea central: la UI se describe como una función de los datos. Cuando los datos cambian, React actualiza automáticamente la pantalla. El código se escribe en **JSX/TSX**: una mezcla de TypeScript y HTML que parece rara al principio pero es muy legible.

Un **componente** es una función que devuelve JSX. Ejemplo mínimo:

```tsx
function Saludo({ nombre }: { nombre: string }) {
  return <p>Hola, {nombre}</p>;
}
```

### Vite

Herramienta de build y servidor de desarrollo. Cuando se corre `npm run dev`, Vite inicia un servidor en `http://localhost:5173` con recarga instantánea: cualquier cambio en el código se refleja en el navegador sin recargar manualmente. Para producción, `vite build` empaqueta todo en archivos estáticos dentro de `frontend/dist/`.

### Tailwind CSS

Framework de estilos. En lugar de escribir CSS en archivos separados, los estilos se aplican directamente en el JSX como clases. Por ejemplo `className="text-sm text-zinc-400 mb-4"` significa: texto pequeño, color gris oscuro, margen inferior de 4 unidades. No hay que aprenderse cada clase: son abreviaciones muy intuitivas del CSS estándar.

### TanStack Query (React Query)

Librería de manejo de estado del servidor. Resuelve uno de los problemas más comunes en frontends: "¿cómo pido datos al backend, los cacheo, los actualizo cuando cambian y muestro un spinner mientras cargan?"

Los dos conceptos clave:
- **`useQuery`**: para pedir datos (GET). Cachea la respuesta, muestra `isLoading` mientras espera.
- **`useMutation`**: para enviar cambios (POST/PATCH/DELETE). Permite ejecutar callbacks cuando termina (`onSuccess`).

### React Router

Librería de navegación. Mapea URLs a componentes: cuando el usuario va a `/materias`, React Router renderiza `MateriasPage`. Toda la navegación es en el cliente (sin recargar el servidor).

### Radix UI

Colección de componentes de interfaz accesibles (Dialog, Select, Tabs, etc.) sin estilos propios. Se usa como base para los componentes de `components/ui/`, que los envuelven y les aplican Tailwind.

---

## Conceptos clave de React

### Estado (`useState`)

Es una variable que, cuando cambia, hace que React redibuje el componente. Se declara con `useState`:

```tsx
const [nombre, setNombre] = useState(""); // valor inicial: ""
// Para cambiar: setNombre("Matematica")
```

### Efectos (`useEffect`)

Código que se ejecuta después de que el componente se renderiza, o cuando cambian ciertos valores. Se usa para sincronizar con sistemas externos.

### Props

Los datos que un componente padre le pasa a un componente hijo. Son como los parámetros de una función.

### Hook

Una función que empieza con `use` y puede usar estado de React. Los hooks permiten reutilizar lógica entre componentes sin copiar código.

### Query Key

En TanStack Query, cada query tiene una clave (array de valores) que la identifica en el caché. Si dos componentes usan la misma query key, comparten la misma caché. Si la clave cambia (ej: cambia el `carreraId`), TanStack Query ejecuta la petición de nuevo con los nuevos parámetros.

---

## Archivos de configuración

### `vite.config.ts`

Configuración de Vite. Define dos cosas importantes:
- **Alias `@`**: permite importar `@/components/ui/button` en lugar de `../../components/ui/button`. Más limpio.
- **Proxy de `/api`**: en desarrollo, cuando el frontend hace una petición a `/api/materias`, Vite la redirige automáticamente a `http://localhost:8000/api/materias` (el backend). En producción esto no es necesario porque FastAPI sirve ambos.

### `tailwind.config.js` y `postcss.config.js`

Configuración de Tailwind CSS. Indica a Tailwind qué archivos escanear para generar solo las clases CSS que se usan (no incluye el CSS completo de Tailwind, solo lo usado).

### `tsconfig.json`

Configuración de TypeScript. Define el alias `@` para que TypeScript también lo entienda (no solo Vite), y opciones de compilación como qué versión de JavaScript generar.

### `index.html`

El único archivo HTML del proyecto. Contiene un `<div id="root">` vacío donde React monta toda la aplicación, y un `<script>` que carga el punto de entrada (`main.tsx`). El navegador descarga este archivo una sola vez.

---

## `frontend/src/main.tsx` — El punto de entrada

El primer archivo que ejecuta React. Hace tres cosas:

1. Crea un `QueryClient` (el gestor de caché de TanStack Query).
2. Envuelve la app con los providers necesarios:
   - `<QueryClientProvider>`: hace que todos los componentes puedan usar TanStack Query.
   - `<BrowserRouter>`: habilita la navegación con React Router.
3. Monta el componente `<App>` dentro del `<div id="root">` del HTML.

Sin estos providers, ningún hook de TanStack Query (`useQuery`, `useMutation`) ni de Router (`useNavigate`, `Link`) funcionaría.

---

## `frontend/src/App.tsx` — Rutas y pantalla de inicio

Define el árbol de rutas de la aplicación. Cada `<Route>` mapea una URL a un componente:

```
/                → Home (pantalla de bienvenida)
/nueva-carrera   → NuevaCarreraPage
/dashboard       → Layout + DashboardPage
/materias        → Layout + MateriasPage
/materias/:id    → Layout + MateriaDetailPage
/evaluaciones    → Layout + EvaluacionesPage
/cronograma      → Layout + CronogramaPage
/plan            → Layout + PlanPage
/correlativas    → Layout + CorrelativasPage
```

Las páginas principales están envueltas en `<Layout>`, que agrega la barra lateral y el header. Las que van sin Layout (Home y NuevaCarreraPage) ocupan toda la pantalla.

Todo el árbol de rutas está dentro de `<CarreraProvider>`, así el contexto de carrera está disponible en todos los componentes.

**Componente `Home`:**

La pantalla de bienvenida que aparece al abrir la app. Muestra el logo "AT", el nombre de la app, una descripción y un botón para ir al Dashboard. Si no hay carreras cargadas, muestra también un enlace "Crear mi primera carrera".

---

## `frontend/src/context/CarreraContext.tsx` — Estado global de carrera

Este es el archivo más importante para entender cómo funciona el multi-carrera.

### ¿Qué es un contexto de React?

Un contexto es como una variable global accesible desde cualquier componente sin necesidad de pasarla como prop a través de toda la jerarquía. Se crea con `createContext()` y se accede con `useContext()`.

### `CarreraProvider`

Componente que envuelve toda la app y provee el contexto. Hace:
- Fetcha la lista de carreras con `useQuery` al iniciar.
- Guarda el `carreraId` activo en `localStorage` para que persista entre sesiones (si cerrás y abrís la app, recuerda qué carrera tenías seleccionada).
- Cuando no hay carrera guardada o la guardada ya no existe, selecciona la primera de la lista automáticamente.

**Función `setCarreraId(id: number)`:**

Parámetros:
- `id`: el ID de la nueva carrera seleccionada

Actualiza el `carreraId`, lo guarda en `localStorage` y llama a `qc.invalidateQueries()` — esto le dice a TanStack Query que todos los datos cacheados son obsoletos y deben recargarse. Así, al cambiar de carrera, todos los hooks (materias, evaluaciones, cronograma, etc.) hacen nuevas peticiones filtrando por la carrera nueva.

**Valores que expone el contexto:**

| Valor | Tipo | Descripción |
|---|---|---|
| `carreraId` | `number \| null` | ID de la carrera seleccionada actualmente |
| `setCarreraId` | función | Cambia la carrera activa |
| `carreras` | `Carrera[]` | Lista completa de carreras |
| `carrera` | `Carrera \| null` | Objeto de la carrera activa |
| `isLoading` | `boolean` | Si la lista de carreras todavía está cargando |
| `refetchCarreras` | función | Fuerza una recarga de la lista de carreras |

### `useCarreraContext()`

Hook que cualquier componente puede llamar para acceder al contexto:

```tsx
const { carreraId, carreras } = useCarreraContext();
```

### `useDeleteCarrera()`

Hook exportado que devuelve una mutation para eliminar una carrera. Al ejecutarse con éxito, invalida el caché de carreras para que la lista se actualice.

---

## `frontend/src/lib/api.ts` — Cliente HTTP

Cuatro funciones que simplifican las peticiones al backend. Todas usan `fetch` (API nativa del navegador) y todas apuntan a `/api` como base.

**`apiGet<T>(path: string): Promise<T>`:**

Parámetros:
- `path`: la ruta relativa, ej. `"/materias?carrera_id=1"`
- `T`: tipo genérico TypeScript del resultado esperado

Hace un GET a `/api{path}`. Si el servidor responde con error (status >= 400), lanza una excepción con el código de estado. Si todo está bien, devuelve el JSON parseado como tipo `T`.

**`apiPost<T>(path: string, body: unknown): Promise<T>`:**

Parámetros:
- `path`: la ruta, ej. `"/materias"`
- `body`: el objeto a enviar como JSON en el cuerpo de la petición

Hace un POST con `Content-Type: application/json`. Si falla, intenta extraer el campo `detail` del JSON de error (FastAPI lo pone ahí) para mostrar un mensaje descriptivo en lugar del genérico "status 422".

**`apiPatch<T>(path: string, body: unknown): Promise<T>`:**

Igual que `apiPost` pero con método PATCH. Se usa para actualizar registros existentes (enviar solo los campos que cambian).

**`apiDelete(path: string): Promise<void>`:**

Parámetros:
- `path`: ej. `"/carreras/3"`

Hace un DELETE. No devuelve nada (el backend devuelve 204 No Content).

---

## `frontend/src/hooks/` — Hooks de datos

Un hook por recurso. Todos siguen el mismo patrón:

1. Llaman a `useCarreraContext()` para obtener el `carreraId` actual.
2. Incluyen `carreraId` en la `queryKey` (así cada carrera tiene su propio caché).
3. Pasan `carrera_id` como parámetro en la URL.
4. Usan `enabled: carreraId !== null` para no hacer la petición si no hay carrera seleccionada.

### `useMaterias.ts`

**`useMaterias(filters?)`:**

Parámetros opcionales:
- `filters.semestre_id`: filtrar por semestre específico
- `filters.estado`: filtrar por estado (`cursando`, `aprobada`, etc.)

Devuelve la lista de materias de la carrera activa, opcionalmente filtrada. La `queryKey` incluye los filtros activos: si cambia el filtro, TanStack Query hace una nueva petición.

**`useMateria(id: number)`:**

Devuelve una sola materia por su ID. Se usa en `MateriaDetailPage`.

**`useCreateMateria()`**, **`useUpdateMateria()`**, **`useDeleteMateria()`:**

Mutations para crear, actualizar y eliminar materias. Todas llaman a `qc.invalidateQueries({ queryKey: ["materias"] })` en `onSuccess` para que las listas se recarguen automáticamente después del cambio.

El tipo `MateriaForm` define los campos opcionales que estas mutations pueden recibir (todos opcionales para update, varios requeridos para create).

### `useEvaluaciones.ts`

**`useEvaluaciones(materia_id?)`:**

Parámetros opcionales:
- `materia_id`: si se pasa, filtra evaluaciones de una sola materia

Devuelve evaluaciones filtradas por carrera activa. Si se pasa `materia_id`, también filtra por materia.

**`useCreateEvaluacion()`**, **`useUpdateEvaluacion()`**, **`useDeleteEvaluacion()`:**

Mutations análogas a las de materias.

### `useSemestres.ts`

**`useSemestres()`:**

Sin parámetros. Lee el `carreraId` del contexto y devuelve los semestres de esa carrera. Se usa mucho en páginas que muestran selectores de semestre.

### `useClases.ts`

**`useClases(materia_id?)`:**

Devuelve las clases de una materia. Se usa en `MateriaDetailPage` para mostrar los horarios. No usa contexto de carrera porque las clases ya pertenecen a una materia específica.

**`useCronograma()`:**

Sin parámetros. Devuelve los ítems del cronograma de la carrera activa: clases que tienen día y hora definidos. Cada ítem incluye `materia_nombre`, `materia_color`, `dia_semana`, `hora_inicio` y `hora_fin`.

**`useCreateClase()`**, **`useUpdateClase()`**, **`useDeleteClase()`:**

Mutations. Al ejecutarse con éxito, invalidan tanto `["clases"]` como `["cronograma"]` porque ambas vistas muestran datos de clases.

### `useCorrelativas.ts`

**`useCorrelativas()`:**

Sin parámetros. Devuelve la lista de materias con sus correlativas. Cada ítem incluye el `id` y `nombre` de la materia, su `estado`, su `semestre_numero` y la lista de materias que son requisito previo (con su estado).

### `useAnalytics.ts`

**`usePromedios()`:**

Sin parámetros. Llama a `/analytics/promedios?carrera_id=X` y devuelve el objeto `Promedios` completo: promedios generales, contadores por estado y desglose por semestre.

Los tipos exportados (`MateriaPromedio`, `SemestrePromedio`, `Promedios`) documentan la estructura exacta de la respuesta.

---

## `frontend/src/pages/` — Las páginas

Cada página es un componente React. Llama a los hooks que necesita y arma la interfaz con los componentes de `components/ui/`.

### `DashboardPage.tsx`

La página más compleja. Combina datos de tres hooks: `usePromedios`, `useEvaluaciones` y `useMaterias`.

Muestra:
- Barra de avance de la carrera (aprobadas / total, con porcentaje).
- Cards con promedio general, cantidad de aprobadas, cursando y pendientes.
- Lista de próximas evaluaciones (las que tienen fecha futura), con link a la materia.
- Gráficos de barras por semestre con los promedios de cada materia (usando la librería Recharts).

La variable `materiaMap` es un `Map<id, nombre>` construido en el render para poder mostrar el nombre de la materia en cada evaluación sin hacer otra petición al servidor.

### `MateriasPage.tsx`

Tabla de materias con dos filtros en la parte superior: semestre y estado. Los filtros son estado local (`useState`) que se pasan a `useMaterias()` como parámetros.

Agrega lógica extra: construye un `notaMap` (promedio de cada materia) y un `blockedSet` (IDs de materias pendientes con correlativas no aprobadas). Esa información se usa para mostrar la nota final en la tabla y para mostrar el badge "Bloqueada" en lugar del estado real.

El botón "+ Nueva" abre un `Dialog` con un formulario para crear una materia nueva. Cuando el usuario hace clic en "Crear", llama a `create.mutateAsync()`. Si tiene éxito, cierra el modal y limpia el formulario.

### `MateriaDetailPage.tsx`

Página de detalle de una materia, dividida en dos pestañas: Evaluaciones y Horarios.

Lee el `id` de la URL con `useParams<{ id: string }>()` y lo convierte a número con `Number(id)`.

**Pestaña Evaluaciones:**

Tabla con todas las evaluaciones de la materia. El botón "Editar" abre el mismo modal que "Nueva evaluación" pero precargado con los datos de la evaluación existente. La función `openEditEval(e)` carga los valores en `evalForm` y guarda el `editingEvalId`. Al guardar, `handleSaveEval()` decide si hace un create o un update según si `editingEvalId` es `null` o no.

**Pestaña Horarios:**

Permite definir los días y horarios en que se dicta la materia. Esos datos aparecen en el `CronogramaPage`. El modal de horario tiene selector de día (lunes a domingo), hora de inicio y hora de fin.

### `EvaluacionesPage.tsx`

Vista global de todas las evaluaciones de la carrera. Tiene dos filtros: por materia (dropdown) y por año (extrae los años disponibles de los semestres). El filtro por año funciona del lado del cliente: filtra la lista ya descargada sin hacer una nueva petición al backend.

### `CronogramaPage.tsx`

Grilla semanal. El diseño es una CSS Grid con columnas (lunes a domingo) y filas (franjas horarias cada 30 minutos, de 17:00 a 22:30).

**Función `generarSlots() → string[]`:**

No recibe parámetros. Genera la lista de franjas horarias: `["17:00", "17:30", "18:00", ..., "22:30"]`. Se calcula al cargar el módulo.

**Función `tiempoTop(hora: string) → number`:**

Parámetros:
- `hora`: string con formato `"HH:MM"`

Devuelve la posición vertical en unidades de slots (cada 30 min = 1 slot). Por ejemplo `"18:30"` devuelve `3.0` (1.5 horas desde las 17:00 = 3 medias horas).

**Función `alturaSlot(horaInicio, horaFin) → number`:**

Parámetros:
- `horaInicio`, `horaFin`: strings con formato `"HH:MM"`

Devuelve cuántos slots ocupa el bloque (para calcular el `grid-row span`).

Cada clase del cronograma se dibuja como un `<div>` con posición CSS Grid calculada a partir de su día y horario.

### `PlanPage.tsx`

Vista tipo kanban: columnas por semestre, tarjetas por materia. Permite ver el plan de estudios completo de la carrera de un vistazo.

Al hacer clic en una materia, se activa `selectedMateriaId` y se calcula qué materias resaltar: la seleccionada, sus correlativas previas y las materias que la tienen como requisito.

Para esto construye dos mapas al renderizar:
- `correlativasMap`: `materia_id → Set<ids de sus prerequisitos>`
- `dependientesMap`: `materia_id → Set<ids de materias que la requieren>`

Abajo de la grilla aparece un panel con el detalle de correlativas de la materia seleccionada.

### `CorrelativasPage.tsx`

Cards agrupadas por semestre. Cada card muestra el nombre de la materia y la lista de sus correlativas con un indicador verde/rojo según si están aprobadas o no.

Los datos vienen agrupados por backend pero la página los reagrupa en un objeto `grouped: Record<semestre_numero, materias[]>` para renderizarlos sección por sección.

### `NuevaCarreraPage.tsx`

Wizard de 3 pasos para crear una carrera. El estado del wizard se guarda en variables locales con `useState`:

**Paso 1 — Nombre y año:**

Pide el nombre de la carrera y el año de inicio. El botón "Siguiente" está deshabilitado si el nombre está vacío.

**Paso 2 — Plan de estudios:**

Lista de semestres (acordeones colapsables). En cada semestre se pueden agregar materias con nombre, código y duración.

Funciones de ayuda:
- `addMateria(semNum)`: agrega una materia vacía al semestre `semNum`.
- `updateMateria(idx, patch)`: actualiza campos específicos de una materia por su índice.
- `removeMateria(idx)`: elimina una materia y reajusta todos los índices de las correlativas para que sigan apuntando correctamente.
- `semYear(n)`: calcula el año del semestre número `n` a partir del año de inicio.

**Paso 3 — Correlativas:**

Para cada materia del semestre N, muestra botones con todas las materias de semestres anteriores. Al hacer clic en uno se activa/desactiva como requisito previo.

`toggleCorrelativa(materiaIdx, requiereIdx)`: agrega o quita la relación `materias[materiaIdx] requiere materias[requiereIdx]`.

**Función `handleCreate()`:**

Llama a `apiPost("/plan/setup", {...})` con todo el payload y redirige al dashboard si tiene éxito. Muestra el mensaje de error debajo si falla.

---

## `frontend/src/components/layout/`

### `Layout.tsx`

Wrapper que divide la pantalla en dos áreas: el sidebar (izquierda) y el contenido principal (derecha). El sidebar se puede mostrar u ocultar con el botón hamburguesa (☰) del header superior. El estado `sidebarOpen` controla si el sidebar tiene `w-56` o `w-0`.

El header es `sticky` (se queda pegado arriba al hacer scroll) y tiene un fondo semi-transparente con `backdrop-blur`.

### `Sidebar.tsx`

La barra de navegación lateral. Contiene:

1. **Logo** con link a `/` (pantalla de inicio).
2. **Selector de carrera**: `<select>` que muestra todas las carreras. Al cambiar, llama a `setCarreraId()`.
3. **Botón "Eliminar carrera"**: aparece solo si hay una carrera seleccionada y no se está mostrando el panel de confirmación.
4. **Panel de confirmación de eliminación**: muestra "¿Eliminar esta carrera y todos sus datos?" con botones "Sí, eliminar" y "Cancelar". El botón "Sí, eliminar" llama a `deleteCarrera.mutateAsync(carreraId)`. Si quedan otras carreras, selecciona la primera y navega al dashboard; si no quedan, va a `/nueva-carrera`.
5. **Links de navegación**: Dashboard, Materias, Evaluaciones, Cronograma, Plan, Correlativas. El link activo se detecta con `location.pathname.startsWith(to)`.
6. **Botón "Nueva carrera"**: navega a `/nueva-carrera`.

---

## `frontend/src/components/ui/`

Componentes de interfaz genéricos. Todos están estilizados con Tailwind y son los bloques de construcción de todas las páginas.

### `Badge`

Etiqueta coloreada de texto pequeño. Acepta una prop `color` que mapea a un estilo predefinido:

```
cursando   → azul
aprobada   → verde
recursando → amarillo
libre      → gris
pendiente  → gris claro
parcial    → naranja
tp         → violeta
final      → ámbar
coloquio   → cyan
```

Si `color` no está en el mapa, usa el estilo gris por defecto.

### `Button`

Botón con dos variantes:
- `default` (sin especificar): fondo violeta con hover.
- `ghost`: transparente con texto gris, para acciones secundarias.

### `Card` y `CardContent`

Contenedor con borde y fondo oscuro (`bg-zinc-900`). `CardContent` agrega padding interno. Se usa para agrupar visualmente secciones de contenido.

### `Dialog` y `DialogHeader`

Modal accesible basado en el elemento nativo `<dialog>` de HTML5. Se controla con las props `open` (booleano) y `onClose` (función).

Internamente usa `ref` y `useEffect` para llamar a `el.showModal()` y `el.close()` según el estado `open`. El backdrop (fondo oscuro detrás del modal) es el pseudo-elemento `::backdrop` del `<dialog>` nativo.

Al hacer clic fuera del contenido del modal se llama a `onClose` automáticamente.

### `Input`

Campo de texto estilizado con fondo oscuro y borde que se ilumina al hacer foco.

### `Label`

Etiqueta para campos de formulario. Muestra el texto en pequeño y color gris sobre el campo.

### `Select`

Selector desplegable (`<select>`) estilizado con Tailwind para mantener consistencia visual con los otros componentes.

### `Table`, `THead`, `TBody`, `Th`, `Td`

Componentes para construir tablas con estilos consistentes en toda la app. `Th` y `Td` son celdas de encabezado y de datos respectivamente.

### `Tabs`

Barra de pestañas. Acepta una lista de tabs (`{ key: string, label: string }`), el valor activo (`value`) y un callback `onChange` para notificar cuándo el usuario cambia de pestaña. No guarda el estado interno: el componente que lo usa decide cuál está activa.

---

## Flujo completo de una acción típica

**Ejemplo: el usuario agrega una nueva evaluación en MateriaDetailPage.**

```
1. El usuario hace clic en "+ Evaluación"
   → openCreateEval() pone showEvalForm = true
   → el <Dialog> se muestra

2. El usuario completa el formulario y hace clic en "Crear"
   → handleSaveEval() construye el payload
   → llama a createEval.mutateAsync(payload)

3. mutateAsync() llama a apiPost("/evaluaciones", payload)
   → fetch POST /api/evaluaciones con el JSON

4. FastAPI recibe la petición, valida con Pydantic, guarda en SQLite
   → devuelve 201 con el objeto creado

5. La mutation recibe el resultado exitoso
   → onSuccess llama a qc.invalidateQueries({ queryKey: ["evaluaciones"] })

6. TanStack Query detecta que el caché de evaluaciones es obsoleto
   → vuelve a ejecutar useEvaluaciones(materiaId)
   → fetch GET /api/evaluaciones?carrera_id=1&materia_id=5

7. FastAPI devuelve la lista actualizada

8. El componente se re-renderiza con la nueva evaluación en la tabla

9. handleSaveEval() cierra el modal y limpia el formulario
```

Todo esto sucede sin que el usuario recargue la página, en menos de un segundo.
