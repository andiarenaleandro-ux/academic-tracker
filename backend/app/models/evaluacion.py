from datetime import date, time
from sqlalchemy import ForeignKey, String, Integer, Float, Date, Time, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Evaluacion(Base):
    __tablename__ = "evaluaciones"

    id: Mapped[int] = mapped_column(primary_key=True)
    materia_id: Mapped[int] = mapped_column(ForeignKey("materias.id"), index=True)
    tipo: Mapped[str] = mapped_column(String(20))
    fecha: Mapped[date] = mapped_column(Date, index=True)
    hora: Mapped[time | None] = mapped_column(Time, nullable=True)
    peso: Mapped[float] = mapped_column(Float, default=1.0)
    nota_obtenida: Mapped[float | None] = mapped_column(Float)
    nota_simulada: Mapped[float | None] = mapped_column(Float)
    notas: Mapped[str | None] = mapped_column(String(500))

    materia: Mapped["Materia"] = relationship(back_populates="evaluaciones")

    __table_args__ = (
        CheckConstraint("tipo IN ('parcial', 'recuperatorio', 'tp', 'final', 'coloquio')", name="ck_evaluacion_tipo"),
    )
