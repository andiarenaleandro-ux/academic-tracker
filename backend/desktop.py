"""
Desktop entry point for Academic Tracker.
Starts uvicorn in a daemon thread and opens a native window via pywebview.
"""
import os
import sys
import socket
import threading
import time
import urllib.request
import urllib.error
import logging
from pathlib import Path


LOG_DIR = Path(os.environ.get("ACADEMIC_TRACKER_DATA_DIR", os.environ.get("APPDATA", "."))) / "AcademicTracker" / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = LOG_DIR / "desktop.log"

logging.basicConfig(
    filename=str(LOG_FILE),
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s",
    force=True,
)
logger = logging.getLogger("desktop")


def find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def healthcheck(port: int, timeout: float = 15.0) -> bool:
    url = f"http://127.0.0.1:{port}/api/health"
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            resp = urllib.request.urlopen(url, timeout=1)
            if resp.status == 200:
                return True
        except (urllib.error.URLError, OSError):
            pass
        time.sleep(0.1)
    return False


def start_server(port: int) -> None:
    import uvicorn

    # In windowed mode (console=False) sys.stdout/stderr are None.
    # Uvicorn's ColourizedFormatter calls sys.stderr.isatty() and crashes.
    if sys.stdout is None:
        sys.stdout = open(os.devnull, "w")
    if sys.stderr is None:
        sys.stderr = open(os.devnull, "w")

    try:
        from app.main import app
        logger.info("app.main imported successfully")
    except Exception as e:
        logger.exception("Failed to import app.main: %s", e)
        return

    try:
        uvicorn.run(
            app,
            host="127.0.0.1",
            port=port,
            log_level="warning",
            reload=False,
            access_log=False,
        )
    except Exception as e:
        logger.exception("uvicorn error: %s", e)


class DesktopApi:
    """Funciones Python expuestas al frontend via window.pywebview.api.*"""

    def __init__(self, port: int):
        self._port = port

    def download_template(self) -> dict:
        try:
            url = f"http://127.0.0.1:{self._port}/api/import/template"
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = resp.read()
            downloads = Path.home() / "Downloads"
            downloads.mkdir(exist_ok=True)
            dest = downloads / "plantilla_academic_tracker.xlsx"
            dest.write_bytes(data)
            logger.info("Template saved to %s", dest)
            return {"ok": True, "path": str(dest)}
        except Exception as e:
            logger.exception("download_template error: %s", e)
            return {"ok": False, "error": str(e)}


def get_icon_path() -> str | None:
    if getattr(sys, "frozen", False):
        base = Path(sys._MEIPASS)
        logger.info("sys._MEIPASS = %s", sys._MEIPASS)
    else:
        base = Path(__file__).resolve().parent.parent
    ico = base / "assets" / "icon.ico"
    resolved = str(ico) if ico.exists() else None
    logger.info("icon path = %s, exists = %s", ico, ico.exists())
    return resolved


def main():
    logger.info("=== Academic Tracker Desktop starting ===")
    logger.info("sys.frozen = %s", getattr(sys, "frozen", False))
    logger.info("sys.executable = %s", sys.executable)
    logger.info("sys.argv = %s", sys.argv)

    port = find_free_port()
    os.environ["ACADEMIC_TRACKER_PORT"] = str(port)
    logger.info("Selected port = %d", port)

    t = threading.Thread(target=start_server, args=(port,), daemon=True)
    t.start()
    logger.info("Server thread started")

    logger.info("Waiting for healthcheck...")
    ok = healthcheck(port)
    if not ok:
        logger.error("Backend healthcheck FAILED after timeout")
        sys.exit(1)
    logger.info("Healthcheck OK")

    try:
        import webview
        logger.info("webview imported successfully")

        icon = get_icon_path()
        api = DesktopApi(port)
        window = webview.create_window(
            "Academic Tracker",
            f"http://127.0.0.1:{port}",
            js_api=api,
            width=1280,
            height=800,
            resizable=True,
        )
        logger.info("Window created, starting event loop...")
        webview.start()
        logger.info("Event loop ended")
    except Exception as e:
        logger.exception("webview error: %s", e)
        sys.exit(1)


if __name__ == "__main__":
    main()
