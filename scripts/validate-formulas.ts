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

// Caso 1
assertEqual(calcularMontoPrestamo(80000, 16000), 64000, 'Caso1 monto');
const r1 = calcularCreditoVehicular(caso1);
assertEqual(r1.indicadores.numero_periodos, 36, 'Caso1 periodos');
assertClose(r1.indicadores.monto_prestamo, 64000, 'Caso1 monto prestamo');
assertClose(r1.indicadores.cuota_francesa, 1570.35, 'Caso1 cuota francesa');
assertClose(r1.indicadores.total_intereses, 12532.66, 'Caso1 total intereses');
assertClose(r1.indicadores.total_pagado, 76532.66, 'Caso1 total pagado');
assertClose(r1.indicadores.van, 2065.35, 'Caso1 VAN');
assertClose(r1.indicadores.tcea * 100, 10, 'Caso1 TCEA %', 0.05);

// Caso 2
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

console.log('✓ validate-formulas: todos los casos §6D pasaron');
console.log(`  Caso1: VAN=${roundMoney(r1.indicadores.van)}, TCEA=${(r1.indicadores.tcea * 100).toFixed(2)}%`);
console.log(`  Caso2: TEM=${(r2.indicadores.tasa_periodica * 100).toFixed(4)}%, periodos=${r2.indicadores.numero_periodos}`);
