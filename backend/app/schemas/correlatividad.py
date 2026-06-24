from pydantic import BaseModel, ConfigDict


class CorrelatividadRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    materia_id: int
    correlativa_id: int
    tipo: str
