from datetime import date
from sqlalchemy import ForeignKey, String, Integer, Date, Boolean, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Tarea(Base):
    __tablename__ = "tareas"

    id: Mapped[int] = mapped_column(primary_key=True)
    materia_id: Mapped[int] = mapped_column(ForeignKey("materias.id"), index=True)
    titulo: Mapped[str] = mapped_column(String(200))
    tipo: Mapped[str] = mapped_column(String(20))
    semana: Mapped[int] = mapped_column(Integer)
    prioridad: Mapped[str] = mapped_column(String(10), default="media")
    fecha_limite: Mapped[date | None] = mapped_column(Date)
    completado: Mapped[bool] = mapped_column(Boolean, default=False)
    notas: Mapped[str | None] = mapped_column(String(500))

    materia: Mapped["Materia"] = relationship(back_populates="tareas")

    __table_args__ = (
        CheckConstraint("tipo IN ('teoria', 'practica', 'tp', 'entrega', 'examen', 'otro')", name="ck_tarea_tipo"),
        CheckConstraint("prioridad IN ('alta', 'media', 'baja')", name="ck_tarea_prioridad"),
    )