"use client";

import { useMemo } from "react";
import { Trash2, ChevronDown, ChevronUp, Package, Wrench, Globe, Truck, ShieldCheck, Plane, Sparkles } from "lucide-react";
import { calcularItem } from "@/lib/calculator";
import { fmtMoney, fmtMoneyDec } from "@/lib/format";
import type { ItemForm, TipoItem, FuenteCompra } from "./types";
import { getItemDefaults, TAX_RATE_US, toItemInput } from "./types";

// ── Input class strings ──────────────────────────────────────────────────────
const inputBase =
  "w-full bg-[var(--surface-2)] border border-[var(--border-0)] rounded-xl text-sm text-[var(--text-0)] placeholder-[var(--text-2)] focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 outline-none transition-all";

const miniInput = (color: string) =>
  `w-full ${color} rounded-lg py-1.5 pl-5 pr-2 text-xs outline-none transition-all focus:border-amber-400/50`;

// ── Props ─────────────────────────────────────────────────────────────────────
interface ItemRowProps {
  item: ItemForm;
  idx: number;
  expanded: boolean;
  onUpdate: <K extends keyof ItemForm>(id: string, field: K, value: ItemForm[K]) => void;
  onRemove: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onTipoChange: (id: string, tipoItem: TipoItem, fuenteCompra?: FuenteCompra) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ItemRow({
  item,
  idx,
  expanded,
  onUpdate,
  onRemove,
  onToggleExpand,
  onTipoChange,
}: ItemRowProps) {
  // Calcula en tiempo real
  const calculated = useMemo(() => calcularItem(toItemInput(item)), [item]);

  const isServicio = item.tipoItem === "SERVICIO";
  const isAmazon = item.fuenteCompra === "AMAZON";
  const isExteriorOtro = item.fuenteCompra === "EXTERIOR_OTRO";
  const showTax = !isServicio && (isAmazon || isExteriorOtro);
  const showEnvio = !isServicio;
  const showPromoEnvio = !isServicio && isAmazon;
  const showImportacion = !isServicio && (isAmazon || isExteriorOtro);
  const showAmazon = !isServicio && isAmazon;

  // Auto-calcular tax cuando aplicaTax=true y precio cambia
  const handlePrecioChange = (value: number) => {
    onUpdate(item.id, "precioUnitarioBase", value);
    if (item.aplicaTax) {
      onUpdate(item.id, "taxUnitario", Math.round(value * TAX_RATE_US));
    }
  };

  // ── Tipo/Fuente selectors ───────────────────────────────────
  const tipoOptions: { value: TipoItem; label: string; icon: React.ReactNode }[] = [
    { value: "PRODUCTO", label: "Producto", icon: <Package className="w-3 h-3" /> },
    { value: "SERVICIO", label: "Servicio", icon: <Wrench className="w-3 h-3" /> },
  ];

  const fuenteOptions: { value: FuenteCompra; label: string; icon: React.ReactNode }[] = [
    { value: "LOCAL", label: "Colombia", icon: <Truck className="w-3 h-3" /> },
    { value: "AMAZON", label: "Amazon", icon: <Globe className="w-3 h-3" /> },
    { value: "EXTERIOR_OTRO", label: "Ext. otro", icon: <Plane className="w-3 h-3" /> },
  ];

  return (
    <>
      {/* ═══ DESKTOP (md+) ════════════════════════════════════════════════ */}
      <div className="hidden md:block border-b border-[var(--border-0)]/50 last:border-0 hover:bg-[var(--surface-2)]/30 transition-colors group">
        <div className="px-5 py-3.5">
          {/* Row 1: Selectors + delete */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[var(--text-2)] w-4 shrink-0 select-none">
                {idx + 1}
              </span>

              {/* Tipo selector */}
              <div className="flex items-center gap-1 bg-[var(--surface-2)] rounded-lg p-0.5 border border-[var(--border-0)]">
                {tipoOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onTipoChange(item.id, opt.value)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      item.tipoItem === opt.value
                        ? "bg-amber-400/15 text-amber-600 dark:text-amber-400 shadow-sm"
                        : "text-[var(--text-2)] hover:text-[var(--text-1)]"
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Fuente selector (solo productos) */}
              {!isServicio && (
                <div className="flex items-center gap-1 bg-[var(--surface-2)] rounded-lg p-0.5 border border-[var(--border-0)]">
                  {fuenteOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => onTipoChange(item.id, "PRODUCTO", opt.value)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        item.fuenteCompra === opt.value
                          ? opt.value === "AMAZON"
                            ? "bg-purple-400/15 text-purple-600 dark:text-purple-400 shadow-sm"
                            : opt.value === "EXTERIOR_OTRO"
                            ? "bg-red-400/15 text-red-600 dark:text-red-400 shadow-sm"
                            : "bg-blue-400/15 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-[var(--text-2)] hover:text-[var(--text-1)]"
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => onRemove(item.id)}
              className="p-1.5 text-[var(--border-1)] hover:text-red-500 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              title="Eliminar ítem"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Row 2: Descripción */}
          <div className="mb-3">
            <textarea
              className={`${inputBase} py-2 px-3 resize-none min-h-[42px]`}
              placeholder={
                isServicio
                  ? "Descripción del servicio..."
                  : "Nombre del producto o componente..."
              }
              rows={1}
              value={item.descripcion}
              onChange={(e) => onUpdate(item.id, "descripcion", e.target.value)}
            />
          </div>

          {/* Row 3: Campos numéricos inline */}
          <div className="flex items-end gap-2 flex-wrap">
            {/* Cantidad */}
            <div className="w-20">
              <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-2)] block mb-1">
                Cantidad
              </label>
              <input
                type="number"
                min="1"
                className={`${inputBase} py-1.5 px-2 text-center text-xs`}
                value={item.cantidad || ""}
                onChange={(e) => onUpdate(item.id, "cantidad", Number(e.target.value))}
              />
            </div>

            {/* Precio Base */}
            <div className="w-36">
              <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-2)] block mb-1">
                Precio Base (COP)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-2)] text-xs pointer-events-none">
                  $
                </span>
                <input
                  type="number"
                  className={`${inputBase} py-1.5 pl-6 pr-2 text-xs`}
                  placeholder="0"
                  value={item.precioUnitarioBase || ""}
                  onChange={(e) => handlePrecioChange(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Tax (solo si aplica) */}
            {showTax && (
              <div className="w-32">
                <label className="text-[9px] font-bold uppercase tracking-wider text-blue-500 block mb-1">
                  <span className="inline-flex items-center gap-0.5">
                    Tax US {item.aplicaTax && <span className="text-[8px] bg-blue-400/10 px-1 rounded">auto</span>}
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-400/60 text-[10px] pointer-events-none">
                    $
                  </span>
                  <input
                    type="number"
                    className={miniInput("bg-blue-400/5 border border-blue-400/25 text-blue-600 dark:text-blue-400")}
                    placeholder="0"
                    value={item.taxUnitario || ""}
                    onChange={(e) => onUpdate(item.id, "taxUnitario", Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            {/* Envío */}
            {showEnvio && (
              <div className="w-32">
                <label className="text-[9px] font-bold uppercase tracking-wider text-orange-500 block mb-1">
                  Envío
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-orange-400/60 text-[10px] pointer-events-none">
                    $
                  </span>
                  <input
                    type="number"
                    className={miniInput("bg-orange-400/5 border border-orange-400/25 text-orange-600 dark:text-orange-400")}
                    placeholder="0"
                    value={item.envioUnitario || ""}
                    onChange={(e) => onUpdate(item.id, "envioUnitario", Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            {/* Promo Envío (solo Amazon) */}
            {showPromoEnvio && (
              <div className="w-32">
                <label className="text-[9px] font-bold uppercase tracking-wider text-teal-500 block mb-1">
                  Promo Envío
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-teal-400/60 text-[10px] pointer-events-none">
                    $
                  </span>
                  <input
                    type="number"
                    className={miniInput("bg-[var(--teal-surface)] border border-[var(--teal-border)] text-[var(--teal-text)]")}
                    placeholder="0"
                    value={item.promocionEnvioUnitario || ""}
                    onChange={(e) => onUpdate(item.id, "promocionEnvioUnitario", Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            {/* Importación */}
            {showImportacion && (
              <div className="w-32">
                <label className="text-[9px] font-bold uppercase tracking-wider text-red-500 block mb-1">
                  Importación
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-red-400/60 text-[10px] pointer-events-none">
                    $
                  </span>
                  <input
                    type="number"
                    className={miniInput("bg-red-400/5 border border-red-400/25 text-red-600 dark:text-red-400")}
                    placeholder="0"
                    value={item.importacionUnitario || ""}
                    onChange={(e) => onUpdate(item.id, "importacionUnitario", Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            {/* Amazon fee (solo visual, auto-calculado) */}
            {showAmazon && (
              <div className="w-36">
                <label className="text-[9px] font-bold uppercase tracking-wider text-purple-500 block mb-1">
                  <span className="inline-flex items-center gap-0.5">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    Garantía Amz
                    <span className="text-[8px] bg-purple-400/10 px-1 rounded">auto</span>
                  </span>
                </label>
                <div className={`py-1.5 px-2 text-xs font-bold rounded-lg bg-purple-400/8 border border-purple-400/20 text-purple-600 dark:text-purple-400`}>
                  +2.25% = ${fmtMoney(calculated.amazonUnitarioCalculado)}
                </div>
              </div>
            )}
          </div>

          {/* Row 4: Costo unitario + Subtotal */}
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[var(--border-0)]/40">
            <span className="text-[11px] text-[var(--text-2)] flex items-center gap-1">
              💰 Costo unitario: <span className="font-semibold text-[var(--text-0)]">${fmtMoney(calculated.costoUnitarioFinal)}</span>
            </span>
            <span className="text-sm font-bold text-[var(--text-0)]">
              Subtotal: ${fmtMoneyDec(calculated.subtotalLinea)}
            </span>
          </div>
        </div>
      </div>

      {/* ═══ MOBILE (< md) ═════════════════════════════════════════════════ */}
      <div className="md:hidden border-b border-[var(--border-0)]/50 last:border-0">
        <div className="p-4 space-y-3">
          {/* Selectors + delete */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[var(--text-2)] w-5 shrink-0">
                {idx + 1}
              </span>
              {/* Tipo selector */}
              <div className="flex items-center gap-0.5 bg-[var(--surface-2)] rounded-lg p-0.5 border border-[var(--border-0)]">
                {tipoOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onTipoChange(item.id, opt.value)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      item.tipoItem === opt.value
                        ? "bg-amber-400/15 text-amber-600 dark:text-amber-400"
                        : "text-[var(--text-2)]"
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => onRemove(item.id)}
              className="p-2 text-[var(--text-2)] hover:text-red-500 hover:bg-red-400/10 rounded-xl transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Fuente selector (solo productos) */}
          {!isServicio && (
            <div className="flex items-center gap-1 bg-[var(--surface-2)] rounded-lg p-0.5 border border-[var(--border-0)] w-fit">
              {fuenteOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onTipoChange(item.id, "PRODUCTO", opt.value)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    item.fuenteCompra === opt.value
                      ? opt.value === "AMAZON"
                        ? "bg-purple-400/15 text-purple-600 dark:text-purple-400"
                        : opt.value === "EXTERIOR_OTRO"
                        ? "bg-red-400/15 text-red-600 dark:text-red-400"
                        : "bg-blue-400/15 text-blue-600 dark:text-blue-400"
                      : "text-[var(--text-2)]"
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Descripción */}
          <textarea
            className={`${inputBase} py-2.5 px-3 resize-none min-h-[60px]`}
            placeholder={isServicio ? "Descripción del servicio..." : "Nombre del producto..."}
            value={item.descripcion}
            onChange={(e) => onUpdate(item.id, "descripcion", e.target.value)}
          />

          {/* Cantidad + Precio */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)]">
                Cantidad
              </label>
              <input
                type="number"
                min="1"
                className={`${inputBase} py-2.5 px-3 text-center`}
                value={item.cantidad || ""}
                onChange={(e) => onUpdate(item.id, "cantidad", Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)]">
                Precio Base
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-2)] text-xs pointer-events-none">
                  $
                </span>
                <input
                  type="number"
                  className={`${inputBase} py-2.5 pl-6 pr-3`}
                  placeholder="0"
                  value={item.precioUnitarioBase || ""}
                  onChange={(e) => handlePrecioChange(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Toggle cargos (solo si hay campos adicionales que mostrar) */}
          {(showTax || showEnvio || showPromoEnvio || showImportacion || showAmazon) && (
            <>
              <button
                onClick={() => onToggleExpand(item.id)}
                className="flex items-center gap-1.5 text-xs text-amber-500/70 hover:text-amber-500 font-semibold transition-colors"
              >
                {expanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                {expanded ? "Ocultar" : "Ver"} cargos adicionales
              </button>

              {expanded && (
                <div className="bg-[var(--surface-2)] border border-[var(--border-0)] rounded-xl p-3 space-y-2.5">
                  {/* Tax */}
                  {showTax && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-500 w-20 shrink-0">Tax US</span>
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-2)] text-[10px] pointer-events-none">
                          $
                        </span>
                        <input
                          type="number"
                          className={`w-full rounded-lg py-1.5 pl-5 pr-2 text-xs outline-none transition-all bg-blue-400/5 border border-blue-400/25 text-blue-600 dark:text-blue-400 focus:border-amber-400/50`}
                          placeholder="0"
                          value={item.taxUnitario || ""}
                          onChange={(e) => onUpdate(item.id, "taxUnitario", Number(e.target.value))}
                        />
                      </div>
                      <span className="text-[9px] bg-blue-400/10 text-blue-500 px-1.5 py-0.5 rounded font-bold">
                        auto
                      </span>
                    </div>
                  )}

                  {/* Envío */}
                  {showEnvio && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-orange-500 w-20 shrink-0">Envío</span>
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-2)] text-[10px] pointer-events-none">
                          $
                        </span>
                        <input
                          type="number"
                          className={`w-full rounded-lg py-1.5 pl-5 pr-2 text-xs outline-none transition-all bg-orange-400/5 border border-orange-400/25 text-orange-600 dark:text-orange-400 focus:border-amber-400/50`}
                          placeholder="0"
                          value={item.envioUnitario || ""}
                          onChange={(e) => onUpdate(item.id, "envioUnitario", Number(e.target.value))}
                        />
                      </div>
                    </div>
                  )}

                  {/* Promo Envío */}
                  {showPromoEnvio && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-teal-500 w-20 shrink-0">Promo envío</span>
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-2)] text-[10px] pointer-events-none">
                          $
                        </span>
                        <input
                          type="number"
                          className={`w-full rounded-lg py-1.5 pl-5 pr-2 text-xs outline-none transition-all bg-[var(--teal-surface)] border border-[var(--teal-border)] text-[var(--teal-text)] focus:border-amber-400/50`}
                          placeholder="0"
                          value={item.promocionEnvioUnitario || ""}
                          onChange={(e) => onUpdate(item.id, "promocionEnvioUnitario", Number(e.target.value))}
                        />
                      </div>
                    </div>
                  )}

                  {/* Importación */}
                  {showImportacion && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-red-500 w-20 shrink-0">Importación</span>
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-2)] text-[10px] pointer-events-none">
                          $
                        </span>
                        <input
                          type="number"
                          className={`w-full rounded-lg py-1.5 pl-5 pr-2 text-xs outline-none transition-all bg-red-400/5 border border-red-400/25 text-red-600 dark:text-red-400 focus:border-amber-400/50`}
                          placeholder="0"
                          value={item.importacionUnitario || ""}
                          onChange={(e) => onUpdate(item.id, "importacionUnitario", Number(e.target.value))}
                        />
                      </div>
                    </div>
                  )}

                  {/* Amazon fee (solo visual) */}
                  {showAmazon && (
                    <div className="flex items-center justify-between pt-1 border-t border-[var(--border-0)]">
                      <span className="text-xs font-bold text-purple-500 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Garantía Amazon (2.25%)
                        <span className="text-[9px] bg-purple-400/10 px-1.5 py-0.5 rounded font-bold">
                          auto
                        </span>
                      </span>
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                        +${fmtMoney(calculated.amazonUnitarioCalculado)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Subtotal row */}
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[11px] text-[var(--text-2)] flex items-center gap-1">
              💰 u: ${fmtMoney(calculated.costoUnitarioFinal)}
            </span>
            <span className="text-sm font-bold text-[var(--text-0)]">
              ${fmtMoneyDec(calculated.subtotalLinea)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
