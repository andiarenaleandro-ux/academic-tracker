import sys
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.db import engine, Base
from app.models import Carrera, Semestre, Materia, Evaluacion, Clase, ConfigAsistencia, Correlatividad
from app.api.router import api_router
from app.config import get_frontend_dist_path


def _apply_schema_patches() -> None:
    """Agrega columnas faltantes a tablas existentes (create_all no lo hace)."""
    from sqlalchemy import text, inspect as sa_inspect
    inspector = sa_inspect(engine)
    with engine.connect() as conn:
        cols = {c["name"] for c in inspector.get_columns("materias")}
        if "duracion" not in cols:
            conn.execute(text("ALTER TABLE materias ADD COLUMN duracion VARCHAR(20)"))
            conn.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _apply_schema_patches()
    yield


is_dev = not hasattr(sys, "frozen")

app = FastAPI(
    title="Academic Tracker ISSD",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if is_dev else None,
    redoc_url="/redoc" if is_dev else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}


frontend_dist = get_frontend_dist_path()
if frontend_dist:
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
