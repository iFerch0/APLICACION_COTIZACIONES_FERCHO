"use client";

import { useState } from "react";
import { User, Phone, Mail, MapPin, Briefcase, Hash, CheckCircle, AlertCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { upsertSellerProfile, type SellerData } from "@/app/actions/seller";

const inputBase =
  "w-full bg-[var(--surface-2)] border border-[var(--border-0)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-0)] placeholder-[var(--text-2)] focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 outline-none transition-all";

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
      {hint && <p className="text-[10px] text-[var(--text-2)] leading-relaxed">{hint}</p>}
    </div>
  );
}

export default function SellerProfileForm({ initial }: { initial: SellerData | null }) {
  const [form, setForm] = useState({
    nombre: initial?.nombre ?? "",
    profesion: initial?.profesion ?? "",
    identificacion: initial?.identificacion ?? "",
    celular: initial?.celular ?? "",
    email: initial?.email ?? "",
    direccion: initial?.direccion ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      setStatus("error");
      setErrorMsg("El nombre del vendedor es obligatorio.");
      return;
    }
    setIsSaving(true);
    setStatus("idle");
    const result = await upsertSellerProfile({
      nombre: form.nombre.trim(),
      profesion: form.profesion.trim() || undefined,
      identificacion: form.identificacion.trim() || undefined,
      celular: form.celular.trim() || undefined,
      email: form.email.trim() || undefined,
      direccion: form.direccion.trim() || undefined,
    });
    setIsSaving(false);
    if (result.success) {
      setStatus("success");
      toast.success("Perfil actualizado");
      setTimeout(() => setStatus("idle"), 4000);
    } else {
      setStatus("error");
      setErrorMsg(result.error ?? "Error desconocido.");
      toast.error(result.error ?? "Error al actualizar perfil");
    }
  };

  return (
    <div className="space-y-6">

      {/* Preview card */}
      <div className="bg-amber-400/5 border border-amber-400/15 rounded-2xl p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80 mb-3">
          Vista previa en el PDF
        </p>
        <div className="text-sm space-y-0.5">
          <p className="font-bold text-[var(--text-0)] text-base">
            {form.nombre || <span className="text-[var(--text-2)] italic">Nombre del vendedor</span>}
          </p>
          {form.profesion && <p className="text-[var(--text-1)]">{form.profesion}</p>}
          {form.identificacion && (
            <p className="text-[var(--text-2)] text-xs">NIT / CC: {form.identificacion}</p>
          )}
          {form.celular && (
            <p className="text-[var(--text-2)] text-xs">Tel: {form.celular}</p>
          )}
          {form.email && (
            <p className="text-[var(--text-2)] text-xs">{form.email}</p>
          )}
          {form.direccion && (
            <p className="text-[var(--text-2)] text-xs">{form.direccion}</p>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="sm:col-span-2">
          <Field label="Nombre completo" icon={User} required hint="Aparece en el encabezado de todas las cotizaciones y facturas.">
            <input className={inputBase} placeholder="Ej: Fernando Rhenals" value={form.nombre} onChange={set("nombre")} />
          </Field>
        </div>

        <Field label="Profesión / Cargo" icon={Briefcase} hint="Ej: Consultor Tecnológico, Técnico en Sistemas">
          <input className={inputBase} placeholder="Ej: Técnico en Sistemas" value={form.profesion} onChange={set("profesion")} />
        </Field>

        <Field label="NIT / Cédula" icon={Hash} hint="Identificación fiscal o personal.">
          <input className={inputBase} placeholder="Ej: 123456789-1" value={form.identificacion} onChange={set("identificacion")} />
        </Field>

        <Field label="Teléfono / Celular" icon={Phone}>
          <input className={inputBase} placeholder="Ej: +57 300 123 4567" value={form.celular} onChange={set("celular")} />
        </Field>

        <Field label="Correo electrónico" icon={Mail}>
          <input className={inputBase} type="email" placeholder="tu@correo.com" value={form.email} onChange={set("email")} />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Dirección" icon={MapPin}>
            <input className={inputBase} placeholder="Ej: Carrera 10 # 20-30, Barranquilla" value={form.direccion} onChange={set("direccion")} />
          </Field>
        </div>
      </div>

      {/* Feedback */}
      {status === "success" && (
        <div className="flex items-center gap-2.5 p-3.5 bg-green-500/8 border border-green-500/20 rounded-xl">
          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
            Perfil guardado correctamente. Se verá reflejado en los próximos PDFs.
          </span>
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2.5 p-3.5 bg-red-500/8 border border-red-500/20 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-sm text-red-500 font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 disabled:cursor-not-allowed text-[oklch(0.090_0.025_255)] font-bold rounded-xl transition-all text-sm shadow-md shadow-amber-400/20"
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
              <Save className="w-4 h-4" />
              Guardar perfil
            </>
          )}
        </button>
      </div>
    </div>
  );
}
