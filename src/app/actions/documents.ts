"use server";

import prisma from "@/lib/prisma";
import { ItemCalculated, DocumentTotals } from "@/lib/calculator";

export async function saveDocument(data: {
  tipo: "COTIZACION" | "FACTURA";
  clienteId: string;
  items: ItemCalculated[];
  totales: DocumentTotals;
  observaciones?: string;
}) {
  // Primero aseguramos un vendedor por defecto para la versión actual
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
          totalLinea: item.subtotalLinea, // asumiendo por ahora simplificado sin 4x1000 a línea
        })),
      },
    },
  });

  return { success: true, document: result };
}

export async function getDocuments(params?: {
  tipo?: "COTIZACION" | "FACTURA";
  search?: string;
  limit?: number;
}) {
  return await prisma.commercialDocument.findMany({
    where: {
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
