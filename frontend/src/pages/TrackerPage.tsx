import { Link } from "react-router-dom";
import { useCarreraContext } from "../context/CarreraContext";
import { useMaterias, type Materia } from "../hooks/useMaterias";
import { useTareas, useUpdateTarea, type Tarea } from "../hooks/useTareas";

const tipoLabels: Record<string, string> = {
  teoria: "Teoría",
  practica: "Práctica",
  tp: "TP",
  entrega: "Entrega",
  examen: "Examen",
  otro: "Otro",
};

function localDateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtDate(d: string) {
  return d.split("-").reverse().join("/");
}

type DueState = "vencida" | "proxima" | "planeada";

function dueState(t: Tarea, today: string, week: string): DueState | null {
  if (!t.fecha_limite) return null;
  if (t.fecha_limite < today) return "vencida";
  if (t.fecha_limite <= week) return "proxima";
  return "planeada";
}

const dueStyles: Record<DueState, string> = {
  vencida: "border-red-800/60 bg-red-950/20",
  proxima: "border-amber-700/50 bg-amber-950/10",
  planeada: "border-zinc-800 bg-zinc-900",
};

const dueDateColor: Record<DueState, string> = {
  vencida: "text-red-400",
  proxima: "text-amber-300",
  planeada: "text-zinc-500",
};

function MetricCard({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className={`rounded-lg p-5 ${className ?? "bg-zinc-800/40 border border-zinc-700/50"}`}>
      <p className="text-sm text-zinc-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-zinc-100">{value}</p>
    </div>
  );
}

export default function TrackerPage() {
  const { carreraId, carreras } = useCarreraContext();
  const { data: materias, isLoading: loadingMaterias } = useMaterias({ estado: "cursando" });
  const { data: tareas, isLoading: loadingTareas } = useTareas();
  const updateTarea = useUpdateTarea();

  const today = localDateString(new Date());
  const weekDate = new Date();
  weekDate.setDate(weekDate.getDate() + 7);
  const week = localDateString(weekDate);

  if (carreraId === null) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-1">Tracker de materias</h1>
        <p className="text-sm text-zinc-500 mb-6">Avisos y pendientes de tus materias en curso.</p>
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          {carreras.length === 0 ? (
            <>
              <p className="text-zinc-400 text-lg">Todavía no tenés ninguna carrera.</p>
              <Link
                to="/nueva-carrera"
                className="inline-flex items-center justify-center px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-sm font-medium text-zinc-300 transition-colors"
              >
                Crear mi primera carrera
              </Link>
            </>
          ) : (
            <p className="text-zinc-400 text-lg">Seleccioná una carrera en el panel lateral.</p>
          )}
        </div>
      </div>
    );
  }

  if (loadingMaterias || loadingTareas) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Tracker de materias</h1>
        <p className="text-zinc-500">Cargando...</p>
      </div>
    );
  }

  const tareasPorMateria = new Map<number, Tarea[]>();
  for (const t of tareas ?? []) {
    const list = tareasPorMateria.get(t.materia_id) ?? [];
    list.push(t);
    tareasPorMateria.set(t.materia_id, list);
  }

  const todas = tareas ?? [];
  const pendientes = todas.filter((t) => !t.completado);
  const vencidas = pendientes.filter((t) => t.fecha_limite && t.fecha_limite < today);
  const porVenecer = pendientes.filter((t) => t.fecha_limite && t.fecha_limite >= today && t.fecha_limite <= week);
  const completadas = todas.filter((t) => t.completado);

  const toggleTarea = (t: Tarea) => {
    updateTarea.mutate({
      id: t.id,
      titulo: t.titulo,
      tipo: t.tipo,
      semana: t.semana,
      prioridad: t.prioridad,
      fecha_limite: t.fecha_limite,
      completado: !t.completado,
    });
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold mb-1">Tracker de materias</h1>
      <p className="text-sm text-zinc-500">Avisos y pendientes de tus materias en curso.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Pendientes" value={pendientes.length} className="bg-sky-950/30 border border-sky-900/50" />
        <MetricCard label="Vencidas" value={vencidas.length} className="bg-red-950/40 border border-red-900/50" />
        <MetricCard label="Por vencer (7 días)" value={porVenecer.length} className="bg-amber-950/40 border border-amber-900/50" />
        <MetricCard label="Completadas" value={completadas.length} className="bg-emerald-950/30 border border-emerald-900/50" />
      </div>

      {(!materias || materias.length === 0) && (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <p className="text-zinc-400 text-lg">No hay materias en estado "cursando".</p>
          <Link
            to="/materias"
            className="inline-flex items-center justify-center px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-sm font-medium text-zinc-300 transition-colors"
          >
            Ir a Materias
          </Link>
        </div>
      )}

      {materias && materias.length > 0 && (
        <div className="space-y-5">
          {materias.map((m: Materia) => {
            const items = tareasPorMateria.get(m.id) ?? [];
            const pendientesMateria = items
              .filter((t) => !t.completado)
              .sort((a, b) => (a.fecha_limite ?? "9999").localeCompare(b.fecha_limite ?? "9999"));
            const completadasMateria = items.filter((t) => t.completado);

            return (
              <div key={m.id} className={`rounded-lg border ${pendientesMateria.some((t) => dueState(t, today, week) === "vencida") ? "border-red-800/50" : "border-zinc-800"} bg-zinc-900`}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                  <Link to={`/materias/${m.id}`} className="font-semibold hover:text-violet-300">
                    {m.nombre}
                  </Link>
                  <span className="text-xs text-zinc-500">
                    {pendientesMateria.length} pendientes · {completadasMateria.length} completadas
                  </span>
                </div>

                {items.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-zinc-500">Sin tareas cargadas. <Link to={`/materias/${m.id}`} className="text-violet-400 hover:text-violet-300">Cargar →</Link></p>
                ) : pendientesMateria.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-emerald-400/80">Sin pendientes. ¡Materia al día!</p>
                ) : (
                  <ul className="divide-y divide-zinc-800/70">
                    {pendientesMateria.map((t) => {
                      const state = dueState(t, today, week);
                      return (
                        <li key={t.id} className={`flex items-center gap-3 px-4 py-2.5 border-l-2 ${state ? dueStyles[state] : "border-l-transparent bg-zinc-900"}`}>
                          <input
                            type="checkbox"
                            checked={t.completado}
                            onChange={() => toggleTarea(t)}
                            className="h-4 w-4 accent-violet-600 rounded cursor-pointer flex-shrink-0"
                          />
                          <span className="text-sm">{t.titulo}</span>
                          {t.semana && <span className="text-xs text-zinc-600">Sem {t.semana}</span>}
                          <span className="text-xs text-zinc-500">{tipoLabels[t.tipo] ?? t.tipo}</span>
                          {t.fecha_limite && (
                            <span className={`text-xs font-medium ${state ? dueDateColor[state] : "text-zinc-500"}`}>
                              {state === "vencida" ? "venció " : state === "proxima" ? "vence " : "para "}
                              {fmtDate(t.fecha_limite)}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}