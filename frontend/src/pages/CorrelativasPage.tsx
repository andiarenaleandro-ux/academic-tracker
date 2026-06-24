import { useCorrelativas, type MateriaCorrelativas } from "../hooks/useCorrelativas";

const tipoLabels: Record<string, string> = {
  promocionada: "Promocionada",
  equivalencia_aprobada: "Equivalencia aprobada",
  aprobada: "Aprobada",
};

const bgColors: Record<string, string> = {
  aprobada: "bg-emerald-900/30 border-emerald-700",
  cursando: "bg-zinc-800 border-zinc-700",
  pendiente: "bg-zinc-800 border-zinc-700",
  recursando: "bg-red-900/30 border-red-700",
  libre: "bg-red-900/30 border-red-700",
};

const semestreColors = [
  "text-sky-400",
  "text-teal-400",
  "text-violet-400",
  "text-rose-400",
  "text-amber-400",
  "text-lime-400",
];

function Card({ m }: { m: MateriaCorrelativas }) {
  const bg = bgColors[m.estado] ?? "bg-zinc-800 border-zinc-700";
  return (
    <div className={`rounded-lg border p-4 ${bg}`}>
      <h3 className="font-semibold text-zinc-100 mb-2">{m.nombre}</h3>
      {m.correlativas.length === 0 ? (
        <p className="text-xs text-zinc-500">Sin correlativas</p>
      ) : (
        <ul className="space-y-1">
          {m.correlativas.map((c) => (
            <li key={c.id} className="text-xs flex items-center gap-2">
              <span className="text-zinc-400">{c.nombre}</span>
              {c.tipo && (
                <span className="text-zinc-600">({tipoLabels[c.tipo] ?? c.tipo})</span>
              )}
              <span
                className={`ml-auto w-2 h-2 rounded-full ${
                  c.estado === "aprobada" ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CorrelativasPage() {
  const { data, isLoading, error } = useCorrelativas();

  if (isLoading) return <div className="p-8 text-zinc-500">Cargando...</div>;
  if (error || !data) return <div className="p-8 text-red-400">Error al cargar</div>;

  const grouped: Record<string, MateriaCorrelativas[]> = {};
  for (const m of data) {
    const key = String(m.semestre_numero);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Correlativas</h1>
      {Object.entries(grouped)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([sem, materias]) => {
          const semNum = Number(sem);
          const sc = semestreColors[(semNum - 1) % semestreColors.length];
          return (
            <section key={sem}>
              <h2 className={`text-lg font-semibold mb-4 ${sc}`}>{sem}° Semestre</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {materias.map((m) => (
                  <Card key={m.id} m={m} />
                ))}
              </div>
            </section>
          );
        })}
    </div>
  );
}
