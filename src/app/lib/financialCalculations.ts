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
}

export interface CronogramaRow {
  numero_cuota: number;
  fecha_pago: string;
  tipo_periodo: 'Normal' | 'Gracia Total' | 'Gracia Parcial';
  saldo_inicial: number;
  interes: number;
  amortizacion: number;
  cuota: number;
  valor_residual_pagado: number;
  saldo_final: number;
  flujo_deudor: number;
  valor_actual: number;
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

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatMoney(value: number, currency: string): string {
  const symbol = currency === 'Soles' ? 'S/' : '$';
  return `${symbol} ${round2(value).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercent(value: number, decimals = 4): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// Devuelve el monto que financia el banco: precio - cuota inicial.
// El valor residual (cuota balón) NO se descuenta aquí; se trata como
// pago diferido al final del plazo (método Compra Inteligente).
export function calcularMontoPrestamo(precioVehiculo: number, cuotaInicial: number): number {
  return Math.max(precioVehiculo - cuotaInicial, 0);
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
  if (tasaPeriodo === 0) return saldo / periodos;

  const factor = (tasaPeriodo * Math.pow(1 + tasaPeriodo, periodos)) / (Math.pow(1 + tasaPeriodo, periodos) - 1);
  return saldo * factor;
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

  // Compra Inteligente: el banco financia precio - cuota_inicial.
  // El valor residual es la cuota balón diferida al último período.
  const montoPrestamo = calcularMontoPrestamo(precioVehiculo, cuotaInicial);

  const diasPeriodo = frequencyDays[solicitud.frecuencia_pago] ?? 30;
  const totalDays = toNumber(solicitud.plazo_credito) * 30;
  const numeroPeriodos = Math.max(Math.ceil(totalDays / diasPeriodo), 1);
  const periodosGracia = Math.min(toNumber(solicitud.periodo_gracia), numeroPeriodos);
  const tipoGracia = solicitud.tipo_gracia || 'Ninguno';
  const periodosNormales = Math.max(numeroPeriodos - (tipoGracia === 'Ninguno' ? 0 : periodosGracia), 1);

  const tea = convertirATasaEfectivaAnual(
    toNumber(solicitud.tasa_interes),
    solicitud.tipo_tasa,
    solicitud.capitalizacion || 'Mensual'
  );
  const tasaPeriodica = convertirTasaEfectivaPeriodo(tea, diasPeriodo);
  const tasaDescuentoAnual = toNumber(solicitud.tasa_descuento) / 100;
  const tasaDescuentoPeriodica = convertirTasaEfectivaPeriodo(tasaDescuentoAnual, diasPeriodo);

  const cronograma: CronogramaRow[] = [];
  // Flujo del deudor: período 0 = monto recibido (positivo),
  // períodos siguientes = cuotas pagadas (negativas).
  const flujos: number[] = [montoPrestamo];
  let saldo = montoPrestamo;
  let cuotaFrancesa = 0;
  let totalIntereses = 0;
  let totalPagado = 0;

  for (let periodo = 1; periodo <= numeroPeriodos; periodo += 1) {
    const saldoInicial = saldo;
    const interes = saldoInicial * tasaPeriodica;
    let amortizacion = 0;
    let cuota = 0;
    let valorResidualPagado = 0;
    let tipoPeriodo: CronogramaRow['tipo_periodo'] = 'Normal';

    const estaEnGracia = tipoGracia !== 'Ninguno' && periodo <= periodosGracia;

    if (estaEnGracia && tipoGracia === 'Total') {
      tipoPeriodo = 'Gracia Total';
      cuota = 0;
      amortizacion = 0;
      saldo = saldoInicial + interes;
    } else if (estaEnGracia && tipoGracia === 'Parcial') {
      tipoPeriodo = 'Gracia Parcial';
      cuota = interes;
      amortizacion = 0;
      saldo = saldoInicial;
    } else {
      if (cuotaFrancesa === 0) {
        // Compra Inteligente: descontar el VA del valor residual (cuota balón)
        // para obtener la base sobre la que se calcula la cuota francesa.
        // periodos_restantes incluye el período actual.
        const periodosRestantes = numeroPeriodos - periodo + 1;
        const vrPV = valorResidual > 0
          ? valorResidual / Math.pow(1 + tasaPeriodica, periodosRestantes)
          : 0;
        const baseCalculo = Math.max(saldoInicial - vrPV, 0);
        cuotaFrancesa = calcularCuotaFrancesa(baseCalculo, tasaPeriodica, periodosRestantes);
      }

      cuota = cuotaFrancesa;
      amortizacion = cuota - interes;
      saldo = Math.max(saldoInicial - amortizacion, 0);

      // Último período: se cobra la cuota balón (valor residual).
      // El saldo queda en 0 tras su pago.
      if (periodo === numeroPeriodos && valorResidual > 0) {
        valorResidualPagado = valorResidual;
        cuota += valorResidual;
        amortizacion += valorResidual;
        saldo = 0;
      }
    }

    const flujoDeudor = -cuota;
    const valorActual = flujoDeudor / Math.pow(1 + tasaDescuentoPeriodica, periodo);

    flujos.push(flujoDeudor);
    totalIntereses += interes;
    totalPagado += cuota;

    cronograma.push({
      numero_cuota: periodo,
      fecha_pago: addDays(solicitud.fecha_inicio, periodo * diasPeriodo),
      tipo_periodo: tipoPeriodo,
      saldo_inicial: round2(saldoInicial),
      interes: round2(interes),
      amortizacion: round2(amortizacion),
      cuota: round2(cuota),
      valor_residual_pagado: round2(valorResidualPagado),
      saldo_final: round2(saldo),
      flujo_deudor: round2(flujoDeudor),
      valor_actual: round2(valorActual),
    });
  }

  const van = flujos.reduce((acc, flujo, index) => acc + flujo / Math.pow(1 + tasaDescuentoPeriodica, index), 0);
  const tirPeriodica = calculateIrr(flujos);
  const tirAnual = Math.pow(1 + tirPeriodica, DAYS_PER_YEAR / diasPeriodo) - 1;

  return {
    cronograma,
    indicadores: {
      monto_prestamo: round2(montoPrestamo),
      tea,
      tasa_periodica: tasaPeriodica,
      tasa_descuento_periodica: tasaDescuentoPeriodica,
      numero_periodos: numeroPeriodos,
      total_intereses: round2(totalIntereses),
      total_pagado: round2(totalPagado),
      van: round2(van),
      tir_periodica: tirPeriodica,
      tir_anual: tirAnual,
      tcea: tirAnual,
      cuota_francesa: round2(cuotaFrancesa),
      valor_residual: round2(valorResidual),
      flujos,
    },
  };
}
