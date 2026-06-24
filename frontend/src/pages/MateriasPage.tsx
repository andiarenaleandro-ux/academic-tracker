import { useState } from "react";
import { Link } from "react-router-dom";
import { useMaterias, useCreateMateria, useDeleteMateria, type Materia } from "../hooks/useMaterias";
import { useSemestres } from "../hooks/useSemestres";
import { usePromedios } from "../hooks/useAnalytics";
import { useCorrelativas } from "../hooks/useCorrelativas";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import { Dialog, DialogHeader } from "../components/ui/dialog";
import { Table, THead, TBody, Th, Td } from "../components/ui/table";

const semestreColors = [
  "text-sky-400",
  "text-teal-400",
  "text-violet-400",
  "text-rose-400",
  "text-amber-400",
  "text-lime-400",
];

const estadoLabels: Record<string, string> = {
  aprobada: "Aprobada",
  cursando: "Cursando",
  pendiente: "Pendiente",
  recursando: "Recursando",
  libre: "Libre",
};

const estados = ["cursando", "aprobada", "recursando", "libre", "pendiente"];

export default function MateriasPage() {
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroSemestre, setFiltroSemestre] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ semestre_id: 0, nombre: "", codigo: "", profesor: "", estado: "cursando" });

  const { data: materias, isLoading } = useMaterias({
    estado: filtroEstado || undefined,
    semestre_id: filtroSemestre ? Number(filtroSemestre) : undefined,
  });
  const { data: semestres } = useSemestres();
  const { data: promedios } = usePromedios();
  const { data: correlativasData } = useCorrelativas();
  const create = useCreateMateria();
  const del = useDeleteMateria();

  const notaMap = new Map<number, number | null>();
  if (promedios) {
    for (const sem of promedios.semestres) {
      for (const m of sem.materias) {
        notaMap.set(m.id, m.promedio);
      }
    }
  }

  const blockedSet = new Set<number>();
  if (correlativasData) {
    for (const m of correlativasData) {
      if (m.estado === "pendiente" && m.correlativas.some((c) => c.estado !== "aprobada")) {
        blockedSet.add(m.id);
      }
    }
  }

  const handleCreate = async () => {
    await create.mutateAsync({
      semestre_id: Number(form.semestre_id),
      nombre: form.nombre,
      codigo: form.codigo || null,
      profesor: form.profesor || null,
      estado: form.estado,
    });
    setShowCreate(false);
    setForm({ semestre_id: 0, nombre: "", codigo: "", profesor: "", estado: "cursando" });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Materias</h1>
        <Button onClick={() => setShowCreate(true)}>+ Nueva</Button>
      </div>

      <Card className="mb-6">
        <CardContent className="flex gap-4 py-4">
          <div className="w-48">
            <Label>Semestre</Label>
            <Select value={filtroSemestre} onChange={(e) => setFiltroSemestre(e.target.value)}>
              <option value="">Todos</option>
              {semestres?.map((s) => (
                <option key={s.id} value={s.id}>S{s.numero} - {s.anio}</option>
              ))}
            </Select>
          </div>
          <div className="w-40">
            <Label>Estado</Label>
            <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="">Todos</option>
              {estados.map((e) => <option key={e} value={e}>{e}</option>)}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <THead>
            <Th>Nombre</Th>
            <Th>Código</Th>
            <Th>Semestre</Th>
            <Th>Nota final</Th>
            <Th>Estado</Th>
            <Th>Acciones</Th>
          </THead>
          <TBody>
            {isLoading && (
              <tr><Td colSpan={6} className="text-center text-zinc-500 py-8">Cargando...</Td></tr>
            )}
            {!isLoading && materias?.length === 0 && (
              <tr><Td colSpan={6} className="text-center text-zinc-500 py-8">Sin materias</Td></tr>
            )}
            {materias?.map((m: Materia) => {
              const nota = notaMap.get(m.id);
              const sem = semestres?.find((s) => s.id === m.semestre_id);
              const sc = sem ? semestreColors[(sem.numero - 1) % semestreColors.length] : "text-zinc-400";
              return (
                <tr key={m.id}>
                  <Td><Link to={`/materias/${m.id}`} className={`${sc} hover:underline`}>{m.nombre}</Link></Td>
                  <Td className="text-zinc-400 font-mono text-xs">{m.codigo ?? "—"}</Td>
                  <Td className={sc}>S{sem?.numero ?? m.semestre_id}</Td>
                  <Td className={nota != null ? (nota >= 4 ? "text-emerald-400" : "text-red-400") : "text-zinc-600"}>
                    {nota != null ? nota.toFixed(2) : "—"}
                  </Td>
                  <Td><Badge color={blockedSet.has(m.id) ? "recursando" : m.estado}>{estadoLabels[m.estado] ?? m.estado}</Badge></Td>
                  <Td>
                    <Button variant="ghost" className="text-xs text-red-400" onClick={() => del.mutate(m.id)}>
                      Eliminar
                    </Button>
                  </Td>
                </tr>
              );
            })}
          </TBody>
        </Table>
      </Card>

      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <DialogHeader>Nueva materia</DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div>
            <Label>Código</Label>
            <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
          </div>
          <div>
            <Label>Semestre</Label>
            <Select value={form.semestre_id || ""} onChange={(e) => setForm({ ...form, semestre_id: Number(e.target.value) })}>
              <option value="">Seleccionar...</option>
              {semestres?.map((s) => (
                <option key={s.id} value={s.id}>S{s.numero} - {s.anio}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Estado</Label>
            <Select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
              <option value="cursando">Cursando</option>
              <option value="pendiente">Pendiente</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!form.nombre || !form.semestre_id}>Crear</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
