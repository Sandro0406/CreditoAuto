export type TipoTasa = 'Efectiva' | 'Nominal';
export type TipoGracia = 'Ninguno' | 'Total' | 'Parcial';
export type FrecuenciaPago = 'Mensual' | 'Quincenal' | 'Semanal';
export type Capitalizacion = 'Diaria' | 'Quincenal' | 'Mensual' | 'Bimestral' | 'Trimestral' | 'Semestral' | 'Anual';

export interface SolicitudCreditoData {
  id: string;
  cliente_id?: string;
  marca_vehiculo: string;
  modelo_vehiculo: string;
  precio_vehiculo: string;
  cuota_inicial: string;
  tasa_descuento: string;
  tasa_interes: string;
  tipo_tasa: TipoTasa | string;
  capitalizacion?: Capitalizacion | string;
  frecuencia_pago: FrecuenciaPago | string;
  plazo_credito: string;
  periodo_gracia: string;
  tipo_gracia: TipoGracia | string;
  moneda: string;
  fecha_inicio: string;
  valor_residual: string;
  // Gastos periódicos (Compra Inteligente): se cobran cada período, incluso en gracia.
  pct_seguro_desgravamen?: string; // % sobre saldo inicial, ej. "0.049" = 0.049%
  seguro_riesgo?: string; // monto fijo por período
  gps?: string; // monto fijo por período
  portes?: string; // monto fijo por período
  gastos_administrativos?: string; // monto fijo por período
  // Costes iniciales (una sola vez): se financian, se suman al monto del préstamo.
  costo_notarial?: string;
  costo_registral?: string;
  costo_tasacion?: string;
  comision_estudio?: string;
  comision_activacion?: string;
  // Gracia mixta: N períodos Total, luego N períodos Parcial, luego el resto Normal.
  // Si ambos son 0/ausentes, se usa el modo legado (tipo_gracia + periodo_gracia).
  periodos_gracia_total?: string;
  periodos_gracia_parcial?: string;
}

export interface CronogramaRow {
  numero_cuota: number;
  fecha_pago: string;
  tipo_periodo: 'Normal' | 'Gracia Total' | 'Gracia Parcial' | 'Cuotón';
  saldo_inicial: number;
  interes: number;
  amortizacion: number;
  cuota: number;
  valor_residual_pagado: number;
  saldo_final: number;
  flujo_deudor: number;
  valor_actual: number;
  seguro_desgravamen: number;
  seguro_riesgo: number;
  gps: number;
  portes: number;
  gastos_administrativos: number;
  gastos_periodo: number;
  // Cuotón (bloque paralelo): capitaliza interés + seguro de desgravamen
  // durante N+1 períodos, se liquida en un período extra tras la última cuota.
  saldo_inicial_cuoton: number;
  interes_cuoton: number;
  seguro_desgravamen_cuoton: number;
  saldo_final_cuoton: number;
}

export interface IndicadoresTransparencia {
  monto_prestamo: number;
  tea: number;
  tasa_periodica: number;
  tasa_descuento_periodica: number;
  numero_periodos: number;
  total_intereses: number;
  total_pagado: number;
  van: number;
  tir_periodica: number;
  tir_anual: number;
  tcea: number;
  cuota_francesa: number;
  valor_residual: number;
  flujos: number[];
  total_gastos: number;
  costes_iniciales: number;
  saldo_a_financiar_con_cuotas: number;
}

export interface ResultadoCredito {
  cronograma: CronogramaRow[];
  indicadores: IndicadoresTransparencia;
}

const DAYS_PER_YEAR = 360;

const frequencyDays: Record<string, number> = {
  Mensual: 30,
  Quincenal: 15,
  Semanal: 7,
};

const capitalizationDays: Record<string, number> = {
  Diaria: 1,
  Quincenal: 15,
  Mensual: 30,
  Bimestral: 60,
  Trimestral: 90,
  Semestral: 180,
  Anual: 360,
};

export function toNumber(value: string | number | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

import { roundMoney } from './money';

export { roundMoney, round2, formatMoney, formatMoneyStorage, MONEY_SCALE } from './money';

export function formatPercent(value: number, decimals = 4): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// Devuelve el monto que financia el banco: precio - cuota inicial + costes
// iniciales financiados (notariales, registrales, tasación, comisiones).
// El valor residual (cuota balón) NO se descuenta aquí; se trata como
// pago diferido al final del plazo (método Compra Inteligente).
export function calcularMontoPrestamo(
  precioVehiculo: number,
  cuotaInicial: number,
  costesIniciales: number = 0
): number {
  return roundMoney(Math.max(precioVehiculo - cuotaInicial, 0) + costesIniciales);
}

export function convertirATasaEfectivaAnual(
  tasaInteresPorcentaje: number,
  tipoTasa: string,
  capitalizacion: string = 'Mensual'
): number {
  const tasa = tasaInteresPorcentaje / 100;

  if (tipoTasa === 'Nominal') {
    const diasCapitalizacion = capitalizationDays[capitalizacion] ?? 30;
    const m = DAYS_PER_YEAR / diasCapitalizacion;
    return Math.pow(1 + tasa / m, m) - 1;
  }

  return tasa;
}

export function convertirTasaEfectivaPeriodo(tea: number, diasPeriodo: number): number {
  return Math.pow(1 + tea, diasPeriodo / DAYS_PER_YEAR) - 1;
}

function calcularCuotaFrancesa(saldo: number, tasaPeriodo: number, periodos: number): number {
  if (periodos <= 0) return 0;
  if (tasaPeriodo === 0) return roundMoney(saldo / periodos);

  const factor = (tasaPeriodo * Math.pow(1 + tasaPeriodo, periodos)) / (Math.pow(1 + tasaPeriodo, periodos) - 1);
  return roundMoney(saldo * factor);
}

function addDays(dateText: string, days: number): string {
  const date = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function calculateIrr(cashflows: number[]): number {
  const npv = (rate: number) => cashflows.reduce((acc, flow, index) => acc + flow / Math.pow(1 + rate, index), 0);

  let low = -0.9999;
  let high = 1;
  let npvLow = npv(low);
  let npvHigh = npv(high);

  let attempts = 0;
  while (npvLow * npvHigh > 0 && attempts < 60) {
    high *= 2;
    npvHigh = npv(high);
    attempts += 1;
  }

  if (npvLow * npvHigh > 0) return 0;

  for (let i = 0; i < 120; i += 1) {
    const mid = (low + high) / 2;
    const npvMid = npv(mid);

    if (Math.abs(npvMid) < 1e-7) return mid;

    if (npvLow * npvMid < 0) {
      high = mid;
      npvHigh = npvMid;
    } else {
      low = mid;
      npvLow = npvMid;
    }
  }

  return (low + high) / 2;
}

export function calcularCreditoVehicular(solicitud: SolicitudCreditoData): ResultadoCredito {
  const precioVehiculo = toNumber(solicitud.precio_vehiculo);
  const cuotaInicial = toNumber(solicitud.cuota_inicial);
  const valorResidual = toNumber(solicitud.valor_residual);

  // Costes iniciales (una sola vez): se financian, se suman al monto del préstamo.
  const costesIniciales = roundMoney(
    toNumber(solicitud.costo_notarial) +
      toNumber(solicitud.costo_registral) +
      toNumber(solicitud.costo_tasacion) +
      toNumber(solicitud.comision_estudio) +
      toNumber(solicitud.comision_activacion)
  );

  // Compra Inteligente: el banco financia precio - cuota_inicial + costes iniciales.
  const montoPrestamo = calcularMontoPrestamo(precioVehiculo, cuotaInicial, costesIniciales);

  const diasPeriodo = frequencyDays[solicitud.frecuencia_pago] ?? 30;
  const totalDays = toNumber(solicitud.plazo_credito) * 30;
  const numeroPeriodos = Math.max(Math.ceil(totalDays / diasPeriodo), 1);

  // Gracia mixta: N períodos Total, luego N períodos Parcial, luego el resto Normal.
  // Modo legado (un solo tipo + contador) si no se especifican los campos nuevos.
  let periodosGraciaTotal = toNumber(solicitud.periodos_gracia_total);
  let periodosGraciaParcial = toNumber(solicitud.periodos_gracia_parcial);
  if (periodosGraciaTotal === 0 && periodosGraciaParcial === 0) {
    const periodoGraciaLegado = Math.min(toNumber(solicitud.periodo_gracia), numeroPeriodos);
    if (solicitud.tipo_gracia === 'Total') periodosGraciaTotal = periodoGraciaLegado;
    else if (solicitud.tipo_gracia === 'Parcial') periodosGraciaParcial = periodoGraciaLegado;
  }
  periodosGraciaTotal = Math.min(Math.max(periodosGraciaTotal, 0), numeroPeriodos);
  periodosGraciaParcial = Math.min(
    Math.max(periodosGraciaParcial, 0),
    Math.max(numeroPeriodos - periodosGraciaTotal, 0)
  );

  const tea = convertirATasaEfectivaAnual(
    toNumber(solicitud.tasa_interes),
    solicitud.tipo_tasa,
    solicitud.capitalizacion || 'Mensual'
  );
  const tasaPeriodica = convertirTasaEfectivaPeriodo(tea, diasPeriodo);
  const tasaDescuentoAnual = toNumber(solicitud.tasa_descuento) / 100;
  const tasaDescuentoPeriodica = convertirTasaEfectivaPeriodo(tasaDescuentoAnual, diasPeriodo);

  // Gastos periódicos (Compra Inteligente): se cobran todos los períodos, incluso en gracia.
  const pctSegDesPeriodo = toNumber(solicitud.pct_seguro_desgravamen) / 100;
  const segRiePeriodo = toNumber(solicitud.seguro_riesgo);
  const gpsPeriodo = toNumber(solicitud.gps);
  const portesPeriodo = toNumber(solicitud.portes);
  const gastosAdminPeriodo = toNumber(solicitud.gastos_administrativos);

  // Cuotón: cronograma paralelo que capitaliza interés + seguro de desgravamen
  // y vence un período después de la última cuota regular (N+1), como en el
  // modelo "Compra Inteligente" del banco. Su valor presente se resta del
  // monto financiado antes de calcular la cuota regular.
  const tasaCapCuoton = tasaPeriodica + pctSegDesPeriodo;
  const maduracionCuoton = numeroPeriodos + 1;
  const vpCuoton = valorResidual > 0
    ? roundMoney(valorResidual / Math.pow(1 + tasaCapCuoton, maduracionCuoton))
    : 0;
  const saldoAFinanciarConCuotas = roundMoney(Math.max(montoPrestamo - vpCuoton, 0));

  const cronograma: CronogramaRow[] = [];
  // Flujo del deudor: período 0 = monto recibido (positivo),
  // períodos siguientes = cuotas + gastos pagados (negativas).
  const flujos: number[] = [montoPrestamo];
  let saldo = saldoAFinanciarConCuotas;
  let saldoCuoton = vpCuoton;
  let cuotaFrancesa = 0;
  let totalIntereses = 0;
  let totalPagado = 0;
  let totalGastos = 0;

  for (let periodo = 1; periodo <= numeroPeriodos; periodo += 1) {
    const saldoInicial = roundMoney(saldo);
    let interes = roundMoney(saldoInicial * tasaPeriodica);
    let amortizacion = 0;
    let cuota = 0;
    let tipoPeriodo: CronogramaRow['tipo_periodo'] = 'Normal';

    // El cuotón capitaliza en paralelo cada período; no se paga hasta el final.
    const saldoInicialCuoton = roundMoney(saldoCuoton);
    const interesCuoton = roundMoney(saldoInicialCuoton * tasaPeriodica);
    const segDesCuoton = roundMoney(saldoInicialCuoton * pctSegDesPeriodo);
    saldoCuoton = roundMoney(saldoInicialCuoton + interesCuoton + segDesCuoton);

    // Gastos se cobran cada período (incluso en gracia), sobre el saldo regular vigente.
    const seguroDesgravamen = roundMoney(saldoInicial * pctSegDesPeriodo);
    const seguroRiesgo = roundMoney(segRiePeriodo);
    const gpsMonto = roundMoney(gpsPeriodo);
    const portesMonto = roundMoney(portesPeriodo);
    const gastosAdminMonto = roundMoney(gastosAdminPeriodo);
    const gastosPeriodo = roundMoney(
      seguroDesgravamen + seguroRiesgo + gpsMonto + portesMonto + gastosAdminMonto
    );

    const estaEnGraciaTotal = periodo <= periodosGraciaTotal;
    const estaEnGraciaParcial = !estaEnGraciaTotal && periodo <= periodosGraciaTotal + periodosGraciaParcial;

    if (estaEnGraciaTotal) {
      tipoPeriodo = 'Gracia Total';
      cuota = 0;
      amortizacion = 0;
      saldo = roundMoney(saldoInicial + interes);
    } else if (estaEnGraciaParcial) {
      tipoPeriodo = 'Gracia Parcial';
      cuota = interes;
      amortizacion = 0;
      saldo = saldoInicial;
    } else {
      if (cuotaFrancesa === 0) {
        // La cuota fija (constante) se calcula con la tasa combinada
        // (interés + % seguro de desgravamen): así es como el seguro,
        // que decrece con el saldo, queda "empaquetado" dentro de un
        // pago constante — igual que el Excel modelo ("Cuota inc Seg Des").
        const periodosRestantes = numeroPeriodos - periodo + 1;
        cuotaFrancesa = calcularCuotaFrancesa(saldoInicial, tasaPeriodica + pctSegDesPeriodo, periodosRestantes);
      }

      // cuota (pura) = cuota fija - seguro de desgravamen de este período.
      cuota = roundMoney(cuotaFrancesa - seguroDesgravamen);
      amortizacion = roundMoney(cuota - interes);
      saldo = roundMoney(Math.max(saldoInicial - amortizacion, 0));
    }

    const flujoDeudor = roundMoney(-(cuota + gastosPeriodo));
    const valorActual = roundMoney(flujoDeudor / Math.pow(1 + tasaDescuentoPeriodica, periodo));

    flujos.push(flujoDeudor);
    totalIntereses = roundMoney(totalIntereses + interes);
    totalPagado = roundMoney(totalPagado + cuota);
    totalGastos = roundMoney(totalGastos + gastosPeriodo);

    cronograma.push({
      numero_cuota: periodo,
      fecha_pago: addDays(solicitud.fecha_inicio, periodo * diasPeriodo),
      tipo_periodo: tipoPeriodo,
      saldo_inicial: saldoInicial,
      interes,
      amortizacion,
      cuota,
      valor_residual_pagado: 0,
      saldo_final: saldo,
      flujo_deudor: flujoDeudor,
      valor_actual: valorActual,
      seguro_desgravamen: seguroDesgravamen,
      seguro_riesgo: seguroRiesgo,
      gps: gpsMonto,
      portes: portesMonto,
      gastos_administrativos: gastosAdminMonto,
      gastos_periodo: gastosPeriodo,
      saldo_inicial_cuoton: saldoInicialCuoton,
      interes_cuoton: interesCuoton,
      seguro_desgravamen_cuoton: segDesCuoton,
      saldo_final_cuoton: saldoCuoton,
    });
  }

  // Período N+1: liquidación del cuotón (solo si hay valor residual).
  if (valorResidual > 0) {
    const periodo = numeroPeriodos + 1;
    const saldoInicialCuoton = roundMoney(saldoCuoton);
    const interesCuoton = roundMoney(saldoInicialCuoton * tasaPeriodica);
    const segDesCuoton = roundMoney(saldoInicialCuoton * pctSegDesPeriodo);
    const valorResidualPagado = roundMoney(valorResidual);

    // El saldo regular ya está en 0; solo se cobran los gastos fijos (no el
    // seguro de desgravamen regular, que se calcula sobre saldo=0).
    const seguroRiesgo = roundMoney(segRiePeriodo);
    const gpsMonto = roundMoney(gpsPeriodo);
    const portesMonto = roundMoney(portesPeriodo);
    const gastosAdminMonto = roundMoney(gastosAdminPeriodo);
    const gastosPeriodo = roundMoney(seguroRiesgo + gpsMonto + portesMonto + gastosAdminMonto);

    const flujoDeudor = roundMoney(-(valorResidualPagado + gastosPeriodo));
    const valorActual = roundMoney(flujoDeudor / Math.pow(1 + tasaDescuentoPeriodica, periodo));

    flujos.push(flujoDeudor);
    totalPagado = roundMoney(totalPagado + valorResidualPagado);
    totalGastos = roundMoney(totalGastos + gastosPeriodo);

    cronograma.push({
      numero_cuota: periodo,
      fecha_pago: addDays(solicitud.fecha_inicio, periodo * diasPeriodo),
      tipo_periodo: 'Cuotón',
      saldo_inicial: 0,
      interes: 0,
      amortizacion: 0,
      cuota: 0,
      valor_residual_pagado: valorResidualPagado,
      saldo_final: 0,
      flujo_deudor: flujoDeudor,
      valor_actual: valorActual,
      seguro_desgravamen: 0,
      seguro_riesgo: seguroRiesgo,
      gps: gpsMonto,
      portes: portesMonto,
      gastos_administrativos: gastosAdminMonto,
      gastos_periodo: gastosPeriodo,
      saldo_inicial_cuoton: saldoInicialCuoton,
      interes_cuoton: interesCuoton,
      seguro_desgravamen_cuoton: segDesCuoton,
      saldo_final_cuoton: 0,
    });
  }

  const van = roundMoney(
    flujos.reduce((acc, flujo, index) => acc + flujo / Math.pow(1 + tasaDescuentoPeriodica, index), 0)
  );
  const tirPeriodica = calculateIrr(flujos);
  const tirAnual = Math.pow(1 + tirPeriodica, DAYS_PER_YEAR / diasPeriodo) - 1;

  return {
    cronograma,
    indicadores: {
      monto_prestamo: montoPrestamo,
      tea,
      tasa_periodica: tasaPeriodica,
      tasa_descuento_periodica: tasaDescuentoPeriodica,
      numero_periodos: numeroPeriodos,
      total_intereses: totalIntereses,
      total_pagado: totalPagado,
      van,
      tir_periodica: tirPeriodica,
      tir_anual: tirAnual,
      tcea: tirAnual,
      cuota_francesa: cuotaFrancesa,
      valor_residual: roundMoney(valorResidual),
      flujos,
      total_gastos: totalGastos,
      costes_iniciales: costesIniciales,
      saldo_a_financiar_con_cuotas: saldoAFinanciarConCuotas,
    },
  };
}
