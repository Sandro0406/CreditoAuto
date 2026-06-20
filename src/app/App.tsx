import { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import RegistroCliente from './components/RegistroCliente';
import SolicitudCredito from './components/SolicitudCredito';
import TablaAmortizacion from './components/TablaAmortizacion';
import ListaClientes from './components/ListaClientes';
import ListaSolicitudes from './components/ListaSolicitudes';
import Configuracion from './components/Configuracion';

type Page = 'login' | 'dashboard' | 'registro' | 'credito' | 'amortizacion' | 'clientes' | 'solicitudes' | 'configuracion';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [userName, setUserName] = useState('');
  const [solicitudEditar, setSolicitudEditar] = useState<any>(null);

  const handleLogin = (name: string) => {
    setUserName(name);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUserName('');
    setCurrentPage('login');
  };

  const navigate = (page: Page) => setCurrentPage(page);

  const handleEditarSolicitud = (s: any) => {
    setSolicitudEditar(s);
    setCurrentPage('credito');
  };

  const handleNuevaSolicitud = () => {
    setSolicitudEditar(null);
    setCurrentPage('credito');
  };

  const layoutProps = {
    currentPage: currentPage as Exclude<Page, 'login'>,
    userName,
    onNavigate: (page: Exclude<Page, 'login'>) => navigate(page),
    onLogout: handleLogout,
  };

  return (
    <>
      {currentPage === 'login' && <Login onLogin={handleLogin} />}
      {currentPage === 'dashboard' && (
        <Dashboard {...layoutProps} />
      )}
      {currentPage === 'registro' && (
        <RegistroCliente {...layoutProps} onBack={() => navigate('clientes')} />
      )}
      {currentPage === 'credito' && (
        <SolicitudCredito
          {...layoutProps}
          onBack={() => { setSolicitudEditar(null); navigate('solicitudes'); }}
          solicitudEditar={solicitudEditar}
        />
      )}
      {currentPage === 'amortizacion' && (
        <TablaAmortizacion {...layoutProps} onBack={() => navigate('dashboard')} />
      )}
      {currentPage === 'clientes' && (
        <ListaClientes
          {...layoutProps}
          onBack={() => navigate('dashboard')}
          onNuevoCliente={() => navigate('registro')}
        />
      )}
      {currentPage === 'solicitudes' && (
        <ListaSolicitudes
          {...layoutProps}
          onBack={() => navigate('dashboard')}
          onNuevaSolicitud={handleNuevaSolicitud}
          onEditarSolicitud={handleEditarSolicitud}
        />
      )}
      {currentPage === 'configuracion' && (
        <Configuracion {...layoutProps} onBack={() => navigate('dashboard')} />
      )}
    </>
  );
}
