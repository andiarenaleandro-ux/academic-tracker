# Cómo se construye el ejecutable (.exe)

Este documento explica de principio a fin cómo se genera el archivo `AcademicTracker.exe`: qué herramientas se usan, qué hace cada paso, y cómo funciona la app una vez empaquetada.

---

## ¿Por qué hace falta un proceso de build?

En desarrollo, la app necesita que el usuario tenga instalado Python (con todas las librerías), Node.js (con todos los paquetes) y que corra dos servidores por separado. Eso es viable para un desarrollador, pero no para alguien que solo quiere usar la app.

El objetivo del build es generar **un solo ejecutable** que:
- Incluya Python y todas las librerías dentro del propio `.exe`.
- Incluya el frontend ya compilado como archivos estáticos.
- Se pueda distribuir a cualquier computadora Windows sin instalar nada extra.

---

## Stack de herramientas de build

### Vite (build del frontend)

Durante el desarrollo, Vite sirve el frontend desde un servidor propio en `:5173`. Para producción, `vite build` compila todo el código TypeScript/React y lo convierte en archivos HTML, CSS y JavaScript estáticos (sin servidor Node). El resultado queda en `frontend/dist/`.

Esos archivos los puede servir directamente FastAPI como si fueran imágenes o documentos estáticos.

### PyInstaller

Herramienta de Python que analiza el código fuente, busca todas las dependencias (librerías Python, DLLs del sistema) y las empaqueta junto con el intérprete de Python en un directorio o un único archivo ejecutable.

El resultado es un ejecutable que funciona en Windows aunque no tenga Python instalado, porque lleva su propio Python "portátil" adentro.

### pywebview

Librería Python que abre una **ventana nativa de Windows** usando el motor de WebView2 (el mismo motor que usa el navegador Edge). La ventana apunta a una URL local (`http://localhost:XXXX`) donde corre el servidor FastAPI.

Desde el punto de vista del usuario, parece una app de escritorio normal, aunque internamente sea un sitio web corriendo en local.

### WebView2 (Microsoft Edge Chromium)

Motor de renderizado web que viene preinstalado en Windows 10/11. Es lo que dibuja el HTML/CSS/JavaScript dentro de la ventana de pywebview. No es necesario instalar Chrome ni Edge por separado — WebView2 ya está en el sistema.

### UPX (UPX executable packer)

Compresor de ejecutables y DLLs. PyInstaller lo usa opcionalmente (cuando `upx=True` en el spec) para reducir el tamaño del directorio final. No afecta el funcionamiento del ejecutable.

---

## Requisitos previos para hacer el build

Solo la primera vez:

```powershell
# Instalar PyInstaller y pywebview
pip install pywebview pyinstaller

# Instalar dependencias del backend
cd backend
pip install -e .
cd ..

# Instalar dependencias del frontend
cd frontend
npm install
cd ..
```

---

## El script de build: `build_desktop.ps1`

Es un script de PowerShell (lenguaje de automatización de Windows) que orquesta todo el proceso. Se ejecuta con:

```powershell
.\build_desktop.ps1
```

Tiene 4 pasos:

---

### Paso 1 — Build del frontend

```powershell
Set-Location frontend
npm run build
```

`npm run build` ejecuta el script definido en `frontend/package.json`:

```
"build": "tsc -b && vite build"
```

Esto hace dos cosas en secuencia:
1. `tsc -b`: TypeScript Compiler. Verifica que el código no tenga errores de tipos. Si algo está mal tipado, el build falla aquí.
2. `vite build`: Vite toma todos los archivos `.tsx`, `.ts`, `.css`, los procesa (elimina código muerto, minifica, divide en chunks) y genera el directorio `frontend/dist/` con:
   - `index.html` — la shell HTML
   - `assets/index-XXXX.js` — todo el JavaScript de React compilado y minificado
   - `assets/index-XXXX.css` — todo el CSS de Tailwind compilado

Si el build falla (`$buildExit -ne 0`), el script para con un error descriptivo.

---

### Paso 2 — Verificar el ícono

```powershell
$iconPath = "assets/icon.ico"
if (-not (Test-Path $iconPath)) {
    # Genera un ícono placeholder...
}
```

PyInstaller necesita un archivo `.ico` (formato de ícono de Windows) para asignar el ícono al ejecutable. Si no existe `assets/icon.ico`, el script genera uno mínimo de 32×32 píxeles usando Python puro (`struct.pack` para escribir el formato binario del `.ico`).

---

### Paso 3 — Verificar dependencias Python

```powershell
python -c "import webview" 2>$null
# Si falla: pip install pywebview

python -c "import PyInstaller" 2>$null
# Si falla: pip install pyinstaller
```

Intenta importar cada librería necesaria para el build. Si alguna no está instalada, la instala automáticamente con `pip install`.

---

### Paso 4 — Ejecutar PyInstaller

```powershell
pyinstaller academic-tracker.spec --clean --noconfirm
```

Flags:
- `--clean`: borra la carpeta `build/` antes de empezar para garantizar un build limpio.
- `--noconfirm`: no pide confirmación para sobrescribir la carpeta `dist/`.

PyInstaller lee el archivo `academic-tracker.spec` para saber qué hacer.

---

## El archivo spec: `academic-tracker.spec`

Este es el archivo de configuración de PyInstaller. Define exactamente qué entra en el ejecutable. Está escrito en Python (PyInstaller lo ejecuta).

Tiene tres secciones principales:

### `Analysis` — Análisis de dependencias

```python
a = Analysis(
    ["backend/desktop.py"],           # punto de entrada
    pathex=[str(Path("backend").resolve())],  # rutas de búsqueda
    datas=[...],
    hiddenimports=[...],
    excludes=[...],
)
```

**`["backend/desktop.py"]`** — El punto de entrada. Es el primer archivo que se ejecuta cuando el usuario abre el `.exe`.

**`pathex`** — Rutas adicionales donde PyInstaller busca módulos Python. Se agrega la carpeta `backend/` para que `import app.main` funcione dentro del exe.

**`datas`** — Archivos que no son código Python pero que la app necesita. Se especifican como pares `(origen, destino_dentro_del_exe)`:

```python
datas=[
    ("frontend/dist", "frontend/dist"),  # el frontend compilado
    ("backend/alembic", "alembic"),      # las migraciones de BD
    ("backend/alembic.ini", "."),        # config de Alembic
    ("assets", "assets"),                # el ícono y otros recursos
],
```

Sin estos archivos, el exe no podría servir el frontend ni aplicar migraciones.

**`hiddenimports`** — La lista de módulos que PyInstaller no puede detectar automáticamente. PyInstaller analiza el código buscando `import X` estático, pero algunos módulos se importan dinámicamente (con strings, plugins, etc.) y PyInstaller no los detecta. Hay que listarlos explícitamente o el exe falla al ejecutarse con un `ModuleNotFoundError`.

Los más importantes:
- Todos los submódulos de `app.*` (los routers, modelos, servicios)
- Submódulos de `uvicorn` que se cargan en tiempo de ejecución
- Submódulos de `websockets` y `h11` (protocolos HTTP internos de uvicorn)
- Submódulos de `openpyxl` (lector de Excel)
- `webview.platforms.edgechromium` (el backend de WebView2)

**`excludes`** — Módulos que se excluyen para reducir el tamaño:

```python
excludes=["tkinter", "test", "unittest", "setuptools", "pip"]
```

---

### `PYZ` — Archivos Python comprimidos

```python
pyz = PYZ(a.pure)
```

`a.pure` son todos los módulos Python puros (sin extensiones C). PyInstaller los comprime en un archivo `.pyz` que el ejecutable puede leer directamente.

---

### `EXE` — El ejecutable

```python
exe = EXE(
    pyz,
    a.scripts,
    name="AcademicTracker",
    console=False,          # sin ventana de consola negra
    upx=True,               # comprimir
    icon="assets/icon.ico",
    ...
)
```

`console=False` es crucial: con `True`, al abrir el exe aparecería una ventana de consola negra además de la ventana de la app. Con `False`, solo aparece la ventana de la app.

---

### `COLLECT` — Recolecta todo en una carpeta

```python
coll = COLLECT(
    exe,
    a.binaries,   # DLLs y extensiones C
    a.datas,      # archivos de datos
    name="AcademicTracker",
)
```

Esto genera el modo `--onedir` (un directorio con todo): `dist/AcademicTracker/` contendrá el `.exe`, todas las DLLs necesarias, los archivos de datos, y la librería Python comprimida. El usuario distribuye toda esa carpeta.

La alternativa `--onefile` empaqueta todo en un único `.exe`, pero es más lenta al iniciar porque descomprime los archivos a una carpeta temporal cada vez.

---

## El resultado del build

Después de ejecutar `build_desktop.ps1`, se genera:

```
dist/
  AcademicTracker/
    AcademicTracker.exe      ← el ejecutable principal
    _internal/               ← Python, DLLs, librerías
      python312.dll
      ...muchas DLLs...
    frontend/
      dist/
        index.html
        assets/
          index-XXXX.js
          index-XXXX.css
    alembic/
      versions/
        ...migraciones...
    alembic.ini
    assets/
      icon.ico
```

El usuario solo necesita distribuir la carpeta `AcademicTracker/` completa. Al hacer doble clic en `AcademicTracker.exe`, la app arranca.

---

## Cómo arranca la app: `backend/desktop.py`

Este archivo es el `main` del ejecutable. Es lo primero que se ejecuta.

### Logging

Lo primero que hace al cargar es configurar el sistema de logs:

```python
LOG_DIR = Path(APPDATA) / "AcademicTracker" / "logs"
LOG_FILE = LOG_DIR / "desktop.log"
logging.basicConfig(filename=str(LOG_FILE), level=logging.DEBUG, ...)
```

Guarda un archivo de log en `%APPDATA%/AcademicTracker/logs/desktop.log`. Es útil para diagnosticar problemas en producción cuando el ejecutable falla y no hay consola visible.

### Función `find_free_port() → int`

```python
with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.bind(("127.0.0.1", 0))
    return s.getsockname()[1]
```

Un **socket** es el mecanismo del sistema operativo para comunicación en red. Al hacer `bind` con puerto `0`, el sistema elige automáticamente cualquier puerto TCP que esté libre en ese momento. `getsockname()[1]` devuelve cuál eligió.

Esto evita conflictos si el usuario tiene otro servidor corriendo en el puerto 8000.

### Función `start_server(port: int) → None`

Inicia uvicorn con la app FastAPI en el puerto recibido. Tiene un detalle importante:

```python
if sys.stdout is None:
    sys.stdout = open(os.devnull, "w")
if sys.stderr is None:
    sys.stderr = open(os.devnull, "w")
```

Cuando PyInstaller compila con `console=False`, Python no tiene una consola donde escribir, entonces `sys.stdout` y `sys.stderr` son `None`. Uvicorn intentaría llamar métodos sobre `None` y crashearía. Se redirigen a `/dev/null` (un "agujero negro": todo lo que se escribe ahí desaparece) para evitar ese crash.

Esta función corre en un **hilo daemon** (`daemon=True`):

```python
t = threading.Thread(target=start_server, args=(port,), daemon=True)
t.start()
```

Un hilo (thread) es una línea de ejecución paralela dentro del mismo proceso. `daemon=True` significa que ese hilo se cierra automáticamente cuando el programa principal termina — así cuando el usuario cierra la ventana, el servidor también se apaga sin intervención extra.

### Función `healthcheck(port: int, timeout: float) → bool`

```python
url = f"http://127.0.0.1:{port}/api/health"
deadline = time.monotonic() + timeout
while time.monotonic() < deadline:
    try:
        resp = urllib.request.urlopen(url, timeout=1)
        if resp.status == 200: return True
    except ...:
        pass
    time.sleep(0.1)
return False
```

Parámetros:
- `port`: el puerto donde debería estar corriendo el servidor
- `timeout`: cuántos segundos esperar máximo (por defecto 15)

Hace un bucle que intenta conectarse al endpoint `/api/health` cada 100 milisegundos. Si el servidor responde con HTTP 200, devuelve `True`. Si pasan 15 segundos sin respuesta, devuelve `False` y el programa aborta.

Sirve para asegurarse de que no se abra la ventana antes de que el servidor esté listo. Sin este paso, el WebView mostraría una pantalla de "no se puede conectar" al abrir.

### `DesktopApi` y el puente JavaScript-Python

```python
class DesktopApi:
    def __init__(self, port: int):
        self._port = port

    def download_template(self) -> dict:
        # descarga el Excel y lo guarda en ~/Downloads/
```

pywebview permite exponer una clase Python al JavaScript de la ventana mediante `js_api`. Cualquier método público de la clase se vuelve accesible desde el frontend como `window.pywebview.api.download_template()`.

Esto resuelve una limitación de WebView2: bloquea las descargas de archivos iniciadas programáticamente desde JavaScript. Al ejecutar la descarga desde Python (que sí puede escribir en el sistema de archivos), se evita ese bloqueo.

**`download_template() → dict`:**

Hace un GET a `/api/import/template` (el backend propio), lee los bytes del archivo Excel, y los guarda en `~/Downloads/plantilla_academic_tracker.xlsx`. Devuelve `{"ok": True, "path": "..."}` o `{"ok": False, "error": "..."}` para que el frontend pueda mostrar el resultado.

### Función `get_icon_path() → str | None`

```python
if getattr(sys, "frozen", False):
    base = Path(sys._MEIPASS)
else:
    base = Path(__file__).resolve().parent.parent
ico = base / "assets" / "icon.ico"
return str(ico) if ico.exists() else None
```

`sys._MEIPASS` es una variable que PyInstaller inyecta en el ejecutable. Apunta a la carpeta temporal (o al directorio del exe en modo `--onedir`) donde están los archivos de datos. Así se puede encontrar `assets/icon.ico` sin saber de antemano dónde está instalada la app.

### Función `main()`

Orquesta todo:

```python
def main():
    port = find_free_port()
    t = threading.Thread(target=start_server, args=(port,), daemon=True)
    t.start()

    ok = healthcheck(port)
    if not ok:
        sys.exit(1)

    window = webview.create_window(
        "Academic Tracker",
        f"http://127.0.0.1:{port}",
        js_api=DesktopApi(port),
        width=1280, height=800,
    )
    webview.start()
```

`webview.start()` es la llamada que bloquea el programa principal mientras la ventana está abierta. Cuando el usuario cierra la ventana, `webview.start()` retorna, `main()` termina, y como el hilo del servidor es daemon, se cierra automáticamente.

---

## Cómo detecta la app si está en modo exe: `config.py`

```python
if getattr(sys, "frozen", False):
    # estamos dentro del .exe
else:
    # estamos en desarrollo
```

`sys.frozen` es un atributo que PyInstaller agrega al ejecutable. En desarrollo normal no existe (por eso se usa `getattr` con `False` como valor por defecto). Cuando la app detecta que `sys.frozen` es `True`, cambia comportamientos clave:

**Ruta de la base de datos:**

```python
if getattr(sys, "frozen", False):
    # Busca un data/ relativo al exe para portabilidad,
    # o usa %APPDATA%/AcademicTracker/ como default de producción
    p = Path(os.environ["APPDATA"]) / "AcademicTracker"
else:
    # Desarrollo: backend/data/
    return Path(__file__).resolve().parent.parent.parent / "data"
```

La base de datos en producción vive en `%APPDATA%/AcademicTracker/academic_tracker.db` (`%APPDATA%` en Windows es algo como `C:\Users\leandro\AppData\Roaming`). Esto garantiza que los datos del usuario persisten aunque se actualice o reinstale la app.

**Ruta del frontend estático:**

```python
if getattr(sys, "frozen", False):
    base = Path(sys._MEIPASS)
else:
    base = Path(__file__).resolve().parent.parent.parent
```

Dentro del exe, los archivos de `frontend/dist/` están en `sys._MEIPASS/frontend/dist/`. En desarrollo están en la raíz del repositorio.

**Swagger docs:**

`main.py` deshabilita `/docs` y `/redoc` cuando `sys.frozen` es `True`:

```python
docs_url = None if getattr(sys, "frozen", False) else "/docs"
app = FastAPI(docs_url=docs_url, ...)
```

En producción no tiene sentido exponer la documentación de la API.

---

## Flujo completo del build

```
1. Desarrollador corre:  .\build_desktop.ps1

2. [Paso 1] npm run build
   → tsc verifica tipos TypeScript
   → vite compila React + Tailwind → frontend/dist/

3. [Paso 2] Verifica icon.ico
   → Si no existe, genera uno placeholder en Python

4. [Paso 3] Verifica pywebview y pyinstaller
   → Si no están instalados, pip install

5. [Paso 4] pyinstaller academic-tracker.spec --clean --noconfirm
   → PyInstaller lee el spec
   → Analiza backend/desktop.py y todas sus importaciones
   → Reúne el intérprete de Python + todas las librerías
   → Copia frontend/dist/, alembic/, assets/
   → Genera dist/AcademicTracker/AcademicTracker.exe
```

---

## Flujo completo cuando el usuario abre el .exe

```
1. Usuario hace doble clic en AcademicTracker.exe

2. PyInstaller bootloader descomprime los módulos Python
   → configura sys.path para apuntar a los módulos internos
   → establece sys.frozen = True y sys._MEIPASS = ruta interna

3. Se ejecuta backend/desktop.py → main()

4. find_free_port() encuentra un puerto libre (ej: 49253)

5. Un hilo daemon inicia uvicorn en 127.0.0.1:49253
   → FastAPI levanta, crea las tablas SQLite si no existen
   → monta frontend/dist/ como archivos estáticos
   → empieza a escuchar peticiones HTTP

6. healthcheck() espera hasta que /api/health responde 200

7. webview.create_window() abre la ventana nativa de Windows
   → WebView2 carga http://127.0.0.1:49253
   → FastAPI sirve frontend/dist/index.html
   → El navegador interno carga React y muestra la app

8. El usuario usa la app. React llama a /api/... → FastAPI → SQLite

9. El usuario cierra la ventana
   → webview.start() retorna
   → main() termina
   → El hilo daemon de uvicorn se cierra automáticamente
```

---

## La base de datos en producción

La base de datos **no está dentro del exe**. Vive en `%APPDATA%\AcademicTracker\academic_tracker.db`.

Esto es intencional: permite actualizar la app (reemplazar el directorio `dist/AcademicTracker/`) sin perder los datos del usuario. Si la base de datos estuviera dentro del exe, cada actualización borraría todo.

Al abrir la app por primera vez:
1. `config.py` devuelve `%APPDATA%/AcademicTracker/` como directorio de datos.
2. Si la carpeta no existe, la crea.
3. `main.py` llama a `Base.metadata.create_all()` que crea el archivo `.db` y todas las tablas.

En actualizaciones posteriores, `create_all()` no toca las tablas que ya existen, y `_apply_schema_patches()` agrega solo las columnas nuevas que faltan.

---

## Preguntas frecuentes

**¿Por qué el exe tarda unos segundos en abrir?**

PyInstaller en modo `--onedir` es más rápido que `--onefile` porque no necesita descomprimir nada. El delay es el tiempo que tarda Python en iniciar, importar todas las librerías, conectarse a SQLite y pasar el healthcheck. En una computadora normal tarda entre 2 y 5 segundos.

**¿Qué pasa si el puerto 49253 ya está ocupado?**

`find_free_port()` deja que el sistema operativo elija el puerto. El sistema nunca devuelve un puerto ocupado. Si ocurriera un conflicto de todas formas (raro pero posible), el healthcheck fallaría y la app mostraría un error en el log.

**¿Dónde están los logs si algo falla?**

En `%APPDATA%\AcademicTracker\logs\desktop.log`. Ahí se registra todo lo que sucede desde que el exe arranca: el puerto elegido, si el servidor inició correctamente, si el healthcheck pasó, y cualquier error.

**¿Por qué se necesitan los `hiddenimports`?**

PyInstaller detecta imports estáticos (`import X` al inicio del archivo) pero no los dinámicos. Uvicorn, por ejemplo, carga sus handlers de protocolo HTTP en tiempo de ejecución según la configuración. Si no se listan en `hiddenimports`, PyInstaller no los incluye en el exe y el servidor crashea al intentar usarlos.
