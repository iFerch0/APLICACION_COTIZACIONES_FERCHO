import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home, Receipt, Pencil } from "lucide-react";
import { getDocumentForEdit } from "@/app/actions/documents";
import { getSellerProfile } from "@/app/actions/seller";
import CotizacionForm from "@/components/cotizaciones/CotizacionForm";

export default async function EditarFacturaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [editDocument, seller] = await Promise.all([
    getDocumentForEdit(id),
    getSellerProfile(),
  ]);

  if (!editDocument || editDocument.tipo !== "FACTURA") notFound();

  return (
    <div className="fade-up space-y-6">
      <nav className="flex items-center gap-1.5 text-xs text-[var(--text-2)]">
        <Link href="/" className="flex items-center gap-1 hover:text-[var(--text-0)] transition-colors">
          <Home className="w-3.5 h-3.5" />
          Inicio
        </Link>
        <ChevronRight className="w-3 h-3 text-[var(--border-1)]" />
        <Link
          href={`/documentos/${id}`}
          className="flex items-center gap-1 hover:text-[var(--text-0)] transition-colors"
        >
          <Receipt className="w-3.5 h-3.5" />
          {editDocument.documentNumero}
        </Link>
        <ChevronRight className="w-3 h-3 text-[var(--border-1)]" />
        <span className="flex items-center gap-1 text-teal-500 font-medium">
          <Pencil className="w-3.5 h-3.5" />
          Editar
        </span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-0)] tracking-tight">
            Editar {editDocument.documentNumero}
          </h1>
          <p className="mt-1.5 text-[var(--text-2)] text-sm">
            Modifica los datos de la factura. Los cambios reemplazarán los ítems y totales actuales.
          </p>
        </div>
        <Link
          href={`/documentos/${id}`}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-2)] hover:bg-[var(--border-0)] border border-[var(--border-0)] text-[var(--text-1)] hover:text-[var(--text-0)] text-sm font-medium rounded-xl transition-all"
        >
          Cancelar
        </Link>
      </div>

      <CotizacionForm tipoDocumento="FACTURA" seller={seller} editDocument={editDocument} />
    </div>
  );
}
