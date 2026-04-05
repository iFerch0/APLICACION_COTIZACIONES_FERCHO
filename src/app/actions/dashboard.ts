"use server";

import prisma from "@/lib/prisma";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalCotizaciones: number;
  totalFacturas: number;
  totalClientes: number;
  // Montos
  montoTotalCotizaciones: number;
  montoTotalFacturas: number;
  // Estado
  cotizacionesPendientes: number; // estado BORRADOR
  cotizacionesFacturadas: number; // estado FACTURADA
  facturasPendientes: number;
  // Tasa conversión
  tasaConversion: number; // % cotizaciones que se convirtieron en factura
  // Recientes
  documentosRecientes: Array<{
    id: string;
    tipo: string;
    numero: string;
    estado: string;
    totalFinal: number;
    createdAt: Date;
    customer: { id: string; nombres: string; apellidos: string | null };
  }>;
  // Top clientes
  topClientes: Array<{
    id: string;
    nombres: string;
    apellidos: string | null;
    totalDocumentos: number;
    totalMonto: number;
  }>;
  // Documentos por mes (últimos 6 meses) para gráfico
  documentosPorMes: Array<{
    mes: string; // "Ene 2026"
    cotizaciones: number;
    facturas: number;
    montoCotizaciones: number;
    montoFacturas: number;
  }>;
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  // Obtener conteos y montos en paralelo
  const [
    totalCotizaciones,
    totalFacturas,
    totalClientes,
    cotizacionesPendientes,
    cotizacionesFacturadas,
    facturasPendientes,
    montoTotalCotizaciones,
    montoTotalFacturas,
  ] = await Promise.all([
    prisma.commercialDocument.count({ where: { tipo: "COTIZACION" } }),
    prisma.commercialDocument.count({ where: { tipo: "FACTURA" } }),
    prisma.customer.count(),
    prisma.commercialDocument.count({
      where: { tipo: "COTIZACION", estado: "BORRADOR" },
    }),
    prisma.commercialDocument.count({
      where: { tipo: "COTIZACION", estado: "FACTURADA" },
    }),
    prisma.commercialDocument.count({
      where: { tipo: "FACTURA", estado: { in: ["BORRADOR", "ENVIADO"] } },
    }),
    prisma.commercialDocument.aggregate({
      where: { tipo: "COTIZACION" },
      _sum: { totalFinal: true },
    }),
    prisma.commercialDocument.aggregate({
      where: { tipo: "FACTURA" },
      _sum: { totalFinal: true },
    }),
  ]);

  // Tasa de conversión
  const tasaConversion =
    totalCotizaciones > 0
      ? Math.round((cotizacionesFacturadas / totalCotizaciones) * 100)
      : 0;

  // Documentos recientes
  const documentosRecientes = await prisma.commercialDocument.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, nombres: true, apellidos: true } },
    },
  });

  // Top clientes por monto total facturado
  const topClientesRaw = await prisma.customer.findMany({
    take: 5,
    orderBy: { documents: { _count: "desc" } },
    include: {
      _count: { select: { documents: true } },
      documents: {
        select: { totalFinal: true },
        where: { tipo: "FACTURA" },
      },
    },
  });

  const topClientes = topClientesRaw.map((c) => ({
    id: c.id,
    nombres: c.nombres,
    apellidos: c.apellidos,
    totalDocumentos: c._count.documents,
    totalMonto: c.documents.reduce(
      (sum, d) => sum + Number(d.totalFinal),
      0
    ),
  }));

  // Documentos por mes (últimos 6 meses)
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const docsByMonthRaw = await prisma.commercialDocument.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { tipo: true, totalFinal: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Agrupar en memoria por mes
  const monthMap = new Map<
    string,
    {
      cotizaciones: number;
      facturas: number;
      montoCotizaciones: number;
      montoFacturas: number;
    }
  >();

  const monthNames = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  for (const doc of docsByMonthRaw) {
    const key = `${doc.createdAt.getFullYear()}-${String(
      doc.createdAt.getMonth() + 1
    ).padStart(2, "0")}`;

    if (!monthMap.has(key)) {
      monthMap.set(key, {
        cotizaciones: 0,
        facturas: 0,
        montoCotizaciones: 0,
        montoFacturas: 0,
      });
    }
    const entry = monthMap.get(key)!;

    if (doc.tipo === "COTIZACION") {
      entry.cotizaciones++;
      entry.montoCotizaciones += Number(doc.totalFinal);
    } else {
      entry.facturas++;
      entry.montoFacturas += Number(doc.totalFinal);
    }
  }

  const documentosPorMes = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => {
      const [year, month] = key.split("-");
      const label = `${monthNames[parseInt(month) - 1]} ${year}`;
      return { mes: label, ...val };
    });

  return {
    totalCotizaciones,
    totalFacturas,
    totalClientes,
    montoTotalCotizaciones: Number(
      montoTotalCotizaciones._sum.totalFinal ?? 0
    ),
    montoTotalFacturas: Number(montoTotalFacturas._sum.totalFinal ?? 0),
    cotizacionesPendientes,
    cotizacionesFacturadas,
    facturasPendientes,
    tasaConversion,
    documentosRecientes: documentosRecientes.map((d) => ({
      id: d.id,
      tipo: d.tipo,
      numero: d.numero,
      estado: d.estado,
      totalFinal: Number(d.totalFinal),
      createdAt: d.createdAt,
      customer: d.customer,
    })),
    topClientes,
    documentosPorMes,
  };
}
