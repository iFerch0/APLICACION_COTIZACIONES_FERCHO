"use client";

import { useState } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Hash,
  FileText,
  Save,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { createCustomer, updateCustomer, type CustomerRow } from "@/app/actions/customers";

// ── Styles ────────────────────────────────────────────────────────────────────

const inputBase =
  "w-full bg-[var(--surface-2)] border border-[var(--border-0)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-0)] placeholder-[var(--text-2)] focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 outline-none transition-all";

// ── Field Component ────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  icon: Icon,
  required,
  children,
}: {
  label: string;
  hint?: string;
  icon: React.ElementType;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)]">
        <Icon className="w-3 h-3" />
        {label}
        {required && <span className="text-amber-500">*</span>}
      </label>
      {children}
      {hint && (
        <p className="text-[10px] text-[var(--text-2)] leading-relaxed">{hint}</p>
      )}
    </div>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface CustomerFormProps {
  customer?: CustomerRow | null;
  onClose: () => void;
  onSaved: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function CustomerForm({ customer, onClose, onSaved }: CustomerFormProps) {
  const isEditing = !!customer;

  const [form, setForm] = useState({
    nombres: customer?.nombres ?? "",
    apellidos: customer?.apellidos ?? "",
    direccion: customer?.direccion ?? "",
    celular: customer?.celular ?? "",
    email: customer?.email ?? "",
    identificacion: customer?.identificacion ?? "",
    notas: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      // Clear validation error on change
      if (validationErrors[key]) {
        setValidationErrors((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.nombres.trim()) {
      errors.nombres = "Los nombres son obligatorios.";
    }

    if (form.email && form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Email inválido.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    setStatus("idle");
    setErrorMsg("");

    try {
      const data = {
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim() || undefined,
        direccion: form.direccion.trim() || undefined,
        celular: form.celular.trim() || undefined,
        email: form.email.trim() || undefined,
        identificacion: form.identificacion.trim() || undefined,
        notas: form.notas.trim() || undefined,
      };

      if (isEditing && customer) {
        const result = await updateCustomer(customer.id, data);
        if (result.success) {
          setStatus("success");
          setTimeout(() => onSaved(), 600);
        } else {
          setStatus("error");
          setErrorMsg(result.error ?? "Error al actualizar.");
        }
      } else {
        await createCustomer(data);
        setStatus("success");
        setTimeout(() => onSaved(), 600);
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Error inesperado al guardar."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Form fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Field label="Nombres" icon={User} required>
            <input
              className={`${inputBase} ${validationErrors.nombres ? "border-red-400 dark:border-red-500 focus:border-red-400 focus:ring-red-400/20" : ""}`}
              placeholder="Ej: Carlos Andrés"
              value={form.nombres}
              onChange={set("nombres")}
            />
            {validationErrors.nombres && (
              <p className="text-[10px] text-red-500 mt-1">{validationErrors.nombres}</p>
            )}
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field label="Apellidos" icon={User} hint="Opcional pero recomendado.">
            <input
              className={inputBase}
              placeholder="Ej: Rodríguez Martínez"
              value={form.apellidos}
              onChange={set("apellidos")}
            />
          </Field>
        </div>

        <Field label="NIT / Cédula" icon={Hash} hint="Identificación fiscal o personal.">
          <input
            className={inputBase}
            placeholder="Ej: 123456789-1"
            value={form.identificacion}
            onChange={set("identificacion")}
          />
        </Field>

        <Field label="Celular / Teléfono" icon={Phone}>
          <input
            className={inputBase}
            placeholder="Ej: +57 300 123 4567"
            value={form.celular}
            onChange={set("celular")}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Correo electrónico" icon={Mail}>
            <input
              className={`${inputBase} ${validationErrors.email ? "border-red-400 dark:border-red-500 focus:border-red-400 focus:ring-red-400/20" : ""}`}
              type="email"
              placeholder="cliente@correo.com"
              value={form.email}
              onChange={set("email")}
            />
            {validationErrors.email && (
              <p className="text-[10px] text-red-500 mt-1">{validationErrors.email}</p>
            )}
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field label="Dirección" icon={MapPin}>
            <input
              className={inputBase}
              placeholder="Ej: Carrera 10 # 20-30, Barranquilla"
              value={form.direccion}
              onChange={set("direccion")}
            />
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field label="Notas" icon={FileText} hint="Notas internas sobre el cliente.">
            <textarea
              className={inputBase + " min-h-[80px] resize-y"}
              placeholder="Observaciones adicionales..."
              value={form.notas}
              onChange={set("notas")}
            />
          </Field>
        </div>
      </div>

      {/* Feedback */}
      {status === "success" && (
        <div className="flex items-center gap-2.5 p-3.5 bg-green-500/8 border border-green-500/20 rounded-xl">
          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
            {isEditing
              ? "Cliente actualizado correctamente."
              : "Cliente creado correctamente."}
          </span>
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2.5 p-3.5 bg-red-500/8 border border-red-500/20 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-sm text-red-500 font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          onClick={onClose}
          disabled={isSaving}
          className="px-4 py-2.5 text-sm font-medium rounded-xl border border-[var(--border-0)] bg-[var(--surface-2)] text-[var(--text-1)] hover:text-[var(--text-0)] disabled:opacity-50 transition-all"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || status === "success"}
          className="flex items-center gap-2 px-6 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 disabled:cursor-not-allowed text-[oklch(0.090_0.025_255)] font-bold rounded-xl transition-all text-sm shadow-md shadow-amber-400/20"
        >
          {isSaving ? (
            <>
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isEditing ? "Guardar cambios" : "Crear cliente"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
