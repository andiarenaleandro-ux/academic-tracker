from sqlalchemy import ForeignKey, UniqueConstraint, Integer, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Semestre(Base):
    __tablename__ = "semestres"

    id: Mapped[int] = mapped_column(primary_key=True)
    carrera_id: Mapped[int] = mapped_column(ForeignKey("carreras.id"))
    numero: Mapped[int]
    anio: Mapped[int]
    fecha_inicio: Mapped[str] = mapped_column(Date)
    fecha_fin: Mapped[str] = mapped_column(Date)

    carrera: Mapped["Carrera"] = relationship(back_populates="semestres")
    materias: Mapped[list["Materia"]] = relationship(back_populates="semestre", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("carrera_id", "numero", "anio", name="uq_semestre_carrera_numero_anio"),
    )
