export const paths = {
  login: '/login',
  dashboard: '/dashboard',
  clientes: '/clientes',
  clienteNuevo: '/clientes/nuevo',
  solicitudes: '/solicitudes',
  solicitudNueva: '/solicitudes/nueva',
  solicitudDetalle: (id: string) => `/solicitudes/${encodeURIComponent(id)}`,
  solicitudEditar: (id: string) => `/solicitudes/${encodeURIComponent(id)}/editar`,
  amortizacion: '/amortizacion',
  amortizacionSolicitud: (id: string) => `/amortizacion/${encodeURIComponent(id)}`,
  configuracion: '/configuracion',
} as const;

export function navSectionFromPath(pathname: string): string {
  if (pathname.startsWith('/clientes')) return 'clientes';
  if (pathname.startsWith('/solicitudes')) return 'solicitudes';
  if (pathname.startsWith('/amortizacion')) return 'amortizacion';
  if (pathname.startsWith('/configuracion')) return 'configuracion';
  return 'dashboard';
}
