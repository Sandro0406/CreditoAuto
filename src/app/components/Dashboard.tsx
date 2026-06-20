import { useState, useEffect } from 'react';
import {
  Users, CreditCard, Car, FileText, PlusCircle,
  BarChart3, Settings, Clock, ArrowUpRight, Sparkles, ArrowRight,
} from 'lucide-react';
import Layout from './Layout';

type Page = 'dashboard' | 'registro' | 'credito' | 'amortizacion' | 'clientes' | 'solicitudes' | 'configuracion';

interface DashboardProps {
  userName: string;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  onBack?: () => void;
}

export default function Dashboard({ userName, currentPage, onNavigate, onLogout }: DashboardProps) {
  const [stats, setStats] = useState({ clientes: 0, activos: 0, pendientes: 0, total: 0 });
  const [actividad, setActividad] = useState<any[]>([]);

  useEffect(() => {
    const clientes = JSON.parse(localStorage.getItem('clientes') || '[]');
    const solicitudes = JSON.parse(localStorage.getItem('solicitudes') || '[]');
    setStats({
      clientes: clientes.length,
      activos: solicitudes.filter((s: any) => s.estado === 'Aprobado').length,
      pendientes: solicitudes.filter((s: any) => s.estado === 'Pendiente').length,
      total: solicitudes.length,
    });
    const acts: any[] = [];
    clientes.slice(-3).forEach((c: any) => acts.push({ label: c.nombre_cliente, sub: 'Cliente registrado', monto: null, fecha: c.fecha_registro, tipo: 'cliente' }));
    solicitudes.slice(-3).forEach((s: any) => acts.push({
      label: `${s.marca_vehiculo} ${s.modelo_vehiculo}`,
      sub: `Solicitud ${(s.estado || '').toLowerCase()}`,
      monto: `${s.moneda === 'Soles' ? 'S/' : '$'} ${parseFloat(s.monto_prestamo || '0').toLocaleString('es-PE')}`,
      fecha: s.fecha_solicitud,
      tipo: 'solicitud',
    }));
    setActividad(acts.slice(-5));
  }, []);

  const statCards = [
    { label: 'Clientes registrados', value: stats.clientes, icon: Users, grad: 'bg-grad-brand', shadow: 'shadow-brand', page: 'clientes' as Page },
    { label: 'Créditos aprobados', value: stats.activos, icon: CreditCard, grad: 'bg-grad-money', shadow: 'shadow-money', page: 'solicitudes' as Page },
    { label: 'Total solicitudes', value: stats.total, icon: Car, grad: 'bg-grad-sky', shadow: '', page: 'solicitudes' as Page },
    { label: 'Pendientes de revisión', value: stats.pendientes, icon: FileText, grad: 'bg-grad-warm', shadow: '', page: 'solicitudes' as Page },
  ];

  const quickCards = [
    { title: 'Nuevo cliente', desc: 'Registrar información del cliente', icon: PlusCircle, page: 'registro' as Page, grad: 'bg-grad-brand' },
    { title: 'Nueva solicitud', desc: 'Crédito vehicular Compra Inteligente', icon: CreditCard, page: 'credito' as Page, grad: 'bg-grad-money' },
    { title: 'Amortización', desc: 'Cronograma, VAN, TIR y TCEA', icon: BarChart3, page: 'amortizacion' as Page, grad: 'bg-grad-sky' },
    { title: 'Configuración', desc: 'Moneda, tasa y parámetros', icon: Settings, page: 'configuracion' as Page, grad: 'bg-grad-warm' },
  ];

  const estadoColor: Record<string, string> = {
    aprobado: 'text-emerald-600',
    pendiente: 'text-amber-600',
    rechazado: 'text-rose-500',
  };

  return (
    <Layout currentPage={currentPage} userName={userName} onNavigate={onNavigate} onLogout={onLogout} pageTitle="Inicio" pageSubtitle="Bandeja principal">
      {/* Hero banner */}
      <div className="bg-grad-brand animate-pan rounded-[28px] p-6 sm:p-7 relative overflow-hidden mb-5 shadow-brand">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute right-20 bottom-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span className="text-white text-xs font-semibold">{new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <h2 className="text-white text-2xl sm:text-[28px] font-extrabold tracking-tight capitalize">¡Hola, {userName}! 👋</h2>
            <p className="text-white/80 text-sm mt-1 max-w-md">Gestiona clientes, simula créditos y revisa los indicadores de transparencia desde un solo lugar.</p>
          </div>
          <button
            onClick={() => onNavigate('credito')}
            className="bg-white text-violet-700 font-bold text-sm px-5 py-3 rounded-2xl flex items-center gap-2 hover:gap-3 transition-all shadow-lg shrink-0 self-start"
          >
            Nueva solicitud
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {statCards.map((card, i) => (
          <button
            key={card.label}
            onClick={() => onNavigate(card.page)}
            className={`card-soft lift p-5 text-left group animate-fade-up delay-${i + 1}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${card.grad} icon-tile ${card.shadow}`}>
                <card.icon className="w-6 h-6 text-white" strokeWidth={2.2} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <p className="text-[32px] font-extrabold text-slate-900 leading-none tracking-tight">{card.value}</p>
            <p className="text-xs text-slate-500 mt-2 font-medium">{card.label}</p>
          </button>
        ))}
      </div>

      {/* Quick actions + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Quick actions */}
        <div className="lg:col-span-2 card-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-800">Acciones rápidas</p>
          </div>
          <div className="p-3 space-y-1">
            {quickCards.map((card) => (
              <button
                key={card.title}
                onClick={() => onNavigate(card.page)}
                className="w-full flex items-center gap-4 px-3 py-3 rounded-2xl text-left hover:bg-slate-50 transition-colors group"
              >
                <div className={`w-11 h-11 ${card.grad} icon-tile shrink-0 group-hover:scale-105 transition-transform`}>
                  <card.icon className="w-5 h-5 text-white" strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{card.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{card.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-1 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-3 card-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-800">Actividad reciente</p>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">En vivo</span>
            </div>
          </div>
          {actividad.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Clock className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-slate-500 text-sm font-medium">Sin actividad reciente</p>
              <p className="text-slate-400 text-xs mt-1">Registra clientes o solicitudes para empezar</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {actividad.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`${item.tipo === 'cliente' ? 'bg-grad-brand' : 'bg-grad-money'} p-0.5 rounded-full shrink-0`}>
                      <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center">
                        {item.tipo === 'cliente'
                          ? <Users className="w-4 h-4 text-violet-600" strokeWidth={2.3} />
                          : <Car className="w-4 h-4 text-emerald-600" strokeWidth={2.3} />}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate capitalize">{item.label}</p>
                      <p className={`text-xs mt-0.5 capitalize font-medium ${estadoColor[item.sub?.split(' ')[1]] || 'text-slate-400'}`}>
                        {item.sub}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    {item.monto && <p className="text-sm font-bold text-slate-800">{item.monto}</p>}
                    <p className="text-xs text-slate-400">{item.fecha}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {actividad.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100">
              <button onClick={() => onNavigate('solicitudes')} className="text-xs text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1 group">
                Ver todas las solicitudes
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
