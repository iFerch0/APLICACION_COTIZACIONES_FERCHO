"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Search,
  FileText,
  Receipt,
  Plus,
  TrendingUp,
  Hash,
  CalendarDays,
  User,
} from "lucide-react";
import type { DocumentListItem } from "@/app/actions/documents";

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtDec = (n: number) =>
  n.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

type TipoFilter = "TODOS" | "COTIZACION" | "FACTURA";

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        accent
          ? "bg-amber-400/5 border-amber-400/20"
          : "bg-[var(--surface-1)] border-[var(--border-0)]"
      }`}
    >
      <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-2)] mb-2">
        {label}
      </div>
      <div
        className={`text-2xl font-black ${accent ? "text-amber-500" : "text-[var(--text-0)]"}`}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-[var(--text-2)] mt-0.5">{sub}</div>}
    </div>
  );
}

function TipoBadge({ tipo }: { tipo: string }) {
  return tipo === "COTIZACION" ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-500 border border-amber-400/20">
      <FileText className="w-2.5 h-2.5" />
      Cot.
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-400/10 text-teal-500 border border-teal-400/20">
      <Receipt className="w-2.5 h-2.5" />
      Fac.
    </span>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mb-4">
        {filtered ? (
          <Search className="w-7 h-7 text-[var(--text-2)]" />
        ) : (
          <FileText className="w-7 h-7 text-[var(--text-2)]" />
        )}
      </div>
      <p className="text-[var(--text-0)] font-semibold text-sm mb-1">
        {filtered ? "Sin resultados" : "Sin documentos aún"}
      </p>
      <p className="text-[var(--text-2)] text-xs max-w-xs leading-relaxed">
        {filtered
          ? "Prueba con otro término de búsqueda o cambia el filtro."
          : "Crea tu primera cotización y aparecerá aquí con toda la información."}
      </p>
      {!filtered && (
        <Link
          href="/cotizaciones/nueva"
          className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-[oklch(0.090_0.025_255)] text-xs font-bold rounded-xl transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Crear primera cotización
        </Link>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function DocumentsClient({ docs }: { docs: DocumentListItem[] }) {
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>("TODOS");

  const filtered = useMemo(() => {
    return docs.filter((doc) => {
      const matchesTipo = tipoFilter === "TODOS" || doc.tipo === tipoFilter;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        doc.numero.toLowerCase().includes(q) ||
        doc.customer.nombres.toLowerCase().includes(q) ||
        (doc.customer.email ?? "").toLowerCase().includes(q);
      return matchesTipo && matchesSearch;
    });
  }, [docs, search, tipoFilter]);

  // Stats
  const stats = useMemo(() => {
    const cotizaciones = docs.filter((d) => d.tipo === "COTIZACION").length;
    const facturas = docs.filter((d) => d.tipo === "FACTURA").length;
    const totalCOP = docs.reduce((sum, d) => sum + d.totalFinal, 0);
    return { total: docs.length, cotizaciones, facturas, totalCOP };
  }, [docs]);

  const isFiltered = search.trim() !== "" || tipoFilter !== "TODOS";

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total documentos" value={stats.total} />
        <StatCard label="Cotizaciones" value={stats.cotizaciones} />
        <StatCard label="Facturas" value={stats.facturas} />
        <StatCard
          label="Total generado"
          value={`$${fmtDec(stats.totalCOP)}`}
          sub="COP"
          accent
        />
      </div>

      {/* Filters */}
      <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-2)] pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por número o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--surface-2)] border border-[var(--border-0)] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[var(--text-0)] placeholder-[var(--text-2)] focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 outline-none transition-all"
            />
          </div>

          {/* Tipo tabs */}
          <div className="flex items-center gap-1 bg-[var(--surface-2)] border border-[var(--border-0)] rounded-xl p-1">
            {(["TODOS", "COTIZACION", "FACTURA"] as TipoFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setTipoFilter(t)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                  tipoFilter === t
                    ? "bg-amber-400 text-[oklch(0.090_0.025_255)] shadow-sm"
                    : "text-[var(--text-1)] hover:text-[var(--text-0)]"
                }`}
              >
                {t === "TODOS" ? "Todos" : t === "COTIZACION" ? "Cot." : "Fac."}
              </button>
            ))}
          </div>
        </div>

        {isFiltered && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-0)]">
            <span className="text-xs text-[var(--text-2)]">
              {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}
            </span>
            <button
              onClick={() => { setSearch(""); setTipoFilter("TODOS"); }}
              className="text-xs text-amber-500 hover:text-amber-400 font-semibold transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Table / List */}
      <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState filtered={isFiltered} />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border-0)]">
                    {[
                      { label: "Tipo", w: "w-20 px-5" },
                      { label: "Número", w: "w-36 px-3" },
                      { label: "Cliente", w: "px-3" },
                      { label: "Ítems", w: "w-16 px-3 text-center" },
                      { label: "Fecha", w: "w-32 px-3" },
                      { label: "Total", w: "w-32 px-3 text-right" },
                      { label: "Estado", w: "w-28 px-5 text-right" },
                    ].map(({ label, w }) => (
                      <th
                        key={label}
                        className={`py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-2)] ${w}`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b border-[var(--border-0)]/50 last:border-0 hover:bg-[var(--surface-2)]/50 transition-colors group cursor-pointer"
                      onClick={() => { window.location.href = `/documentos/${doc.id}`; }}
                    >
                      <td className="px-5 py-3.5">
                        <TipoBadge tipo={doc.tipo} />
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="font-mono text-xs font-bold text-[var(--text-0)] tracking-tight">
                          {doc.numero}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="text-sm font-medium text-[var(--text-0)]">
                          {doc.customer.nombres}
                        </div>
                        {doc.customer.email && (
                          <div className="text-xs text-[var(--text-2)] mt-0.5 truncate max-w-[180px]">
                            {doc.customer.email}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span className="text-xs font-semibold text-[var(--text-1)]">
                          {doc._count.items}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="text-sm text-[var(--text-0)]">
                          {format(new Date(doc.fecha), "dd MMM yyyy", { locale: es })}
                        </div>
                        <div className="text-[10px] text-[var(--text-2)] mt-0.5">
                          {format(new Date(doc.createdAt), "HH:mm")}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <span className="text-sm font-bold text-[var(--text-0)]">
                          ${fmtDec(doc.totalFinal)}
                        </span>
                        <div className="text-[10px] text-[var(--text-2)]">COP</div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <EstadoBadge estado={doc.estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-[var(--border-0)]/50">
              {filtered.map((doc) => (
                <Link key={doc.id} href={`/documentos/${doc.id}`} className="block p-4 space-y-2 hover:bg-[var(--surface-2)]/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <TipoBadge tipo={doc.tipo} />
                      <span className="font-mono text-xs font-bold text-[var(--text-0)]">
                        {doc.numero}
                      </span>
                    </div>
                    <EstadoBadge estado={doc.estado} />
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-[var(--text-1)]">
                      <User className="w-3 h-3 text-[var(--text-2)]" />
                      <span className="truncate">{doc.customer.nombres}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[var(--text-1)]">
                      <Hash className="w-3 h-3 text-[var(--text-2)]" />
                      {doc._count.items} {doc._count.items === 1 ? "ítem" : "ítems"}
                    </div>
                    <div className="flex items-center gap-1.5 text-[var(--text-1)]">
                      <CalendarDays className="w-3 h-3 text-[var(--text-2)]" />
                      {format(new Date(doc.fecha), "dd MMM yyyy", { locale: es })}
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-[var(--text-0)]">
                      <TrendingUp className="w-3 h-3 text-amber-500" />
                      ${fmtDec(doc.totalFinal)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Footer count */}
            <div className="px-5 py-3 border-t border-[var(--border-0)] flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)]">
                {filtered.length} de {docs.length} documentos
              </span>
              <Link
                href="/cotizaciones/nueva"
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 hover:text-amber-400 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Nueva cotización
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    BORRADOR: {
      label: "Borrador",
      cls: "bg-[var(--surface-2)] text-[var(--text-2)] border-[var(--border-0)]",
    },
    ENVIADO: {
      label: "Enviado",
      cls: "bg-blue-400/10 text-blue-500 border-blue-400/20",
    },
    ACEPTADO: {
      label: "Aceptado",
      cls: "bg-green-400/10 text-green-600 dark:text-green-400 border-green-400/20",
    },
    RECHAZADO: {
      label: "Rechazado",
      cls: "bg-red-400/10 text-red-500 border-red-400/20",
    },
  };
  const cfg = map[estado] ?? map["BORRADOR"];
  return (
    <span
      className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}
