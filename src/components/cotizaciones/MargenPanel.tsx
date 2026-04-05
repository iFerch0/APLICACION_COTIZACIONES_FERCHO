"use client";

import { Percent, Lock } from "lucide-react";
import { fmtMoneyDec } from "@/lib/format";
import type { MargenTipo, MargenRedondeo } from "./types";

// ── Input class string ──────────────────────────────────────────────────────
const inputBase =
  "w-full bg-[var(--surface-2)] border border-[var(--border-0)] rounded-xl text-sm text-[var(--text-0)] placeholder-[var(--text-2)] focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 outline-none transition-all";

// ── Props ────────────────────────────────────────────────────────────────────
interface MargenPanelProps {
  margenPreset: number | "manual";
  margenManual: number;
  margenTipo: MargenTipo;
  margenRedondeo: MargenRedondeo;
  margenPorcentaje: number;
  totalesCostoFinal: number;
  totalesFinal: number;
  onPresetChange: (preset: number | "manual") => void;
  onManualChange: (val: number) => void;
  onTipoChange: (tipo: MargenTipo) => void;
  onRedondeoChange: (redondeo: MargenRedondeo) => void;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function MargenPanel({
  margenPreset,
  margenManual,
  margenTipo,
  margenRedondeo,
  margenPorcentaje,
  totalesCostoFinal,
  totalesFinal,
  onPresetChange,
  onManualChange,
  onTipoChange,
  onRedondeoChange,
}: MargenPanelProps) {
  const ganancia = totalesFinal - totalesCostoFinal;
  const margenReal = totalesCostoFinal > 0 ? (ganancia / totalesCostoFinal) * 100 : 0;

  return (
    <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border-0)] flex items-center gap-2.5">
        <Percent className="w-4 h-4 text-teal-500" />
        <h3 className="text-[var(--text-0)] font-semibold text-sm">Margen de Ganancia</h3>
        <span className="ml-auto flex items-center gap-1 text-[9px] bg-teal-400/10 text-teal-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
          <Lock className="w-2.5 h-2.5" />
          Solo vendedor
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Porcentaje */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)] block mb-2">
            Margen %
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {([0, 10, 15, "manual"] as const).map((p) => (
              <button
                key={String(p)}
                onClick={() => onPresetChange(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  margenPreset === p
                    ? "bg-teal-500 text-white shadow-sm"
                    : "bg-[var(--surface-2)] text-[var(--text-1)] hover:text-[var(--text-0)] border border-[var(--border-0)]"
                }`}
              >
                {p === 0 ? "Ninguno" : p === "manual" ? "Manual" : `${p}%`}
              </button>
            ))}
          </div>
          {margenPreset === "manual" && (
            <div className="relative mt-2">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={margenManual}
                onChange={(e) => onManualChange(Math.max(0, Number(e.target.value)))}
                className={`${inputBase} py-2 pl-3 pr-8`}
                placeholder="Ej: 12.5"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-2)] text-xs pointer-events-none">
                %
              </span>
            </div>
          )}
        </div>

        {/* Tipo */}
        {margenPorcentaje > 0 && (
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)] block mb-2">
              Aplicar sobre
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["base", "total"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => onTipoChange(t)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    margenTipo === t
                      ? "bg-teal-500/15 text-teal-500 border border-teal-500/30"
                      : "bg-[var(--surface-2)] text-[var(--text-1)] hover:text-[var(--text-0)] border border-[var(--border-0)]"
                  }`}
                >
                  {t === "base" ? "Precio Base" : "Costo Total"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Redondeo */}
        {margenPorcentaje > 0 && (
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)] block mb-2">
              Redondeo de precio
            </label>
            <div className="flex gap-1.5">
              {([0, 1000, 5000] as MargenRedondeo[]).map((r) => (
                <button
                  key={r}
                  onClick={() => onRedondeoChange(r)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    margenRedondeo === r
                      ? "bg-teal-500/15 text-teal-500 border border-teal-500/30"
                      : "bg-[var(--surface-2)] text-[var(--text-1)] hover:text-[var(--text-0)] border border-[var(--border-0)]"
                  }`}
                >
                  {r === 0 ? "Ninguno" : r === 1000 ? "1.000" : "5.000"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Profitability panel */}
        {margenPorcentaje > 0 && totalesCostoFinal > 0 && (
          <div className="bg-teal-400/5 border border-teal-400/15 rounded-xl p-3.5 space-y-2">
            <div className="text-[9px] font-black uppercase tracking-widest text-teal-500/70 mb-2.5">
              Tu rentabilidad
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-1)]">Tu costo</span>
              <span className="text-sm font-semibold text-[var(--text-0)]">
                ${fmtMoneyDec(totalesCostoFinal)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-1)]">Precio cliente</span>
              <span className="text-sm font-semibold text-teal-500">
                ${fmtMoneyDec(totalesFinal)}
              </span>
            </div>
            <div className="border-t border-teal-400/20 pt-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-1)]">Tu ganancia</span>
                <span className="text-sm font-bold text-amber-500">
                  +${fmtMoneyDec(ganancia)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-1)]">Margen real</span>
                <span className="text-sm font-bold text-[var(--text-0)]">
                  {margenReal.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
