import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import { useCarreraContext } from "../context/CarreraContext";

export type Semestre = {
  id: number;
  carrera_id: number;
  numero: number;
  anio: number;
  fecha_inicio: string;
  fecha_fin: string;
};

export function useSemestres() {
  const { carreraId } = useCarreraContext();
  return useQuery({
    queryKey: ["semestres", carreraId],
    queryFn: () => apiGet<Semestre[]>(`/semestres${carreraId !== null ? `?carrera_id=${carreraId}` : ""}`),
    enabled: carreraId !== null,
  });
}
