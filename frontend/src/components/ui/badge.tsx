import type { ReactNode } from "react";

const colors: Record<string, string> = {
  cursando: "bg-blue-900/50 text-blue-300 border-blue-800",
  aprobada: "bg-green-900/50 text-green-300 border-green-800",
  recursando: "bg-yellow-900/50 text-yellow-300 border-yellow-800",
  libre: "bg-zinc-800 text-zinc-400 border-zinc-700",
  pendiente: "bg-zinc-700/50 text-zinc-300 border-zinc-600",
  parcial: "bg-orange-900/50 text-orange-300 border-orange-800",
  recuperatorio: "bg-red-900/50 text-red-300 border-red-800",
  tp: "bg-purple-900/50 text-purple-300 border-purple-800",
  final: "bg-amber-900/50 text-amber-300 border-amber-800",
  coloquio: "bg-cyan-900/50 text-cyan-300 border-cyan-800",
};

export function Badge({ children, color }: { children: ReactNode; color?: string }) {
  const style = color ? colors[color] : "bg-zinc-800 text-zinc-400 border-zinc-700";
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      {children}
    </span>
  );
}
