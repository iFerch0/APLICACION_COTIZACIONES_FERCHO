import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronRight, Home, FolderOpen, User, Mail, FileText, Receipt, Hash, ArrowRight, CheckCircle2, Archive } from "lucide-react";
import { getDocumentById } from "@/app/actions/documents";
import DocumentDetailClient from "@/components/documentos/DocumentDetailClient";
import DocumentActionsClient from "@/components/documentos/DocumentActionsClient";

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
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-0)] tracking-tight">
                  {doc.numero}
                </h1>
                {/* Badge de estado */}
                {doc.estado === "FACTURADA" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-400/10 text-teal-600 dark:text-teal-400 border border-teal-400/20">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Facturada
                  </span>
                )}
                {doc.estado === "ARCHIVADA" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-2)] border border-[var(--border-0)]">
                    <Archive className="w-2.5 h-2.5" />
                    Archivada
                  </span>
                )}
                {!esCotizacion && doc.cotizacionOrigen && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-400/20">
                    <FileText className="w-2.5 h-2.5" />
                    desde {doc.cotizacionOrigen.numero}
                  </span>
                )}
              </div>
              <p className="text-[var(--text-2)] text-sm mt-0.5">
                {esCotizacion ? "Cotización comercial" : "Documento equivalente / Factura"} ·{" "}
                {format(new Date(doc.fecha), "dd 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
          {/* Convert / Factura link */}
          {esCotizacion && doc.estado !== "ARCHIVADA" && (
            doc.facturasGeneradas.length > 0 ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-green-400/10 border border-green-400/20 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Facturada
                </span>
                <Link
                  href={`/facturas/nueva?fromCotizacion=${doc.id}`}
                  className="flex items-center gap-2 px-3.5 py-2 bg-teal-400/10 hover:bg-teal-400/20 border border-teal-400/20 text-teal-500 text-xs font-semibold rounded-xl transition-all"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  Nueva factura desde esta
                </Link>
              </div>
            ) : (
              <Link
                href={`/facturas/nueva?fromCotizacion=${doc.id}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-400 hover:bg-teal-300 text-[oklch(0.090_0.025_255)] text-sm font-bold rounded-xl transition-all shadow-md shadow-teal-400/20"
              >
                <Receipt className="w-4 h-4" />
                Convertir a Factura
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )
          )}
          {/* PDF download */}
          <DocumentDetailClient doc={doc} />
          {/* Edit / Archive / Delete */}
          <DocumentActionsClient
            docId={doc.id}
            tipo={doc.tipo as "COTIZACION" | "FACTURA"}
            estado={doc.estado}
            numero={doc.numero}
            hasFacturas={doc.facturasGeneradas.length > 0}
          />
        </div>
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
          {/* Subtotal base — solo si hay extras que cambien el total */}
          {doc.subtotal < doc.totalFinal && (
            <div className="flex justify-between text-sm text-[var(--text-1)]">
              <span>Subtotal base</span>
              <span>${fmtDec(doc.subtotal)}</span>
            </div>
          )}
          {doc.totalTax > 0 && (
            <div className="flex justify-between text-sm text-[var(--text-1)]">
              <span>Tax</span>
              <span>+${fmtDec(doc.totalTax)}</span>
            </div>
          )}
          {doc.totalEnvio > 0 && (
            <div className="flex justify-between text-sm text-[var(--text-1)]">
              <span>Descuento envío</span>
              <span>+${fmtDec(doc.totalEnvio)}</span>
            </div>
          )}
          {doc.totalPromocionEnvio > 0 && (
            <div className="flex justify-between text-sm text-[var(--text-1)]">
              <span>Promo envío gratis</span>
              <span className="text-teal-500">−${fmtDec(doc.totalPromocionEnvio)}</span>
            </div>
          )}
          {doc.totalImportacion > 0 && (
            <div className="flex justify-between text-sm text-[var(--text-1)]">
              <span>Importación</span>
              <span>+${fmtDec(doc.totalImportacion)}</span>
            </div>
          )}
          {doc.totalAmazon > 0 && (
            <div className="flex justify-between text-sm text-[var(--text-1)]">
              <span>Garantía Tasa de Cambio</span>
              <span>+${fmtDec(doc.totalAmazon)}</span>
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

      {/* ── Trazabilidad: Factura originada desde cotización ── */}
      {!esCotizacion && doc.cotizacionOrigen && (
        <div className="bg-[var(--surface-1)] border border-teal-400/20 rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-teal-500/70 mb-3 flex items-center gap-1.5">
            <FileText className="w-3 h-3" />
            Originada de cotización
          </p>
          <Link
            href={`/documentos/${doc.cotizacionOrigen.id}`}
            className="inline-flex items-center gap-3 p-3 bg-teal-400/5 hover:bg-teal-400/10 border border-teal-400/15 rounded-xl transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="font-mono text-sm font-bold text-[var(--text-0)]">{doc.cotizacionOrigen.numero}</p>
              <p className="text-xs text-[var(--text-2)]">
                {format(new Date(doc.cotizacionOrigen.fecha), "dd 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--text-2)] ml-auto" />
          </Link>
        </div>
      )}

      {/* ── Trazabilidad: Facturas generadas desde esta cotización ── */}
      {esCotizacion && doc.facturasGeneradas.length > 0 && (
        <div className="bg-[var(--surface-1)] border border-green-400/20 rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-green-600/70 dark:text-green-400/70 mb-3 flex items-center gap-1.5">
            <Receipt className="w-3 h-3" />
            Facturas generadas ({doc.facturasGeneradas.length})
          </p>
          <div className="space-y-2">
            {doc.facturasGeneradas.map((fac) => (
              <Link
                key={fac.id}
                href={`/documentos/${fac.id}`}
                className="flex items-center justify-between gap-3 p-3 bg-green-400/5 hover:bg-green-400/10 border border-green-400/15 rounded-xl transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-400/10 flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4 text-teal-500" />
                  </div>
                  <div>
                    <p className="font-mono text-sm font-bold text-[var(--text-0)]">{fac.numero}</p>
                    <p className="text-xs text-[var(--text-2)]">
                      {format(new Date(fac.fecha), "dd MMM yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-teal-500">${fmtDec(fac.totalFinal)}</p>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--text-2)] ml-auto mt-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
