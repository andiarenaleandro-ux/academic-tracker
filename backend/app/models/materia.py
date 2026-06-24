from sqlalchemy import ForeignKey, String, Integer, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Materia(Base):
    __tablename__ = "materias"

    id: Mapped[int] = mapped_column(primary_key=True)
    semestre_id: Mapped[int] = mapped_column(ForeignKey("semestres.id"))
    nombre: Mapped[str] = mapped_column(String(200))
    codigo: Mapped[str | None] = mapped_column(String(20))
    creditos: Mapped[int | None] = mapped_column(Integer)
    profesor: Mapped[str | None] = mapped_column(String(200))
    estado: Mapped[str] = mapped_column(String(20), default="cursando")
    duracion: Mapped[str | None] = mapped_column(String(20))

    semestre: Mapped["Semestre"] = relationship(back_populates="materias")
    evaluaciones: Mapped[list["Evaluacion"]] = relationship(back_populates="materia", cascade="all, delete-orphan")
    clases: Mapped[list["Clase"]] = relationship(back_populates="materia", cascade="all, delete-orphan")
    config_asistencia: Mapped["ConfigAsistencia | None"] = relationship(back_populates="materia", uselist=False, cascade="all, delete-orphan")
    correlatividades: Mapped[list["Correlatividad"]] = relationship(back_populates="materia", foreign_keys="Correlatividad.materia_id", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("estado IN ('cursando', 'aprobada', 'recursando', 'libre', 'pendiente')", name="ck_materia_estado"),
        CheckConstraint("duracion IS NULL OR duracion IN ('anual', 'cuatrimestral', 'semestral', 'bimestral', 'trimestral')", name="ck_materia_duracion"),
    )
