"use client";

import { useState, useEffect, useRef } from "react";
import { User, AlertCircle } from "lucide-react";
import { searchCustomers } from "@/app/actions/customers";
import type { ClienteForm } from "./types";

// ── Input class string ──────────────────────────────────────────────────────
const inputBase =
  "w-full bg-[var(--surface-2)] border border-[var(--border-0)] rounded-xl text-sm text-[var(--text-0)] placeholder-[var(--text-2)] focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 outline-none transition-all";

// ── Section Header (inline) ──────────────────────────────────────────────────
function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-400/10 text-amber-500">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h3 className="text-[var(--text-0)] font-semibold text-sm">{title}</h3>
        {subtitle && <p className="text-[var(--text-2)] text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────
interface CustomerSelectorProps {
  clienteInfo: ClienteForm;
  selectedCustomerId: string | null;
  formError: string | null;
  onClienteChange: (info: ClienteForm) => void;
  onCustomerIdChange: (id: string | null) => void;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function CustomerSelector({
  clienteInfo,
  selectedCustomerId,
  formError,
  onClienteChange,
  onCustomerIdChange,
}: CustomerSelectorProps) {
  const [suggestions, setSuggestions] = useState<
    { id: string; nombres: string; email: string | null }[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
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
    onClienteChange({ ...clienteInfo, nombres: c.nombres, email: c.email ?? "" });
    onCustomerIdChange(c.id);
    setShowSuggestions(false);
  };

  return (
    <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl p-5">
      <SectionHeader
        icon={User}
        title="Información del Cliente"
        subtitle="Datos de contacto del destinatario del documento"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nombre */}
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
              onClienteChange({ ...clienteInfo, nombres: e.target.value });
              onCustomerIdChange(null);
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

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)]">
            Email de contacto
          </label>
          <input
            className={`${inputBase} py-3 px-4`}
            placeholder="cliente@empresa.com"
            type="email"
            value={clienteInfo.email}
            onChange={(e) => onClienteChange({ ...clienteInfo, email: e.target.value })}
          />
        </div>

        {/* Notas */}
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)]">
            Notas y observaciones
          </label>
          <textarea
            className={`${inputBase} py-3 px-4 resize-none`}
            placeholder="Condiciones especiales, términos de pago, observaciones..."
            rows={3}
            value={clienteInfo.notas}
            onChange={(e) => onClienteChange({ ...clienteInfo, notas: e.target.value })}
          />
        </div>

        {/* Error */}
        {formError && (
          <div className="sm:col-span-2 flex items-center gap-2.5 p-3 bg-red-500/8 border border-red-500/20 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-xs text-red-500 font-medium">{formError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
