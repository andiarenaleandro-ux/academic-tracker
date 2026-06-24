from datetime import date, time
from pydantic import BaseModel, ConfigDict


class ClaseCreate(BaseModel):
    materia_id: int
    fecha: date | None = None
    asistio: bool = False
    tema: str | None = None
    notas: str | None = None
    dia_semana: int | None = None
    hora_inicio: time | None = None
    hora_fin: time | None = None


class ClaseUpdate(BaseModel):
    fecha: date | None = None
    asistio: bool | None = None
    tema: str | None = None
    notas: str | None = None
    dia_semana: int | None = None
    hora_inicio: time | None = None
    hora_fin: time | None = None


class ClaseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    materia_id: int
    fecha: date | None
    asistio: bool
    tema: str | None
    notas: str | None
    dia_semana: int | None
    hora_inicio: time | None
    hora_fin: time | None
