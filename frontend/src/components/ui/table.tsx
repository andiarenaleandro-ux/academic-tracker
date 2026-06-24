import type { ReactNode } from "react";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-zinc-800">
      <tr className="text-left text-zinc-500 text-xs uppercase tracking-wider">{children}</tr>
    </thead>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-zinc-800">{children}</tbody>;
}

export function Th({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}

export function Td({ children, className = "", colSpan }: { children: ReactNode; className?: string; colSpan?: number }) {
  return <td colSpan={colSpan} className={`px-4 py-3 text-zinc-300 ${className}`}>{children}</td>;
}
