"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  Percent,
  FileText,
  Save,
  CheckCircle,
  AlertCircle,
  Settings,
  Globe,
} from "lucide-react";

// ── Styles ────────────────────────────────────────────────────────────────────

const inputBase =
  "w-full bg-[var(--surface-2)] border border-[var(--border-0)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-0)] placeholder-[var(--text-2)] focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 outline-none transition-all";

// ── Field Component ────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  icon: Icon,
  children,
}: {
  label: string;
  hint?: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)]">
        <Icon className="w-3 h-3" />
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-[10px] text-[var(--text-2)] leading-relaxed">{hint}</p>
      )}
    </div>
  );
}

// ── Setting Item Interface ─────────────────────────────────────────────────────

interface SettingItem {
  key: string;
  value: string;
  label?: string;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function GeneralSettings({ initialSettings }: { initialSettings?: SettingItem[] }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [original, setOriginal] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(!initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Load settings on mount if not provided
  useEffect(() => {
    if (initialSettings) {
      const map: Record<string, string> = {};
      initialSettings.forEach((s) => {
        map[s.key] = s.value;
      });
      setSettings(map);
      setOriginal(map);
      setLoading(false);
      return;
    }

    async function loadSettings() {
      try {
        const { getAllSettings } = await import("@/app/actions/settings");
        const result = await getAllSettings();
        const map: Record<string, string> = {};
        if (Array.isArray(result)) {
          result.forEach((s: SettingItem) => {
            map[s.key] = s.value;
          });
        }
        setSettings(map);
        setOriginal(map);
      } catch {
        // Settings actions not yet available — use empty defaults
        const defaults: Record<string, string> = {
          exchange_rate_usd_cop: "4200",
          amazon_rate_percent: "0",
          tax_rate_us_percent: "0",
          terminos_condiciones: "",
        };
        setSettings(defaults);
        setOriginal(defaults);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [initialSettings]);

  const set =
    (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setSettings((prev) => ({ ...prev, [key]: e.target.value }));

  const hasChanges = Object.keys(settings).some(
    (k) => settings[k] !== original[k]
  );

  const handleSave = async () => {
    setIsSaving(true);
    setStatus("idle");
    setErrorMsg("");

    try {
      const { upsertSetting } = await import("@/app/actions/settings");

      const changedKeys = Object.keys(settings).filter(
        (k) => settings[k] !== original[k]
      );

      for (const key of changedKeys) {
        await upsertSetting(key, settings[key]);
      }

      setOriginal({ ...settings });
      setStatus("success");
      setTimeout(() => setStatus("idle"), 4000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Error al guardar la configuración."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-12 rounded-xl bg-[var(--surface-2)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Exchange rate */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field
          label="Tasa de cambio USD → COP"
          icon={DollarSign}
          hint="Se usa para convertir precios de dólares a pesos."
        >
          <input
            type="number"
            step="1"
            min="0"
            className={inputBase}
            placeholder="Ej: 4200"
            value={settings.exchange_rate_usd_cop ?? ""}
            onChange={set("exchange_rate_usd_cop")}
          />
        </Field>

        <Field
          label="Amazon rate %"
          icon={Percent}
          hint="Porcentaje adicional por compra en Amazon."
        >
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            className={inputBase}
            placeholder="Ej: 5"
            value={settings.amazon_rate_percent ?? ""}
            onChange={set("amazon_rate_percent")}
          />
        </Field>

        <Field
          label="Tax rate EE.UU. %"
          icon={Globe}
          hint="Impuesto de ventas en EE.UU. aplicado a compras."
        >
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            className={inputBase}
            placeholder="Ej: 7"
            value={settings.tax_rate_us_percent ?? ""}
            onChange={set("tax_rate_us_percent")}
          />
        </Field>
      </div>

      {/* Terms */}
      <Field
        label="Términos y Condiciones"
        icon={FileText}
        hint="Texto que aparece al final de cotizaciones y facturas."
      >
        <textarea
          className={inputBase + " min-h-[120px] resize-y"}
          placeholder="Ej: Esta cotización tiene una validez de 15 días calendario..."
          value={settings.terminos_condiciones ?? ""}
          onChange={set("terminos_condiciones")}
        />
      </Field>

      {/* Feedback */}
      {status === "success" && (
        <div className="flex items-center gap-2.5 p-3.5 bg-green-500/8 border border-green-500/20 rounded-xl">
          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
            Configuración guardada correctamente.
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
          disabled={isSaving || !hasChanges}
          className="flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-[oklch(0.090_0.025_255)] font-bold rounded-xl transition-all text-sm shadow-md shadow-amber-400/20"
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
              Guardar configuración
            </>
          )}
        </button>
      </div>
    </div>
  );
}
