import { ReactNode, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard, Users, CreditCard, BarChart3,
  Settings, LogOut, PlusCircle, Car, Search, Menu, ChevronRight,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Sheet, SheetContent } from './ui/sheet';
import { useAuth } from '../context/AuthContext';
import { useAppSettings } from '../context/SettingsContext';
import NotificationBell from './NotificationBell';
import { navSectionFromPath, paths } from '../lib/routes';

interface LayoutProps {
  children: ReactNode;
  pageTitle: string;
  pageSubtitle?: string;
}

const mainNav = [
  { path: paths.dashboard, section: 'dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { path: paths.clientes, section: 'clientes', icon: Users, label: 'Clientes' },
  { path: paths.solicitudes, section: 'solicitudes', icon: CreditCard, label: 'Solicitudes' },
  { path: paths.amortizacion, section: 'amortizacion', icon: BarChart3, label: 'Amortización' },
  { path: paths.configuracion, section: 'configuracion', icon: Settings, label: 'Configuración' },
];

const quickNav = [
  { path: paths.clienteNuevo, section: 'clientes', icon: PlusCircle, label: 'Nuevo cliente' },
  { path: paths.solicitudNueva, section: 'solicitudes', icon: Car, label: 'Nueva solicitud' },
];

interface SidebarContentProps {
  activeSection: string;
  pathname: string;
  userName: string;
  companyName: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

function SidebarContent({ activeSection, pathname, userName, companyName, onNavigate, onLogout }: SidebarContentProps) {
  const initial = (userName || 'U').charAt(0).toUpperCase();
  const isQuickActive = (path: string) => pathname === path;
  const onQuickPath = quickNav.some((q) => q.path === pathname);

  const navClass = (active: boolean) =>
    `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors text-sm ${
      active
        ? 'bg-brand-50 text-brand-800 font-semibold'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
    }`;
  const iconClass = (active: boolean) =>
    `w-[18px] h-[18px] shrink-0 ${active ? 'text-brand-700' : 'text-slate-400'}`;

  return (
    <>
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-700 rounded-xl flex items-center justify-center">
            <Car className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <p className="font-bold text-[16px] leading-none tracking-tight text-slate-900">
              Crédito<span className="text-brand-700">Auto</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium truncate">{companyName}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 overflow-y-auto">
        <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-[0.1em] px-3 mb-1.5 mt-1">Menú</p>
        <div className="space-y-0.5">
          {mainNav.map((item) => {
            const active = activeSection === item.section && !onQuickPath;
            return (
              <button key={item.path} type="button" onClick={() => onNavigate(item.path)} className={navClass(active)}>
                <item.icon className={iconClass(active)} strokeWidth={2.1} />
                {item.label}
              </button>
            );
          })}
        </div>

        <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-[0.1em] px-3 mb-1.5 mt-6">Crear</p>
        <div className="space-y-0.5">
          {quickNav.map((item) => {
            const active = isQuickActive(item.path);
            return (
              <button key={item.path} type="button" onClick={() => onNavigate(item.path)} className={navClass(active)}>
                <item.icon className={iconClass(active)} strokeWidth={2.1} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mx-1 mt-6 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="text-slate-800 text-[13px] font-semibold leading-snug">Método SBS</p>
          <p className="text-slate-500 text-[11px] mt-1 leading-snug">VAN, TIR y TCEA calculados según Res. 8181-2012</p>
        </div>
      </nav>

      <div className="px-3 py-3 border-t border-slate-100">
        <button
          type="button"
          className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
          onClick={onLogout}
        >
          <div className="avatar-ring shrink-0">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <span className="text-brand-700 text-xs font-bold">{initial}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-slate-800 text-xs font-semibold truncate capitalize">{userName}</p>
            <p className="text-slate-400 text-[11px]">Cerrar sesión</p>
          </div>
          <LogOut className="w-4 h-4 text-slate-300 group-hover:text-red-500 transition-colors" />
        </button>
      </div>
    </>
  );
}

export default function Layout({ children, pageTitle, pageSubtitle }: LayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { userName, logout } = useAuth();
  const { settings } = useAppSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const activeSection = navSectionFromPath(location.pathname);
  const initial = (userName || 'U').charAt(0).toUpperCase();

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileNavOpen(false);
  };

  const handleLogout = async () => {
    setMobileNavOpen(false);
    await logout();
    navigate(paths.login, { replace: true });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0 z-20">
        <SidebarContent
          activeSection={activeSection}
          pathname={location.pathname}
          userName={userName}
          companyName={settings.nombreEmpresa || 'Compra Inteligente'}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-[min(18rem,85vw)] p-0 border-r border-slate-200 flex flex-col [&>button]:top-5 [&>button]:right-4"
        >
          <SidebarContent
            activeSection={activeSection}
            pathname={location.pathname}
            userName={userName}
            companyName={settings.nombreEmpresa || 'Compra Inteligente'}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="glass border-b border-slate-200 px-4 sm:px-6 lg:px-7 h-14 sm:h-16 flex items-center justify-between gap-3 shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="min-w-0">
              {pageSubtitle && (
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide truncate">{pageSubtitle}</p>
              )}
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight tracking-tight truncate">{pageTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar…"
                className="w-52 pl-9 pr-4 py-2 rounded-lg bg-slate-100 border border-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-400 transition-all"
              />
            </div>
            <NotificationBell />
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="avatar-ring rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
                  aria-label="Menú de usuario"
                >
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                    <span className="text-brand-700 text-sm font-bold">{initial}</span>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-0 rounded-xl border-slate-200 shadow-lg">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900 capitalize truncate">{userName}</p>
                  <p className="text-xs text-slate-500 truncate">{settings.nombreEmpresa || 'Compra Inteligente'}</p>
                </div>
                <div className="p-1.5">
                  <button
                    type="button"
                    onClick={() => { navigate(paths.dashboard); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-400" />
                    Inicio
                  </button>
                  <button
                    type="button"
                    onClick={() => { navigate(paths.configuracion); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    Configuración
                    <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                  </button>
                </div>
                <div className="p-1.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto app-canvas px-4 py-4 sm:px-6 sm:py-6 lg:px-7">
          <div className="animate-fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
