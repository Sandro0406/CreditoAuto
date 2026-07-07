export interface Cliente {
  id_cliente: string;
  nombre_cliente: string;
  dni_cliente: string;
  telefono_cliente: string;
  direccion_cliente: string;
  fecha_registro: string;
}

export interface Solicitud {
  id: string;
  loan_uuid?: string;
  cliente_id?: string;
  marca_vehiculo: string;
  modelo_vehiculo: string;
  precio_vehiculo: string;
  cuota_inicial: string;
  monto_prestamo: string;
  tasa_interes: string;
  tasa_descuento?: string;
  tipo_tasa: string;
  capitalizacion?: string;
  frecuencia_pago: string;
  plazo_credito: string;
  periodo_gracia: string;
  tipo_gracia: string;
  moneda: string;
  fecha_inicio: string;
  valor_residual: string;
  fecha_solicitud: string;
  estado: string;
  pct_seguro_desgravamen?: string;
  seguro_riesgo?: string;
  gps?: string;
  portes?: string;
  gastos_administrativos?: string;
  costo_notarial?: string;
  costo_registral?: string;
  costo_tasacion?: string;
  comision_estudio?: string;
  comision_activacion?: string;
  periodos_gracia_total?: string;
  periodos_gracia_parcial?: string;
}

export interface AppConfig {
  nombreEmpresa: string;
  monedaDefecto: string;
  tasaInteresDefecto: string;
  tipoTasaDefecto: string;
  capitalizacionDefecto: string;
  plazoMaximo: string;
  montoMaximo: string;
  notificacionesEmail: boolean;
  notificacionesSMS: boolean;
  autoaprobacionHasta: string;
  requiereAprobacionGerencia: boolean;
  pctSeguroDesgravamenDefecto: string;
  seguroRiesgoDefecto: string;
  gpsDefecto: string;
  portesDefecto: string;
  gastosAdminDefecto: string;
  costoNotarialDefecto: string;
  costoRegistralDefecto: string;
  costoTasacionDefecto: string;
  comisionEstudioDefecto: string;
  comisionActivacionDefecto: string;
}

export const DEFAULT_CONFIG: AppConfig = {
  nombreEmpresa: 'CréditoAuto',
  monedaDefecto: 'Soles',
  tasaInteresDefecto: '12.5',
  tipoTasaDefecto: 'Efectiva',
  capitalizacionDefecto: 'Mensual',
  plazoMaximo: '120',
  montoMaximo: '500000',
  notificacionesEmail: true,
  notificacionesSMS: false,
  autoaprobacionHasta: '50000',
  requiereAprobacionGerencia: true,
  pctSeguroDesgravamenDefecto: '0.049',
  seguroRiesgoDefecto: '4',
  gpsDefecto: '20',
  portesDefecto: '3.5',
  gastosAdminDefecto: '3.5',
  costoNotarialDefecto: '0',
  costoRegistralDefecto: '0',
  costoTasacionDefecto: '0',
  comisionEstudioDefecto: '0',
  comisionActivacionDefecto: '0',
};

export const ADVISOR_EMAIL = 'adoa2705@gmail.com';

export function usernameToEmail(username: string): string {
  const trimmed = username.trim().toLowerCase();
  if (trimmed.includes('@')) return trimmed;
  if (trimmed === 'adoa' || trimmed === 'asesor') return ADVISOR_EMAIL;
  return `${trimmed}@example.com`;
}
