"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { ItemCalculated, DocumentTotals, ItemInput } from "@/lib/calculator";
import { saveDocumentSchema, updateDocumentSchema } from "@/lib/schemas";
import { z } from "zod";

// ── Numeración secuencial ─────────────────────────────────────────────────────
async function generarNumeroDocumento(
  tipo: "COTIZACION" | "FACTURA"
): Promise<string> {
  const anio = new Date().getFullYear();
  const prefijo = tipo === "COTIZACION" ? "COT" : "FAC";

  const seq = await prisma.documentSequence.upsert({
    where: { tipo },
    update: { secuencia: { increment: 1 } },
    create: { tipo, anio, secuencia: 1 },
  });

  return `${prefijo}-${anio}-${String(seq.secuencia).padStart(4, "0")}`;
}

// ── EditDocumentData ──────────────────────────────────────────────────────────
export interface EditDocumentData {
  documentId: string;
  documentNumero: string;
  tipo: "COTIZACION" | "FACTURA";
  clienteId: string;
  clienteNombre: string;
  clienteEmail: string;
  items: ItemInput[];
  observaciones: string;
  margenPorcentaje: number;
  margenTipo: "base" | "total";
  margenRedondeo: 0 | 1000 | 5000;
}

// ── Tipo para datos importados de una cotización ─────────────────────────────
export interface ImportedCotizacionData {
  cotizacionOrigenId: string;
  cotizacionNumero: string;
  clienteId: string;
  clienteNombre: string;
  clienteEmail: string;
  items: ItemInput[];
  observaciones: string;
}

// ── saveDocument ─────────────────────────────────────────────────────────────
export async function saveDocument(data: unknown) {
  try {
    const validated = saveDocumentSchema.parse(data);

    let seller = await prisma.sellerProfile.findFirst();
    if (!seller) {
      seller = await prisma.sellerProfile.create({
        data: {
          nombre: "Fernando Rhenals",
          email: "ferchotecnico@example.com",
        },
      });
    }

    const numero = await generarNumeroDocumento(validated.tipo);

    const result = await prisma.commercialDocument.create({
      data: {
        tipo: validated.tipo,
        numero,
        sellerId: seller.id,
        customerId: validated.clienteId,
        observaciones: validated.observaciones,
        subtotal: validated.totales.subtotal,
        totalTax: validated.totales.totalTax,
        totalEnvio: validated.totales.totalEnvio,
        totalPromocionEnvio: validated.totales.totalPromocionEnvio,
        totalAmazon: validated.totales.totalAmazon,
        totalImportacion: validated.totales.totalImportacion,
        total4x1000: 0,
        totalFinal: validated.totales.totalFinal,
        margenPorcentaje: validated.margenPorcentaje,
        margenTipo: validated.margenTipo,
        margenRedondeo: validated.margenRedondeo,
        cotizacionOrigenId: validated.cotizacionOrigenId ?? null,
        items: {
          create: validated.items.map((item, index) => ({
            orden: index,
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precioUnitarioBase: item.precioUnitarioBase,
            tipoItem: item.tipoItem,
            fuenteCompra: item.fuenteCompra,
            precioOriginal: item.precioOriginal ?? null,
            monedaOriginal: item.monedaOriginal ?? "COP",
            grupoId: item.grupoId ?? null,
            grupoLabel: item.grupoLabel ?? null,
            aplicaTax: item.aplicaTax,
            taxUnitario: item.taxUnitario,
            envioUnitario: item.envioUnitario,
            promocionEnvioUnitario: item.promocionEnvioUnitario,
            importacionUnitario: item.importacionUnitario,
            aplicaAmazon: item.aplicaAmazon,
            amazonUnitario: item.amazonUnitarioCalculado,
            costoUnitarioFinal: item.costoUnitarioFinal,
            subtotalLinea: item.subtotalLinea,
            aplica4x1000: false,
            valor4x1000Linea: 0,
          })),
        },
      },
    });

    // Si viene de una cotización, marcarla como FACTURADA
    if (validated.cotizacionOrigenId) {
      await prisma.commercialDocument.update({
        where: { id: validated.cotizacionOrigenId },
        data: { estado: "FACTURADA" },
      });
    }

    revalidatePath("/documentos");
    revalidatePath("/");

    return { success: true, document: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Datos inválidos",
        details: error.issues,
      };
    }
    console.error("[saveDocument] Error:", error);
    return { success: false, error: "Error al guardar el documento." };
  }
}

// ── getDocuments ──────────────────────────────────────────────────────────────
export async function getDocuments(params?: {
  tipo?: "COTIZACION" | "FACTURA";
  search?: string;
  limit?: number;
  showArchived?: boolean;
}) {
  return await prisma.commercialDocument.findMany({
    where: {
      ...(params?.showArchived ? {} : { estado: { not: "ARCHIVADA" } }),
      ...(params?.tipo ? { tipo: params.tipo } : {}),
      ...(params?.search
        ? {
            OR: [
              { numero: { contains: params.search } },
              { customer: { nombres: { contains: params.search } } },
            ],
          }
        : {}),
    },
    include: {
      customer: { select: { id: true, nombres: true, email: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
    ...(params?.limit ? { take: params.limit } : {}),
  });
}

export type DocumentListItem = Awaited<ReturnType<typeof getDocuments>>[number];

// ── Tipos para trazabilidad ───────────────────────────────────────────────────
export interface CotizacionOrigenRef {
  id: string;
  numero: string;
  fecha: Date;
}

export interface FacturaGeneradaRef {
  id: string;
  numero: string;
  fecha: Date;
  totalFinal: number;
  estado: string;
}

// ── getDocumentById ───────────────────────────────────────────────────────────
export async function getDocumentById(id: string) {
  const doc = await prisma.commercialDocument.findUnique({
    where: { id },
    include: {
      customer: true,
      seller: true,
      items: { orderBy: { orden: "asc" } },
    },
  });

  if (!doc) return null;

  // Obtener cotizacionOrigenId directamente desde el documento
  const cotizacionOrigenId = doc.cotizacionOrigenId ?? null;

  // Buscar cotización origen si aplica
  let cotizacionOrigen: CotizacionOrigenRef | null = null;
  if (cotizacionOrigenId) {
    const origen = await prisma.commercialDocument.findUnique({
      where: { id: cotizacionOrigenId },
      select: { id: true, numero: true, fecha: true },
    });
    cotizacionOrigen = origen ?? null;
  }

    // Buscar facturas generadas si es cotización
  let facturasGeneradas: FacturaGeneradaRef[] = [];
  if (doc.tipo === "COTIZACION") {
    const facturas = await prisma.commercialDocument.findMany({
      where: { cotizacionOrigenId: id },
      select: {
        id: true,
        numero: true,
        fecha: true,
        totalFinal: true,
        estado: true,
      },
      orderBy: { createdAt: "desc" },
    });
    facturasGeneradas = facturas.map((f) => ({
      ...f,
      totalFinal: Number(f.totalFinal),
    }));
  }

  return { ...doc, cotizacionOrigenId, cotizacionOrigen, facturasGeneradas };
}

export type DocumentDetail = Awaited<ReturnType<typeof getDocumentById>>;

// ── getDocumentForConversion ──────────────────────────────────────────────────
export async function getDocumentForConversion(
  id: string
): Promise<ImportedCotizacionData | null> {
  const doc = await prisma.commercialDocument.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { orderBy: { orden: "asc" } },
    },
  });

  if (!doc || doc.tipo !== "COTIZACION") return null;

  const items: ItemInput[] = doc.items.map((item) => ({
    id: `item-${item.orden}-${Date.now()}`,
    descripcion: item.descripcion,
    cantidad: item.cantidad,
    precioUnitarioBase: Number(item.precioUnitarioBase),
    tipoItem: (item.tipoItem as "PRODUCTO" | "SERVICIO") ?? "PRODUCTO",
    fuenteCompra: (item.fuenteCompra as "LOCAL" | "AMAZON" | "EXTERIOR_OTRO") ?? "LOCAL",
    precioOriginal: item.precioOriginal ? Number(item.precioOriginal) : undefined,
    monedaOriginal: item.monedaOriginal ?? undefined,
    grupoId: item.grupoId ?? undefined,
    grupoLabel: item.grupoLabel ?? undefined,
    aplicaTax: item.aplicaTax,
    taxUnitario: Number(item.taxUnitario),
    envioUnitario: Number(item.envioUnitario),
    promocionEnvioUnitario: Number(item.promocionEnvioUnitario),
    importacionUnitario: Number(item.importacionUnitario),
    aplicaAmazon: item.aplicaAmazon,
  }));

  return {
    cotizacionOrigenId: doc.id,
    cotizacionNumero: doc.numero,
    clienteId: doc.customerId,
    clienteNombre: doc.customer.nombres,
    clienteEmail: doc.customer.email ?? "",
    items,
    observaciones: doc.observaciones ?? "",
  };
}

// ── getCotizacionesParaImportar ────────────────────────────────────────────────
export async function getCotizacionesParaImportar(search?: string) {
  const cotizaciones = await prisma.commercialDocument.findMany({
    where: {
      tipo: "COTIZACION",
      ...(search
        ? {
            OR: [
              { numero: { contains: search } },
              { customer: { nombres: { contains: search } } },
            ],
          }
        : {}),
    },
    include: {
      customer: { select: { id: true, nombres: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Contar facturas vinculadas usando Prisma groupBy
  const ids = cotizaciones.map((c) => c.id);
  const countMap = new Map<string, number>();

  if (ids.length > 0) {
    const grouped = await prisma.commercialDocument.groupBy({
      by: ["cotizacionOrigenId"],
      where: {
        cotizacionOrigenId: { in: ids },
      },
      _count: { id: true },
    });
    for (const row of grouped) {
      if (row.cotizacionOrigenId) {
        countMap.set(row.cotizacionOrigenId, row._count.id);
      }
    }
  }

  return cotizaciones.map((c) => ({
    ...c,
    facturasCount: countMap.get(c.id) ?? 0,
  }));
}

export type CotizacionParaImportar = Awaited<
  ReturnType<typeof getCotizacionesParaImportar>
>[number];

// ── getDocumentForEdit ────────────────────────────────────────────────────────
export async function getDocumentForEdit(
  id: string
): Promise<EditDocumentData | null> {
  const doc = await prisma.commercialDocument.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { orderBy: { orden: "asc" } },
    },
  });
  if (!doc) return null;
  if (doc.estado === "ARCHIVADA") return null;

  const items: ItemInput[] = doc.items.map((item) => ({
    id: `item-${item.orden}-${Date.now()}`,
    descripcion: item.descripcion,
    cantidad: item.cantidad,
    precioUnitarioBase: Number(item.precioUnitarioBase),
    tipoItem: (item.tipoItem as "PRODUCTO" | "SERVICIO") ?? "PRODUCTO",
    fuenteCompra: (item.fuenteCompra as "LOCAL" | "AMAZON" | "EXTERIOR_OTRO") ?? "LOCAL",
    precioOriginal: item.precioOriginal ? Number(item.precioOriginal) : undefined,
    monedaOriginal: item.monedaOriginal ?? undefined,
    grupoId: item.grupoId ?? undefined,
    grupoLabel: item.grupoLabel ?? undefined,
    aplicaTax: item.aplicaTax,
    taxUnitario: Number(item.taxUnitario),
    envioUnitario: Number(item.envioUnitario),
    promocionEnvioUnitario: Number(item.promocionEnvioUnitario),
    importacionUnitario: Number(item.importacionUnitario),
    aplicaAmazon: item.aplicaAmazon,
  }));

  // Obtener margen directamente desde el documento (campos ya en schema)
  const margenPorcentaje = Number(doc.margenPorcentaje) ?? 0;
  const margenTipo = (doc.margenTipo ?? "base") as "base" | "total";
  const margenRedondeo = (doc.margenRedondeo ?? 0) as 0 | 1000 | 5000;

  return {
    documentId: doc.id,
    documentNumero: doc.numero,
    tipo: doc.tipo as "COTIZACION" | "FACTURA",
    clienteId: doc.customerId,
    clienteNombre: doc.customer.nombres,
    clienteEmail: doc.customer.email ?? "",
    items,
    observaciones: doc.observaciones ?? "",
    margenPorcentaje,
    margenTipo,
    margenRedondeo,
  };
}

// ── updateDocument ────────────────────────────────────────────────────────────
export async function updateDocument(
  id: string,
  data: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = updateDocumentSchema.parse(data);

    await prisma.commercialDocumentItem.deleteMany({
      where: { documentId: id },
    });
    await prisma.commercialDocument.update({
      where: { id },
      data: {
        customerId: validated.clienteId,
        observaciones: validated.observaciones,
        subtotal: validated.totales.subtotal,
        totalTax: validated.totales.totalTax,
        totalEnvio: validated.totales.totalEnvio,
        totalPromocionEnvio: validated.totales.totalPromocionEnvio,
        totalAmazon: validated.totales.totalAmazon,
        totalImportacion: validated.totales.totalImportacion,
        total4x1000: 0,
        totalFinal: validated.totales.totalFinal,
        margenPorcentaje: validated.margenPorcentaje,
        margenTipo: validated.margenTipo,
        margenRedondeo: validated.margenRedondeo,
        items: {
          create: validated.items.map((item, index) => ({
            orden: index,
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precioUnitarioBase: item.precioUnitarioBase,
            tipoItem: item.tipoItem,
            fuenteCompra: item.fuenteCompra,
            precioOriginal: item.precioOriginal ?? null,
            monedaOriginal: item.monedaOriginal ?? "COP",
            grupoId: item.grupoId ?? null,
            grupoLabel: item.grupoLabel ?? null,
            aplicaTax: item.aplicaTax,
            taxUnitario: item.taxUnitario,
            envioUnitario: item.envioUnitario,
            promocionEnvioUnitario: item.promocionEnvioUnitario,
            importacionUnitario: item.importacionUnitario,
            aplicaAmazon: item.aplicaAmazon,
            amazonUnitario: item.amazonUnitarioCalculado,
            costoUnitarioFinal: item.costoUnitarioFinal,
            subtotalLinea: item.subtotalLinea,
            aplica4x1000: false,
            valor4x1000Linea: 0,
          })),
        },
      },
    });

    revalidatePath("/documentos");
    revalidatePath(`/documentos/${id}`);

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Datos inválidos: ${error.issues.map((i) => i.message).join(", ")}`,
      };
    }
    console.error("[updateDocument] Error:", error);
    return { success: false, error: "Error al actualizar el documento." };
  }
}

// ── deleteDocument ────────────────────────────────────────────────────────────
export async function deleteDocument(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar si hay facturas vinculadas a esta cotización
    const linkedFacturasCount = await prisma.commercialDocument.count({
      where: { cotizacionOrigenId: id },
    });
    if (linkedFacturasCount > 0) {
      return {
        success: false,
        error:
          "No puedes eliminar una cotización que tiene facturas asociadas.",
      };
    }

    // Si este documento (factura) vino de una cotización, restaurar estado
    const doc = await prisma.commercialDocument.findUnique({
      where: { id },
      select: { cotizacionOrigenId: true },
    });
    if (doc?.cotizacionOrigenId) {
      await prisma.commercialDocument.update({
        where: { id: doc.cotizacionOrigenId },
        data: { estado: "BORRADOR" },
      });
    }

    // Items se eliminan en cascada (onDelete: Cascade en schema)
    await prisma.commercialDocument.delete({ where: { id } });

    revalidatePath("/documentos");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("[deleteDocument] Error:", error);
    return { success: false, error: "Error al eliminar el documento." };
  }
}

// ── archiveDocument ───────────────────────────────────────────────────────────
export async function archiveDocument(
  id: string
): Promise<{ success: boolean; newEstado?: string; error?: string }> {
  try {
    const doc = await prisma.commercialDocument.findUnique({
      where: { id },
      select: { estado: true },
    });
    if (!doc) return { success: false, error: "Documento no encontrado." };

    const newEstado = doc.estado === "ARCHIVADA" ? "BORRADOR" : "ARCHIVADA";
    await prisma.commercialDocument.update({
      where: { id },
      data: { estado: newEstado },
    });

    revalidatePath("/documentos");
    revalidatePath(`/documentos/${id}`);

    return { success: true, newEstado };
  } catch (error) {
    console.error("[archiveDocument] Error:", error);
    return { success: false, error: "Error al archivar el documento." };
  }
}
