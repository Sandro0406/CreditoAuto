import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Users, CreditCard, Car, FileText, PlusCircle,
  BarChart3, Settings, Clock, ArrowRight,
} from 'lucide-react';
import Layout from './Layout';
import { getClients } from '../lib/api/clients';
import { getLoans } from '../lib/api/loans';
import { useAuth } from '../context/AuthContext';
import { paths } from '../lib/routes';

export default function Dashboard() {
  const { userName } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ clientes: 0, activos: 0, pendientes: 0, total: 0 });
  const [actividad, setActividad] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([getClients(), getLoans()]).then(([clientes, solicitudes]) => {
      setStats({
        clientes: clientes.length,
        activos: solicitudes.filter((s) => s.estado === 'Aprobado').length,
        pendientes: solicitudes.filter((s) => s.estado === 'Pendiente').length,
        total: solicitudes.length,
      });
      const acts: any[] = [];
      clientes.slice(-3).forEach((c) => acts.push({ label: c.nombre_cliente, sub: 'Cliente registrado', monto: null, fecha: c.fecha_registro, tipo: 'cliente' }));
      solicitudes.slice(-3).forEach((s) => acts.push({
        label: `${s.marca_vehiculo} ${s.modelo_vehiculo}`,
        sub: `Solicitud ${(s.estado || '').toLowerCase()}`,
        monto: `${s.moneda === 'Soles' ? 'S/' : '$'} ${parseFloat(s.monto_prestamo || '0').toLocaleString('es-PE')}`,
        fecha: s.fecha_solicitud,
        tipo: 'solicitud',
      }));
      setActividad(acts.slice(-5));
    }).catch(console.error);
  }, []);

  const statCards = [
    { label: 'Clientes registrados', value: stats.clientes, icon: Users, path: paths.clientes },
    { label: 'Créditos aprobados', value: stats.activos, icon: CreditCard, path: paths.solicitudes, accent: true },
    { label: 'Total solicitudes', value: stats.total, icon: Car, path: paths.solicitudes },
    { label: 'Pendientes de revisión', value: stats.pendientes, icon: FileText, path: paths.solicitudes },
  ];

  const quickCards = [
    { title: 'Nuevo cliente', desc: 'Registrar información del cliente', icon: PlusCircle, path: paths.clienteNuevo },
    { title: 'Nueva solicitud', desc: 'Crédito vehicular Compra Inteligente', icon: CreditCard, path: paths.solicitudNueva },
    { title: 'Amortización', desc: 'Cronograma, VAN, TIR y TCEA', icon: BarChart3, path: paths.amortizacion },
    { title: 'Configuración', desc: 'Moneda, tasa y parámetros', icon: Settings, path: paths.configuracion },
  ];

  const estadoColor: Record<string, string> = {
    aprobado: 'text-brand-700',
    pendiente: 'text-amber-600',
    rechazado: 'text-red-600',
  };

  return (
    <Layout pageTitle="Inicio" pageSubtitle="Bandeja principal">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight capitalize">Hola, {userName}</h2>
          <p className="text-slate-500 text-sm mt-1">
            {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
            {' · '}Gestiona clientes, simula créditos y revisa la transparencia.
          </p>
        </div>
        <button
          onClick={() => navigate(paths.solicitudNueva)}
          className="btn-grad text-sm px-4 py-2.5 flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Nueva solicitud
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {statCards.map((card, i) => (
          <button
            key={card.label}
            onClick={() => navigate(card.path)}
            className={`card-soft lift p-4 sm:p-5 text-left animate-fade-up delay-${i + 1}`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${card.accent ? 'bg-brand-50' : 'bg-slate-100'}`}>
              <card.icon className={`w-[18px] h-[18px] ${card.accent ? 'text-brand-700' : 'text-slate-500'}`} strokeWidth={2.1} />
            </div>
            <p className="text-[28px] sm:text-[32px] font-bold text-slate-900 leading-none tracking-tight tabular">{card.value}</p>
            <p className="text-[13px] text-slate-500 mt-2 font-medium leading-snug">{card.label}</p>
          </button>
        ))}
      </div>

      {/* Acciones rápidas + Actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 card-soft overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800">Acciones rápidas</p>
          </div>
          <div className="p-2">
            {quickCards.map((card) => (
              <button
                key={card.title}
                onClick={() => navigate(card.path)}
                className="w-full flex items-center gap-3.5 px-3 py-3 rounded-lg text-left hover:bg-slate-50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-brand-50 flex items-center justify-center shrink-0 transition-colors">
                  <card.icon className="w-[18px] h-[18px] text-slate-500 group-hover:text-brand-700 transition-colors" strokeWidth={2.1} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{card.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{card.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 card-soft overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">Actividad reciente</p>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">En vivo</span>
            </div>
          </div>
          {actividad.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-slate-500 text-sm font-medium">Sin actividad reciente</p>
              <p className="text-slate-400 text-xs mt-1">Registra clientes o solicitudes para empezar</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {actividad.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      {item.tipo === 'cliente'
                        ? <Users className="w-4 h-4 text-slate-500" strokeWidth={2.2} />
                        : <Car className="w-4 h-4 text-brand-700" strokeWidth={2.2} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate capitalize">{item.label}</p>
                      <p className={`text-xs mt-0.5 capitalize font-medium ${estadoColor[item.sub?.split(' ')[1]] || 'text-slate-400'}`}>
                        {item.sub}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    {item.monto && <p className="text-sm font-semibold text-slate-800 tabular">{item.monto}</p>}
                    <p className="text-xs text-slate-400">{item.fecha}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {actividad.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100">
              <button onClick={() => navigate(paths.solicitudes)} className="text-xs text-brand-700 hover:text-brand-800 font-semibold flex items-center gap-1 group">
                Ver todas las solicitudes
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
