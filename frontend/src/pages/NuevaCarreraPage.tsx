import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../lib/api";
import { useCarreraContext } from "../context/CarreraContext";

const DURACIONES = ["cuatrimestral", "anual", "semestral", "bimestral", "trimestral"];

interface MateriaForm {
  nombre: string;
  codigo: string;
  duracion: string;
  semestre_num: number;
}

interface CorrelativaRel {
  materia_idx: number;
  requiere_idx: number;
}

const anioActual = new Date().getFullYear();

export default function NuevaCarreraPage() {
  const navigate = useNavigate();
  const { setCarreraId, refetchCarreras, carreraId } = useCarreraContext();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [nombre, setNombre] = useState("");
  const [anioInicio, setAnioInicio] = useState(anioActual);

  // Step 2
  const [numSemestres, setNumSemestres] = useState(8);
  const [materias, setMaterias] = useState<MateriaForm[]>([]);
  const [openSem, setOpenSem] = useState<number>(1);

  // Step 3
  const [correlativas, setCorrelativas] = useState<CorrelativaRel[]>([]);

  // ── helpers ─────────────────────────────────────────────────────────────

  const materiasEnSem = (n: number) => materias.filter((m) => m.semestre_num === n);
  const idxOf = (m: MateriaForm) => materias.indexOf(m);

  const addMateria = (semNum: number) =>
    setMaterias((prev) => [...prev, { nombre: "", codigo: "", duracion: "cuatrimestral", semestre_num: semNum }]);

  const updateMateria = (idx: number, patch: Partial<MateriaForm>) =>
    setMaterias((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)));

  const removeMateria = (idx: number) => {
    setMaterias((prev) => prev.filter((_, i) => i !== idx));
    setCorrelativas((prev) =>
      prev
        .filter((r) => r.materia_idx !== idx && r.requiere_idx !== idx)
        .map((r) => ({
          materia_idx: r.materia_idx > idx ? r.materia_idx - 1 : r.materia_idx,
          requiere_idx: r.requiere_idx > idx ? r.requiere_idx - 1 : r.requiere_idx,
        }))
    );
  };

  const toggleCorrelativa = (materiaIdx: number, requiereIdx: number) => {
    setCorrelativas((prev) => {
      const exists = prev.some((r) => r.materia_idx === materiaIdx && r.requiere_idx === requiereIdx);
      if (exists) return prev.filter((r) => !(r.materia_idx === materiaIdx && r.requiere_idx === requiereIdx));
      return [...prev, { materia_idx: materiaIdx, requiere_idx: requiereIdx }];
    });
  };

  const semYear = (n: number) => anioInicio + Math.floor((n - 1) / 2);

  // ── submit ───────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await apiPost<{ ok: boolean; carrera_id: number }>("/plan/setup", {
        nombre_carrera: nombre.trim(),
        num_semestres: numSemestres,
        anio_inicio: anioInicio,
        materias: materias
          .filter((m) => m.nombre.trim())
          .map((m) => ({
            nombre: m.nombre.trim(),
            codigo: m.codigo.trim() || null,
            duracion: m.duracion || null,
            semestre_num: m.semestre_num,
          })),
        correlativas,
      });
      await refetchCarreras();
      setCarreraId(res.carrera_id);
      navigate("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear la carrera");
    } finally {
      setSaving(false);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-2xl space-y-6">

        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Nueva carrera</h1>
            {carreraId !== null && (
              <button
                onClick={() => navigate(-1)}
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                ✕ Cancelar
              </button>
            )}
          </div>
          <div className="flex gap-2 mt-3 mb-0">
            {([1, 2, 3] as const).map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-500"}`}>
                  {s}
                </div>
                <span className={`text-xs ${step === s ? "text-zinc-200" : "text-zinc-600"}`}>
                  {s === 1 ? "Carrera" : s === 2 ? "Plan de estudios" : "Correlativas"}
                </span>
                {s < 3 && <span className="text-zinc-700 text-xs">›</span>}
              </div>
            ))}
          </div>
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Nombre de la carrera</label>
              <input
                autoFocus
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="ej: Técnico Superior en Ciencia de Datos e IA"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500 placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Año de inicio</label>
              <input
                type="number"
                value={anioInicio}
                onChange={(e) => setAnioInicio(parseInt(e.target.value) || anioActual)}
                className="w-32 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!nombre.trim()}
                className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 flex items-center gap-4">
              <label className="text-sm text-zinc-400 whitespace-nowrap">Cantidad de semestres</label>
              <input
                type="number"
                min={1}
                max={20}
                value={numSemestres}
                onChange={(e) => setNumSemestres(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-violet-500"
              />
              <span className="text-xs text-zinc-600">(podés cambiar esto después)</span>
            </div>

            {Array.from({ length: numSemestres }, (_, i) => i + 1).map((semNum) => {
              const mats = materiasEnSem(semNum);
              const isOpen = openSem === semNum;
              return (
                <div key={semNum} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                  <button
                    onClick={() => setOpenSem(isOpen ? 0 : semNum)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition-colors"
                  >
                    <span className="font-medium text-sm">
                      Semestre {semNum}
                      <span className="ml-2 text-zinc-500 text-xs font-normal">({semYear(semNum)})</span>
                    </span>
                    <span className="text-zinc-500 text-xs">{mats.length} materias {isOpen ? "▲" : "▼"}</span>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 space-y-2 border-t border-zinc-800">
                      {mats.length > 0 && (
                        <div className="grid grid-cols-[1fr_90px_150px_24px] gap-2 pt-3 pb-1">
                          <span className="text-xs text-zinc-600">Nombre</span>
                          <span className="text-xs text-zinc-600">Código</span>
                          <span className="text-xs text-zinc-600">Duración</span>
                          <span />
                        </div>
                      )}

                      {mats.map((m) => {
                        const idx = idxOf(m);
                        return (
                          <div key={idx} className="grid grid-cols-[1fr_90px_150px_24px] gap-2 items-center">
                            <input
                              value={m.nombre}
                              onChange={(e) => updateMateria(idx, { nombre: e.target.value })}
                              placeholder="Nombre de la materia"
                              className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs outline-none focus:border-violet-500 placeholder:text-zinc-600"
                            />
                            <input
                              value={m.codigo}
                              onChange={(e) => updateMateria(idx, { codigo: e.target.value })}
                              placeholder="MAT1"
                              className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs outline-none focus:border-violet-500 placeholder:text-zinc-600"
                            />
                            <select
                              value={m.duracion}
                              onChange={(e) => updateMateria(idx, { duracion: e.target.value })}
                              className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs outline-none focus:border-violet-500"
                            >
                              {DURACIONES.map((d) => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => removeMateria(idx)}
                              className="text-zinc-600 hover:text-red-400 transition-colors text-sm leading-none"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}

                      <button
                        onClick={() => addMateria(semNum)}
                        className="mt-2 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                      >
                        + Agregar materia
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
                ← Atrás
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-5 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <p className="text-sm text-zinc-400 mb-4">
                Para cada materia, marcá cuáles son sus requisitos previos. Podés saltear esto y editarlo después.
              </p>

              {materias.filter((m) => m.nombre.trim()).length === 0 ? (
                <p className="text-sm text-zinc-600 italic">No agregaste materias todavía.</p>
              ) : (
                <div className="space-y-4">
                  {Array.from({ length: numSemestres }, (_, i) => i + 1).map((semNum) => {
                    const mats = materiasEnSem(semNum).filter((m) => m.nombre.trim());
                    if (mats.length === 0) return null;
                    const prevMats = materias.filter((m) => m.semestre_num < semNum && m.nombre.trim());
                    return (
                      <div key={semNum}>
                        <p className="text-xs text-zinc-600 font-medium mb-2 uppercase tracking-wider">Semestre {semNum}</p>
                        {mats.map((m) => {
                          const mIdx = idxOf(m);
                          const reqs = correlativas.filter((r) => r.materia_idx === mIdx).map((r) => r.requiere_idx);
                          return (
                            <div key={mIdx} className="mb-3">
                              <p className="text-sm text-zinc-300 mb-1">{m.nombre}</p>
                              {prevMats.length === 0 ? (
                                <p className="text-xs text-zinc-600 italic ml-2">Sin materias previas disponibles</p>
                              ) : (
                                <div className="flex flex-wrap gap-2 ml-2">
                                  {prevMats.map((pm) => {
                                    const pmIdx = idxOf(pm);
                                    const selected = reqs.includes(pmIdx);
                                    return (
                                      <button
                                        key={pmIdx}
                                        onClick={() => toggleCorrelativa(mIdx, pmIdx)}
                                        className={`px-2 py-1 rounded text-xs border transition-colors ${
                                          selected
                                            ? "bg-violet-600/30 border-violet-500 text-violet-300"
                                            : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-500"
                                        }`}
                                      >
                                        {selected ? "✓ " : ""}{pm.nombre}
                                        <span className="text-zinc-600 ml-1">(S{pm.semestre_num})</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-900/40 border border-red-800 rounded-lg text-red-300 text-sm">{error}</div>
            )}

            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(2)} className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
                ← Atrás
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !nombre.trim()}
                className="px-6 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? "Creando..." : "Crear carrera"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
