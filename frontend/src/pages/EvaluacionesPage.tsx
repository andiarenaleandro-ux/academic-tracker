import { useState } from "react";
import { useEvaluaciones, type Evaluacion } from "../hooks/useEvaluaciones";
import { useMaterias } from "../hooks/useMaterias";
import { useSemestres } from "../hooks/useSemestres";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import { Table, THead, TBody, Th, Td } from "../components/ui/table";

export default function EvaluacionesPage() {
  const [filtroMateria, setFiltroMateria] = useState("");
  const [filtroAnio, setFiltroAnio] = useState("");
  const { data: evaluaciones } = useEvaluaciones(
    filtroMateria ? Number(filtroMateria) : undefined,
  );
  const { data: materias } = useMaterias();
  const { data: semestres } = useSemestres();

  const materiaMap = new Map<number, { nombre: string; semestre_id: number }>();
  if (materias) {
    for (const m of materias) {
      materiaMap.set(m.id, { nombre: m.nombre, semestre_id: m.semestre_id });
    }
  }

  const semestreMap = new Map<number, { numero: number; anio: number }>();
  if (semestres) {
    for (const s of semestres) {
      semestreMap.set(s.id, { numero: s.numero, anio: s.anio });
    }
  }

  const aniosDisponibles = [...new Set(Array.from(semestreMap.values()).map((s) => s.anio))].sort();

  const evaluacionesFiltradas = (evaluaciones ?? []).filter((e) => {
    if (!filtroAnio) return true;
    const mat = materiaMap.get(e.materia_id);
    if (!mat) return false;
    const sem = semestreMap.get(mat.semestre_id);
    return sem?.anio === Number(filtroAnio);
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Evaluaciones</h1>

      <Card className="mb-6 p-4">
        <div className="flex gap-4">
          <div className="w-64">
            <Label>Materia</Label>
            <Select value={filtroMateria} onChange={(e) => setFiltroMateria(e.target.value)}>
              <option value="">Todas</option>
              {materias?.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </Select>
          </div>
          <div className="w-36">
            <Label>Año</Label>
            <Select value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)}>
              <option value="">Todos</option>
              {aniosDisponibles.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <THead>
            <Th>Materia</Th>
            <Th>Tipo</Th>
            <Th>Fecha</Th>
            <Th>Hora</Th>
            <Th>Nota</Th>
            <Th>Simulada</Th>
            <Th>Notas</Th>
          </THead>
          <TBody>
            {evaluacionesFiltradas.length === 0 && (
              <tr><Td colSpan={7} className="text-center text-zinc-500 py-8">Sin evaluaciones</Td></tr>
            )}
            {evaluacionesFiltradas.map((e: Evaluacion) => (
              <tr key={e.id}>
                <Td className="text-zinc-500">{materiaMap.get(e.materia_id)?.nombre ?? `ID ${e.materia_id}`}</Td>
                <Td><Badge color={e.tipo}>{e.tipo}</Badge></Td>
                <Td>{e.fecha}</Td>
                <Td className="text-zinc-500">{e.hora ? e.hora.slice(0, 5) : "—"}</Td>
                <Td className={e.nota_obtenida != null && e.nota_obtenida >= 4 ? "text-green-400" : e.nota_obtenida != null ? "text-red-400" : ""}>
                  {e.nota_obtenida ?? "—"}
                </Td>
                <Td className="text-zinc-500">{e.nota_simulada ?? "—"}</Td>
                <Td className="text-zinc-500 text-xs max-w-[150px] truncate">{e.notas ?? "—"}</Td>
              </tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
