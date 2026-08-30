import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "../lib/api";
import { useCarreraContext } from "../context/CarreraContext";

export type Tarea = {
  id: number;
  materia_id: number;
  titulo: string;
  tipo: string;
  semana: number;
  prioridad: string;
  fecha_limite: string | null;
  completado: boolean;
  notas: string | null;
};

export type TareaForm = {
  materia_id: number;
  titulo: string;
  tipo: string;
  semana: number;
  prioridad: string;
  fecha_limite?: string | null;
  completado?: boolean;
  notas?: string | null;
};

export function useTareas(materia_id?: number) {
  const { carreraId } = useCarreraContext();
  return useQuery({
    queryKey: ["tareas", carreraId, materia_id],
    queryFn: () => {
      const params = new URLSearchParams();
      if (carreraId !== null) params.set("carrera_id", String(carreraId));
      if (materia_id) params.set("materia_id", String(materia_id));
      const qs = params.toString();
      return apiGet<Tarea[]>(`/tareas${qs ? `?${qs}` : ""}`);
    },
    enabled: carreraId !== null,
  });
}

export function useCreateTarea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TareaForm) => apiPost<Tarea>("/tareas", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tareas"] }),
  });
}

export function useUpdateTarea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<TareaForm> & { id: number }) =>
      apiPatch<Tarea>(`/tareas/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tareas"] }),
  });
}

export function useDeleteTarea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/tareas/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tareas"] }),
  });
}