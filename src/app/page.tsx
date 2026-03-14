import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Receipt, Users, ArrowRight, Zap, Shield, Calculator, Plus, FolderOpen } from "lucide-react";
import { getDocuments } from "@/app/actions/documents";

const quickActions = [
  {
    href: "/cotizaciones/nueva",
    icon: FileText,
    label: "Nueva Cotización",
    description: "Crea una cotización con cálculos automáticos de impuestos, envíos y comisiones.",
    badge: "Más usado",
  },
  {
    href: "/facturas/nueva",
    icon: Receipt,
    label: "Nueva Factura",
    description: "Genera facturas simples o documentos equivalentes para tus clientes.",
    badge: null,
  },
];

const features = [
  {
    icon: Calculator,
    title: "Cálculo automático",
    desc: "IVA, envíos, comisión Amazon (2.25%) e importación calculados al instante.",
  },
  {
    icon: FileText,
    title: "3 formatos PDF",
    desc: "Completo con desglose, resumido o concatenado. Descarga o previsualiza en tiempo real.",
  },
  {
    icon: Shield,
    title: "Datos seguros",
    desc: "Todos tus documentos y clientes se almacenan localmente con numeración automática.",
  },
  {
    icon: Zap,
    title: "Rápido y eficiente",
    desc: "Añade ítems, ajusta cargos y genera tu cotización en segundos, no minutos.",
  },
];

const fmtDec = (n: number) =>
  n.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default async function Home() {
  const recentDocs = await getDocuments({ limit: 5 });

  return (
    <div className="fade-up space-y-10">

      {/* Hero */}
      <div className="pt-4 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 mb-5">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-semibold text-amber-500 tracking-wide">Sistema activo</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-0)] tracking-tight leading-tight">
          Bienvenido a{" "}
          <span className="text-amber-500">CotizaPro</span>
        </h1>
        <p className="mt-3 text-[var(--text-1)] text-base max-w-xl leading-relaxed">
          Crea cotizaciones y facturas profesionales con cálculos automáticos. Olvídate de Excel y los errores manuales.
        </p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-2)] mb-4">
          Acciones rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickActions.map(({ href, icon: Icon, label, description, badge }) => (
            <Link
              key={href}
              href={href}
              className="group relative bg-[var(--surface-1)] hover:bg-[var(--surface-2)] border border-[var(--border-0)] hover:border-amber-400/30 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:shadow-amber-400/5"
            >
              {badge && (
                <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-500 border border-amber-400/20">
                  {badge}
                </span>
              )}
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center mb-4 text-amber-500">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-[var(--text-0)] font-bold text-lg mb-1.5 group-hover:text-amber-500 transition-colors">
                {label}
              </h3>
              <p className="text-[var(--text-2)] text-sm leading-relaxed">
                {description}
              </p>
              <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-amber-400/60 group-hover:text-amber-500 transition-colors">
                Comenzar
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent documents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-2)]">
            Documentos recientes
          </h2>
          <Link
            href="/documentos"
            className="text-xs text-amber-500 hover:text-amber-400 font-semibold transition-colors flex items-center gap-1"
          >
            Ver todos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl overflow-hidden">
          {recentDocs.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-[var(--text-2)]" />
              </div>
              <p className="text-[var(--text-0)] font-semibold text-sm mb-1">Sin documentos aún</p>
              <p className="text-[var(--text-2)] text-xs max-w-xs">
                Crea tu primera cotización y aparecerá aquí con toda la información.
              </p>
              <Link
                href="/cotizaciones/nueva"
                className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-[oklch(0.090_0.025_255)] text-xs font-bold rounded-xl transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                Crear primera cotización
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[var(--border-0)]">
                      {["Número", "Cliente", "Fecha", "Total"].map((h, i) => (
                        <th
                          key={h}
                          className={`px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-2)] ${i === 3 ? "text-right" : ""}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentDocs.map((doc) => (
                      <tr
                        key={doc.id}
                        className="border-b border-[var(--border-0)]/50 last:border-0 hover:bg-[var(--surface-2)]/50 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                doc.tipo === "COTIZACION" ? "bg-amber-400" : "bg-teal-400"
                              }`}
                            />
                            <span className="font-mono text-xs font-bold text-[var(--text-0)]">
                              {doc.numero}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-[var(--text-1)]">
                          {doc.customer.nombres}
                        </td>
                        <td className="px-5 py-3 text-xs text-[var(--text-2)]">
                          {format(new Date(doc.fecha), "dd MMM yyyy", { locale: es })}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-sm font-bold text-[var(--text-0)]">
                            ${fmtDec(doc.totalFinal)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="sm:hidden divide-y divide-[var(--border-0)]/50">
                {recentDocs.map((doc) => (
                  <div key={doc.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            doc.tipo === "COTIZACION" ? "bg-amber-400" : "bg-teal-400"
                          }`}
                        />
                        <span className="font-mono text-xs font-bold text-[var(--text-0)]">
                          {doc.numero}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--text-2)]">
                        {doc.customer.nombres} ·{" "}
                        {format(new Date(doc.fecha), "dd MMM", { locale: es })}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[var(--text-0)]">
                      ${fmtDec(doc.totalFinal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 border-t border-[var(--border-0)] flex items-center justify-between">
                <span className="text-[10px] text-[var(--text-2)]">
                  Últimos {recentDocs.length} documentos
                </span>
                <Link
                  href="/documentos"
                  className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 hover:text-amber-400 transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Ver historial completo
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Features */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-2)] mb-4">
          Características
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl p-4"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center mb-3">
                <Icon className="w-4 h-4 text-amber-500" />
              </div>
              <h4 className="text-[var(--text-0)] font-semibold text-sm mb-1">{title}</h4>
              <p className="text-[var(--text-2)] text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
