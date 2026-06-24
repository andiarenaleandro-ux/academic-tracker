import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "../lib/api";
import { useCarreraContext } from "../context/CarreraContext";

export type Materia = {
  id: number;
  semestre_id: number;
  nombre: string;
  codigo: string | null;
  creditos: number | null;
  profesor: string | null;
  estado: string;
};

export type MateriaForm = {
  semestre_id?: number;
  nombre?: string;
  codigo?: string | null;
  creditos?: number | null;
  profesor?: string | null;
  estado?: string;
};

export function useMaterias(filters?: { semestre_id?: number; estado?: string }) {
  const { carreraId } = useCarreraContext();
  const params = new URLSearchParams();
  if (carreraId !== null) params.set("carrera_id", String(carreraId));
  if (filters?.semestre_id) params.set("semestre_id", String(filters.semestre_id));
  if (filters?.estado) params.set("estado", filters.estado);
  const qs = params.toString();
  return useQuery({
    queryKey: ["materias", carreraId, filters],
    queryFn: () => apiGet<Materia[]>(`/materias${qs ? `?${qs}` : ""}`),
    enabled: carreraId !== null,
  });
}

export function useMateria(id: number) {
  return useQuery({
    queryKey: ["materias", id],
    queryFn: () => apiGet<Materia>(`/materias/${id}`),
    enabled: !!id,
  });
}

export function useCreateMateria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MateriaForm) => apiPost<Materia>("/materias", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materias"] }),
  });
}

export function useUpdateMateria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: MateriaForm & { id: number }) =>
      apiPatch<Materia>(`/materias/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materias"] }),
  });
}

export function useDeleteMateria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/materias/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materias"] }),
  });
}
