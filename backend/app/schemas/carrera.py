from pydantic import BaseModel, ConfigDict


class CarreraCreate(BaseModel):
    nombre: str
    escala_nota_min: int = 0
    escala_nota_max: int = 10
    nota_aprobacion: float = 4.0


class CarreraUpdate(BaseModel):
    nombre: str | None = None
    escala_nota_min: int | None = None
    escala_nota_max: int | None = None
    nota_aprobacion: float | None = None


class CarreraRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    escala_nota_min: int
    escala_nota_max: int
    nota_aprobacion: float
