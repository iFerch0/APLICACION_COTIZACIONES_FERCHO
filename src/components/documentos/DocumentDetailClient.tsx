"use client";

import dynamic from "next/dynamic";
import { Download } from "lucide-react";
import type { DocumentDetail } from "@/app/actions/documents";
import type { ItemCalculated, DocumentTotals } from "@/lib/calculator";
import type { SellerData } from "@/app/actions/seller";

const PDFDownloadButton = dynamic(
  () => import("@/components/pdf/ClientPDFViewer").then((m) => ({ default: m.PDFDownloadButton })),
  { ssr: false, loading: () => <span className="text-xs text-[var(--text-2)]">Cargando PDF...</span> }
);

export default function DocumentDetailClient({ doc }: { doc: NonNullable<DocumentDetail> }) {
  const items: ItemCalculated[] = doc.items.map((item) => ({
    id: item.id,
    descripcion: item.descripcion,
    cantidad: item.cantidad,
    precioUnitarioBase: item.precioUnitarioBase,
    aplicaTax: item.aplicaTax,
    taxUnitario: item.taxUnitario,
    envioUnitario: item.envioUnitario,
    promocionEnvioUnitario: item.promocionEnvioUnitario,
    importacionUnitario: item.importacionUnitario,
    aplicaAmazon: item.aplicaAmazon,
    amazonUnitarioCalculado: item.amazonUnitario,
    costoUnitarioFinal: item.costoUnitarioFinal,
    subtotalLinea: item.subtotalLinea,
  }));

  const totales: DocumentTotals = {
    subtotal: doc.subtotal,
    totalTax: doc.totalTax,
    totalEnvio: doc.totalEnvio,
    totalPromocionEnvio: doc.totalPromocionEnvio,
    totalImportacion: doc.totalImportacion,
    totalAmazon: doc.totalAmazon,
    totalFinal: doc.totalFinal,
  };

  const seller: SellerData = {
    id: doc.seller.id,
    nombre: doc.seller.nombre,
    profesion: doc.seller.profesion,
    direccion: doc.seller.direccion,
    celular: doc.seller.celular,
    email: doc.seller.email,
    identificacion: doc.seller.identificacion,
  };

  return (
    <PDFDownloadButton
      formato="completo"
      numero={doc.numero}
      cliente={{ nombres: doc.customer.nombres, email: doc.customer.email ?? "", notas: doc.observaciones ?? "" }}
      items={items}
      totales={totales}
      tipoDocumento={doc.tipo as "COTIZACION" | "FACTURA"}
      seller={seller}
      fileName={`${doc.numero}.pdf`}
      label="Descargar PDF"
      className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-[oklch(0.090_0.025_255)] font-bold rounded-xl transition-all text-sm shadow-md shadow-amber-400/20 shrink-0"
    />
  );
}
