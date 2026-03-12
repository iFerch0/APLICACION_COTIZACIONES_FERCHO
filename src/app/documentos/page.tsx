import Link from "next/link";
import { ChevronRight, Home, FolderOpen, Plus } from "lucide-react";
import { getDocuments } from "@/app/actions/documents";
import DocumentsClient from "@/components/documentos/DocumentsClient";

export default async function DocumentosPage() {
  const docs = await getDocuments();

  return (
    <div className="fade-up space-y-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[var(--text-2)]">
        <Link href="/" className="flex items-center gap-1 hover:text-[var(--text-0)] transition-colors">
          <Home className="w-3.5 h-3.5" />
          Inicio
        </Link>
        <ChevronRight className="w-3 h-3 text-[var(--border-1)]" />
        <span className="flex items-center gap-1 text-[var(--text-1)] font-medium">
          <FolderOpen className="w-3.5 h-3.5" />
          Documentos
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-0)] tracking-tight">
            Documentos
          </h1>
          <p className="mt-1.5 text-[var(--text-2)] text-sm">
            Historial de cotizaciones y facturas generadas.
          </p>
        </div>
        <Link
          href="/cotizaciones/nueva"
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-[oklch(0.090_0.025_255)] text-sm font-bold rounded-xl transition-all shadow-md shadow-amber-400/20"
        >
          <Plus className="w-4 h-4" />
          Nueva Cotización
        </Link>
      </div>

      <DocumentsClient docs={docs} />
    </div>
  );
}
