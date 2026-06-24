import { type SelectHTMLAttributes } from "react";

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
