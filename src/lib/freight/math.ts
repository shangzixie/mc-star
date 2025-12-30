export function ceilToDecimals(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return value;
  if (!Number.isInteger(decimals) || decimals < 0) return value;

  const factor = 10 ** decimals;
  // EPSILON helps avoid cases like 1.005 * 100 === 100.499999999...
  return Math.ceil((value + Number.EPSILON) * factor) / factor;
}

export function formatCeilFixed(value: number, decimals = 2): string {
  return ceilToDecimals(value, decimals).toFixed(decimals);
}
