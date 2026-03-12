import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronRight, Home, FolderOpen, User, Mail, FileText, Receipt, Hash } from "lucide-react";
import { getDocumentById } from "@/app/actions/documents";
import DocumentDetailClient from "@/components/documentos/DocumentDetailClient";

const fmtDec = (n: number) =>
  n.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default async function DocumentoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = await getDocumentById(id);
  if (!doc) notFound();

  const esCotizacion = doc.tipo === "COTIZACION";
  const accentColor = esCotizacion ? "amber" : "teal";

  return (
    <div className="fade-up space-y-6 max-w-4xl">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[var(--text-2)] flex-wrap">
        <Link href="/" className="flex items-center gap-1 hover:text-[var(--text-0)] transition-colors">
          <Home className="w-3.5 h-3.5" />
          Inicio
        </Link>
        <ChevronRight className="w-3 h-3 text-[var(--border-1)]" />
        <Link href="/documentos" className="flex items-center gap-1 hover:text-[var(--text-0)] transition-colors">
          <FolderOpen className="w-3.5 h-3.5" />
          Documentos
        </Link>
        <ChevronRight className="w-3 h-3 text-[var(--border-1)]" />
        <span className={`font-medium ${esCotizacion ? "text-amber-500" : "text-teal-500"}`}>
          {doc.numero}
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${esCotizacion ? "bg-amber-400/10" : "bg-teal-400/10"}`}>
              {esCotizacion
                ? <FileText className="w-5 h-5 text-amber-500" />
                : <Receipt className="w-5 h-5 text-teal-500" />}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-0)] tracking-tight">
                {doc.numero}
              </h1>
              <p className="text-[var(--text-2)] text-sm">
                {esCotizacion ? "Cotización comercial" : "Documento equivalente / Factura"} ·{" "}
                {format(new Date(doc.fecha), "dd 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
            </div>
          </div>
        </div>

        {/* PDF Download */}
        <DocumentDetailClient doc={doc} />
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Client */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-2)] mb-3">Cliente</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--text-2)] shrink-0" />
              <span className="text-sm font-semibold text-[var(--text-0)]">{doc.customer.nombres}</span>
            </div>
            {doc.customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[var(--text-2)] shrink-0" />
                <span className="text-sm text-[var(--text-1)]">{doc.customer.email}</span>
              </div>
            )}
            {doc.customer.identificacion && (
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-[var(--text-2)] shrink-0" />
                <span className="text-sm text-[var(--text-1)]">{doc.customer.identificacion}</span>
              </div>
            )}
          </div>
        </div>

        {/* Seller */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-2)] mb-3">Vendedor</p>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-[var(--text-0)]">{doc.seller.nombre}</p>
            {doc.seller.profesion && <p className="text-xs text-[var(--text-1)]">{doc.seller.profesion}</p>}
            {doc.seller.celular && <p className="text-xs text-[var(--text-2)]">Tel: {doc.seller.celular}</p>}
            {doc.seller.email && <p className="text-xs text-[var(--text-2)]">{doc.seller.email}</p>}
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-0)]">
          <h2 className="text-sm font-bold text-[var(--text-0)]">
            Ítems ({doc.items.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[500px]">
            <thead>
              <tr className="border-b border-[var(--border-0)]">
                {["Descripción", "Cant.", "Costo Unit.", "Subtotal"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-2)] ${i > 1 ? "text-right" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {doc.items.map((item) => (
                <tr key={item.id} className="border-b border-[var(--border-0)]/50 last:border-0">
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-[var(--text-0)]">{item.descripcion}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-[var(--text-1)]">{item.cantidad}</td>
                  <td className="px-5 py-3.5 text-sm text-right text-[var(--text-1)]">
                    ${fmtDec(item.costoUnitarioFinal)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right font-semibold text-[var(--text-0)]">
                    ${fmtDec(item.subtotalLinea)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-full sm:w-72 bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl p-5 space-y-2.5">
          {doc.totalTax > 0 && (
            <div className="flex justify-between text-sm text-[var(--text-1)]">
              <span>Total Tax</span>
              <span>${fmtDec(doc.totalTax)}</span>
            </div>
          )}
          {(doc.totalEnvio - doc.totalPromocionEnvio) > 0 && (
            <div className="flex justify-between text-sm text-[var(--text-1)]">
              <span>Envío neto</span>
              <span>${fmtDec(doc.totalEnvio - doc.totalPromocionEnvio)}</span>
            </div>
          )}
          {doc.totalImportacion > 0 && (
            <div className="flex justify-between text-sm text-[var(--text-1)]">
              <span>Importación</span>
              <span>${fmtDec(doc.totalImportacion)}</span>
            </div>
          )}
          {doc.totalAmazon > 0 && (
            <div className="flex justify-between text-sm text-[var(--text-1)]">
              <span>Garantía Amazon</span>
              <span>${fmtDec(doc.totalAmazon)}</span>
            </div>
          )}
          {doc.total4x1000 > 0 && (
            <div className="flex justify-between text-sm text-[var(--text-1)]">
              <span>Retención 4×1000</span>
              <span>${fmtDec(doc.total4x1000)}</span>
            </div>
          )}
          <div className="border-t border-[var(--border-0)] pt-2.5 flex justify-between items-center">
            <span className="font-black text-[var(--text-0)] text-sm uppercase tracking-wide">Total</span>
            <span className={`text-xl font-black ${esCotizacion ? "text-amber-500" : "text-teal-500"}`}>
              ${fmtDec(doc.totalFinal)}
            </span>
          </div>
          <p className="text-[10px] text-[var(--text-2)] text-right">COP — Pesos Colombianos</p>
        </div>
      </div>

      {doc.observaciones && (
        <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-2)] mb-2">Notas</p>
          <p className="text-sm text-[var(--text-1)] leading-relaxed">{doc.observaciones}</p>
        </div>
      )}

    </div>
  );
}
