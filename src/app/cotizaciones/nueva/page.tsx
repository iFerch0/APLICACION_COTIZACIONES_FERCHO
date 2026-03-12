import CotizacionForm from "@/components/cotizaciones/CotizacionForm";
import Link from "next/link";
import { ChevronRight, Home, FileText } from "lucide-react";
import { getSellerProfile } from "@/app/actions/seller";

export default async function NuevaCotizacionPage() {
  const seller = await getSellerProfile();
  return (
    <div className="fade-up space-y-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[var(--text-2)]">
        <Link href="/" className="flex items-center gap-1 hover:text-[var(--text-0)] transition-colors">
          <Home className="w-3.5 h-3.5" />
          Inicio
        </Link>
        <ChevronRight className="w-3 h-3 text-[var(--border-1)]" />
        <span className="flex items-center gap-1 text-amber-500 font-medium">
          <FileText className="w-3.5 h-3.5" />
          Nueva Cotización
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-0)] tracking-tight">
            Nueva Cotización
          </h1>
          <p className="mt-1.5 text-[var(--text-2)] text-sm">
            Agrega ítems, configura cargos adicionales y genera el documento PDF.
          </p>
        </div>
        <Link
          href="/"
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-2)] hover:bg-[var(--border-0)] border border-[var(--border-0)] text-[var(--text-1)] hover:text-[var(--text-0)] text-sm font-medium rounded-xl transition-all"
        >
          Cancelar
        </Link>
      </div>

      <CotizacionForm tipoDocumento="COTIZACION" seller={seller} />
    </div>
  );
}
