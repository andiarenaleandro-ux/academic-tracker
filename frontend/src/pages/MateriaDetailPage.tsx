import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMateria, useUpdateMateria } from "../hooks/useMaterias";
import { useEvaluaciones, useCreateEvaluacion, useUpdateEvaluacion, useDeleteEvaluacion, type Evaluacion } from "../hooks/useEvaluaciones";
import { useClases, useCreateClase, useUpdateClase, useDeleteClase, type Clase } from "../hooks/useClases";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import { Dialog, DialogHeader } from "../components/ui/dialog";
import { Table, THead, TBody, Th, Td } from "../components/ui/table";
import { Tabs } from "../components/ui/tabs";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const evalLabels: Record<string, string> = {
  parcial: "Parcial",
  recuperatorio: "Recuperatorio",
  tp: "TP",
  final: "Final",
  coloquio: "Coloquio",
};
const tiposEval = Object.keys(evalLabels);

const emptyEvalForm = { tipo: "parcial", fecha: "", hora: "", peso: "1.0", nota_obtenida: "", nota_simulada: "", notas: "" };

export default function MateriaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const materiaId = Number(id);
  const { data: materia, isLoading: loadingMateria } = useMateria(materiaId);
  const { data: evaluaciones } = useEvaluaciones(materiaId);
  const { data: clases } = useClases(materiaId);
  const updateMateria = useUpdateMateria();
  const createEval = useCreateEvaluacion();
  const updateEval = useUpdateEvaluacion();
  const deleteEval = useDeleteEvaluacion();
  const createClase = useCreateClase();
  const updateClase = useUpdateClase();
  const deleteClase = useDeleteClase();

  const [tab, setTab] = useState("evaluaciones");
  const [showEvalForm, setShowEvalForm] = useState(false);
  const [editingEvalId, setEditingEvalId] = useState<number | null>(null);
  const [evalForm, setEvalForm] = useState(emptyEvalForm);
  const [showClaseForm, setShowClaseForm] = useState(false);
  const [editingClaseId, setEditingClaseId] = useState<number | null>(null);
  const [claseForm, setClaseForm] = useState({ dia_semana: "1", hora_inicio: "19:00", hora_fin: "21:00" });

  const openCreateEval = () => {
    setEditingEvalId(null);
    setEvalForm(emptyEvalForm);
    setShowEvalForm(true);
  };

  const openEditEval = (e: Evaluacion) => {
    setEditingEvalId(e.id);
    setEvalForm({
      tipo: e.tipo,
      fecha: e.fecha,
      hora: e.hora ?? "",
      peso: String(e.peso),
      nota_obtenida: e.nota_obtenida != null ? String(e.nota_obtenida) : "",
      nota_simulada: e.nota_simulada != null ? String(e.nota_simulada) : "",
      notas: e.notas ?? "",
    });
    setShowEvalForm(true);
  };

  const handleSaveEval = async () => {
    const payload = {
      materia_id: materiaId,
      tipo: evalForm.tipo,
      fecha: evalForm.fecha,
      hora: evalForm.hora || null,
      peso: Number(evalForm.peso),
      nota_obtenida: evalForm.nota_obtenida ? Number(evalForm.nota_obtenida) : null,
      nota_simulada: evalForm.nota_simulada ? Number(evalForm.nota_simulada) : null,
      notas: evalForm.notas || null,
    };
    if (editingEvalId !== null) {
      await updateEval.mutateAsync({ id: editingEvalId, ...payload });
    } else {
      await createEval.mutateAsync(payload);
    }
    setShowEvalForm(false);
    setEditingEvalId(null);
    setEvalForm(emptyEvalForm);
  };

  const handleDeleteEval = async (evalId: number) => {
    if (confirm("¿Eliminar esta evaluación?")) {
      await deleteEval.mutateAsync(evalId);
    }
  };

  const openEditClase = (c: Clase) => {
    setEditingClaseId(c.id);
    setClaseForm({
      dia_semana: String(c.dia_semana ?? 1),
      hora_inicio: c.hora_inicio ?? "19:00",
      hora_fin: c.hora_fin ?? "21:00",
    });
    setShowClaseForm(true);
  };

  const handleSaveClase = async () => {
    const payload = {
      materia_id: materiaId,
      dia_semana: Number(claseForm.dia_semana),
      hora_inicio: claseForm.hora_inicio || null,
      hora_fin: claseForm.hora_fin || null,
    };
    if (editingClaseId !== null) {
      await updateClase.mutateAsync({ id: editingClaseId, ...payload });
    } else {
      await createClase.mutateAsync(payload);
    }
    setShowClaseForm(false);
    setEditingClaseId(null);
    setClaseForm({ dia_semana: "1", hora_inicio: "19:00", hora_fin: "21:00" });
  };

  const handleDeleteClase = async (claseId: number) => {
    if (confirm("¿Eliminar este horario?")) {
      await deleteClase.mutateAsync(claseId);
    }
  };

  if (loadingMateria) return <div className="p-8 text-zinc-500">Cargando...</div>;
  if (!materia) return <div className="p-8 text-zinc-500">Materia no encontrada</div>;

  return (
    <div className="p-8">
      <Link to="/materias" className="text-sm text-zinc-500 hover:text-zinc-300 mb-4 inline-block">&larr; Volver</Link>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">{materia.nombre}</h1>
        <select
          value={materia.estado}
          onChange={(e) => updateMateria.mutate({ id: materia.id, estado: e.target.value })}
          className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-sm text-zinc-200 cursor-pointer"
        >
          <option value="cursando">Cursando</option>
          <option value="pendiente">Pendiente</option>
          <option value="aprobada">Aprobada</option>
          <option value="recursando">Recursando</option>
          <option value="libre">Libre</option>
        </select>
      </div>
      <p className="text-sm text-zinc-500 mb-6">
        {materia.codigo && `Código: ${materia.codigo}`}{materia.creditos ? ` • ${materia.creditos} créditos` : ""}
      </p>

      <Tabs value={tab} onChange={setTab} tabs={[
        { key: "evaluaciones", label: "Evaluaciones" },
        { key: "horarios", label: "Horarios" },
      ]} />

      {tab === "evaluaciones" && (
        <div>
          <div className="flex justify-end mb-4">
            <Button onClick={openCreateEval}>+ Evaluación</Button>
          </div>
          <Card>
            <Table>
              <THead>
                <Th>Tipo</Th>
                <Th>Fecha</Th>
                <Th>Hora</Th>
                <Th>Peso</Th>
                <Th>Nota</Th>
                <Th>Simulada</Th>
                <Th>Notas</Th>
                <Th>Acciones</Th>
              </THead>
              <TBody>
                {evaluaciones?.map((e: Evaluacion) => (
                  <tr key={e.id}>
                    <Td><Badge color={e.tipo}>{evalLabels[e.tipo] ?? e.tipo}</Badge></Td>
                    <Td>{e.fecha}</Td>
                    <Td>{e.hora ? e.hora.slice(0, 5) : "—"}</Td>
                    <Td>{(e.peso * 100).toFixed(0)}%</Td>
                    <Td className={e.nota_obtenida != null && e.nota_obtenida >= 4 ? "text-emerald-400" : e.nota_obtenida != null ? "text-red-400" : ""}>
                      {e.nota_obtenida ?? "—"}
                    </Td>
                    <Td className="text-zinc-500">{e.nota_simulada ?? "—"}</Td>
                    <Td className="text-zinc-500 text-xs max-w-[200px] truncate">{e.notas ?? "—"}</Td>
                    <Td>
                      <div className="flex gap-1">
                        <Button variant="ghost" className="text-xs text-blue-400" onClick={() => openEditEval(e)}>Editar</Button>
                        <Button variant="ghost" className="text-xs text-red-400" onClick={() => handleDeleteEval(e.id)}>Eliminar</Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </TBody>
            </Table>
          </Card>

          <Dialog open={showEvalForm} onClose={() => { setShowEvalForm(false); setEditingEvalId(null); }}>
            <DialogHeader>{editingEvalId !== null ? "Editar evaluación" : "Nueva evaluación"}</DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Tipo</Label>
                  <Select value={evalForm.tipo} onChange={(e) => setEvalForm({ ...evalForm, tipo: e.target.value })}>
                    {tiposEval.map((t) => <option key={t} value={t}>{evalLabels[t]}</option>)}
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Fecha</Label>
                  <Input type="date" value={evalForm.fecha} onChange={(e) => setEvalForm({ ...evalForm, fecha: e.target.value })} />
                </div>
                <div className="flex-1">
                  <Label>Hora (opcional)</Label>
                  <Input type="time" value={evalForm.hora} onChange={(e) => setEvalForm({ ...evalForm, hora: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Peso (0.0 - 1.0)</Label>
                <Input type="number" step="0.1" value={evalForm.peso} onChange={(e) => setEvalForm({ ...evalForm, peso: e.target.value })} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Nota obtenida (opcional)</Label>
                  <Input type="number" step="0.1" value={evalForm.nota_obtenida} onChange={(e) => setEvalForm({ ...evalForm, nota_obtenida: e.target.value })} />
                </div>
                <div className="flex-1">
                  <Label>Nota simulada (opcional)</Label>
                  <Input type="number" step="0.1" value={evalForm.nota_simulada} onChange={(e) => setEvalForm({ ...evalForm, nota_simulada: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Comentarios</Label>
                <Input value={evalForm.notas} onChange={(e) => setEvalForm({ ...evalForm, notas: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => { setShowEvalForm(false); setEditingEvalId(null); }}>Cancelar</Button>
                <Button onClick={handleSaveEval} disabled={!evalForm.fecha}>
                  {editingEvalId !== null ? "Guardar" : "Crear"}
                </Button>
              </div>
            </div>
          </Dialog>
        </div>
      )}

      {tab === "horarios" && (
        <div>
          <div className="flex justify-end mb-4">
            <Button onClick={() => { setEditingClaseId(null); setClaseForm({ dia_semana: "1", hora_inicio: "19:00", hora_fin: "21:00" }); setShowClaseForm(true); }}>+ Horario</Button>
          </div>
          <Card>
            <Table>
              <THead>
                <Th>Día</Th>
                <Th>Inicio</Th>
                <Th>Fin</Th>
                <Th>Acciones</Th>
              </THead>
              <TBody>
                {clases?.map((c: Clase) => (
                  <tr key={c.id}>
                    <Td>{c.dia_semana ? DIAS[c.dia_semana - 1] : "—"}</Td>
                    <Td>{c.hora_inicio ?? "—"}</Td>
                    <Td>{c.hora_fin ?? "—"}</Td>
                    <Td>
                      <div className="flex gap-1">
                        <Button variant="ghost" className="text-xs text-blue-400" onClick={() => openEditClase(c)}>Editar</Button>
                        <Button variant="ghost" className="text-xs text-red-400" onClick={() => handleDeleteClase(c.id)}>Eliminar</Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </TBody>
            </Table>
          </Card>

          <Dialog open={showClaseForm} onClose={() => { setShowClaseForm(false); setEditingClaseId(null); }}>
            <DialogHeader>{editingClaseId !== null ? "Editar horario" : "Nuevo horario"}</DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Día</Label>
                  <Select value={claseForm.dia_semana} onChange={(e) => setClaseForm({ ...claseForm, dia_semana: e.target.value })}>
                    {DIAS.map((d, i) => (
                      <option key={i} value={i + 1}>{d}</option>
                    ))}
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Inicio</Label>
                  <Input type="time" value={claseForm.hora_inicio} onChange={(e) => setClaseForm({ ...claseForm, hora_inicio: e.target.value })} />
                </div>
                <div className="flex-1">
                  <Label>Fin</Label>
                  <Input type="time" value={claseForm.hora_fin} onChange={(e) => setClaseForm({ ...claseForm, hora_fin: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => { setShowClaseForm(false); setEditingClaseId(null); }}>Cancelar</Button>
                <Button onClick={handleSaveClase}>{editingClaseId !== null ? "Guardar" : "Crear"}</Button>
              </div>
            </div>
          </Dialog>
        </div>
      )}
    </div>
  );
}
