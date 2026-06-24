import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "../lib/api";
import { useCarreraContext } from "../context/CarreraContext";

export type Evaluacion = {
  id: number;
  materia_id: number;
  tipo: string;
  fecha: string;
  hora: string | null;
  peso: number;
  nota_obtenida: number | null;
  nota_simulada: number | null;
  notas: string | null;
};

export type EvaluacionForm = {
  materia_id: number;
  tipo: string;
  fecha: string;
  hora?: string | null;
  peso?: number;
  nota_obtenida?: number | null;
  nota_simulada?: number | null;
  notas?: string | null;
};

export function useEvaluaciones(materia_id?: number) {
  const { carreraId } = useCarreraContext();
  return useQuery({
    queryKey: ["evaluaciones", carreraId, materia_id],
    queryFn: () => {
      const params = new URLSearchParams();
      if (carreraId !== null) params.set("carrera_id", String(carreraId));
      if (materia_id) params.set("materia_id", String(materia_id));
      const qs = params.toString();
      return apiGet<Evaluacion[]>(`/evaluaciones${qs ? `?${qs}` : ""}`);
    },
    enabled: carreraId !== null,
  });
}

export function useCreateEvaluacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: EvaluacionForm) => apiPost<Evaluacion>("/evaluaciones", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["evaluaciones"] }),
  });
}

export function useUpdateEvaluacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: EvaluacionForm & { id: number }) =>
      apiPatch<Evaluacion>(`/evaluaciones/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["evaluaciones"] }),
  });
}

export function useDeleteEvaluacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/evaluaciones/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["evaluaciones"] }),
  });
}
