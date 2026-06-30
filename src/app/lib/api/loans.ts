import { supabase } from '../supabase';
import { calcularMontoPrestamo } from '../financialCalculations';
import { resolveInitialLoanStatus } from '../approval';
import { notifyLoanCreated, notifyLoanStatusChanged } from '../notify';
import { getSettings } from './settings';
import { loanToSolicitud, solicitudToLoanPayload } from './mappers';
import { moneyToDb } from '../money';
import type { Solicitud } from '../types';

async function getUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('No autenticado');
  return user.id;
}

export async function getLoans(): Promise<Solicitud[]> {
  const { data, error } = await supabase
    .from('loans')
    .select(`
      *,
      vehicles (*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) =>
    loanToSolicitud(row, row.vehicles, row.client_id ? String(row.client_id) : undefined)
  );
}

export async function getLoanByExternalCode(externalCode: string): Promise<Solicitud | null> {
  const { data, error } = await supabase
    .from('loans')
    .select(`*, vehicles (*)`)
    .eq('external_code', externalCode)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return loanToSolicitud(data, data.vehicles, data.client_id ? String(data.client_id) : undefined);
}

export async function createLoan(form: Partial<Solicitud>): Promise<Solicitud> {
  const userId = await getUserId();
  const externalCode = `SOL-${Date.now()}`;
  const financed = calcularMontoPrestamo(
    Number(form.precio_vehiculo),
    Number(form.cuota_inicial)
  );

  const { data: vehicle, error: vErr } = await supabase
    .from('vehicles')
    .insert({
      brand: form.marca_vehiculo || '',
      model: form.modelo_vehiculo || '',
      vehicle_price: moneyToDb(Number(form.precio_vehiculo)),
      currency_type: form.moneda || 'Soles',
    })
    .select()
    .single();

  if (vErr) throw vErr;

  const settings = await getSettings();
  const { status, message } = resolveInitialLoanStatus(financed, settings);

  const payload = solicitudToLoanPayload(userId, {
    ...form,
    external_code: externalCode,
    vehicle_id: vehicle.id,
    client_id: form.cliente_id ? Number(form.cliente_id) : null,
    financed_amount: financed,
    estado: status,
  });

  const { data: loan, error: lErr } = await supabase
    .from('loans')
    .insert(payload)
    .select(`*, vehicles (*)`)
    .single();

  if (lErr) throw lErr;
  const solicitud = loanToSolicitud(loan, loan.vehicles, form.cliente_id);
  const vehicleLabel = `${form.marca_vehiculo} ${form.modelo_vehiculo}`;
  await notifyLoanCreated(externalCode, vehicleLabel, status, message, settings).catch(() => undefined);
  return solicitud;
}

export async function updateLoan(form: Solicitud): Promise<Solicitud> {
  const userId = await getUserId();
  const financed = calcularMontoPrestamo(
    Number(form.precio_vehiculo),
    Number(form.cuota_inicial)
  );

  const { data: existing, error: findErr } = await supabase
    .from('loans')
    .select('id, vehicle_id')
    .eq('external_code', form.id)
    .single();

  if (findErr) throw findErr;

  await supabase
    .from('vehicles')
    .update({
      brand: form.marca_vehiculo,
      model: form.modelo_vehiculo,
      vehicle_price: moneyToDb(Number(form.precio_vehiculo)),
      currency_type: form.moneda,
    })
    .eq('id', existing.vehicle_id);

  const payload = solicitudToLoanPayload(userId, {
    ...form,
    external_code: form.id,
    vehicle_id: existing.vehicle_id,
    client_id: form.cliente_id ? Number(form.cliente_id) : null,
    financed_amount: financed,
  });

  const { data: loan, error } = await supabase
    .from('loans')
    .update({
      client_id: payload.client_id,
      initial_payment_amount: payload.initial_payment_amount,
      financed_amount: payload.financed_amount,
      total_vehicle_price: payload.total_vehicle_price,
      annual_interest_rate: payload.annual_interest_rate,
      interest_rate_type: payload.interest_rate_type,
      capitalization_period: payload.capitalization_period,
      payment_frequency: payload.payment_frequency,
      loan_term_in_months: payload.loan_term_in_months,
      number_of_grace_periods: payload.number_of_grace_periods,
      grace_period_type: payload.grace_period_type,
      residual_value_amount: payload.residual_value_amount,
      discount_rate: payload.discount_rate,
      start_date: payload.start_date,
      status: form.estado,
      currency_type: payload.currency_type,
    })
    .eq('id', existing.id)
    .select(`*, vehicles (*)`)
    .single();

  if (error) throw error;
  return loanToSolicitud(loan, loan.vehicles, form.cliente_id);
}

export async function updateLoanStatus(externalCode: string, status: string): Promise<void> {
  const loan = await getLoanByExternalCode(externalCode);
  const { error } = await supabase
    .from('loans')
    .update({ status })
    .eq('external_code', externalCode);
  if (error) throw error;
  if (loan) {
    const vehicleLabel = `${loan.marca_vehiculo} ${loan.modelo_vehiculo}`;
    await notifyLoanStatusChanged(externalCode, vehicleLabel, status).catch(() => undefined);
  }
}

export async function deleteLoan(externalCode: string): Promise<void> {
  const { data: loan, error: findErr } = await supabase
    .from('loans')
    .select('id, vehicle_id')
    .eq('external_code', externalCode)
    .single();

  if (findErr) throw findErr;

  const { error } = await supabase.from('loans').delete().eq('id', loan.id);
  if (error) throw error;

  await supabase.from('vehicles').delete().eq('id', loan.vehicle_id);
}

export async function getLoanUuidByExternalCode(externalCode: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('loans')
    .select('id')
    .eq('external_code', externalCode)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}
