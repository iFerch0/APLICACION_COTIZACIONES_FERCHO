"use client";

import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { CotizacionPDF } from "./CotizacionPDF";
import { ItemCalculated, DocumentTotals } from "@/lib/calculator";
import type { SellerData } from "@/app/actions/seller";
import { Download } from "lucide-react";

interface ClientPDFViewerProps {
  formato: "completo" | "resumido" | "concatenado";
  cliente: {
    nombres: string;
    email: string;
    notas: string;
  };
  items: ItemCalculated[];
  totales: DocumentTotals;
  tipoDocumento: "COTIZACION" | "FACTURA";
  seller?: SellerData | null;
}

export function PDFDownloadButton({
  fileName,
  className,
  label = "Descargar PDF",
  ...pdfProps
}: ClientPDFViewerProps & { fileName: string; className?: string; label?: string }) {
  return (
    <PDFDownloadLink
      document={<CotizacionPDF {...pdfProps} />}
      fileName={fileName}
      className={className}
    >
      {({ loading }) => (loading ? "Generando..." : label)}
    </PDFDownloadLink>
  );
}

export default function ClientPDFViewer(props: ClientPDFViewerProps) {
  const isFactura = props.tipoDocumento === "FACTURA";
  const fileName = `${isFactura ? "Factura" : "Cotizacion"}_${props.formato}_${Date.now()}.pdf`;

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-[var(--border-0)]">

      {/* Visor PDF */}
      <div className="relative h-[75vh] min-h-[480px] max-h-[700px]">
        <PDFViewer
          style={{ width: "100%", height: "100%" }}
          showToolbar={false}
        >
          <CotizacionPDF {...props} />
        </PDFViewer>
      </div>

      {/* Footer con descarga */}
      <div className={`flex items-center justify-between gap-3 px-5 py-3.5 border-t border-[var(--border-0)] ${isFactura ? "bg-teal-400/5" : "bg-amber-400/5"
        }`}>
        <div className="flex items-center gap-2">
          {/* Dots decorativos */}
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--border-1)]" />
            <div className="w-2 h-2 rounded-full bg-[var(--border-1)]" />
            <div className="w-2 h-2 rounded-full bg-[var(--border-1)]" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-2)]">
            {props.formato} · PDF
          </span>
        </div>

        <PDFDownloadLink
          document={<CotizacionPDF {...props} />}
          fileName={fileName}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${isFactura
            ? "bg-teal-400 hover:bg-teal-300 text-[oklch(0.090_0.025_255)] shadow-sm shadow-teal-400/20"
            : "bg-amber-400 hover:bg-amber-300 text-[oklch(0.090_0.025_255)] shadow-sm shadow-amber-400/20"
            }`}
        >
          {({ loading }) =>
            loading ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generando...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                Descargar PDF
              </>
            )
          }
        </PDFDownloadLink>
      </div>
    </div>
  );
}
