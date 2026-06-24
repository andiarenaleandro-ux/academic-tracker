import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCarreraContext, useDeleteCarrera } from "../../context/CarreraContext";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: "◉" },
  { to: "/materias", label: "Materias", icon: "▣" },
  { to: "/evaluaciones", label: "Evaluaciones", icon: "◎" },
  { to: "/cronograma", label: "Cronograma", icon: "◈" },
  { to: "/plan", label: "Plan", icon: "⊞" },
  { to: "/correlativas", label: "Correlativas", icon: "↔" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { carreras, carreraId, setCarreraId } = useCarreraContext();
  const deleteCarrera = useDeleteCarrera();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    if (carreraId === null) return;
    await deleteCarrera.mutateAsync(carreraId);
    setConfirmDelete(false);
    const remaining = carreras.filter((c) => c.id !== carreraId);
    if (remaining.length > 0 && remaining[0]) {
      setCarreraId(remaining[0].id);
      navigate("/dashboard");
    } else {
      navigate("/nueva-carrera");
    }
  };

  return (
    <aside className="w-56 bg-zinc-900 border-r border-zinc-800 min-h-screen flex flex-col">
      <div className="px-4 py-4 border-b border-zinc-800">
        <Link to="/" className="block font-bold text-base tracking-tight text-zinc-100 hover:text-white mb-2">
          Academic Tracker
        </Link>
        {carreras.length > 0 ? (
          <select
            value={carreraId ?? ""}
            onChange={(e) => {
              setCarreraId(parseInt(e.target.value, 10));
              setConfirmDelete(false);
            }}
            className="w-full text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 rounded px-2 py-1 outline-none cursor-pointer hover:border-zinc-500 transition-colors"
          >
            {carreras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-xs text-zinc-600 italic">Sin carrera</p>
        )}

        {carreraId !== null && !confirmDelete && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="mt-2 text-xs text-zinc-600 hover:text-red-400 transition-colors w-full text-left"
          >
            Eliminar carrera
          </button>
        )}

        {confirmDelete && (
          <div className="mt-2 p-2 bg-red-950/40 border border-red-800/50 rounded text-xs space-y-2">
            <p className="text-red-300">¿Eliminar esta carrera y todos sus datos?</p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleteCarrera.isPending}
                className="px-2 py-1 bg-red-700 hover:bg-red-600 disabled:opacity-50 rounded text-white transition-colors"
              >
                {deleteCarrera.isPending ? "..." : "Sí, eliminar"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-zinc-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              <span className="text-xs">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-zinc-800">
        <button
          onClick={() => navigate("/nueva-carrera")}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors text-left"
        >
          <span className="text-xs">＋</span>
          Nueva carrera
        </button>
      </div>
    </aside>
  );
}
