"use client";

import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  FileText,
  Receipt,
  Users,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Plus,
  FolderOpen,
} from "lucide-react";
import { fmtMoney } from "@/lib/format";
import type { DashboardStats } from "@/app/actions/dashboard";

// ── Status badge colors ──────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    BORRADOR: {
      bg: "bg-amber-400/10 dark:bg-amber-400/15",
      text: "text-amber-600 dark:text-amber-400",
      label: "Borrador",
    },
    ENVIADO: {
      bg: "bg-blue-400/10 dark:bg-blue-400/15",
      text: "text-blue-600 dark:text-blue-400",
      label: "Enviado",
    },
    FACTURADA: {
      bg: "bg-emerald-400/10 dark:bg-emerald-400/15",
      text: "text-emerald-600 dark:text-emerald-400",
      label: "Facturada",
    },
    ARCHIVADA: {
      bg: "bg-zinc-400/10 dark:bg-zinc-400/15",
      text: "text-zinc-500 dark:text-zinc-400",
      label: "Archivada",
    },
  };
  const c = config[estado] ?? config.BORRADOR;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${c.bg} ${c.text}`}
    >
      {c.label}
    </span>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  colorClass: string;
  iconBg: string;
}

function StatCard({ icon: Icon, label, value, subtext, colorClass, iconBg }: StatCardProps) {
  return (
    <div className="relative bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-black/5 hover:border-[var(--border-1)] group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-2)] mb-1">
        {label}
      </p>
      <p className="text-2xl font-black text-[var(--text-0)] tracking-tight">
        {value}
      </p>
      {subtext && (
        <p className="text-xs text-[var(--text-2)] mt-1">{subtext}</p>
      )}
    </div>
  );
}

// ── Monthly bar chart (pure Tailwind divs) ────────────────────────────────────

function MonthlyChart({ data }: { data: DashboardStats["documentosPorMes"] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl p-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-2)] mb-6">
          Actividad Mensual
        </h3>
        <p className="text-sm text-[var(--text-2)]">Sin datos aún.</p>
      </div>
    );
  }

  const maxMonto = Math.max(
    ...data.map((d) => d.montoCotizaciones + d.montoFacturas),
    1
  );

  return (
    <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-2)]">
          Actividad Mensual
        </h3>
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
            Cotizaciones
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-teal-400" />
            Facturas
          </span>
        </div>
      </div>

      <div className="flex items-end gap-3 h-44">
        {data.map((d, i) => {
          const cotH = Math.max((d.montoCotizaciones / maxMonto) * 100, d.cotizaciones > 0 ? 8 : 0);
          const facH = Math.max((d.montoFacturas / maxMonto) * 100, d.facturas > 0 ? 8 : 0);
          const totalH = cotH + facH;

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar">
              {/* Tooltip */}
              <div className="text-[10px] text-[var(--text-2)] opacity-0 group-hover/bar:opacity-100 transition-opacity mb-1 text-center whitespace-nowrap">
                {(d.montoCotizaciones + d.montoFacturas) > 0
                  ? fmtMoney(d.montoCotizaciones + d.montoFacturas)
                  : "—"}
              </div>
              {/* Bars container */}
              <div
                className="w-full flex flex-col justify-end"
                style={{ height: "120px" }}
              >
                {/* Cotizaciones bar (bottom) */}
                <div
                  className="w-full bg-amber-400/80 dark:bg-amber-400/70 rounded-t-sm transition-all duration-300 min-h-0"
                  style={{ height: `${cotH}%` }}
                />
                {/* Facturas bar (top, stacked) */}
                <div
                  className="w-full bg-teal-400/80 dark:bg-teal-400/70 rounded-t-sm transition-all duration-300 min-h-0"
                  style={{ height: `${facH}%` }}
                />
              </div>
              {/* Month label */}
              <span className="text-[10px] font-semibold text-[var(--text-2)] mt-2">
                {d.mes}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Top Clients ───────────────────────────────────────────────────────────────

function TopClientes({ clientes }: { clientes: DashboardStats["topClientes"] }) {
  if (clientes.length === 0) {
    return (
      <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl p-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-2)] mb-4">
          Top Clientes
        </h3>
        <p className="text-sm text-[var(--text-2)]">Sin clientes registrados.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-2)]">
          Top Clientes
        </h3>
        <Link
          href="/clientes"
          className="text-[10px] font-bold text-amber-500 hover:text-amber-400 uppercase tracking-wider transition-colors flex items-center gap-1"
        >
          Ver todos
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-1">
        {clientes.map((cliente, i) => (
          <Link
            key={cliente.id}
            href={`/clientes/${cliente.id}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--surface-2)] transition-colors group/client"
          >
            {/* Rank */}
            <span
              className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                i === 0
                  ? "bg-amber-400/15 text-amber-500"
                  : i === 1
                  ? "bg-zinc-400/10 text-zinc-500 dark:text-zinc-400"
                  : i === 2
                  ? "bg-orange-400/10 text-orange-500"
                  : "bg-[var(--surface-2)] text-[var(--text-2)]"
              }`}
            >
              {i + 1}
            </span>

            {/* Name + docs */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--text-0)] truncate group-hover/client:text-amber-500 transition-colors">
                {cliente.nombres}
                {cliente.apellidos ? ` ${cliente.apellidos}` : ""}
              </p>
              <p className="text-[10px] text-[var(--text-2)]">
                {cliente.totalDocumentos} documento{cliente.totalDocumentos !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Amount */}
            <span className="text-sm font-bold text-[var(--text-0)] shrink-0">
              {fmtMoney(cliente.totalMonto)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Recent Documents ──────────────────────────────────────────────────────────

function DocumentosRecientes({ docs }: { docs: DashboardStats["documentosRecientes"] }) {
  if (docs.length === 0) {
    return (
      <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl p-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-2)] mb-4">
          Documentos Recientes
        </h3>
        <div className="flex flex-col items-center py-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center mb-3">
            <FolderOpen className="w-5 h-5 text-[var(--text-2)]" />
          </div>
          <p className="text-sm font-semibold text-[var(--text-0)] mb-1">Sin documentos</p>
          <p className="text-xs text-[var(--text-2)]">
            Crea tu primera cotización para verla aquí.
          </p>
          <Link
            href="/cotizaciones/nueva"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-[oklch(0.090_0.025_255)] text-xs font-bold rounded-xl transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Crear cotización
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-2)]">
          Documentos Recientes
        </h3>
        <Link
          href="/documentos"
          className="text-[10px] font-bold text-amber-500 hover:text-amber-400 uppercase tracking-wider transition-colors flex items-center gap-1"
        >
          Ver todos
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-t border-b border-[var(--border-0)]">
              <th className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-2)]">
                Documento
              </th>
              <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-2)]">
                Cliente
              </th>
              <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-2)]">
                Fecha
              </th>
              <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-2)] text-right">
                Monto
              </th>
              <th className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-2)] text-right">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <tr key={doc.id} className="border-b border-[var(--border-0)]/50 last:border-0 hover:bg-[var(--surface-2)]/50 transition-colors">
                <td className="px-6 py-3">
                  <Link href={`/documentos/${doc.id}`} className="flex items-center gap-2 group/doc">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        doc.tipo === "COTIZACION" ? "bg-amber-400" : "bg-teal-400"
                      }`}
                    />
                    <span className="font-mono text-xs font-bold text-[var(--text-0)] group-hover/doc:text-amber-500 transition-colors">
                      {doc.numero}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        doc.tipo === "COTIZACION"
                          ? "bg-amber-400/10 text-amber-600 dark:text-amber-400"
                          : "bg-teal-400/10 text-teal-600 dark:text-teal-400"
                      }`}
                    >
                      {doc.tipo === "COTIZACION" ? "COT" : "FAC"}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-[var(--text-1)]">
                  {doc.customer.nombres}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--text-2)]">
                  {format(new Date(doc.createdAt), "dd MMM yyyy", { locale: es })}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold text-[var(--text-0)]">
                    {fmtMoney(doc.totalFinal)}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  <EstadoBadge estado={doc.estado} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="sm:hidden divide-y divide-[var(--border-0)]/50">
        {docs.map((doc) => (
          <Link
            key={doc.id}
            href={`/documentos/${doc.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-2)]/50 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    doc.tipo === "COTIZACION" ? "bg-amber-400" : "bg-teal-400"
                  }`}
                />
                <span className="font-mono text-xs font-bold text-[var(--text-0)]">
                  {doc.numero}
                </span>
                <EstadoBadge estado={doc.estado} />
              </div>
              <div className="text-xs text-[var(--text-2)]">
                {doc.customer.nombres} · {format(new Date(doc.createdAt), "dd MMM", { locale: es })}
              </div>
            </div>
            <span className="text-sm font-bold text-[var(--text-0)] ml-3 shrink-0">
              {fmtMoney(doc.totalFinal)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Main DashboardClient ──────────────────────────────────────────────────────

interface DashboardClientProps {
  stats: DashboardStats;
}

export function DashboardClient({ stats }: DashboardClientProps) {
  const {
    totalCotizaciones,
    totalFacturas,
    totalClientes,
    montoTotalFacturas,
    cotizacionesPendientes,
    facturasPendientes,
    tasaConversion,
    documentosRecientes,
    topClientes,
    documentosPorMes,
  } = stats;

  return (
    <div className="fade-up space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-semibold text-amber-500 tracking-wide">
              Sistema activo
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-0)] tracking-tight">
            Dashboard
          </h1>
          <p className="mt-1 text-[var(--text-2)] text-sm">
            Resumen de tu actividad comercial
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/cotizaciones/nueva"
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-[oklch(0.090_0.025_255)] text-sm font-bold rounded-xl transition-all shadow-md shadow-amber-400/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Cotización</span>
            <span className="sm:hidden">Nueva</span>
          </Link>
          <Link
            href="/facturas/nueva"
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-1)] border border-[var(--border-0)] hover:border-teal-400/40 text-[var(--text-0)] text-sm font-bold rounded-xl transition-all hover:shadow-md hover:shadow-teal-400/10"
          >
            <Receipt className="w-4 h-4 text-teal-500" />
            <span className="hidden sm:inline">Nueva Factura</span>
            <span className="sm:hidden">Factura</span>
          </Link>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          icon={FileText}
          label="Cotizaciones"
          value={totalCotizaciones}
          subtext={`${cotizacionesPendientes} pendiente${cotizacionesPendientes !== 1 ? "s" : ""}`}
          colorClass="text-amber-500"
          iconBg="bg-amber-400/10"
        />
        <StatCard
          icon={Receipt}
          label="Facturas"
          value={totalFacturas}
          subtext={`${facturasPendientes} pendiente${facturasPendientes !== 1 ? "s" : ""}`}
          colorClass="text-emerald-500"
          iconBg="bg-emerald-400/10"
        />
        <StatCard
          icon={Users}
          label="Clientes"
          value={totalClientes}
          subtext="Total registrados"
          colorClass="text-orange-500"
          iconBg="bg-orange-400/10"
        />
        <StatCard
          icon={TrendingUp}
          label="Conversión"
          value={`${tasaConversion}%`}
          subtext="Cot. → Factura"
          colorClass="text-purple-500"
          iconBg="bg-purple-400/10"
        />
        <StatCard
          icon={DollarSign}
          label="Total Facturado"
          value={fmtMoney(montoTotalFacturas)}
          subtext="Acumulado"
          colorClass="text-teal-500"
          iconBg="bg-teal-400/10"
        />
      </div>

      {/* ── Monthly Chart ── */}
      <MonthlyChart data={documentosPorMes} />

      {/* ── Bottom Grid: Top Clients + Recent Docs ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <TopClientes clientes={topClientes} />
        </div>
        <div className="lg:col-span-3">
          <DocumentosRecientes docs={documentosRecientes} />
        </div>
      </div>
    </div>
  );
}
