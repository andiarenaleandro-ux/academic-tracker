import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "../lib/api";
import { useCarreraContext } from "../context/CarreraContext";

export type Clase = {
  id: number;
  materia_id: number;
  fecha: string | null;
  asistio: boolean;
  tema: string | null;
  notas: string | null;
  dia_semana: number | null;
  hora_inicio: string | null;
  hora_fin: string | null;
};

export type ClaseForm = {
  materia_id: number;
  fecha?: string | null;
  asistio?: boolean;
  tema?: string | null;
  notas?: string | null;
  dia_semana?: number | null;
  hora_inicio?: string | null;
  hora_fin?: string | null;
};

export type CronogramaItem = {
  materia_id: number;
  materia_nombre: string;
  materia_color: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
};

export function useClases(materia_id?: number) {
  return useQuery({
    queryKey: ["clases", materia_id],
    queryFn: () => {
      const qs = materia_id ? `?materia_id=${materia_id}` : "";
      return apiGet<Clase[]>(`/clases${qs}`);
    },
  });
}

export function useCronograma() {
  const { carreraId } = useCarreraContext();
  return useQuery({
    queryKey: ["cronograma", carreraId],
    queryFn: () => apiGet<CronogramaItem[]>(`/cronograma${carreraId !== null ? `?carrera_id=${carreraId}` : ""}`),
    enabled: carreraId !== null,
  });
}

export function useCreateClase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ClaseForm) => apiPost<Clase>("/clases", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clases"] });
      qc.invalidateQueries({ queryKey: ["cronograma"] });
    },
  });
}

export function useUpdateClase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: ClaseForm & { id: number }) =>
      apiPatch<Clase>(`/clases/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clases"] });
      qc.invalidateQueries({ queryKey: ["cronograma"] });
    },
  });
}

export function useDeleteClase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/clases/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clases"] });
      qc.invalidateQueries({ queryKey: ["cronograma"] });
    },
  });
}
