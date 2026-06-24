import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiGet, apiDelete } from "../lib/api";

export interface Carrera {
  id: number;
  nombre: string;
  escala_nota_min: number;
  escala_nota_max: number;
  nota_aprobacion: number;
}

interface CarreraContextValue {
  carreraId: number | null;
  setCarreraId: (id: number) => void;
  carreras: Carrera[];
  carrera: Carrera | null;
  isLoading: boolean;
  refetchCarreras: () => void;
}

const CarreraContext = createContext<CarreraContextValue>({
  carreraId: null,
  setCarreraId: () => {},
  carreras: [],
  carrera: null,
  isLoading: true,
  refetchCarreras: () => {},
});

export function CarreraProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  const { data: carreras = [], isLoading } = useQuery<Carrera[]>({
    queryKey: ["carreras"],
    queryFn: () => apiGet<Carrera[]>("/carreras"),
  });

  const [carreraId, setCarreraIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem("carreraId");
    return saved ? parseInt(saved, 10) : null;
  });

  useEffect(() => {
    if (isLoading || carreras.length === 0) return;
    const exists = carreras.some((c) => c.id === carreraId);
    if (!exists && carreras[0]) {
      setCarreraIdState(carreras[0].id);
      localStorage.setItem("carreraId", String(carreras[0].id));
    }
  }, [carreras, isLoading, carreraId]);

  const setCarreraId = (id: number) => {
    localStorage.setItem("carreraId", String(id));
    setCarreraIdState(id);
    qc.invalidateQueries();
  };

  const carrera = carreras.find((c) => c.id === carreraId) ?? null;

  return (
    <CarreraContext.Provider
      value={{
        carreraId,
        setCarreraId,
        carreras,
        carrera,
        isLoading,
        refetchCarreras: () => qc.invalidateQueries({ queryKey: ["carreras"] }),
      }}
    >
      {children}
    </CarreraContext.Provider>
  );
}

export function useCarreraContext() {
  return useContext(CarreraContext);
}

export function useDeleteCarrera() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/carreras/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["carreras"] }),
  });
}
