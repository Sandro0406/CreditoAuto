import { ReactNode } from 'react';
import {
  LayoutDashboard, Users, CreditCard, BarChart3,
  Settings, LogOut, PlusCircle, Car, Search, Bell, Sparkles,
} from 'lucide-react';

type Page = 'dashboard' | 'registro' | 'credito' | 'amortizacion' | 'clientes' | 'solicitudes' | 'configuracion';

interface LayoutProps {
  children: ReactNode;
  currentPage: Page;
  userName: string;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  pageTitle: string;
  pageSubtitle?: string;
}

const mainNav = [
  { id: 'dashboard' as Page, icon: LayoutDashboard, label: 'Inicio' },
  { id: 'clientes' as Page, icon: Users, label: 'Clientes' },
  { id: 'solicitudes' as Page, icon: CreditCard, label: 'Solicitudes' },
  { id: 'amortizacion' as Page, icon: BarChart3, label: 'Amortización' },
  { id: 'configuracion' as Page, icon: Settings, label: 'Configuración' },
];

const quickNav = [
  { id: 'registro' as Page, icon: PlusCircle, label: 'Nuevo cliente' },
  { id: 'credito' as Page, icon: Car, label: 'Nueva solicitud' },
];

export default function Layout({ children, currentPage, userName, onNavigate, onLogout, pageTitle, pageSubtitle }: LayoutProps) {
  const initial = (userName || 'U').charAt(0).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* ===== Sidebar ===== */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col shrink-0 z-20">
        {/* Brand */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-grad-brand rounded-2xl flex items-center justify-center shadow-brand">
              <Car className="w-6 h-6 text-white" strokeWidth={2.4} />
            </div>
            <div>
              <p className="font-extrabold text-[17px] leading-none tracking-tight text-slate-900">
                Crédito<span className="text-grad">Auto</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">Compra Inteligente</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 overflow-y-auto">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.12em] px-3 mb-2 mt-2">Menú</p>
          <div className="space-y-1">
            {mainNav.map((item) => {
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-left transition-all duration-200 text-sm font-medium group
                    ${active
                      ? 'bg-grad-brand text-white shadow-brand'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <item.icon className={`w-[18px] h-[18px] shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-slate-400 group-hover:text-violet-500'}`} strokeWidth={2.2} />
                  {item.label}
                </button>
              );
            })}
          </div>

          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.12em] px-3 mb-2 mt-6">Crear</p>
          <div className="space-y-1">
            {quickNav.map((item) => {
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-left transition-all duration-200 text-sm font-medium group
                    ${active
                      ? 'bg-emerald-500 text-white shadow-money'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <item.icon className={`w-[18px] h-[18px] shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-slate-400 group-hover:text-emerald-500'}`} strokeWidth={2.2} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Promo card */}
          <div className="mx-1 mt-6 rounded-3xl bg-grad-brand p-4 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-white/15 blur-md" />
            <Sparkles className="w-5 h-5 text-white/90 mb-2" />
            <p className="text-white text-[13px] font-bold leading-snug relative">Método SBS</p>
            <p className="text-white/80 text-[11px] mt-1 leading-snug relative">VAN, TIR y TCEA calculados según Res. 8181-2012</p>
          </div>
        </nav>

        {/* User / Logout */}
        <div className="px-3 py-3 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-2 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group" onClick={onLogout}>
            <div className="avatar-ring shrink-0">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <span className="text-grad text-xs font-extrabold">{initial}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 text-xs font-semibold truncate capitalize">{userName}</p>
              <p className="text-slate-400 text-[11px]">Cerrar sesión</p>
            </div>
            <LogOut className="w-4 h-4 text-slate-300 group-hover:text-rose-500 transition-colors" />
          </div>
        </div>
      </aside>

      {/* ===== Main ===== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="glass border-b border-slate-100/80 px-7 h-[68px] flex items-center justify-between shrink-0 z-10">
          <div>
            {pageSubtitle && (
              <p className="text-[11px] font-semibold text-violet-500 uppercase tracking-wider">{pageSubtitle}</p>
            )}
            <h1 className="text-[19px] font-extrabold text-slate-900 leading-tight tracking-tight">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar…"
                className="w-52 pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100/70 border border-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-violet-300 transition-all"
              />
            </div>
            <button className="relative w-10 h-10 rounded-2xl bg-slate-100/70 hover:bg-slate-200/70 flex items-center justify-center transition-colors">
              <Bell className="w-[18px] h-[18px] text-slate-500" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            </button>
            <div className="avatar-ring">
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center">
                <span className="text-grad text-sm font-extrabold">{initial}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto app-canvas px-7 py-6">
          <div className="animate-fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
