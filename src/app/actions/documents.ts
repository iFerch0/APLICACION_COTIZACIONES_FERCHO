"use server";

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ItemCalculated, DocumentTotals, ItemInput } from "@/lib/calculator";

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
export async function saveDocument(data: {
  tipo: "COTIZACION" | "FACTURA";
  clienteId: string;
  items: ItemCalculated[];
  totales: DocumentTotals;
  observaciones?: string;
  cotizacionOrigenId?: string;
}) {
  let seller = await prisma.sellerProfile.findFirst();
  if (!seller) {
    seller = await prisma.sellerProfile.create({
      data: {
        nombre: "Fernando Rhenals",
        email: "ferchotecnico@example.com",
      },
    });
  }

  const randomNumero = `${data.tipo === "COTIZACION" ? "COT" : "FAC"}-${Date.now().toString().slice(-6)}`;

  const result = await prisma.commercialDocument.create({
    data: {
      tipo: data.tipo,
      numero: randomNumero,
      sellerId: seller.id,
      customerId: data.clienteId,
      observaciones: data.observaciones,
      ...data.totales,
      total4x1000: 0,
      items: {
        create: data.items.map((item, index) => ({
          orden: index,
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precioUnitarioBase: item.precioUnitarioBase,
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
          totalLinea: item.subtotalLinea,
        })),
      },
    },
  });

  // Vincular con cotización origen via SQL directo (compatible con Prisma client sin regenerar)
  if (data.cotizacionOrigenId) {
    await prisma.$executeRaw`
      UPDATE "CommercialDocument"
      SET "cotizacionOrigenId" = ${data.cotizacionOrigenId}
      WHERE "id" = ${result.id}
    `;
    await prisma.$executeRaw`
      UPDATE "CommercialDocument"
      SET "estado" = 'FACTURADA'
      WHERE "id" = ${data.cotizacionOrigenId}
    `;
  }

  return { success: true, document: result };
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
// Usa raw SQL para trazabilidad (compatible con Prisma client sin regenerar)
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

  // Obtener cotizacionOrigenId desde la BD
  const rawDoc = await prisma.$queryRaw<Array<{ cotizacionOrigenId: string | null }>>`
    SELECT "cotizacionOrigenId" FROM "CommercialDocument" WHERE "id" = ${id}
  `;
  const cotizacionOrigenId = rawDoc[0]?.cotizacionOrigenId ?? null;

  // Buscar cotización origen si aplica
  let cotizacionOrigen: CotizacionOrigenRef | null = null;
  if (cotizacionOrigenId) {
    const rows = await prisma.$queryRaw<CotizacionOrigenRef[]>`
      SELECT "id", "numero", "fecha" FROM "CommercialDocument" WHERE "id" = ${cotizacionOrigenId}
    `;
    cotizacionOrigen = rows[0] ?? null;
  }

  // Buscar facturas generadas si es cotización
  let facturasGeneradas: FacturaGeneradaRef[] = [];
  if (doc.tipo === "COTIZACION") {
    facturasGeneradas = await prisma.$queryRaw<FacturaGeneradaRef[]>`
      SELECT "id", "numero", "fecha", "totalFinal", "estado"
      FROM "CommercialDocument"
      WHERE "cotizacionOrigenId" = ${id}
      ORDER BY "createdAt" DESC
    `;
  }

  return { ...doc, cotizacionOrigenId, cotizacionOrigen, facturasGeneradas };
}

export type DocumentDetail = Awaited<ReturnType<typeof getDocumentById>>;

// ── getDocumentForConversion ──────────────────────────────────────────────────
export async function getDocumentForConversion(id: string): Promise<ImportedCotizacionData | null> {
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
    precioUnitarioBase: item.precioUnitarioBase,
    aplicaTax: item.aplicaTax,
    taxUnitario: item.taxUnitario,
    envioUnitario: item.envioUnitario,
    promocionEnvioUnitario: item.promocionEnvioUnitario,
    importacionUnitario: item.importacionUnitario,
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

  // Contar facturas vinculadas via SQL (compatible con Prisma client sin regenerar)
  const ids = cotizaciones.map((c) => c.id);
  const countMap = new Map<string, number>();

  if (ids.length > 0) {
    const rows = await prisma.$queryRaw<Array<{ cotizacionOrigenId: string; cnt: bigint }>>(
      Prisma.sql`
        SELECT "cotizacionOrigenId", COUNT(*) as cnt
        FROM "CommercialDocument"
        WHERE "cotizacionOrigenId" IN (${Prisma.join(ids)})
        GROUP BY "cotizacionOrigenId"
      `
    );
    for (const row of rows) {
      countMap.set(row.cotizacionOrigenId, Number(row.cnt));
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
export async function getDocumentForEdit(id: string): Promise<EditDocumentData | null> {
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
    precioUnitarioBase: item.precioUnitarioBase,
    aplicaTax: item.aplicaTax,
    taxUnitario: item.taxUnitario,
    envioUnitario: item.envioUnitario,
    promocionEnvioUnitario: item.promocionEnvioUnitario,
    importacionUnitario: item.importacionUnitario,
    aplicaAmazon: item.aplicaAmazon,
  }));

  return {
    documentId: doc.id,
    documentNumero: doc.numero,
    tipo: doc.tipo as "COTIZACION" | "FACTURA",
    clienteId: doc.customerId,
    clienteNombre: doc.customer.nombres,
    clienteEmail: doc.customer.email ?? "",
    items,
    observaciones: doc.observaciones ?? "",
  };
}

// ── updateDocument ────────────────────────────────────────────────────────────
export async function updateDocument(
  id: string,
  data: {
    clienteId: string;
    items: ItemCalculated[];
    totales: DocumentTotals;
    observaciones?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.commercialDocumentItem.deleteMany({ where: { documentId: id } });
    await prisma.commercialDocument.update({
      where: { id },
      data: {
        customerId: data.clienteId,
        observaciones: data.observaciones,
        ...data.totales,
        total4x1000: 0,
        items: {
          create: data.items.map((item, index) => ({
            orden: index,
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precioUnitarioBase: item.precioUnitarioBase,
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
            totalLinea: item.subtotalLinea,
          })),
        },
      },
    });
    return { success: true };
  } catch {
    return { success: false, error: "Error al actualizar el documento." };
  }
}

// ── deleteDocument ────────────────────────────────────────────────────────────
export async function deleteDocument(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Prevent deleting a cotizacion that has linked facturas
    const linkedFacturas = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "CommercialDocument" WHERE "cotizacionOrigenId" = ${id}
    `;
    if (linkedFacturas.length > 0) {
      return { success: false, error: "No puedes eliminar una cotización que tiene facturas asociadas." };
    }

    // If this factura came from a cotizacion, reset that cotizacion's estado
    const rawDoc = await prisma.$queryRaw<Array<{ cotizacionOrigenId: string | null }>>`
      SELECT "cotizacionOrigenId" FROM "CommercialDocument" WHERE "id" = ${id}
    `;
    const cotizacionOrigenId = rawDoc[0]?.cotizacionOrigenId;
    if (cotizacionOrigenId) {
      await prisma.$executeRaw`
        UPDATE "CommercialDocument" SET "estado" = 'BORRADOR' WHERE "id" = ${cotizacionOrigenId}
      `;
    }

    // Items cascade-delete automatically (onDelete: Cascade in schema)
    await prisma.commercialDocument.delete({ where: { id } });
    return { success: true };
  } catch {
    return { success: false, error: "Error al eliminar el documento." };
  }
}

// ── archiveDocument ───────────────────────────────────────────────────────────
export async function archiveDocument(
  id: string
): Promise<{ success: boolean; newEstado?: string; error?: string }> {
  try {
    const rawDoc = await prisma.$queryRaw<Array<{ estado: string }>>`
      SELECT "estado" FROM "CommercialDocument" WHERE "id" = ${id}
    `;
    if (!rawDoc[0]) return { success: false, error: "Documento no encontrado." };

    const newEstado = rawDoc[0].estado === "ARCHIVADA" ? "BORRADOR" : "ARCHIVADA";
    await prisma.commercialDocument.update({ where: { id }, data: { estado: newEstado } });
    return { success: true, newEstado };
  } catch {
    return { success: false, error: "Error al archivar el documento." };
  }
}
