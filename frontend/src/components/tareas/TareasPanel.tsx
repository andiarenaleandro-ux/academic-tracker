import { useState } from "react";
import { useTareas, useCreateTarea, useUpdateTarea, useDeleteTarea, type Tarea } from "../../hooks/useTareas";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { Dialog, DialogHeader } from "../ui/dialog";

const tipoLabels: Record<string, string> = {
  teoria: "Teoría",
  practica: "Práctica",
  tp: "Trabajo Práctico",
  entrega: "Entrega",
  examen: "Examen",
  otro: "Otro",
};

const tipoStyles: Record<string, string> = {
  teoria: "bg-sky-900/50 text-sky-300 border-sky-800",
  practica: "bg-teal-900/50 text-teal-300 border-teal-800",
  tp: "bg-violet-900/50 text-violet-300 border-violet-800",
  entrega: "bg-orange-900/50 text-orange-300 border-orange-800",
  examen: "bg-rose-900/50 text-rose-300 border-rose-800",
  otro: "bg-zinc-800 text-zinc-400 border-zinc-700",
};

const prioridadLabels: Record<string, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

const prioridadStyles: Record<string, string> = {
  alta: "text-red-400",
  media: "text-amber-400",
  baja: "text-zinc-500",
};

const emptyForm = { titulo: "", tipo: "teoria", semana: "1", prioridad: "media", fecha_limite: "", notas: "" };

function fmtDate(d: string) {
  return d.split("-").reverse().join("/");
}

export function TareasPanel({ materiaId }: { materiaId: number }) {
  const { data: tareas, isLoading } = useTareas(materiaId);
  const createTarea = useCreateTarea();
  const updateTarea = useUpdateTarea();
  const deleteTarea = useDeleteTarea();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const today = new Date().toISOString().slice(0, 10);

  const sorted = [...(tareas ?? [])].sort(
    (a, b) => a.semana - b.semana || (a.fecha_limite ?? "9999").localeCompare(b.fecha_limite ?? "9999")
  );

  const grupos = new Map<number, Tarea[]>();
  for (const t of sorted) {
    const list = grupos.get(t.semana) ?? [];
    list.push(t);
    grupos.set(t.semana, list);
  }

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (t: Tarea) => {
    setEditingId(t.id);
    setForm({
      titulo: t.titulo,
      tipo: t.tipo,
      semana: String(t.semana),
      prioridad: t.prioridad,
      fecha_limite: t.fecha_limite ?? "",
      notas: t.notas ?? "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    const payload = {
      materia_id: materiaId,
      titulo: form.titulo,
      tipo: form.tipo,
      semana: Number(form.semana),
      prioridad: form.prioridad,
      fecha_limite: form.fecha_limite || null,
      notas: form.notas || null,
    };
    if (editingId !== null) {
      await updateTarea.mutateAsync({ id: editingId, ...payload });
    } else {
      await createTarea.mutateAsync(payload);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleToggle = (t: Tarea) => {
    updateTarea.mutate({ id: t.id, titulo: t.titulo, tipo: t.tipo, semana: t.semana, prioridad: t.prioridad, fecha_limite: t.fecha_limite, completado: !t.completado });
  };

  const handleDelete = (tid: number) => {
    if (confirm("¿Eliminar esta tarea?")) {
      deleteTarea.mutate(tid);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate}>+ Tarea</Button>
      </div>

      {isLoading && <p className="text-zinc-500 py-4">Cargando tareas...</p>}

      {!isLoading && (!tareas || tareas.length === 0) && (
        <p className="text-zinc-500 py-4 text-center">
          Sin tareas cargadas. Agregá teoría, prácticas y entregas de esta materia.
        </p>
      )}

      {[...grupos.entries()].map(([semana, items]) => {
        const done = items.filter((t) => t.completado).length;
        return (
          <div key={semana} className="mb-5">
            <h3 className="text-sm font-semibold text-zinc-300 mb-2">
              Semana {semana}
              <span className="ml-2 text-zinc-600 font-normal">
                {done}/{items.length} completadas
              </span>
            </h3>
            <Card>
              <ul className="divide-y divide-zinc-800">
                {items.map((t) => {
                  const vencida = !t.completado && t.fecha_limite && t.fecha_limite < today;
                  return (
                    <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={t.completado}
                        onChange={() => handleToggle(t)}
                        className="h-4 w-4 accent-violet-600 rounded cursor-pointer flex-shrink-0"
                      />
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${tipoStyles[t.tipo] ?? tipoStyles.otro}`}>
                        {tipoLabels[t.tipo] ?? t.tipo}
                      </span>
                      <span className={`text-sm ${t.completado ? "line-through opacity-50" : ""}`}>{t.titulo}</span>
                      <span className={`text-xs ${prioridadStyles[t.prioridad] ?? prioridadStyles.baja}`}>
                        {prioridadLabels[t.prioridad] ?? t.prioridad}
                      </span>
                      {t.fecha_limite && (
                        <span className={`text-xs ${vencida ? "text-red-400" : t.completado ? "text-zinc-600" : "text-zinc-500"}`}>
                          {vencida && !t.completado ? "venció " : ""}{fmtDate(t.fecha_limite)}
                        </span>
                      )}
                      <div className="ml-auto flex gap-1 flex-shrink-0">
                        <Button variant="ghost" className="text-xs text-blue-400" onClick={() => openEdit(t)}>Editar</Button>
                        <Button variant="ghost" className="text-xs text-red-400" onClick={() => handleDelete(t.id)}>Eliminar</Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        );
      })}

      <Dialog open={showForm} onClose={() => { setShowForm(false); setEditingId(null); }}>
        <DialogHeader>{editingId !== null ? "Editar tarea" : "Nueva tarea"}</DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Leer teoría unidad 3" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Tipo</Label>
              <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                {Object.entries(tipoLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
            <div className="flex-1">
              <Label>Semana</Label>
              <Input type="number" min={1} value={form.semana} onChange={(e) => setForm({ ...form, semana: e.target.value })} />
            </div>
            <div className="flex-1">
              <Label>Prioridad</Label>
              <Select value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value })}>
                {Object.entries(prioridadLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label>Fecha límite (opcional)</Label>
            <Input type="date" value={form.fecha_limite} onChange={(e) => setForm({ ...form, fecha_limite: e.target.value })} />
          </div>
          <div>
            <Label>Notas (opcional)</Label>
            <Input value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Ej: capítulos 4 y 5" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.titulo.trim() || !form.semana}>
              {editingId !== null ? "Guardar" : "Crear"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}