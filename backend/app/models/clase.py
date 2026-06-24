from datetime import date, time
from sqlalchemy import ForeignKey, String, Date, Boolean, Integer, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Clase(Base):
    __tablename__ = "clases"

    id: Mapped[int] = mapped_column(primary_key=True)
    materia_id: Mapped[int] = mapped_column(ForeignKey("materias.id"), index=True)
    fecha: Mapped[date | None] = mapped_column(Date, nullable=True)
    asistio: Mapped[bool] = mapped_column(Boolean, default=False)
    tema: Mapped[str | None] = mapped_column(String(200))
    notas: Mapped[str | None] = mapped_column(String(500))
    dia_semana: Mapped[int | None] = mapped_column(Integer, nullable=True)
    hora_inicio: Mapped[time | None] = mapped_column(Time, nullable=True)
    hora_fin: Mapped[time | None] = mapped_column(Time, nullable=True)

    materia: Mapped["Materia"] = relationship(back_populates="clases")
