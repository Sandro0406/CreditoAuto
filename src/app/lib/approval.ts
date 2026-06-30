import type { AppConfig } from '../types';

export function resolveInitialLoanStatus(
  financedAmount: number,
  settings: AppConfig
): { status: string; message: string } {
  const limit = Number(settings.autoaprobacionHasta) || 0;

  if (limit > 0 && financedAmount <= limit) {
    return {
      status: 'Aprobado',
      message: `Auto-aprobada: monto financiado (${financedAmount.toLocaleString('es-PE')}) ≤ límite (${limit.toLocaleString('es-PE')})`,
    };
  }

  if (settings.requiereAprobacionGerencia && financedAmount > limit) {
    return {
      status: 'Pendiente',
      message: `Pendiente: requiere aprobación de gerencia (monto > ${limit.toLocaleString('es-PE')})`,
    };
  }

  return { status: 'Pendiente', message: 'Solicitud registrada como pendiente de revisión' };
}

export function validateLoanAgainstSettings(
  financedAmount: number,
  termMonths: number,
  settings: AppConfig
): string | null {
  const plazoMax = Number(settings.plazoMaximo);
  const montoMax = Number(settings.montoMaximo);

  if (plazoMax > 0 && termMonths > plazoMax) {
    return `El plazo máximo permitido es ${plazoMax} meses (configuración).`;
  }
  if (montoMax > 0 && financedAmount > montoMax) {
    return `El monto financiado máximo es ${montoMax.toLocaleString('es-PE')} (configuración).`;
  }
  return null;
}
