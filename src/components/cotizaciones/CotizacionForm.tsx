"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  Settings,
  TrendingUp,
  Eye,
  CheckCircle,
  AlertCircle,
  Download,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { ItemInput, calcularItem, calcularTotalesDocumento } from "@/lib/calculator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createCustomer, searchCustomers } from "@/app/actions/customers";
import { saveDocument } from "@/app/actions/documents";

const ClientPDFViewer = dynamic(() => import("@/components/pdf/ClientPDFViewer"), {
  ssr: false,
});

const PDFDownloadButton = dynamic(
  () => import("@/components/pdf/ClientPDFViewer").then((m) => ({ default: m.PDFDownloadButton })),
  { ssr: false }
);

export interface DocumentFormProps {
  tipoDocumento?: "COTIZACION" | "FACTURA";
  seller?: import("@/app/actions/seller").SellerData | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtDec = (n: number) =>
  n.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const makeItem = (): ItemInput => ({
  id: crypto.randomUUID(),
  descripcion: "",
  cantidad: 1,
  precioUnitarioBase: 0,
  aplicaTax: false,
  taxUnitario: 0,
  envioUnitario: 0,
  promocionEnvioUnitario: 0,
  importacionUnitario: 0,
  aplicaAmazon: false,
});

// ── Shared input class strings ─────────────────────────────────────────────
const inputBase =
  "w-full bg-[var(--surface-2)] border border-[var(--border-0)] rounded-xl text-sm text-[var(--text-0)] placeholder-[var(--text-2)] focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 outline-none transition-all";

const chargeInput =
  "w-full bg-[var(--surface-1)] border border-[var(--border-0)] rounded-lg py-1.5 pl-5 pr-2 text-xs text-[var(--text-0)] placeholder-[var(--text-2)] focus:border-amber-400/50 outline-none transition-all";

const chargeInputTeal =
  "w-full bg-[var(--teal-surface)] border border-[var(--teal-border)] rounded-lg py-1.5 pl-5 pr-2 text-xs text-[var(--teal-text)] focus:border-amber-400/50 outline-none transition-all";

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  accent = "amber",
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  accent?: "amber" | "teal";
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
          accent === "amber"
            ? "bg-amber-400/10 text-amber-500"
            : "bg-teal-400/10 text-teal-500"
        }`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h3 className="text-[var(--text-0)] font-semibold text-sm">{title}</h3>
        {subtitle && <p className="text-[var(--text-2)] text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function LineItem({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "amber" | "teal" | "danger";
}) {
  const valueClass =
    accent === "amber"
      ? "text-amber-500"
      : accent === "teal"
      ? "text-teal-500"
      : accent === "danger"
      ? "text-red-500"
      : "text-[var(--text-0)]";

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[var(--text-1)]">{label}</span>
      <span className={`text-sm font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function CotizacionForm({
  tipoDocumento = "COTIZACION",
  seller,
}: DocumentFormProps) {
  const [clienteInfo, setClienteInfo] = useState({ nombres: "", email: "", notas: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedDoc, setSavedDoc] = useState<{
    numero: string;
    id: string;
    totalFinal: number;
  } | null>(null);
  const [formatoPDF, setFormatoPDF] = useState<"completo" | "resumido" | "concatenado">("completo");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<ItemInput[]>([{ ...makeItem(), id: "1" }]);
  const [aplica4x1000Global, setAplica4x1000Global] = useState(false);

  // Autocomplete
  const [suggestions, setSuggestions] = useState<{ id: string; nombres: string; email: string | null }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedCustomerId) return;
    const t = setTimeout(async () => {
      if (clienteInfo.nombres.length >= 2) {
        const results = await searchCustomers(clienteInfo.nombres);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [clienteInfo.nombres, selectedCustomerId]);

  const selectSuggestion = (c: { id: string; nombres: string; email: string | null }) => {
    setClienteInfo((prev) => ({ ...prev, nombres: c.nombres, email: c.email ?? "" }));
    setSelectedCustomerId(c.id);
    setShowSuggestions(false);
  };

  const calculatedItems = useMemo(() => items.map(calcularItem), [items]);
  const totales = useMemo(
    () => calcularTotalesDocumento(calculatedItems, aplica4x1000Global),
    [calculatedItems, aplica4x1000Global]
  );

  const isLabel = tipoDocumento === "COTIZACION" ? "Cotización" : "Factura";

  const agregarItem = () => {
    const item = makeItem();
    setItems((prev) => [...prev, item]);
    setExpandedItems((prev) => new Set([...prev, item.id]));
  };

  const eliminarItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setExpandedItems((prev) => {
      const s = new Set(prev);
      s.delete(id);
      return s;
    });
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const updateItem = <K extends keyof ItemInput>(id: string, field: K, value: ItemInput[K]) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = async () => {
    setFormError(null);
    if (!clienteInfo.nombres.trim()) {
      setFormError("El nombre del cliente es obligatorio.");
      return;
    }
    const invalidItems = calculatedItems.filter((i) => !i.descripcion.trim() || i.precioUnitarioBase <= 0);
    if (invalidItems.length > 0) {
      setFormError("Todos los ítems deben tener descripción y precio mayor a $0.");
      return;
    }
    setIsSaving(true);
    try {
      const clienteDb = selectedCustomerId
        ? { id: selectedCustomerId }
        : await createCustomer({
            nombres: clienteInfo.nombres,
            email: clienteInfo.email,
            notas: clienteInfo.notas,
          });
      const doc = await saveDocument({
        tipo: tipoDocumento,
        clienteId: clienteDb.id,
        items: calculatedItems,
        totales,
        observaciones: clienteInfo.notas,
      });
      if (doc.success) {
        setSavedDoc({
          numero: doc.document.numero,
          id: doc.document.id,
          totalFinal: totales.totalFinal,
        });
      }
    } catch {
      setFormError("Ocurrió un error al guardar. Verifica los datos e intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setItems([{ ...makeItem(), id: "1" }]);
    setClienteInfo({ nombres: "", email: "", notas: "" });
    setAplica4x1000Global(false);
    setExpandedItems(new Set());
    setSavedDoc(null);
    setFormError(null);
    setFormatoPDF("completo");
    setSelectedCustomerId(null);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 w-full">

      {/* ── Main forms ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-5">

        {/* Items Section */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-0)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-400/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h3 className="text-[var(--text-0)] font-semibold text-sm">Detalle de Ítems</h3>
                <p className="text-[var(--text-2)] text-xs">
                  {items.length} {items.length === 1 ? "producto" : "productos"}
                </p>
              </div>
            </div>
            <button
              onClick={agregarItem}
              className="flex items-center gap-2 px-3.5 py-2 bg-amber-400/10 hover:bg-amber-400/20 text-amber-500 text-sm font-semibold rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Añadir ítem</span>
            </button>
          </div>

          {/* ── Desktop table (md+) ──────────────────────────────────── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left min-w-[740px]">
              <thead>
                <tr className="border-b border-[var(--border-0)]">
                  {[
                    { label: "Descripción", cls: "w-[32%] px-5" },
                    { label: "Cant.", cls: "w-14 text-center px-3" },
                    { label: "Precio Base", cls: "w-28 px-3" },
                    { label: "Cargos Adic.", cls: "w-36 px-3" },
                    { label: "Amazon", cls: "w-20 text-center px-3" },
                    { label: "Subtotal", cls: "w-28 text-right px-3" },
                  ].map(({ label, cls }) => (
                    <th
                      key={label}
                      className={`py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-2)] ${cls}`}
                    >
                      {label}
                    </th>
                  ))}
                  <th className="px-2 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {calculatedItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="border-b border-[var(--border-0)]/50 last:border-0 hover:bg-[var(--surface-2)]/50 transition-colors group"
                  >
                    {/* Description */}
                    <td className="px-5 py-3.5 align-top">
                      <div className="flex items-start gap-2">
                        <span className="mt-2.5 text-[10px] font-bold text-[var(--text-2)] w-4 shrink-0 select-none">
                          {idx + 1}
                        </span>
                        <textarea
                          className={`${inputBase} py-2.5 px-3 resize-none min-h-[76px]`}
                          placeholder="Nombre del producto o servicio..."
                          value={item.descripcion}
                          onChange={(e) => updateItem(item.id, "descripcion", e.target.value)}
                        />
                      </div>
                    </td>

                    {/* Cantidad */}
                    <td className="px-3 py-3.5 align-top">
                      <input
                        type="number"
                        min="1"
                        className={`${inputBase} py-2.5 px-2 text-center`}
                        value={item.cantidad || ""}
                        onChange={(e) => updateItem(item.id, "cantidad", Number(e.target.value))}
                      />
                    </td>

                    {/* Precio Base */}
                    <td className="px-3 py-3.5 align-top">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-2)] text-xs pointer-events-none">
                          $
                        </span>
                        <input
                          type="number"
                          className={`${inputBase} py-2.5 pl-6 pr-2`}
                          placeholder="0"
                          value={item.precioUnitarioBase || ""}
                          onChange={(e) =>
                            updateItem(item.id, "precioUnitarioBase", Number(e.target.value))
                          }
                        />
                      </div>
                    </td>

                    {/* Cargos adicionales */}
                    <td className="px-3 py-3.5 align-top">
                      <div className="space-y-1.5">

                        {/* Tax */}
                        <div className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            className="w-3.5 h-3.5 rounded accent-amber-500 shrink-0"
                            checked={item.aplicaTax}
                            onChange={(e) => updateItem(item.id, "aplicaTax", e.target.checked)}
                          />
                          <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-1)] w-7 shrink-0">
                            Tax
                          </span>
                          <div className="relative flex-1">
                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[var(--text-2)] text-[10px] pointer-events-none">
                              $
                            </span>
                            <input
                              type="number"
                              className={`${
                                item.aplicaTax
                                  ? "w-full bg-amber-400/5 border border-amber-400/30 rounded-lg py-1.5 pl-5 pr-2 text-xs text-amber-500 focus:border-amber-400/60 outline-none transition-all"
                                  : `${chargeInput} opacity-30 pointer-events-none`
                              }`}
                              placeholder="0"
                              value={item.taxUnitario || ""}
                              onChange={(e) =>
                                updateItem(item.id, "taxUnitario", Number(e.target.value))
                              }
                            />
                          </div>
                        </div>

                        {/* Envío, Promo, Importación */}
                        {(
                          [
                            {
                              label: "Env",
                              key: "envioUnitario" as keyof ItemInput,
                              cls: chargeInput,
                              color: "text-[var(--text-1)]",
                            },
                            {
                              label: "Pro",
                              key: "promocionEnvioUnitario" as keyof ItemInput,
                              cls: chargeInputTeal,
                              color: "text-teal-500",
                            },
                            {
                              label: "Imp",
                              key: "importacionUnitario" as keyof ItemInput,
                              cls: chargeInput,
                              color: "text-[var(--text-1)]",
                            },
                          ] as const
                        ).map(({ label, key, cls, color }) => (
                          <div key={key} className="flex items-center gap-1.5">
                            <div className="w-3.5 h-3.5 shrink-0" />
                            <span className={`text-[10px] font-bold uppercase tracking-wide w-7 shrink-0 ${color}`}>
                              {label}
                            </span>
                            <div className="relative flex-1">
                              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[var(--text-2)] text-[10px] pointer-events-none">
                                $
                              </span>
                              <input
                                type="number"
                                className={cls}
                                placeholder="0"
                                value={(item[key] as number) || ""}
                                onChange={(e) =>
                                  updateItem(
                                    item.id,
                                    key,
                                    Number(e.target.value) as ItemInput[typeof key]
                                  )
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Amazon */}
                    <td className="px-3 py-3.5 align-top text-center">
                      <label className="flex flex-col items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded accent-amber-500"
                          checked={item.aplicaAmazon}
                          onChange={(e) => updateItem(item.id, "aplicaAmazon", e.target.checked)}
                        />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-2)]">
                          Amz
                        </span>
                        {item.aplicaAmazon ? (
                          <span className="text-[10px] font-bold text-amber-500 bg-amber-400/10 px-1.5 py-0.5 rounded-lg">
                            +${fmt(item.amazonUnitarioCalculado)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[var(--border-1)] font-medium">—</span>
                        )}
                      </label>
                    </td>

                    {/* Subtotal */}
                    <td className="px-3 py-3.5 align-top text-right">
                      <div className="pt-1">
                        <div className="text-[var(--text-0)] font-bold text-sm">
                          ${fmtDec(item.subtotalLinea)}
                        </div>
                        <div className="text-[var(--text-2)] text-[10px] mt-1">
                          u: ${fmt(item.costoUnitarioFinal)}
                        </div>
                      </div>
                    </td>

                    {/* Delete */}
                    <td className="px-2 py-3.5 align-top">
                      <button
                        onClick={() => eliminarItem(item.id)}
                        className="mt-1.5 p-1.5 text-[var(--border-1)] hover:text-red-500 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards (< md) ──────────────────────────────────── */}
          <div className="md:hidden divide-y divide-[var(--border-0)]/50">
            {calculatedItems.map((item, idx) => {
              const expanded = expandedItems.has(item.id);
              return (
                <div key={item.id} className="p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-3 text-[10px] font-bold text-[var(--text-2)] w-5 shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1 space-y-3">

                      {/* Description + delete */}
                      <div className="flex gap-2">
                        <textarea
                          className={`flex-1 ${inputBase} py-2.5 px-3 resize-none min-h-[60px]`}
                          placeholder="Nombre del producto..."
                          value={item.descripcion}
                          onChange={(e) => updateItem(item.id, "descripcion", e.target.value)}
                        />
                        <button
                          onClick={() => eliminarItem(item.id)}
                          className="p-2 text-[var(--text-2)] hover:text-red-500 hover:bg-red-400/10 rounded-xl transition-all self-start"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Cantidad + Precio */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)]">
                            Cantidad
                          </label>
                          <input
                            type="number"
                            min="1"
                            className={`${inputBase} py-2.5 px-3 text-center`}
                            value={item.cantidad || ""}
                            onChange={(e) =>
                              updateItem(item.id, "cantidad", Number(e.target.value))
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
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
                              onChange={(e) =>
                                updateItem(item.id, "precioUnitarioBase", Number(e.target.value))
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Toggle cargos */}
                      <button
                        onClick={() => toggleExpanded(item.id)}
                        className="flex items-center gap-1.5 text-xs text-amber-500/70 hover:text-amber-500 font-semibold transition-colors"
                      >
                        {expanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                        {expanded ? "Ocultar" : "Ver"} cargos adicionales
                      </button>

                      {/* Cargos expandidos */}
                      {expanded && (
                        <div className="bg-[var(--surface-2)] border border-[var(--border-0)] rounded-xl p-3 space-y-2.5">

                          {/* Tax */}
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="w-3.5 h-3.5 rounded accent-amber-500 shrink-0"
                              checked={item.aplicaTax}
                              onChange={(e) =>
                                updateItem(item.id, "aplicaTax", e.target.checked)
                              }
                            />
                            <span className="text-xs font-bold text-amber-500/80 w-20 shrink-0">
                              Tax extra
                            </span>
                            <div className="relative flex-1">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-2)] text-[10px] pointer-events-none">
                                $
                              </span>
                              <input
                                type="number"
                                className={`w-full rounded-lg py-1.5 pl-5 pr-2 text-xs outline-none transition-all ${
                                  item.aplicaTax
                                    ? "bg-amber-400/5 border border-amber-400/30 text-amber-500 focus:border-amber-400/60"
                                    : "bg-[var(--surface-1)] border border-[var(--border-0)] text-[var(--text-2)] opacity-40 pointer-events-none"
                                }`}
                                placeholder="0"
                                value={item.taxUnitario || ""}
                                onChange={(e) =>
                                  updateItem(item.id, "taxUnitario", Number(e.target.value))
                                }
                              />
                            </div>
                          </div>

                          {/* Envío, Promo, Importación */}
                          {(
                            [
                              {
                                label: "Envío",
                                key: "envioUnitario" as keyof ItemInput,
                                color: "text-[var(--text-1)]",
                                isTeal: false,
                              },
                              {
                                label: "Promo envío",
                                key: "promocionEnvioUnitario" as keyof ItemInput,
                                color: "text-teal-500",
                                isTeal: true,
                              },
                              {
                                label: "Importación",
                                key: "importacionUnitario" as keyof ItemInput,
                                color: "text-[var(--text-1)]",
                                isTeal: false,
                              },
                            ] as const
                          ).map(({ label, key, color, isTeal }) => (
                            <div key={key} className="flex items-center gap-2">
                              <div className="w-3.5 h-3.5 shrink-0" />
                              <span className={`text-xs font-bold w-20 shrink-0 ${color}`}>
                                {label}
                              </span>
                              <div className="relative flex-1">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-2)] text-[10px] pointer-events-none">
                                  $
                                </span>
                                <input
                                  type="number"
                                  className={`w-full rounded-lg py-1.5 pl-5 pr-2 text-xs outline-none transition-all ${
                                    isTeal
                                      ? "bg-[var(--teal-surface)] border border-[var(--teal-border)] text-[var(--teal-text)] focus:border-amber-400/50"
                                      : "bg-[var(--surface-1)] border border-[var(--border-0)] text-[var(--text-0)] focus:border-amber-400/50"
                                  }`}
                                  placeholder="0"
                                  value={(item[key] as number) || ""}
                                  onChange={(e) =>
                                    updateItem(
                                      item.id,
                                      key,
                                      Number(e.target.value) as ItemInput[typeof key]
                                    )
                                  }
                                />
                              </div>
                            </div>
                          ))}

                          {/* Amazon */}
                          <div className="flex items-center gap-2 pt-0.5 border-t border-[var(--border-0)]">
                            <input
                              type="checkbox"
                              className="w-3.5 h-3.5 rounded accent-amber-500 shrink-0"
                              checked={item.aplicaAmazon}
                              onChange={(e) =>
                                updateItem(item.id, "aplicaAmazon", e.target.checked)
                              }
                            />
                            <span className="text-xs font-bold text-[var(--text-1)] flex-1">
                              Garantía Amazon (2.25%)
                            </span>
                            {item.aplicaAmazon && (
                              <span className="text-xs font-bold text-amber-500">
                                +${fmt(item.amazonUnitarioCalculado)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Subtotal row */}
                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-[10px] text-[var(--text-2)]">
                          Precio unit: ${fmt(item.costoUnitarioFinal)}
                        </span>
                        <span className="text-sm font-bold text-[var(--text-0)]">
                          ${fmtDec(item.subtotalLinea)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer add row */}
          <div className="px-5 py-3 border-t border-[var(--border-0)] flex items-center justify-between">
            <button
              onClick={agregarItem}
              className="flex items-center gap-2 text-sm text-[var(--text-1)] hover:text-amber-500 font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar otro ítem
            </button>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)]">
              {items.length} {items.length === 1 ? "producto" : "productos"}
            </span>
          </div>
        </div>

        {/* Customer Section */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl p-5">
          <SectionHeader
            icon={User}
            title="Información del Cliente"
            subtitle="Datos de contacto del destinatario del documento"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 relative" ref={autocompleteRef}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)]">
                Nombre completo <span className="text-amber-500">*</span>
              </label>
              <input
                className={`${inputBase} py-3 px-4`}
                placeholder="Ej: Juan Pérez"
                type="text"
                autoComplete="off"
                value={clienteInfo.nombres}
                onChange={(e) => {
                  setClienteInfo({ ...clienteInfo, nombres: e.target.value });
                  setSelectedCustomerId(null);
                }}
              />
              {showSuggestions && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-[var(--surface-1)] border border-[var(--border-0)] rounded-xl shadow-xl overflow-hidden">
                  <p className="px-3 pt-2.5 pb-1 text-[9px] font-bold uppercase tracking-widest text-[var(--text-2)]">
                    Clientes existentes
                  </p>
                  {suggestions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={() => selectSuggestion(c)}
                      className="w-full flex flex-col items-start px-3 py-2.5 hover:bg-amber-400/8 transition-colors text-left"
                    >
                      <span className="text-sm font-semibold text-[var(--text-0)]">{c.nombres}</span>
                      {c.email && <span className="text-xs text-[var(--text-2)]">{c.email}</span>}
                    </button>
                  ))}
                </div>
              )}
              {selectedCustomerId && (
                <p className="text-[10px] text-amber-500 font-semibold">
                  ✓ Cliente existente seleccionado
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)]">
                Email de contacto
              </label>
              <input
                className={`${inputBase} py-3 px-4`}
                placeholder="cliente@empresa.com"
                type="email"
                value={clienteInfo.email}
                onChange={(e) => setClienteInfo({ ...clienteInfo, email: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)]">
                Notas y observaciones
              </label>
              <textarea
                className={`${inputBase} py-3 px-4 resize-none`}
                placeholder="Condiciones especiales, términos de pago, observaciones..."
                rows={3}
                value={clienteInfo.notas}
                onChange={(e) => setClienteInfo({ ...clienteInfo, notas: e.target.value })}
              />
            </div>

            {formError && (
              <div className="sm:col-span-2 flex items-center gap-2.5 p-3 bg-red-500/8 border border-red-500/20 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-xs text-red-500 font-medium">{formError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Global Settings */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl p-5">
          <SectionHeader
            icon={Settings}
            title="Configuración Global"
            subtitle="Ajustes impositivos y financieros para el documento completo"
          />
          <div className="flex items-center justify-between p-4 bg-[var(--surface-2)] border border-[var(--border-0)] rounded-xl">
            <div>
              <div className="text-sm font-semibold text-[var(--text-0)]">Retención 4×1000</div>
              <div className="text-xs text-[var(--text-2)] mt-0.5">
                Aplica 0.4% sobre el subtotal total del documento
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={aplica4x1000Global}
                onChange={(e) => setAplica4x1000Global(e.target.checked)}
              />
              <div className="w-11 h-6 bg-[var(--border-0)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400" />
              <span className="ml-3 text-sm font-medium text-[var(--text-1)]">
                {aplica4x1000Global ? "Activo" : "Inactivo"}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* ── Summary Panel ──────────────────────────────────────────────── */}
      <div className="xl:w-80 shrink-0">
        <div className="xl:sticky xl:top-24 space-y-4">

          <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl overflow-hidden">

            {/* Header */}
            <div className="px-5 py-4 border-b border-[var(--border-0)] flex items-center gap-2.5">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <h3 className="text-[var(--text-0)] font-semibold text-sm">Resumen de {isLabel}</h3>
            </div>

            {/* Lines */}
            <div className="p-5 space-y-2.5">
              <LineItem label="Subtotal ítems" value={`$${fmtDec(totales.subtotal)}`} />
              {totales.totalTax > 0 && (
                <LineItem label="Tax (extras)" value={`+$${fmtDec(totales.totalTax)}`} accent="amber" />
              )}
              {totales.totalEnvio - totales.totalPromocionEnvio > 0 && (
                <LineItem
                  label="Envío neto"
                  value={`+$${fmtDec(totales.totalEnvio - totales.totalPromocionEnvio)}`}
                />
              )}
              {totales.totalPromocionEnvio > 0 && (
                <LineItem
                  label="Descuento envío"
                  value={`−$${fmtDec(totales.totalPromocionEnvio)}`}
                  accent="teal"
                />
              )}
              {totales.totalImportacion > 0 && (
                <LineItem label="Importación" value={`+$${fmtDec(totales.totalImportacion)}`} />
              )}
              {totales.totalAmazon > 0 && (
                <LineItem
                  label="Garantía Amazon"
                  value={`+$${fmtDec(totales.totalAmazon)}`}
                  accent="amber"
                />
              )}
              {aplica4x1000Global && (
                <LineItem
                  label="Retención 4×1000"
                  value={`+$${fmtDec(totales.total4x1000)}`}
                  accent="danger"
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
                      ${fmtDec(totales.totalFinal)}
                    </div>
                    <div className="text-[10px] text-[var(--text-2)] mt-1 font-medium">
                      COP — Pesos Colombianos
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons / Success state */}
            <div className="px-5 pb-5">
              {savedDoc ? (
                /* ── Success state ─────────────────────────────────── */
                <div className="space-y-3 fade-up">
                  {/* Checkmark + doc info */}
                  <div className="flex flex-col items-center text-center py-5 px-3 bg-green-500/5 border border-green-500/15 rounded-2xl">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                      <CheckCircle className="w-6 h-6 text-green-500" strokeWidth={2} />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-400 mb-1.5">
                      {isLabel} guardada
                    </div>
                    <div className="text-2xl font-black text-[var(--text-0)] tracking-tight mb-0.5">
                      {savedDoc.numero}
                    </div>
                    <div className="text-sm text-[var(--text-2)]">
                      Total:{" "}
                      <span className="font-bold text-[var(--text-0)]">
                        ${fmtDec(savedDoc.totalFinal)}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-2)] mt-1">
                      {clienteInfo.nombres}
                    </div>
                  </div>

                  {/* Direct download */}
                  <PDFDownloadButton
                    formato={formatoPDF}
                    cliente={clienteInfo}
                    items={calculatedItems}
                    totales={totales}
                    aplica4x1000Global={aplica4x1000Global}
                    tipoDocumento={tipoDocumento}
                    seller={seller}
                    fileName={`${savedDoc.numero}.pdf`}
                    label="Descargar PDF"
                    className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-[oklch(0.090_0.025_255)] font-bold py-3 rounded-xl transition-all text-sm shadow-md shadow-amber-400/20"
                  />

                  {/* PDF Preview Dialog */}
                  <Dialog>
                    <DialogTrigger className="w-full flex items-center justify-center gap-2 bg-[var(--surface-2)] hover:bg-[var(--border-0)] border border-[var(--border-0)] text-[var(--text-1)] hover:text-[var(--text-0)] font-semibold py-3 rounded-xl transition-all text-sm">
                      <Eye className="w-4 h-4" />
                      Vista previa PDF
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[var(--surface-1)] border-[var(--border-0)]">
                      <DialogHeader>
                        <DialogTitle className="text-[var(--text-0)] text-base font-bold">
                          {savedDoc.numero} — Vista Previa
                        </DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col gap-4 pt-2">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-[var(--surface-2)] p-3 rounded-xl">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)] shrink-0">
                            Plantilla:
                          </span>
                          <select
                            className="flex-1 w-full bg-[var(--surface-1)] border border-[var(--border-0)] text-[var(--text-0)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400/50"
                            value={formatoPDF}
                            onChange={(e) =>
                              setFormatoPDF(e.target.value as "completo" | "resumido" | "concatenado")
                            }
                          >
                            <option value="completo">Completo — Con desglose de cargos</option>
                            <option value="resumido">Resumido — Modelo simplificado</option>
                            <option value="concatenado">Concatenado — Solo texto formal</option>
                          </select>
                        </div>
                        <div className="rounded-xl overflow-hidden shadow-2xl bg-gray-100 border border-[var(--border-0)]">
                          <ClientPDFViewer
                            formato={formatoPDF}
                            cliente={clienteInfo}
                            items={calculatedItems}
                            totales={totales}
                            aplica4x1000Global={aplica4x1000Global}
                            tipoDocumento={tipoDocumento}
                            seller={seller}
                          />
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Nueva Cotización */}
                  <button
                    onClick={handleReset}
                    className="w-full flex items-center justify-center gap-2 bg-[var(--surface-2)] hover:bg-[var(--border-0)] border border-[var(--border-0)] text-[var(--text-1)] hover:text-[var(--text-0)] font-semibold py-3 rounded-xl transition-all text-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {tipoDocumento === "COTIZACION" ? "Nueva Cotización" : "Nueva Factura"}
                  </button>

                  {/* Ir al inicio */}
                  <Link
                    href="/"
                    className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-2)] hover:text-[var(--text-1)] font-medium py-1.5 transition-colors"
                  >
                    ← Volver al inicio
                  </Link>
                </div>
              ) : (
                /* ── Default actions ───────────────────────────────── */
                <div className="space-y-2.5">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 disabled:cursor-not-allowed text-[oklch(0.090_0.025_255)] font-bold py-3.5 rounded-xl transition-all text-sm shadow-md shadow-amber-400/20"
                  >
                    {isSaving ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Guardar {isLabel}
                      </>
                    )}
                  </button>

                  <Dialog>
                    <DialogTrigger className="w-full flex items-center justify-center gap-2 bg-[var(--surface-2)] hover:bg-[var(--border-0)] border border-[var(--border-0)] text-[var(--text-1)] hover:text-[var(--text-0)] font-semibold py-3.5 rounded-xl transition-all text-sm">
                      <Eye className="w-4 h-4" />
                      Vista Previa PDF
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[var(--surface-1)] border-[var(--border-0)]">
                      <DialogHeader>
                        <DialogTitle className="text-[var(--text-0)] text-base font-bold">
                          Vista Previa — {tipoDocumento}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col gap-4 pt-2">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-[var(--surface-2)] p-3 rounded-xl">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)] shrink-0">
                            Plantilla:
                          </span>
                          <select
                            className="flex-1 w-full bg-[var(--surface-1)] border border-[var(--border-0)] text-[var(--text-0)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400/50"
                            value={formatoPDF}
                            onChange={(e) =>
                              setFormatoPDF(e.target.value as "completo" | "resumido" | "concatenado")
                            }
                          >
                            <option value="completo">Completo — Con desglose de todos los cargos</option>
                            <option value="resumido">Resumido — Modelo simplificado integrado</option>
                            <option value="concatenado">Concatenado — Solo texto formal</option>
                          </select>
                        </div>
                        <div className="rounded-xl overflow-hidden shadow-2xl bg-gray-100 border border-[var(--border-0)]">
                          <ClientPDFViewer
                            formato={formatoPDF}
                            cliente={clienteInfo}
                            items={calculatedItems}
                            totales={totales}
                            aplica4x1000Global={aplica4x1000Global}
                            tipoDocumento={tipoDocumento}
                            seller={seller}
                          />
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>

            {/* Info note */}
            <div className="mx-5 mb-5 flex items-start gap-2.5 bg-amber-400/5 border border-amber-400/10 rounded-xl p-3">
              <svg
                className="w-3.5 h-3.5 text-amber-500/60 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-xs text-[var(--text-2)] leading-relaxed">
                Válida por{" "}
                <span className="text-amber-500/80 font-semibold">15 días</span> calendario
                desde su generación según políticas comerciales.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
