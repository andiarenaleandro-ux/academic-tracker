import type { ReactNode } from "react";

export function Card({ className = "", children, ...props }: { className?: string; children: ReactNode; [key: string]: unknown }) {
  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-lg ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`px-6 py-4 border-b border-zinc-800 ${className}`}>{children}</div>;
}

export function CardContent({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}
