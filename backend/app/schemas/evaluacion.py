from datetime import date, time
from pydantic import BaseModel, ConfigDict, field_validator


class EvaluacionCreate(BaseModel):
    materia_id: int
    tipo: str
    fecha: date
    hora: str | None = None
    peso: float = 1.0
    nota_obtenida: float | None = None
    nota_simulada: float | None = None
    notas: str | None = None

    @field_validator("tipo")
    @classmethod
    def validate_tipo(cls, v: str) -> str:
        allowed = {"parcial", "recuperatorio", "tp", "final", "coloquio"}
        if v not in allowed:
            raise ValueError(f"tipo must be one of {allowed}")
        return v


class EvaluacionUpdate(BaseModel):
    tipo: str | None = None
    fecha: date | None = None
    hora: str | None = None
    peso: float | None = None
    nota_obtenida: float | None = None
    nota_simulada: float | None = None
    notas: str | None = None

    @field_validator("tipo")
    @classmethod
    def validate_tipo(cls, v: str | None) -> str | None:
        if v is None:
            return v
        allowed = {"parcial", "recuperatorio", "tp", "final", "coloquio"}
        if v not in allowed:
            raise ValueError(f"tipo must be one of {allowed}")
        return v


class EvaluacionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    materia_id: int
    tipo: str
    fecha: date
    hora: time | None
    peso: float
    nota_obtenida: float | None
    nota_simulada: float | None
    notas: str | None
