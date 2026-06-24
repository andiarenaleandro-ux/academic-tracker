import type { ReactNode } from "react";
import { useState } from "react";
import { Sidebar } from "./Sidebar";

export function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex">
      <div
        className={`transition-all duration-200 overflow-hidden ${
          sidebarOpen ? "w-56" : "w-0"
        }`}
      >
        <div className="w-56 min-h-screen flex-shrink-0">
          <Sidebar />
        </div>
      </div>

      <main className="flex-1 min-w-0 min-h-screen">
        <div className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 flex items-center gap-2 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-zinc-400 hover:text-zinc-200 text-xl leading-none"
            aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {sidebarOpen ? "✕" : "☰"}
          </button>
          <span className="text-sm font-semibold text-zinc-300">Academic Tracker</span>
        </div>
        {children}
      </main>
    </div>
  );
}
