const PALETTE = [
  { text: "text-rose-400", dot: "bg-rose-400", border: "border-rose-400" },
  { text: "text-sky-400", dot: "bg-sky-400", border: "border-sky-400" },
  { text: "text-emerald-400", dot: "bg-emerald-400", border: "border-emerald-400" },
  { text: "text-amber-400", dot: "bg-amber-400", border: "border-amber-400" },
  { text: "text-violet-400", dot: "bg-violet-400", border: "border-violet-400" },
  { text: "text-cyan-400", dot: "bg-cyan-400", border: "border-cyan-400" },
  { text: "text-lime-400", dot: "bg-lime-400", border: "border-lime-400" },
  { text: "text-fuchsia-400", dot: "bg-fuchsia-400", border: "border-fuchsia-400" },
  { text: "text-orange-400", dot: "bg-orange-400", border: "border-orange-400" },
  { text: "text-teal-400", dot: "bg-teal-400", border: "border-teal-400" },
] as const;

type MateriaColor = { text: string; dot: string; border: string };

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function materiaColor(nombre: string): MateriaColor {
  const idx = hashString(nombre) % PALETTE.length;
  return PALETTE[idx] as MateriaColor;
}
