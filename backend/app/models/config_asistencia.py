from sqlalchemy import ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class ConfigAsistencia(Base):
    __tablename__ = "config_asistencia"

    materia_id: Mapped[int] = mapped_column(ForeignKey("materias.id"), primary_key=True)
    asistencia_minima_pct: Mapped[float] = mapped_column(Float, default=75.0)

    materia: Mapped["Materia"] = relationship(back_populates="config_asistencia")
