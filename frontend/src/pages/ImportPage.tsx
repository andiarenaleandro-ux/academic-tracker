import { useState, useRef } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";

declare global {
  interface Window {
    pywebview?: { api?: { download_template?: () => Promise<{ ok: boolean; path?: string; error?: string }> } };
  }
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; creados: number; errores: number; detalle: Record<string, { creados: number; actualizados: number; errores: string[] }> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [templateOk, setTemplateOk] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al importar");
    } finally {
      setLoading(false);
    }
  };

  const handleDescargar = async () => {
    setTemplateError(null);
    setTemplateOk(null);
    try {
      // Modo desktop (pywebview): usar API Python nativa que guarda en Descargas
      if (window.pywebview?.api?.download_template) {
        const res = await window.pywebview.api.download_template();
        if (res.ok) {
          setTemplateOk(`Guardado en: ${res.path}`);
        } else {
          throw new Error(res.error ?? "Error al descargar");
        }
        return;
      }
      // Modo dev (navegador): descarga normal via fetch
      const r = await fetch("/api/import/template");
      if (!r.ok) throw new Error("No se pudo descargar la plantilla");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "plantilla_academic_tracker.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setTemplateError(e instanceof Error ? e.message : "Error al descargar");
    }
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Importar datos</h1>

      <Card className="p-6 max-w-xl space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-1">Importar desde Excel</h2>
          <p className="text-sm text-zinc-500">
            Completá la plantilla con tu carrera, materias y correlativas, luego importala acá.
          </p>
        </div>

        <div>
          <Button variant="ghost" className="text-xs text-violet-400 px-0" onClick={handleDescargar}>
            Descargar plantilla Excel
          </Button>
          {templateError && <p className="text-xs text-red-400 mt-1">{templateError}</p>}
          {templateOk && <p className="text-xs text-green-400 mt-1">{templateOk}</p>}
          <p className="text-xs text-zinc-600 mt-1">
            Abrila en Excel o Google Sheets, completá con tus datos y volvé a importarla acá.
          </p>
        </div>

        <div
          className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center cursor-pointer hover:border-zinc-500 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); setError(null); }}
          />
          <p className="text-zinc-400 text-sm">
            {file ? file.name : "Hacé clic para seleccionar el archivo .xlsx"}
          </p>
        </div>

        <Button onClick={handleImport} disabled={!file || loading}>
          {loading ? "Importando..." : "Importar"}
        </Button>

        {error && (
          <div className="p-3 bg-red-900/50 border border-red-800 rounded text-red-300 text-sm">{error}</div>
        )}

        {result && (
          <div className={`p-4 rounded border text-sm space-y-3 ${result.ok ? "bg-green-900/30 border-green-800" : "bg-amber-900/30 border-amber-800"}`}>
            <p className={`font-semibold ${result.ok ? "text-green-300" : "text-amber-300"}`}>
              {result.ok ? "Importación completada" : "Importado con advertencias"} — {result.creados} registros creados
              {result.errores > 0 && `, ${result.errores} errores`}
            </p>
            <div className="space-y-1">
              {Object.entries(result.detalle).map(([hoja, d]) => (
                <div key={hoja}>
                  <span className="text-zinc-400">{hoja}:</span>{" "}
                  <span className="text-zinc-300">{d.creados} creados, {d.actualizados} actualizados</span>
                  {d.errores.length > 0 && (
                    <ul className="mt-1 ml-4 text-red-400 text-xs list-disc">
                      {d.errores.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
