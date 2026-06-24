import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import { useCarreraContext } from "../context/CarreraContext";

export interface MateriaPromedio {
  id: number;
  nombre: string;
  promedio: number | null;
  estado: string;
}

export interface SemestrePromedio {
  numero: number;
  promedio_con_aplazos: number | null;
  promedio_sin_aplazos: number | null;
  materias: MateriaPromedio[];
}

export interface Promedios {
  promedio_general_con_aplazos: number | null;
  promedio_general_sin_aplazos: number | null;
  total_materias: number;
  aprobadas: number;
  cursando: number;
  pendientes: number;
  semestres: SemestrePromedio[];
}

export function usePromedios() {
  const { carreraId } = useCarreraContext();
  return useQuery<Promedios>({
    queryKey: ["promedios", carreraId],
    queryFn: () => apiGet(`/analytics/promedios?carrera_id=${carreraId ?? 0}`),
    enabled: carreraId !== null,
  });
}
