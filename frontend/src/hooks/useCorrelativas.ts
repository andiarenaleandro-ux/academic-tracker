import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import { useCarreraContext } from "../context/CarreraContext";

export interface CorrelativaItem {
  id: number;
  nombre: string;
  tipo: string;
  estado: string;
}

export interface MateriaCorrelativas {
  id: number;
  nombre: string;
  estado: string;
  semestre_numero: number;
  correlativas: CorrelativaItem[];
}

export function useCorrelativas() {
  const { carreraId } = useCarreraContext();
  return useQuery<MateriaCorrelativas[]>({
    queryKey: ["correlatividades", carreraId],
    queryFn: () => apiGet(`/correlatividades${carreraId !== null ? `?carrera_id=${carreraId}` : ""}`),
    enabled: carreraId !== null,
  });
}
