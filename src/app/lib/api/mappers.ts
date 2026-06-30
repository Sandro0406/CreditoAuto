import type { Cliente, Solicitud } from '../types';
import type { Database } from '../database.types';
import { moneyFromDb, moneyToDb } from '../money';

type ClientRow = Database['public']['Tables']['clients']['Row'];
type LoanRow = Database['public']['Tables']['loans']['Row'];
type VehicleRow = Database['public']['Tables']['vehicles']['Row'];

export function clientFromRow(row: ClientRow): Cliente {
  return {
    id_cliente: String(row.id),
    nombre_cliente: row.full_name,
    dni_cliente: row.document_number,
    telefono_cliente: row.phone,
    direccion_cliente: row.address || '',
    fecha_registro: new Date(row.created_at).toLocaleDateString('es-PE'),
  };
}

export function clientToInsert(
  userId: string,
  data: Omit<Cliente, 'id_cliente' | 'fecha_registro'>
): Database['public']['Tables']['clients']['Insert'] {
  return {
    user_id: userId,
    full_name: data.nombre_cliente,
    document_number: data.dni_cliente,
    phone: data.telefono_cliente,
    address: data.direccion_cliente || null,
  };
}

export function loanToSolicitud(
  loan: LoanRow,
  vehicle: VehicleRow,
  clientId?: string | null
): Solicitud {
  return {
    id: loan.external_code,
    loan_uuid: loan.id,
    cliente_id: clientId ?? (loan.client_id ? String(loan.client_id) : undefined),
    marca_vehiculo: vehicle.brand,
    modelo_vehiculo: vehicle.model,
    precio_vehiculo: String(moneyFromDb(loan.total_vehicle_price)),
    cuota_inicial: String(moneyFromDb(loan.initial_payment_amount)),
    monto_prestamo: String(moneyFromDb(loan.financed_amount)),
    tasa_interes: String(loan.annual_interest_rate),
    tasa_descuento: String(loan.discount_rate),
    tipo_tasa: loan.interest_rate_type,
    capitalizacion: loan.capitalization_period || undefined,
    frecuencia_pago: loan.payment_frequency,
    plazo_credito: String(loan.loan_term_in_months),
    periodo_gracia: String(loan.number_of_grace_periods),
    tipo_gracia: loan.grace_period_type,
    moneda: loan.currency_type,
    fecha_inicio: loan.start_date,
    valor_residual: String(moneyFromDb(loan.residual_value_amount)),
    fecha_solicitud: new Date(loan.created_at).toLocaleDateString('es-PE'),
    estado: loan.status,
  };
}

export function solicitudToLoanPayload(
  userId: string,
  data: Partial<Solicitud> & {
    vehicle_id: number;
    client_id?: number | null;
    external_code: string;
    financed_amount: number;
  }
): Database['public']['Tables']['loans']['Insert'] {
  return {
    user_id: userId,
    external_code: data.external_code,
    client_id: data.client_id ?? null,
    vehicle_id: data.vehicle_id,
    initial_payment_amount: moneyToDb(data.cuota_inicial ?? 0),
    financed_amount: moneyToDb(data.financed_amount),
    total_vehicle_price: moneyToDb(data.precio_vehiculo ?? 0),
    annual_interest_rate: Number(data.tasa_interes),
    interest_rate_type: data.tipo_tasa || 'Efectiva',
    capitalization_period: data.tipo_tasa === 'Nominal' ? data.capitalizacion || 'Mensual' : null,
    payment_frequency: data.frecuencia_pago || 'Mensual',
    loan_term_in_months: Number(data.plazo_credito),
    number_of_grace_periods: Number(data.periodo_gracia || 0),
    grace_period_type: data.tipo_gracia || 'Ninguno',
    residual_value_amount: moneyToDb(data.valor_residual || 0),
    discount_rate: Number(data.tasa_descuento || 0),
    start_date: data.fecha_inicio || new Date().toISOString().split('T')[0],
    status: data.estado || 'Pendiente',
    currency_type: data.moneda || 'Soles',
  };
}
