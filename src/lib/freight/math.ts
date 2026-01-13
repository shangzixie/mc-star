export function ceilToDecimals(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return value;
  if (!Number.isInteger(decimals) || decimals < 0) return value;

  const factor = 10 ** decimals;
  // EPSILON helps avoid cases like 1.005 * 100 === 100.499999999...
  return Math.ceil((value + Number.EPSILON) * factor) / factor;
}

/**
 * Ceil a number to `decimals`, but return as a scaled integer (value * 10^decimals).
 *
 * Useful for exact-ish arithmetic like:
 * - unitVolumeScaled = ceilToScaledInt(unitVolumeRaw, 2)
 * - totalVolumeScaled = unitVolumeScaled * qty
 */
export function ceilToScaledInt(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return Number.NaN;
  if (!Number.isInteger(decimals) || decimals < 0) return Number.NaN;

  const factor = 10 ** decimals;
  return Math.ceil((value + Number.EPSILON) * factor);
}

export function formatScaledInt(scaledValue: number, decimals: number): string {
  if (!Number.isFinite(scaledValue)) return '';
  if (!Number.isInteger(decimals) || decimals < 0) return '';

  const factor = 10 ** decimals;
  return (scaledValue / factor).toFixed(decimals);
}

export function formatCeilFixed(value: number, decimals = 2): string {
  return ceilToDecimals(value, decimals).toFixed(decimals);
}
