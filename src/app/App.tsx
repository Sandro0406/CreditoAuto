import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import RequireAuth from './components/RequireAuth';
import { SettingsProvider } from './context/SettingsContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import RegistroCliente from './components/RegistroCliente';
import SolicitudCredito from './components/SolicitudCredito';
import TablaAmortizacion from './components/TablaAmortizacion';
import ListaClientes from './components/ListaClientes';
import ListaSolicitudes from './components/ListaSolicitudes';
import DetalleSolicitud from './components/DetalleSolicitud';
import Configuracion from './components/Configuracion';
import { paths } from './lib/routes';

function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to={paths.dashboard} replace />;
  }

  return (
    <Login
      onLogin={(name) => {
        login(name);
        navigate(paths.dashboard, { replace: true });
      }}
    />
  );
}

function AuthenticatedShell() {
  return (
    <SettingsProvider>
      <Outlet />
    </SettingsProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path={paths.login} element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AuthenticatedShell />}>
        <Route path="/" element={<Navigate to={paths.dashboard} replace />} />
        <Route path={paths.dashboard} element={<Dashboard />} />
        <Route path={paths.clientes} element={<ListaClientes />} />
        <Route path={paths.clienteNuevo} element={<RegistroCliente />} />
        <Route path={paths.solicitudes} element={<ListaSolicitudes />} />
        <Route path={paths.solicitudNueva} element={<SolicitudCredito />} />
        <Route path="/solicitudes/:id" element={<DetalleSolicitud />} />
        <Route path="/solicitudes/:id/editar" element={<SolicitudCredito />} />
        <Route path={paths.amortizacion} element={<TablaAmortizacion />} />
        <Route path="/amortizacion/:id" element={<TablaAmortizacion />} />
        <Route path={paths.configuracion} element={<Configuracion />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={paths.dashboard} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
