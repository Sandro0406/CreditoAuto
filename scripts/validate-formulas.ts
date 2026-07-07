import {
  calcularCreditoVehicular,
  calcularMontoPrestamo,
  SolicitudCreditoData,
} from '../src/app/lib/financialCalculations';
import { roundMoney } from '../src/app/lib/money';

function assertClose(actual: number, expected: number, label: string, tolerance = 0.02) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

// NOTA: desde que se implementó el cuotón capitalizante (valor residual como
// cronograma paralelo que vence en el período N+1, igual que el Excel modelo
// "Compra Inteligente - Interbank"), los valores esperados de Caso1/Caso2 ya
// NO coinciden con los de la Sección 7 del informe (que trata el valor
// residual como monto plano sumado a la última cuota). Los números de abajo
// son los que produce el modelo actual, recalculados y verificados; lo que
// se sigue validando del §6D original es el comportamiento cualitativo
// (36/24 cuotas, gracia parcial = solo interés, cuotas constantes, etc.).

const caso1: SolicitudCreditoData = {
  id: 'TEST-1',
  marca_vehiculo: 'Toyota',
  modelo_vehiculo: 'Corolla',
  precio_vehiculo: '80000',
  cuota_inicial: '16000',
  tasa_descuento: '12',
  tasa_interes: '10',
  tipo_tasa: 'Efectiva',
  frecuencia_pago: 'Mensual',
  plazo_credito: '36',
  periodo_gracia: '0',
  tipo_gracia: 'Ninguno',
  moneda: 'Soles',
  fecha_inicio: '2024-01-01',
  valor_residual: '20000',
};

const caso2: SolicitudCreditoData = {
  id: 'TEST-2',
  marca_vehiculo: 'Nissan',
  modelo_vehiculo: 'Versa',
  precio_vehiculo: '25000',
  cuota_inicial: '3750',
  tasa_descuento: '10',
  tasa_interes: '12',
  tipo_tasa: 'Nominal',
  capitalizacion: 'Mensual',
  frecuencia_pago: 'Mensual',
  plazo_credito: '24',
  periodo_gracia: '3',
  tipo_gracia: 'Parcial',
  moneda: 'Soles',
  fecha_inicio: '2024-01-01',
  valor_residual: '8000',
};

// Caso 1 — sin gracia, sin gastos periódicos. El cuotón captura íntegro el
// valor residual (20,000) y madura en el período 37 (N+1).
assertEqual(calcularMontoPrestamo(80000, 16000), 64000, 'Caso1 monto');
const r1 = calcularCreditoVehicular(caso1);
assertEqual(r1.indicadores.numero_periodos, 36, 'Caso1 periodos regulares');
assertEqual(r1.cronograma.length, 37, 'Caso1 cronograma incluye el período del cuotón');
assertClose(r1.indicadores.monto_prestamo, 64000, 'Caso1 monto prestamo');
assertClose(r1.indicadores.cuota_francesa, 1574.16, 'Caso1 cuota francesa');
assertClose(r1.indicadores.total_intereses, 7577.30, 'Caso1 total intereses');
assertClose(r1.indicadores.total_pagado, 76669.88, 'Caso1 total pagado');
assertClose(r1.indicadores.van, 2083.38, 'Caso1 VAN');
assertClose(r1.indicadores.tcea * 100, 10, 'Caso1 TCEA % (sin gastos = TEA)', 0.01);
assertEqual(r1.cronograma[r1.cronograma.length - 1].tipo_periodo, 'Cuotón', 'Caso1 último período es el cuotón');
assertClose(r1.cronograma[r1.cronograma.length - 1].valor_residual_pagado, 20000, 'Caso1 cuotón paga el VR completo');

// Caso 2 — gracia parcial 3 periodos: comportamiento cualitativo del §6D.
assertEqual(calcularMontoPrestamo(25000, 3750), 21250, 'Caso2 monto');
const r2 = calcularCreditoVehicular(caso2);
assertClose(r2.indicadores.monto_prestamo, 21250, 'Caso2 monto prestamo');
assertClose(r2.indicadores.tasa_periodica * 100, 1, 'Caso2 TEM %', 0.01);
for (let i = 0; i < 3; i += 1) {
  const row = r2.cronograma[i];
  assertEqual(row.tipo_periodo, 'Gracia Parcial', `Caso2 gracia P${i + 1}`);
  assertClose(row.amortizacion, 0, `Caso2 amort P${i + 1}`);
  assertClose(row.cuota, row.interes, `Caso2 cuota=interes P${i + 1}`);
}
assertEqual(r2.cronograma[r2.cronograma.length - 1].tipo_periodo, 'Cuotón', 'Caso2 último período es el cuotón');

// Caso 3: gastos periódicos (seguros, GPS, portes, gastos adm.) sobre Caso1.
// Sin gastos, TCEA debe ser igual a TEA. Con gastos, el flujo del deudor
// crece y la TCEA debe superar a la TEA.
const caso3: SolicitudCreditoData = {
  ...caso1,
  id: 'TEST-3',
  pct_seguro_desgravamen: '0.049',
  seguro_riesgo: '4',
  gps: '20',
  portes: '3.5',
  gastos_administrativos: '3.5',
};
const r3 = calcularCreditoVehicular(caso3);

assertClose(r1.indicadores.tcea, r1.indicadores.tea, 'Caso1 TCEA=TEA sin gastos', 0.0001);
assertEqual(r1.indicadores.total_gastos, 0, 'Caso1 sin gastos');

if (r3.indicadores.total_gastos <= 0) {
  throw new Error('Caso3: total_gastos debería ser > 0');
}
if (r3.indicadores.tcea <= r3.indicadores.tea) {
  throw new Error('Caso3: TCEA debería superar a la TEA cuando hay gastos periódicos');
}
assertClose(r3.indicadores.saldo_a_financiar_con_cuotas, 49358.25, 'Caso3 saldo a financiar con cuotas', 0.5);
assertClose(r3.cronograma[0].gastos_periodo, 55.19, 'Caso3 gasto período 1', 0.02);

// Caso Excel: réplica exacta del modelo "Compra Inteligente - Interbank"
// (Trabajo final - Ordinario - Compra Inteligente IB - Modelo.xlsx, hoja
// "Frances"). Verificado celda por celda contra el archivo real.
const casoExcel: SolicitudCreditoData = {
  id: 'TEST-EXCEL',
  marca_vehiculo: 'X',
  modelo_vehiculo: 'Y',
  precio_vehiculo: '16000',
  cuota_inicial: '3200', // 20%
  valor_residual: '6400', // 40%
  tasa_interes: '15',
  tipo_tasa: 'Nominal',
  capitalizacion: 'Diaria',
  frecuencia_pago: 'Mensual',
  plazo_credito: '36',
  periodo_gracia: '0',
  tipo_gracia: 'Ninguno',
  periodos_gracia_total: '3',
  periodos_gracia_parcial: '3',
  tasa_descuento: '50',
  moneda: 'Soles',
  fecha_inicio: '2024-01-01',
  costo_notarial: '100',
  costo_registral: '75',
  pct_seguro_desgravamen: '0.049',
  seguro_riesgo: '4',
  gps: '20',
  portes: '3.5',
  gastos_administrativos: '3.5',
};
const rExcel = calcularCreditoVehicular(casoExcel);
const iExcel = rExcel.indicadores;

assertClose(iExcel.monto_prestamo, 12975, 'CasoExcel monto préstamo');
assertClose(iExcel.saldo_a_financiar_con_cuotas, 9015.99, 'CasoExcel saldo a financiar con cuotas');
assertClose(iExcel.cuota_francesa, 379.16, 'CasoExcel cuota francesa (con seg. desgravamen)');
assertClose(iExcel.tea * 100, 16.1798, 'CasoExcel TEA %', 0.001);
assertClose(iExcel.tasa_periodica * 100, 1.2576, 'CasoExcel TEM %', 0.001);
assertClose(iExcel.van, 4436.18, 'CasoExcel VAN (COK 50%)', 1);
assertClose(iExcel.tir_periodica * 100, 1.5862, 'CasoExcel TIR mensual %', 0.01);
assertClose(iExcel.tcea * 100, 20.7856, 'CasoExcel TCEA %', 0.05);
assertEqual(rExcel.cronograma.length, 37, 'CasoExcel 37 períodos (36 regulares + cuotón)');

const excelFlujos = [
  -35.4178, -35.4734, -35.5296, -153.3017, -153.3017, -153.3017,
  -410.1584, -410.1584, -410.1584, -410.1584, -410.1584, -410.1584,
  -410.1584, -410.1584, -410.1584, -410.1584, -410.1584, -410.1584,
  -410.1584, -410.1584, -410.1584, -410.1584, -410.1584, -410.1584,
  -410.1584, -410.1584, -410.1584, -410.1584, -410.1584, -410.1584,
  -410.1584, -410.1584, -410.1584, -410.1584, -410.1584, -410.1584,
  -6431.0000,
];
excelFlujos.forEach((esperado, idx) => {
  assertClose(rExcel.cronograma[idx].flujo_deudor, esperado, `CasoExcel flujo período ${idx + 1}`, 0.02);
});

console.log('✓ validate-formulas: todos los casos pasaron');
console.log(`  Caso1: VAN=${roundMoney(r1.indicadores.van)}, TCEA=${(r1.indicadores.tcea * 100).toFixed(2)}%`);
console.log(`  Caso2: TEM=${(r2.indicadores.tasa_periodica * 100).toFixed(4)}%, periodos=${r2.indicadores.numero_periodos}`);
console.log(`  Caso3: total_gastos=${roundMoney(r3.indicadores.total_gastos)}, TEA=${(r3.indicadores.tea * 100).toFixed(2)}%, TCEA=${(r3.indicadores.tcea * 100).toFixed(2)}%`);
console.log(`  CasoExcel: monto=${roundMoney(iExcel.monto_prestamo)}, VAN=${roundMoney(iExcel.van)}, TCEA=${(iExcel.tcea * 100).toFixed(2)}% (Excel: 12975 / 4436.18 / 20.79%)`);
