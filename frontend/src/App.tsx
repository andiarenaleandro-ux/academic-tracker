import { Routes, Route } from "react-router-dom";
import { CarreraProvider } from "./context/CarreraContext";
import { Layout } from "./components/layout/Layout";
import TrackerPage from "./pages/TrackerPage";
import DashboardPage from "./pages/DashboardPage";
import MateriasPage from "./pages/MateriasPage";
import MateriaDetailPage from "./pages/MateriaDetailPage";
import EvaluacionesPage from "./pages/EvaluacionesPage";
import CronogramaPage from "./pages/CronogramaPage";
import CorrelativasPage from "./pages/CorrelativasPage";
import PlanPage from "./pages/PlanPage";
import NuevaCarreraPage from "./pages/NuevaCarreraPage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout><TrackerPage /></Layout>} />
      <Route path="/tracker" element={<Layout><TrackerPage /></Layout>} />
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