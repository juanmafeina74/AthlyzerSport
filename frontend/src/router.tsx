import { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import LoginPage from "./components/auth/LoginPage";
import EquipoList from "./components/equipos/EquipoList";
import EquipoCreate from "./components/equipos/EquipoCreate";
import EquipoEdit from "./components/equipos/EquipoEdit";
import EquipoDelete from "./components/equipos/EquipoDelete";
import JugadorDelete from "./components/jugadores/JugadorDelete";
import JugadorList from "./components/jugadores/JugadorList";
import JugadorEdit from "./components/jugadores/JugadorEdit";
import JugadorCreate from "./components/jugadores/JugadorCreate";
import TemporadaList from "./components/temporadas/TemporadaList";
import TemporadaCreate from "./components/temporadas/TemporadaCreate";
import TemporadaEdit from "./components/temporadas/TemporadaEdit";
import TemporadaDelete from "./components/temporadas/TemporadaDelete";
import UsuarioCreate from "./components/usuarios/UsuarioCreate";
import UsuarioDelete from "./components/usuarios/UsuarioDelete";
import UsuarioEdit from "./components/usuarios/UsuarioEdit";
import UsuarioList from "./components/usuarios/UsuarioList";
import DashboardPage from "./DashboardPage";
import AdminPage from "./AdminPage";

function isAuthenticated() {
  const rawUser = localStorage.getItem("athlyzer_user");

  if (!rawUser) {
    return false;
  }

  try {
    const user = JSON.parse(rawUser) as { accessToken?: string };
    return Boolean(user.accessToken);
  } catch {
    localStorage.removeItem("athlyzer_user");
    return false;
  }
}

function RequireAuth({ children }: { children: ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const rawUser = localStorage.getItem("athlyzer_user");

  if (!isAuthenticated() || !rawUser) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(rawUser) as { role?: string };

  if (user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
}

function RouteFallback() {
  return <Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />;
}

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
        <Route path="/usuarios" element={<RequireAdmin><UsuarioList /></RequireAdmin>} />
        <Route path="/usuarios/crear" element={<RequireAdmin><UsuarioCreate /></RequireAdmin>} />
        <Route path="/usuarios/editar/:id" element={<RequireAdmin><UsuarioEdit /></RequireAdmin>} />
        <Route path="/usuarios/borrar/:id" element={<RequireAdmin><UsuarioDelete /></RequireAdmin>} />
        <Route path="/equipos" element={<RequireAuth><EquipoList /></RequireAuth>} />
        <Route path="/equipos/crear" element={<RequireAuth><EquipoCreate /></RequireAuth>} />
        <Route path="/equipos/editar/:id" element={<RequireAuth><EquipoEdit /></RequireAuth>} />
        <Route path="/equipos/borrar/:id" element={<RequireAuth><EquipoDelete /></RequireAuth>} />
        <Route path="/jugadores" element={<RequireAuth><JugadorList /></RequireAuth>} />
        <Route path="/jugadores/crear" element={<RequireAuth><JugadorCreate /></RequireAuth>} />
        <Route path="/jugadores/editar/:id" element={<RequireAuth><JugadorEdit /></RequireAuth>} />
        <Route path="/jugadores/borrar/:id" element={<RequireAuth><JugadorDelete /></RequireAuth>} />
        <Route path="/temporadas" element={<RequireAuth><TemporadaList /></RequireAuth>} />
        <Route path="/temporadas/crear" element={<RequireAuth><TemporadaCreate /></RequireAuth>} />
        <Route path="/temporadas/editar/:id" element={<RequireAuth><TemporadaEdit /></RequireAuth>} />
        <Route path="/temporadas/borrar/:id" element={<RequireAuth><TemporadaDelete /></RequireAuth>} />
        <Route path="*" element={<RouteFallback />} />
      </Routes>
    </BrowserRouter>
  );
}
