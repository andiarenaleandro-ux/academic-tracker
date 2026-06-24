from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Carrera(Base):
    __tablename__ = "carreras"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(200), unique=True)
    escala_nota_min: Mapped[int] = mapped_column(default=0)
    escala_nota_max: Mapped[int] = mapped_column(default=10)
    nota_aprobacion: Mapped[float] = mapped_column(default=4.0)

    semestres: Mapped[list["Semestre"]] = relationship(back_populates="carrera", cascade="all, delete-orphan")
