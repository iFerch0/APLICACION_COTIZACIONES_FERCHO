/**
 * Utilidades de formateo compartidas.
 * Elimina la duplicación de fmtDec que existía en múltiples archivos.
 */

/**
 * Formatea un número como moneda colombiana (COP) sin decimales.
 * Uso principal: totales, subtotales.
 */
export function fmtMoney(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "$0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Formatea un número como moneda colombiana (COP) con decimales.
 * Uso principal: precios unitarios, costos individuales.
 */
export function fmtMoneyDec(
  value: number | string | null | undefined,
  decimals: number = 2
): string {
  if (value === null || value === undefined) return "$0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Formatea un porcentaje con 2 decimales.
 */
export function fmtPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}
