/** 1 unidad monetaria = 10_000 minor units → 4 decimales (evita error de centavo). */
export const MONEY_SCALE = 10_000;

/** Redondea a 4 decimales monetarios. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * MONEY_SCALE) / MONEY_SCALE;
}

/** @deprecated Usar roundMoney */
export const round2 = roundMoney;

export function toMinorUnits(amount: number): number {
  return Math.round(roundMoney(amount) * MONEY_SCALE);
}

export function fromMinorUnits(minor: number): number {
  return minor / MONEY_SCALE;
}

/** Convierte monto decimal → entero para persistencia en BD. */
export function moneyToDb(amount: number | string): number {
  return toMinorUnits(Number(amount));
}

/** Convierte entero de BD → monto decimal para cálculos/UI. */
export function moneyFromDb(minor: number | string | null | undefined): number {
  if (minor === null || minor === undefined) return 0;
  return fromMinorUnits(Number(minor));
}

export function formatMoney(value: number, currency: string, decimals = 2): string {
  const symbol = currency === 'Soles' ? 'S/' : '$';
  const rounded = decimals >= 4 ? roundMoney(value) : roundMoney(value);
  return `${symbol} ${rounded.toLocaleString('es-PE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatMoneyStorage(value: number, currency: string): string {
  return formatMoney(value, currency, 4);
}
