export interface ItemInput {
  id: string;
  descripcion: string;
  cantidad: number;
  precioUnitarioBase: number;
  aplicaTax: boolean;
  taxUnitario: number; // Ingresado manualmente si aplica
  envioUnitario: number;
  promocionEnvioUnitario: number; // Restado del Envío
  importacionUnitario: number; // Cargos de importación adicionales
  aplicaAmazon: boolean; // Automático si es true -> precio * 0.0225
}

export interface ItemCalculated extends ItemInput {
  amazonUnitarioCalculado: number;
  costoUnitarioFinal: number;
  subtotalLinea: number;
}

export interface DocumentTotals {
  subtotal: number;
  totalTax: number;
  totalEnvio: number;
  totalPromocionEnvio: number;
  totalImportacion: number;
  totalAmazon: number;
  totalFinal: number;
}

export const AMAZON_RATE = 0.0225;

// ── Margen de Ganancia ────────────────────────────────────────────────────────
export type MargenTipo = 'base' | 'total';
export type MargenRedondeo = 0 | 1000 | 5000;

export interface MargenConfig {
  porcentaje: number;   // e.g. 10, 15, custom
  tipo: MargenTipo;     // 'base' → inflate precioUnitarioBase; 'total' → inflate costoUnitarioFinal
  redondeo: MargenRedondeo;
}

export function aplicarRedondeo(valor: number, redondeo: MargenRedondeo): number {
  if (redondeo === 0) return valor;
  return Math.ceil(valor / redondeo) * redondeo;
}

/** Returns a new ItemInput with precioUnitarioBase adjusted to include the margin. */
export function aplicarMargenAItem(item: ItemInput, config: MargenConfig): ItemInput {
  const { porcentaje, tipo, redondeo } = config;
  if (porcentaje <= 0) return item;
  const rate = porcentaje / 100;

  if (tipo === 'base') {
    const newBase = aplicarRedondeo(item.precioUnitarioBase * (1 + rate), redondeo);
    return { ...item, precioUnitarioBase: newBase };
  } else {
    // 'total': inflate the full costoUnitarioFinal, add difference onto precioUnitarioBase
    const calc = calcularItem(item);
    const marginAmount = calc.costoUnitarioFinal * rate;
    const newBase = aplicarRedondeo(item.precioUnitarioBase + marginAmount, redondeo);
    return { ...item, precioUnitarioBase: newBase };
  }
}

export function calcularItem(item: ItemInput): ItemCalculated {
  const tax = item.aplicaTax ? item.taxUnitario : 0;
  const envioBase = item.envioUnitario || 0;
  const promoEnvio = item.promocionEnvioUnitario || 0;
  const envioNeto = envioBase - promoEnvio;
  const importacion = item.importacionUnitario || 0;
  
  // Amazon Garantia se cobra sobre el Precio Base sumado a Cargos de importación, e impuestos.
  // IMPORTANTE: Amazon calcula la garantía incluyendo el envío BRUTO (envioBase), ANTES de aplicar cualquier promoción (Free Shipping).
  const baseGarantia = item.precioUnitarioBase + tax + envioBase + importacion;
  const amazon = item.aplicaAmazon ? baseGarantia * AMAZON_RATE : 0;

  const costoUnitarioFinal = item.precioUnitarioBase + tax + amazon + envioNeto + importacion;
  const subtotalLinea = costoUnitarioFinal * item.cantidad;

  return {
    ...item,
    amazonUnitarioCalculado: amazon,
    costoUnitarioFinal,
    subtotalLinea,
  };
}

export function calcularTotalesDocumento(
  items: ItemCalculated[]
): DocumentTotals {
  let subtotal = 0;
  let totalTax = 0;
  let totalEnvio = 0;
  let totalPromocionEnvio = 0;
  let totalImportacion = 0;
  let totalAmazon = 0;

  for (const item of items) {
    subtotal += item.precioUnitarioBase * item.cantidad;
    totalTax += (item.aplicaTax ? item.taxUnitario : 0) * item.cantidad;
    totalEnvio += (item.envioUnitario || 0) * item.cantidad;
    totalPromocionEnvio += (item.promocionEnvioUnitario || 0) * item.cantidad;
    totalImportacion += (item.importacionUnitario || 0) * item.cantidad;
    totalAmazon += item.amazonUnitarioCalculado * item.cantidad;
  }

  const totalFinal =
    subtotal +
    totalTax +
    (totalEnvio - totalPromocionEnvio) +
    totalImportacion +
    totalAmazon;

  return {
    subtotal,
    totalTax,
    totalEnvio,
    totalPromocionEnvio,
    totalImportacion,
    totalAmazon,
    totalFinal,
  };
}
