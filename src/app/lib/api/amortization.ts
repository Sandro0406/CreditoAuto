import { supabase } from '../supabase';
import {
  calcularCreditoVehicular,
  CronogramaRow,
  IndicadoresTransparencia,
  SolicitudCreditoData,
} from '../financialCalculations';
import { getLoanUuidByExternalCode } from './loans';
import type { Solicitud } from '../types';
import { moneyFromDb, moneyToDb } from '../money';

function solicitudToCalcData(s: Solicitud): SolicitudCreditoData {
  return {
    id: s.id,
    cliente_id: s.cliente_id,
    marca_vehiculo: s.marca_vehiculo,
    modelo_vehiculo: s.modelo_vehiculo,
    precio_vehiculo: s.precio_vehiculo,
    cuota_inicial: s.cuota_inicial,
    tasa_descuento: s.tasa_descuento || '0',
    tasa_interes: s.tasa_interes,
    tipo_tasa: s.tipo_tasa,
    capitalizacion: s.capitalizacion,
    frecuencia_pago: s.frecuencia_pago,
    plazo_credito: s.plazo_credito,
    periodo_gracia: s.periodo_gracia,
    tipo_gracia: s.tipo_gracia,
    moneda: s.moneda,
    fecha_inicio: s.fecha_inicio,
    valor_residual: s.valor_residual,
  };
}

export async function calculateAndPersistAmortization(solicitud: Solicitud) {
  const loanId = solicitud.loan_uuid || (await getLoanUuidByExternalCode(solicitud.id));
  if (!loanId) throw new Error('Préstamo no encontrado');

  const resultado = calcularCreditoVehicular(solicitudToCalcData(solicitud));
  await persistAmortization(loanId, resultado.cronograma, resultado.indicadores);
  await supabase.from('loans').update({ status: 'Calculado' }).eq('id', loanId);
  return resultado;
}

export async function persistAmortization(
  loanId: string,
  cronograma: CronogramaRow[],
  indicadores: IndicadoresTransparencia
) {
  await supabase.from('payment_schedule').delete().eq('loan_id', loanId);
  await supabase.from('financial_indicators').delete().eq('loan_id', loanId);

  const scheduleRows = cronograma.map((row) => ({
    loan_id: loanId,
    installment_number: row.numero_cuota,
    due_date: row.fecha_pago,
    grace_type: row.tipo_periodo,
    initial_balance: moneyToDb(row.saldo_inicial),
    interest: moneyToDb(row.interes),
    amortization: moneyToDb(row.amortizacion),
    installment_amount: moneyToDb(row.cuota),
    residual_paid: moneyToDb(row.valor_residual_pagado),
    final_balance: moneyToDb(row.saldo_final),
    debtor_flow: moneyToDb(row.flujo_deudor),
    present_value: moneyToDb(row.valor_actual),
  }));

  const { error: schedErr } = await supabase.from('payment_schedule').insert(scheduleRows);
  if (schedErr) throw schedErr;

  const { error: indErr } = await supabase.from('financial_indicators').insert({
    loan_id: loanId,
    financed_amount: moneyToDb(indicadores.monto_prestamo),
    tea: indicadores.tea,
    periodic_rate: indicadores.tasa_periodica,
    discount_rate_periodic: indicadores.tasa_descuento_periodica,
    num_periods: indicadores.numero_periodos,
    total_interest: moneyToDb(indicadores.total_intereses),
    total_paid: moneyToDb(indicadores.total_pagado),
    van: moneyToDb(indicadores.van),
    tir_periodic: indicadores.tir_periodica,
    tir_annual: indicadores.tir_anual,
    tcea: indicadores.tcea,
    french_installment: moneyToDb(indicadores.cuota_francesa),
    residual_value: moneyToDb(indicadores.valor_residual),
    calculation_snapshot: { flujos: indicadores.flujos },
  });
  if (indErr) throw indErr;
}

export async function loadPersistedAmortization(loanExternalCode: string) {
  const loanId = await getLoanUuidByExternalCode(loanExternalCode);
  if (!loanId) return null;

  const { data: schedule, error: sErr } = await supabase
    .from('payment_schedule')
    .select('*')
    .eq('loan_id', loanId)
    .order('installment_number');

  const { data: indicators, error: iErr } = await supabase
    .from('financial_indicators')
    .select('*')
    .eq('loan_id', loanId)
    .maybeSingle();

  if (sErr) throw sErr;
  if (iErr) throw iErr;
  if (!schedule?.length || !indicators) return null;

  const cronograma: CronogramaRow[] = schedule.map((r) => ({
    numero_cuota: r.installment_number,
    fecha_pago: r.due_date,
    tipo_periodo: r.grace_type as CronogramaRow['tipo_periodo'],
    saldo_inicial: moneyFromDb(r.initial_balance),
    interes: moneyFromDb(r.interest),
    amortizacion: moneyFromDb(r.amortization),
    cuota: moneyFromDb(r.installment_amount),
    valor_residual_pagado: moneyFromDb(r.residual_paid),
    saldo_final: moneyFromDb(r.final_balance),
    flujo_deudor: moneyFromDb(r.debtor_flow),
    valor_actual: moneyFromDb(r.present_value),
  }));

  const snapshot = indicators.calculation_snapshot as { flujos?: number[] };
  const indicadores: IndicadoresTransparencia = {
    monto_prestamo: moneyFromDb(indicators.financed_amount),
    tea: Number(indicators.tea),
    tasa_periodica: Number(indicators.periodic_rate),
    tasa_descuento_periodica: Number(indicators.discount_rate_periodic),
    numero_periodos: indicators.num_periods,
    total_intereses: moneyFromDb(indicators.total_interest),
    total_pagado: moneyFromDb(indicators.total_paid),
    van: moneyFromDb(indicators.van),
    tir_periodica: Number(indicators.tir_periodic),
    tir_anual: Number(indicators.tir_annual),
    tcea: Number(indicators.tcea),
    cuota_francesa: moneyFromDb(indicators.french_installment),
    valor_residual: moneyFromDb(indicators.residual_value),
    flujos: snapshot.flujos || [],
  };

  return { cronograma, indicadores };
}
