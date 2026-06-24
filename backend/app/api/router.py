from fastapi import APIRouter

from app.api import carreras, semestres, materias, evaluaciones, clases, config_asistencia, importer, analytics, correlativas, cronograma, plan

api_router = APIRouter()

api_router.include_router(carreras.router, prefix="/carreras", tags=["carreras"])
api_router.include_router(semestres.router, prefix="/semestres", tags=["semestres"])
api_router.include_router(materias.router, prefix="/materias", tags=["materias"])
api_router.include_router(evaluaciones.router, prefix="/evaluaciones", tags=["evaluaciones"])
api_router.include_router(clases.router, prefix="/clases", tags=["clases"])
api_router.include_router(config_asistencia.router, prefix="/materias", tags=["asistencia"])
api_router.include_router(importer.router, prefix="", tags=["import"])
api_router.include_router(analytics.router, prefix="", tags=["analytics"])
api_router.include_router(correlativas.router, prefix="", tags=["correlativas"])
api_router.include_router(cronograma.router, prefix="/cronograma", tags=["cronograma"])
api_router.include_router(plan.router, prefix="", tags=["plan"])
