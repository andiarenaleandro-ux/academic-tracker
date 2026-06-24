from datetime import date
from pydantic import BaseModel, ConfigDict


class SemestreCreate(BaseModel):
    carrera_id: int
    numero: int
    anio: int
    fecha_inicio: date
    fecha_fin: date


class SemestreUpdate(BaseModel):
    numero: int | None = None
    anio: int | None = None
    fecha_inicio: date | None = None
    fecha_fin: date | None = None


class SemestreRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    carrera_id: int
    numero: int
    anio: int
    fecha_inicio: date
    fecha_fin: date
