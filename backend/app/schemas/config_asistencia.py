from pydantic import BaseModel, ConfigDict


class ConfigAsistenciaCreate(BaseModel):
    asistencia_minima_pct: float


class ConfigAsistenciaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    materia_id: int
    asistencia_minima_pct: float
