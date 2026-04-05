"use client";

import { TrendingUp, Hash } from "lucide-react";
import { fmtMoneyDec } from "@/lib/format";
import type { DocumentTotals as DocumentTotalsType } from "@/lib/calculator";
import type { MargenConfig, ItemForm } from "./types";

// ── Props ────────────────────────────────────────────────────────────────────
interface DocumentTotalsProps {
  totales: DocumentTotalsType;
  isLabel: string;
  margen?: MargenConfig;
  items?: ItemForm[];
}

// ── Linea individual ─────────────────────────────────────────────────────────
function LineItem({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "amber" | "teal" | "danger";
}) {
  const valueClass = accent
    ? accent === "amber"
      ? "text-amber-500"
      : accent === "teal"
      ? "text-teal-500"
      : "text-red-500"
    : "text-[var(--text-0)]";

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[var(--text-1)]">{label}</span>
      <span className={`text-sm font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
export default function DocumentTotals({ totales, isLabel, margen, items }: DocumentTotalsProps) {
  const itemCount = items?.reduce((sum, i) => sum + i.cantidad, 0) ?? 0;
  const hasMargen = margen && margen.porcentaje > 0;
  const margenAmount = hasMargen ? totales.totalFinal - totales.subtotal : 0;

  return (
    <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border-0)] flex items-center gap-2.5">
        <TrendingUp className="w-4 h-4 text-amber-500" />
        <h3 className="text-[var(--text-0)] font-semibold text-sm">Resumen de {isLabel}</h3>
        {items && items.length > 0 && (
          <span className="ml-auto flex items-center gap-1 text-[9px] bg-amber-400/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">
            <Hash className="w-2.5 h-2.5" />
            {itemCount} {itemCount === 1 ? "unidad" : "unidades"}
          </span>
        )}
      </div>

      {/* Lines */}
      <div className="p-5 space-y-2.5">
        <LineItem label="Subtotal ítems" value={`$${fmtMoneyDec(totales.subtotal)}`} />
        {totales.totalTax > 0 && (
          <LineItem label="Tax (extras)" value={`+$${fmtMoneyDec(totales.totalTax)}`} accent="amber" />
        )}
        {totales.totalEnvio > 0 && (
          <LineItem label="Envío" value={`+$${fmtMoneyDec(totales.totalEnvio)}`} />
        )}
        {totales.totalPromocionEnvio > 0 && (
          <LineItem label="Promo envío gratis" value={`−$${fmtMoneyDec(totales.totalPromocionEnvio)}`} accent="teal" />
        )}
        {totales.totalImportacion > 0 && (
          <LineItem label="Importación" value={`+$${fmtMoneyDec(totales.totalImportacion)}`} />
        )}
        {totales.totalAmazon > 0 && (
          <LineItem label="Garantía Tasa de Cambio" value={`+$${fmtMoneyDec(totales.totalAmazon)}`} accent="amber" />
        )}
        {/* Margen */}
        {hasMargen && (
          <LineItem
            label={`Margen (${margen.porcentaje}% sobre ${margen.tipo === "base" ? "precio base" : "costo total"})`}
            value={`+$${fmtMoneyDec(margenAmount)}`}
            accent="teal"
          />
        )}
        {/* Total */}
        <div className="border-t border-[var(--border-0)] pt-4 mt-2">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest text-amber-500/70 mb-1">
                Total Final
              </div>
              <div className="text-3xl font-black text-[var(--text-0)] leading-none">
                ${fmtMoneyDec(totales.totalFinal)}
              </div>
              <div className="text-[10px] text-[var(--text-2)] mt-1 font-medium">
                COP — Pesos Colombianos
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
