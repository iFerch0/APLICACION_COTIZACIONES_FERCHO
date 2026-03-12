"use client";

import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { CotizacionPDF } from "./CotizacionPDF";
import { ItemCalculated, DocumentTotals } from "@/lib/calculator";

interface ClientPDFViewerProps {
  formato: "completo" | "resumido" | "concatenado";
  cliente: {
    nombres: string;
    email: string;
    notas: string;
  };
  items: ItemCalculated[];
  totales: DocumentTotals;
  aplica4x1000Global: boolean;
}

export default function ClientPDFViewer(props: ClientPDFViewerProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
        <span className="text-gray-700 font-medium">Previsualización de documento</span>
        <PDFDownloadLink
          document={<CotizacionPDF {...props} />}
          fileName={`Cotizacion_${props.formato}_${new Date().getTime()}.pdf`}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          {({ loading }) => (loading ? "Generando documento..." : "Descargar PDF ahora")}
        </PDFDownloadLink>
      </div>

      <div className="h-[600px] w-full border rounded-lg overflow-hidden">
        <PDFViewer style={{ width: "100%", height: "100%" }} showToolbar={false}>
          <CotizacionPDF {...props} />
        </PDFViewer>
      </div>
    </div>
  );
}
