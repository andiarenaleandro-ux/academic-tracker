import { useCronograma, type CronogramaItem } from "../hooks/useClases";
import { Card } from "../components/ui/card";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function generarSlots(): string[] {
  const slots: string[] = [];
  for (let h = 17; h <= 22; h++) {
    slots.push(`${h.toString().padStart(2, "0")}:00`);
    if (!(h === 22)) slots.push(`${h.toString().padStart(2, "0")}:30`);
  }
  return slots;
}

const SLOTS = generarSlots();

function parseHora(hora: string): { h: number; m: number } {
  const [hs, ms] = hora.split(":");
  return { h: Number(hs), m: Number(ms) };
}

function tiempoTop(hora: string): number {
  const { h, m } = parseHora(hora);
  return ((h - 17) * 60 + m) / 30;
}

function alturaSlot(horaInicio: string, horaFin: string): number {
  const start = tiempoTop(horaInicio);
  const { h, m } = parseHora(horaFin);
  const end = ((h - 17) * 60 + m) / 30;
  return end - start;
}

export default function CronogramaPage() {
  const { data: cronograma, isLoading } = useCronograma();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Cronograma Semanal</h1>

      <Card className="overflow-auto">
        <div
          className="grid"
          style={{
            gridTemplateColumns: "80px repeat(7, 1fr)",
          }}
        >
          {/* header row (grid-row: 1) */}
          <div className="sticky left-0 bg-zinc-800 z-10 border-b border-zinc-700" />
          {DIAS.map((d) => (
            <div
              key={d}
              className="px-3 py-2 text-center text-sm font-semibold bg-zinc-800 text-zinc-200 border-l border-b border-zinc-700"
            >
              {d}
            </div>
          ))}

          {/* grid lines (time labels + empty cells) rendered first so blocks overlay them */}
          {SLOTS.map((slot, si) => {
            const row = si + 2;
            return (
              <div key={slot} className="contents">
                <div
                  className="text-xs text-zinc-500 text-right pr-2 py-3 border-b border-zinc-800/50 sticky left-0 bg-zinc-900"
                  style={{ gridRow: row, gridColumn: 1 }}
                >
                  {slot}
                </div>
                {DIAS.map((_, di) => (
                  <div
                    key={di}
                    className="border-l border-b border-zinc-800/30"
                    style={{ gridRow: row, gridColumn: di + 2 }}
                  />
                ))}
              </div>
            );
          })}

          {/* blocks rendered on top */}
          {!isLoading && cronograma?.map((item: CronogramaItem) => {
            const top = tiempoTop(item.hora_inicio);
            const h = alturaSlot(item.hora_inicio, item.hora_fin);
            return (
              <div
                key={`${item.materia_id}-${item.dia_semana}-${item.hora_inicio}`}
                className="rounded px-2 py-1 text-xs font-medium overflow-hidden"
                style={{
                  gridRow: `${top + 2} / span ${h}`,
                  gridColumn: item.dia_semana + 1,
                  backgroundColor: item.materia_color,
                  color: "#fff",
                }}
              >
                <div className="font-semibold leading-tight">{item.materia_nombre}</div>
                <div className="opacity-80 leading-tight">{item.hora_inicio} - {item.hora_fin}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {!isLoading && cronograma?.length === 0 && (
        <p className="text-center text-zinc-500 mt-8">No hay clases con horarios cargados.</p>
      )}
    </div>
  );
}
