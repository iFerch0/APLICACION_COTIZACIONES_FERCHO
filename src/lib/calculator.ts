export interface ItemInput {
  id: string;
  descripcion: string;
  cantidad: number;
  precioUnitarioBase: number;
  aplicaTax: boolean;
  taxUnitario: number; // Ingresado manualmente si aplica
  envioUnitario: number;
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
  totalAmazon: number;
  total4x1000: number;
  totalFinal: number;
}

export const AMAZON_RATE = 0.0225;
export const IMPUESTO_4X1000_RATE = 0.004;

export function calcularItem(item: ItemInput): ItemCalculated {
  const tax = item.aplicaTax ? item.taxUnitario : 0;
  const amazon = item.aplicaAmazon ? item.precioUnitarioBase * AMAZON_RATE : 0;
  const envio = item.envioUnitario || 0;

  const costoUnitarioFinal = item.precioUnitarioBase + tax + amazon + envio;
  const subtotalLinea = costoUnitarioFinal * item.cantidad;

  return {
    ...item,
    amazonUnitarioCalculado: amazon,
    costoUnitarioFinal,
    subtotalLinea,
  };
}

export function calcularTotalesDocumento(
  items: ItemCalculated[],
  aplica4x1000Global: boolean
): DocumentTotals {
  let subtotal = 0;
  let totalTax = 0;
  let totalEnvio = 0;
  let totalAmazon = 0;

  for (const item of items) {
    subtotal += item.subtotalLinea;
    totalTax += (item.aplicaTax ? item.taxUnitario : 0) * item.cantidad;
    totalEnvio += (item.envioUnitario || 0) * item.cantidad;
    totalAmazon += item.amazonUnitarioCalculado * item.cantidad;
  }

  // 4x1000 global sobre el subtotal general si está configurado
  const total4x1000 = aplica4x1000Global ? subtotal * IMPUESTO_4X1000_RATE : 0;
  const totalFinal = subtotal + total4x1000;

  return {
    subtotal,
    totalTax,
    totalEnvio,
    totalAmazon,
    total4x1000,
    totalFinal,
  };
}
