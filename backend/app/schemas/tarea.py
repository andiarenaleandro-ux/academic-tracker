from datetime import date
from pydantic import BaseModel, ConfigDict, field_validator


TIPOS_TAREA = {"teoria", "practica", "tp", "entrega", "examen", "otro"}
PRIORIDADES = {"alta", "media", "baja"}


class TareaCreate(BaseModel):
    materia_id: int
    titulo: str
    tipo: str
    semana: int
    prioridad: str = "media"
    fecha_limite: date | None = None
    completado: bool = False
    notas: str | None = None

    @field_validator("tipo")
    @classmethod
    def validate_tipo(cls, v: str) -> str:
        if v not in TIPOS_TAREA:
            raise ValueError(f"tipo must be one of {TIPOS_TAREA}")
        return v

    @field_validator("prioridad")
    @classmethod
    def validate_prioridad(cls, v: str) -> str:
        if v not in PRIORIDADES:
            raise ValueError(f"prioridad must be one of {PRIORIDADES}")
        return v

    @field_validator("semana")
    @classmethod
    def validate_semana(cls, v: int) -> int:
        if v < 1:
            raise ValueError("semana must be >= 1")
        return v


class TareaUpdate(BaseModel):
    titulo: str | None = None
    tipo: str | None = None
    semana: int | None = None
    prioridad: str | None = None
    fecha_limite: date | None = None
    completado: bool | None = None
    notas: str | None = None

    @field_validator("tipo")
    @classmethod
    def validate_tipo(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if v not in TIPOS_TAREA:
            raise ValueError(f"tipo must be one of {TIPOS_TAREA}")
        return v

    @field_validator("prioridad")
    @classmethod
    def validate_prioridad(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if v not in PRIORIDADES:
            raise ValueError(f"prioridad must be one of {PRIORIDADES}")
        return v

    @field_validator("semana")
    @classmethod
    def validate_semana(cls, v: int | None) -> int | None:
        if v is not None and v < 1:
            raise ValueError("semana must be >= 1")
        return v


class TareaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    materia_id: int
    titulo: str
    tipo: str
    semana: int
    prioridad: str
    fecha_limite: date | None
    completado: bool
    notas: str | None