// ── Tipos compartidos del módulo de cotizaciones ────────────────────────────

export type TipoItem = "PRODUCTO" | "SERVICIO";
export type FuenteCompra = "LOCAL" | "AMAZON" | "EXTERIOR_OTRO";
export type MargenTipo = "base" | "total";
export type MargenRedondeo = 0 | 1000 | 5000;

/** Forma del formulario para UN ítem — incluye campos nuevos */
export interface ItemForm {
  id: string;
  descripcion: string;
  cantidad: number;
  precioUnitarioBase: number;

  // ── Clasificación del ítem (nuevos campos) ──
  tipoItem: TipoItem;
  fuenteCompra: FuenteCompra;
  precioOriginal?: number;
  monedaOriginal?: string;
  grupoId?: string;
  grupoLabel?: string;

  // ── Costos ──
  aplicaTax: boolean;
  taxUnitario: number;
  envioUnitario: number;
  promocionEnvioUnitario: number;
  importacionUnitario: number;
  aplicaAmazon: boolean;
}

export interface MargenConfig {
  porcentaje: number;
  tipo: MargenTipo;
  redondeo: MargenRedondeo;
}

/** Datos del cliente dentro del formulario */
export interface ClienteForm {
  nombres: string;
  email: string;
  notas: string;
}

/** Resultado de guardar un documento */
export interface SavedDoc {
  numero: string;
  id: string;
  totalFinal: number;
  cotizacionOrigenId?: string;
  cotizacionOrigenNumero?: string;
}

// ── Constantes ─────────────────────────────────────────────────────────────

export const TAX_RATE_US = 0.07;

/** Valores default de un ítem según tipo + fuente */
export function getItemDefaults(tipoItem: TipoItem, fuenteCompra: FuenteCompra) {
  if (tipoItem === "SERVICIO") {
    return {
      aplicaTax: false,
      aplicaAmazon: false,
      taxUnitario: 0,
      envioUnitario: 0,
      promocionEnvioUnitario: 0,
      importacionUnitario: 0,
    };
  }

  switch (fuenteCompra) {
    case "LOCAL":
      return {
        aplicaTax: false,
        aplicaAmazon: false,
        taxUnitario: 0,
        envioUnitario: 0,
        promocionEnvioUnitario: 0,
        importacionUnitario: 0,
      };
    case "AMAZON":
      return {
        aplicaTax: true,
        aplicaAmazon: true,
        taxUnitario: 0,
        envioUnitario: 0,
        promocionEnvioUnitario: 0,
        importacionUnitario: 0,
      };
    case "EXTERIOR_OTRO":
      return {
        aplicaTax: true,
        aplicaAmazon: false,
        taxUnitario: 0,
        envioUnitario: 0,
        promocionEnvioUnitario: 0,
        importacionUnitario: 0,
      };
  }
}

/** Crea un ítem vacío con defaults */
export function makeItem(): ItemForm {
  return {
    id: crypto.randomUUID(),
    descripcion: "",
    cantidad: 1,
    precioUnitarioBase: 0,
    tipoItem: "PRODUCTO",
    fuenteCompra: "LOCAL",
    aplicaTax: false,
    taxUnitario: 0,
    envioUnitario: 0,
    promocionEnvioUnitario: 0,
    importacionUnitario: 0,
    aplicaAmazon: false,
  };
}

/**
 * Convierte ItemForm → ItemInput del calculator.
 * Usa spread + override para que funcione tanto con el ItemInput actual
 * como con el ItemInput expandido que el otro agente está creando.
 */
export function toItemInput(item: ItemForm) {
  return {
    id: item.id,
    descripcion: item.descripcion,
    cantidad: item.cantidad,
    precioUnitarioBase: item.precioUnitarioBase,
    tipoItem: item.tipoItem,
    fuenteCompra: item.fuenteCompra,
    aplicaTax: item.aplicaTax,
    taxUnitario: item.taxUnitario,
    envioUnitario: item.envioUnitario,
    promocionEnvioUnitario: item.promocionEnvioUnitario,
    importacionUnitario: item.importacionUnitario,
    aplicaAmazon: item.aplicaAmazon,
  } as import("@/lib/calculator").ItemInput;
}
