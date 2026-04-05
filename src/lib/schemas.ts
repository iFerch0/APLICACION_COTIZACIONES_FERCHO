import { z } from "zod";

// ── Customer ──────────────────────────────────────────────────────────────────
export const customerSchema = z.object({
  nombres: z.string().min(1, "Nombres requeridos").max(100),
  apellidos: z.string().max(100).optional().default(""),
  direccion: z.string().max(200).optional().default(""),
  celular: z.string().max(20).optional().default(""),
  email: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  identificacion: z.string().max(50).optional().default(""),
  notas: z.string().max(500).optional().default(""),
});

export type CustomerInput = z.infer<typeof customerSchema>;

// ── Seller Profile ────────────────────────────────────────────────────────────
export const sellerProfileSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(100),
  profesion: z.string().max(100).optional().default(""),
  direccion: z.string().max(200).optional().default(""),
  celular: z.string().max(20).optional().default(""),
  email: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  identificacion: z.string().max(50).optional().default(""),
});

export type SellerProfileInput = z.infer<typeof sellerProfileSchema>;

// ── Document Item ─────────────────────────────────────────────────────────────
export const documentItemSchema = z.object({
  id: z.string().optional(),
  descripcion: z.string().min(1, "Descripción requerida").max(300),
  cantidad: z.number().int().min(1, "Mínimo 1"),
  precioUnitarioBase: z.number().min(0, "Precio debe ser ≥ 0"),
  // ── Tipo y fuente ──
  tipoItem: z.enum(["PRODUCTO", "SERVICIO"]).default("PRODUCTO"),
  fuenteCompra: z.enum(["LOCAL", "AMAZON", "EXTERIOR_OTRO"]).default("LOCAL"),
  precioOriginal: z.number().min(0).optional(),
  monedaOriginal: z.string().optional().default("COP"),
  grupoId: z.string().optional(),
  grupoLabel: z.string().optional(),
  // ── Costos ──
  aplicaTax: z.boolean().default(false),
  taxUnitario: z.number().min(0).default(0),
  envioUnitario: z.number().min(0).default(0),
  promocionEnvioUnitario: z.number().min(0).default(0),
  importacionUnitario: z.number().min(0).default(0),
  aplicaAmazon: z.boolean().default(false),
});

export type DocumentItemInput = z.infer<typeof documentItemSchema>;

// ── Document Totals ───────────────────────────────────────────────────────────
export const documentTotalsSchema = z.object({
  subtotal: z.number().min(0),
  totalTax: z.number().min(0),
  totalEnvio: z.number().min(0),
  totalPromocionEnvio: z.number().min(0),
  totalImportacion: z.number().min(0),
  totalAmazon: z.number().min(0),
  totalFinal: z.number().min(0),
});

// ── Document (save/create) ────────────────────────────────────────────────────
export const saveDocumentSchema = z.object({
  tipo: z.enum(["COTIZACION", "FACTURA"]),
  clienteId: z.string().min(1, "Cliente requerido"),
  items: z
    .array(
      documentItemSchema.extend({
        amazonUnitarioCalculado: z.number().min(0).default(0),
        costoUnitarioFinal: z.number().min(0).default(0),
        subtotalLinea: z.number().min(0).default(0),
      })
    )
    .min(1, "Al menos 1 ítem requerido"),
  totales: documentTotalsSchema,
  observaciones: z.string().max(1000).optional().default(""),
  margenPorcentaje: z.number().min(0).max(100).default(0),
  margenTipo: z.enum(["base", "total"]).default("base"),
  margenRedondeo: z.union([z.literal(0), z.literal(1000), z.literal(5000)]).default(0),
  cotizacionOrigenId: z.string().optional(),
});

export type SaveDocumentInput = z.infer<typeof saveDocumentSchema>;

// ── Document (update) ─────────────────────────────────────────────────────────
export const updateDocumentSchema = z.object({
  clienteId: z.string().min(1, "Cliente requerido"),
  items: z
    .array(
      documentItemSchema.extend({
        amazonUnitarioCalculado: z.number().min(0).default(0),
        costoUnitarioFinal: z.number().min(0).default(0),
        subtotalLinea: z.number().min(0).default(0),
      })
    )
    .min(1, "Al menos 1 ítem requerido"),
  totales: documentTotalsSchema,
  observaciones: z.string().max(1000).optional().default(""),
  margenPorcentaje: z.number().min(0).max(100).default(0),
  margenTipo: z.enum(["base", "total"]).default("base"),
  margenRedondeo: z.union([z.literal(0), z.literal(1000), z.literal(5000)]).default(0),
});

export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
