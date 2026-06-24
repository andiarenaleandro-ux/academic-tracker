from pydantic import BaseModel, ConfigDict, field_validator


DURACIONES = {"anual", "cuatrimestral", "semestral", "bimestral", "trimestral"}


class MateriaCreate(BaseModel):
    semestre_id: int
    nombre: str
    codigo: str | None = None
    creditos: int | None = None
    profesor: str | None = None
    estado: str = "cursando"
    duracion: str | None = None

    @field_validator("estado")
    @classmethod
    def validate_estado(cls, v: str) -> str:
        allowed = {"cursando", "aprobada", "recursando", "libre", "pendiente"}
        if v not in allowed:
            raise ValueError(f"estado must be one of {allowed}")
        return v

    @field_validator("duracion")
    @classmethod
    def validate_duracion(cls, v: str | None) -> str | None:
        if v is not None and v not in DURACIONES:
            raise ValueError(f"duracion must be one of {DURACIONES}")
        return v


class MateriaUpdate(BaseModel):
    nombre: str | None = None
    codigo: str | None = None
    creditos: int | None = None
    profesor: str | None = None
    estado: str | None = None
    duracion: str | None = None

    @field_validator("estado")
    @classmethod
    def validate_estado(cls, v: str | None) -> str | None:
        if v is None:
            return v
        allowed = {"cursando", "aprobada", "recursando", "libre", "pendiente"}
        if v not in allowed:
            raise ValueError(f"estado must be one of {allowed}")
        return v

    @field_validator("duracion")
    @classmethod
    def validate_duracion(cls, v: str | None) -> str | None:
        if v is not None and v not in DURACIONES:
            raise ValueError(f"duracion must be one of {DURACIONES}")
        return v


class MateriaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    semestre_id: int
    nombre: str
    codigo: str | None
    creditos: int | None
    profesor: str | None
    estado: str
    duracion: str | None
