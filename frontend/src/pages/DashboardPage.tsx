import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Link } from "react-router-dom";
import { usePromedios, type SemestrePromedio } from "../hooks/useAnalytics";
import { useCarreraContext } from "../context/CarreraContext";
import { useEvaluaciones, type Evaluacion } from "../hooks/useEvaluaciones";
import { useMaterias } from "../hooks/useMaterias";

const semestreColors = [
  "#38bdf8", "#2dd4bf", "#a78bfa", "#fb7185", "#fbbf24", "#a3e635",
];
function PromedioCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-lg p-6">
      <p className="text-sm text-zinc-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-zinc-100">
        {value !== null ? value.toFixed(2) : "—"}
      </p>
    </div>
  );
}

function ResumenCard({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className={`rounded-lg p-6 ${className ?? "bg-zinc-800/40 border border-zinc-700/50"}`}>
      <p className="text-sm text-zinc-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-zinc-100">{value}</p>
    </div>
  );
}

function AvanceCard({ aprobadas, total, promedio }: { aprobadas: number; total: number; promedio: number | null }) {
  const pct = total > 0 ? Math.round((aprobadas / total) * 100) : 0;
  return (
    <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-lg p-6 flex flex-col justify-between">
      <p className="text-sm text-zinc-400 mb-1">Avance de carrera</p>
      <p className="text-3xl font-bold text-indigo-300">{pct}%</p>
      <div className="w-full bg-indigo-950/50 rounded-full h-2 mt-2 mb-2">
        <div className="bg-indigo-400 rounded-full h-2 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-zinc-500">
        {aprobadas} / {total} materias
        {promedio !== null && (
          <span className="ml-2 text-indigo-300 font-medium">· Promedio: {promedio.toFixed(2)}</span>
        )}
      </p>
    </div>
  );
}

function SemestreChart({ semestre }: { semestre: SemestrePromedio }) {
  const color = semestreColors[(semestre.numero - 1) % semestreColors.length];
  const data = semestre.materias.map((m) => ({
    name: m.nombre.length > 25 ? m.nombre.slice(0, 22) + "..." : m.nombre,
    promedio: m.promedio,
  }));

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 border-t-2" style={{ borderTopColor: color }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color }}>
        {semestre.numero}° Semestre
        <span className="ml-3 text-zinc-600 font-normal">
          con: {semestre.promedio_con_aplazos?.toFixed(2) ?? "—"} / sin: {semestre.promedio_sin_aplazos?.toFixed(2) ?? "—"}
        </span>
      </h3>
      {data.some((d) => d.promedio !== null) ? (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis domain={[0, 10]} tick={{ fill: "#a1a1aa", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#e4e4e7" }}
            />
            <Bar dataKey="promedio" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-zinc-600 text-sm py-8 text-center">Sin evaluaciones cargadas</p>
      )}
    </div>
  );
}

const evalLabels: Record<string, string> = {
  parcial: "Parcial",
  recuperatorio: "Recuperatorio",
  tp: "TP",
  final: "Final",
  coloquio: "Coloquio",
};

const evalColors: Record<string, string> = {
  parcial: "bg-blue-500/10 border-blue-500/30 text-blue-300",
  recuperatorio: "bg-amber-500/10 border-amber-500/30 text-amber-300",
  tp: "bg-violet-500/10 border-violet-500/30 text-violet-300",
  final: "bg-red-500/10 border-red-500/30 text-red-300",
  coloquio: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
};

export default function DashboardPage() {
  const { carreraId } = useCarreraContext();
  const { data, isLoading, error } = usePromedios();
  const { data: evaluaciones } = useEvaluaciones();
  const { data: materias } = useMaterias();

  const materiaMap = new Map<number, string>();
  if (materias) for (const m of materias) materiaMap.set(m.id, m.nombre);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (evaluaciones ?? [])
    .filter((e) => e.fecha && e.fecha >= today)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  if (isLoading || carreraId === null) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <p className="text-zinc-500">Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <p className="text-red-400">Error al cargar datos: {error?.toString()}</p>
      </div>
    );
  }

  if (!data || data.total_materias === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <p className="text-zinc-400 text-lg">No hay materias cargadas para esta carrera.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <AvanceCard aprobadas={data.aprobadas} total={data.total_materias} promedio={data.promedio_general_con_aplazos} />
        <PromedioCard label="Promedio (sin aplazos)" value={data.promedio_general_sin_aplazos} />
        <ResumenCard label="Aprobadas" value={data.aprobadas} className="bg-emerald-950/30 border border-emerald-900/50" />
        <ResumenCard label="Cursando" value={data.cursando} className="bg-sky-950/30 border border-sky-900/50" />
        <ResumenCard label="Pendientes" value={data.pendientes} className="bg-amber-950/30 border border-amber-900/50" />
        <ResumenCard label="Total materias" value={data.total_materias} className="bg-zinc-800/40 border border-zinc-700/50" />
      </div>

      {upcoming.length > 0 && (
        <>
          <h2 className="text-lg font-semibold pt-2">Próximas evaluaciones</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {upcoming.map((e: Evaluacion) => (
              <Link
                key={e.id}
                to={`/materias/${e.materia_id}`}
                className={`rounded-lg border p-3 block ${evalColors[e.tipo] ?? "bg-zinc-800/40 border-zinc-700/50 text-zinc-300"} hover:brightness-110 transition-all`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wide">{evalLabels[e.tipo] ?? e.tipo}</span>
                  <span className="text-xs opacity-70">{e.fecha.split("-").reverse().join("/")}</span>
                </div>
                <p className="text-sm font-medium text-zinc-100">{materiaMap.get(e.materia_id) ?? `ID ${e.materia_id}`}</p>
                {e.hora && <p className="text-xs text-zinc-500 mt-1">{e.hora.slice(0, 5)} hs</p>}
              </Link>
            ))}
          </div>
        </>
      )}

      <h2 className="text-lg font-semibold pt-4">Promedios por semestre</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.semestres.map((sem) => (
          <SemestreChart key={sem.numero} semestre={sem} />
        ))}
      </div>
    </div>
  );
}
