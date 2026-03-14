import CotizacionForm from "@/components/cotizaciones/CotizacionForm";
import Link from "next/link";
import { ChevronRight, Home, Receipt, FileText } from "lucide-react";
import { getSellerProfile } from "@/app/actions/seller";
import { getDocumentForConversion } from "@/app/actions/documents";

export default async function NuevaFacturaPage({
  searchParams,
}: {
  searchParams: Promise<{ fromCotizacion?: string }>;
}) {
  const { fromCotizacion } = await searchParams;
  const seller = await getSellerProfile();
  const sourceDocument = fromCotizacion
    ? await getDocumentForConversion(fromCotizacion)
    : null;

  return (
    <div className="fade-up space-y-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[var(--text-2)]">
        <Link href="/" className="flex items-center gap-1 hover:text-[var(--text-0)] transition-colors">
          <Home className="w-3.5 h-3.5" />
          Inicio
        </Link>
        <ChevronRight className="w-3 h-3 text-[var(--border-1)]" />
        {sourceDocument && (
          <>
            <Link href={`/documentos/${sourceDocument.cotizacionOrigenId}`} className="flex items-center gap-1 hover:text-[var(--text-0)] transition-colors">
              <FileText className="w-3.5 h-3.5" />
              {sourceDocument.cotizacionNumero}
            </Link>
            <ChevronRight className="w-3 h-3 text-[var(--border-1)]" />
          </>
        )}
        <span className="flex items-center gap-1 text-teal-500 font-medium">
          <Receipt className="w-3.5 h-3.5" />
          Nueva Factura
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-0)] tracking-tight">
            {sourceDocument
              ? `Nueva Factura — desde ${sourceDocument.cotizacionNumero}`
              : "Nueva Factura"}
          </h1>
          <p className="mt-1.5 text-[var(--text-2)] text-sm">
            {sourceDocument
              ? `Datos pre-cargados desde la cotización ${sourceDocument.cotizacionNumero}. Puedes modificar antes de guardar.`
              : "Genera una factura simple o documento equivalente a partir de los datos e ítems introducidos."}
          </p>
        </div>
        <Link
          href={sourceDocument ? `/documentos/${sourceDocument.cotizacionOrigenId}` : "/"}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-2)] hover:bg-[var(--border-0)] border border-[var(--border-0)] text-[var(--text-1)] hover:text-[var(--text-0)] text-sm font-medium rounded-xl transition-all"
        >
          Cancelar
        </Link>
      </div>

      <CotizacionForm tipoDocumento="FACTURA" seller={seller} sourceDocument={sourceDocument} />
    </div>
  );
}
