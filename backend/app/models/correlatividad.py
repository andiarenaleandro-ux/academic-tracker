from sqlalchemy import ForeignKey, String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Correlatividad(Base):
    __tablename__ = "correlatividades"

    id: Mapped[int] = mapped_column(primary_key=True)
    materia_id: Mapped[int] = mapped_column(ForeignKey("materias.id"), index=True)
    correlativa_id: Mapped[int] = mapped_column(ForeignKey("materias.id"))
    tipo: Mapped[str] = mapped_column(String(30))

    materia: Mapped["Materia"] = relationship(foreign_keys=[materia_id], back_populates="correlatividades")
    correlativa: Mapped["Materia"] = relationship(foreign_keys=[correlativa_id])
