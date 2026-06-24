import { useState } from "react";
import { Link } from "react-router-dom";
import { useSemestres } from "../hooks/useSemestres";
import { useMaterias } from "../hooks/useMaterias";
import { usePromedios } from "../hooks/useAnalytics";
import { useCorrelativas } from "../hooks/useCorrelativas";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";

const estadoColors: Record<string, string> = {
  aprobada: "border-emerald-500/60 bg-emerald-950/20",
  cursando: "border-sky-500/60 bg-sky-950/20",
  pendiente: "border-zinc-700/60 bg-zinc-900/50",
  recursando: "border-rose-500/60 bg-rose-950/20",
  libre: "border-red-500/60 bg-red-950/20",
};

const estadoLabels: Record<string, string> = {
  aprobada: "Aprobada",
  cursando: "Cursando",
  pendiente: "Pendiente",
  recursando: "Recursando",
  libre: "Libre",
};

const semestreLabels: Record<number, string> = {
  1: "1°",
  2: "2°",
  3: "3°",
  4: "4°",
  5: "5°",
  6: "6°",
  7: "7°",
  8: "8°",
  9: "9°",
  10: "10°",
};

export default function PlanPage() {
  const [selectedMateriaId, setSelectedMateriaId] = useState<number | null>(null);
  const { data: semestres } = useSemestres();
  const { data: materias } = useMaterias();
  const { data: promedios } = usePromedios();
  const { data: correlativas } = useCorrelativas();

  const notaMap = new Map<number, number | null>();
  if (promedios) {
    for (const sem of promedios.semestres) {
      for (const m of sem.materias) {
        notaMap.set(m.id, m.promedio);
      }
    }
  }

  const correlativasMap = new Map<number, Set<number>>();
  if (correlativas) {
    for (const item of correlativas) {
      const ids = new Set(item.correlativas.map((c) => c.id));
      correlativasMap.set(item.id, ids);
    }
  }

  const dependientesMap = new Map<number, Set<number>>();
  if (correlativas) {
    for (const item of correlativas) {
      for (const corr of item.correlativas) {
        if (!dependientesMap.has(corr.id)) dependientesMap.set(corr.id, new Set());
        dependientesMap.get(corr.id)!.add(item.id);
      }
    }
  }

  const highlighted = new Set<number>();
  if (selectedMateriaId) {
    highlighted.add(selectedMateriaId);
    const prereqs = correlativasMap.get(selectedMateriaId);
    if (prereqs) for (const id of prereqs) highlighted.add(id);
    const dependents = dependientesMap.get(selectedMateriaId);
    if (dependents) for (const id of dependents) highlighted.add(id);
  }

  const materiasPorSemestre = new Map<number, typeof materias>();
  if (materias && semestres) {
    for (const sem of semestres) {
      const ms = materias.filter((m) => m.semestre_id === sem.id);
      if (ms.length > 0) materiasPorSemestre.set(sem.numero, ms);
    }
  }

  const nums = [...materiasPorSemestre.keys()].sort((a, b) => a - b);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Plan de Estudios</h1>
      <p className="text-sm text-zinc-500 mb-6">Hacé clic en una materia para ver sus correlativas.</p>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {nums.map((num) => (
          <div key={num} className="flex-shrink-0 w-56">
            <h2 className="text-sm font-semibold text-zinc-400 mb-3 sticky top-0 bg-zinc-950 py-2">
              {semestreLabels[num] ?? `${num}°`} Semestre
            </h2>
            <div className="space-y-2">
              {materiasPorSemestre.get(num)?.map((m) => {
                const nota = notaMap.get(m.id);
                const isHighlighted = highlighted.has(m.id);
                const isSelected = selectedMateriaId === m.id;
                const hasCorr = correlativasMap.get(m.id);
                const isBlocked = hasCorr && m.estado === "pendiente";

                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMateriaId(isSelected ? null : m.id)}
                    className={`rounded-lg border p-3 cursor-pointer transition-all duration-150 ${
                      estadoColors[m.estado] ?? "border-zinc-700/60 bg-zinc-900/50"
                    } ${
                      isSelected
                        ? "ring-2 ring-zinc-400 scale-[1.02]"
                        : isHighlighted
                          ? "ring-1 ring-zinc-500 brightness-125"
                          : "hover:brightness-110"
                    }`}
                  >
                    <Link
                      to={`/materias/${m.id}`}
                      className="text-sm font-medium text-zinc-100 hover:underline block mb-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {m.nombre}
                    </Link>
                    <div className="flex items-center gap-2 text-xs">
                      {m.codigo && <span className="text-zinc-600 font-mono">{m.codigo}</span>}
                      <Badge color={m.estado}>
                        {isBlocked ? "Bloqueada" : estadoLabels[m.estado] ?? m.estado}
                      </Badge>
                    </div>
                    {nota != null && (
                      <p className={`text-xs mt-1 ${nota >= 4 ? "text-emerald-400" : "text-red-400"}`}>
                        Nota: {nota.toFixed(2)}
                      </p>
                    )}
                    {hasCorr && hasCorr.size > 0 && (
                      <p className="text-[10px] text-zinc-600 mt-1">{hasCorr.size} correlativa{hasCorr.size > 1 ? "s" : ""}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedMateriaId && correlativas && (() => {
        const item = correlativas.find((c) => c.id === selectedMateriaId);
        if (!item) return null;
        const prereqs = item.correlativas;
        const dependents = dependientesMap.get(selectedMateriaId);
        return (
          <Card className="mt-6 p-4 max-w-xl">
            <h3 className="text-sm font-semibold text-zinc-300 mb-2">{item.nombre}</h3>
            {prereqs.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-zinc-500 mb-1">Correlativas requeridas:</p>
                <div className="flex flex-wrap gap-2">
                  {prereqs.map((c) => (
                    <Badge key={c.id} color={c.estado}>{c.nombre}</Badge>
                  ))}
                </div>
              </div>
            )}
            {dependents && dependents.size > 0 && (
              <div>
                <p className="text-xs text-zinc-500 mb-1">Es correlativa de:</p>
                <div className="flex flex-wrap gap-2">
                  {[...dependents].map((id) => {
                    const dep = correlativas.find((c) => c.id === id);
                    if (!dep) return null;
                    return <Badge key={id} color={dep.estado}>{dep.nombre}</Badge>;
                  })}
                </div>
              </div>
            )}
            {prereqs.length === 0 && (!dependents || dependents.size === 0) && (
              <p className="text-xs text-zinc-600">Sin correlativas</p>
            )}
          </Card>
        );
      })()}
    </div>
  );
}
