import os
import sys
from pathlib import Path


def get_data_dir() -> Path:
    env = os.environ.get("ACADEMIC_TRACKER_DATA_DIR")
    if env:
        p = Path(env).resolve()
        p.mkdir(parents=True, exist_ok=True)
        return p

    if getattr(sys, "frozen", False):
        # Portable/dev mode: look for an existing DB up to 2 levels above the exe.
        # This lets the packaged app find data/ in the repo when run from dist/.
        exe_dir = Path(sys.executable).parent
        for candidate in [exe_dir / "data", exe_dir.parent / "data", exe_dir.parent.parent / "data"]:
            if (candidate / "academic_tracker.db").exists():
                return candidate.resolve()
        # Production default: %APPDATA%
        p = Path(os.environ["APPDATA"]) / "AcademicTracker"
        p.mkdir(parents=True, exist_ok=True)
        return p

    return Path(__file__).resolve().parent.parent.parent / "data"


def get_database_url() -> str:
    return f"sqlite:///{get_data_dir() / 'academic_tracker.db'}"


def get_frontend_dist_path() -> Path | None:
    if getattr(sys, "frozen", False):
        base = Path(sys._MEIPASS)
    else:
        base = Path(__file__).resolve().parent.parent.parent

    candidates = [
        base / "frontend" / "dist",
        base.parent / "frontend" / "dist",
    ]
    for p in candidates:
        if p.is_dir() and (p / "index.html").is_file():
            return p.resolve()
    return None
