import { Routes, Route, Link } from "react-router-dom";
import { CarreraProvider, useCarreraContext } from "./context/CarreraContext";
import { Layout } from "./components/layout/Layout";
import DashboardPage from "./pages/DashboardPage";
import MateriasPage from "./pages/MateriasPage";
import MateriaDetailPage from "./pages/MateriaDetailPage";
import EvaluacionesPage from "./pages/EvaluacionesPage";
import CronogramaPage from "./pages/CronogramaPage";
import CorrelativasPage from "./pages/CorrelativasPage";
import PlanPage from "./pages/PlanPage";
import NuevaCarreraPage from "./pages/NuevaCarreraPage";

function Home() {
  const { carreras } = useCarreraContext();
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center relative overflow-hidden">
      {/* fondo decorativo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-700/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-indigo-600/8 blur-2xl" />
      </div>

      <div className="relative text-center space-y-6 px-8 max-w-md">
        {/* ícono / logo */}
        <div className="flex justify-center mb-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-900/40">
            <span className="text-2xl font-bold text-white">AT</span>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Academic Tracker
          </h1>
          <p className="mt-3 text-zinc-500 text-base leading-relaxed">
            Organizá tu carrera, seguí tus materias,<br />
            evaluaciones y promedios en un solo lugar.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-violet-900/30"
          >
            Abrir Dashboard →
          </Link>
          {carreras.length === 0 && (
            <Link
              to="/nueva-carrera"
              className="inline-flex items-center justify-center px-8 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-sm font-medium text-zinc-300 transition-colors"
            >
              Crear mi primera carrera
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/nueva-carrera" element={<NuevaCarreraPage />} />
      <Route path="/dashboard" element={<Layout><DashboardPage /></Layout>} />
      <Route path="/materias" element={<Layout><MateriasPage /></Layout>} />
      <Route path="/materias/:id" element={<Layout><MateriaDetailPage /></Layout>} />
      <Route path="/evaluaciones" element={<Layout><EvaluacionesPage /></Layout>} />
      <Route path="/cronograma" element={<Layout><CronogramaPage /></Layout>} />
      <Route path="/plan" element={<Layout><PlanPage /></Layout>} />
      <Route path="/correlativas" element={<Layout><CorrelativasPage /></Layout>} />
    </Routes>
  );
}

export default function App() {
  return (
    <CarreraProvider>
      <AppRoutes />
    </CarreraProvider>
  );
}
