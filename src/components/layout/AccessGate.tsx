"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Lock } from "lucide-react";

const ACCESS_STORAGE_KEY = "cotizapro_access_granted";

export default function AccessGate({ children }: { children: ReactNode }) {
  const expectedPassword = useMemo(
    () => (process.env.NEXT_PUBLIC_APP_ACCESS_PASSWORD ?? "").trim() || "cotizapro123",
    []
  );
  const [isReady, setIsReady] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const hasLocalAccess = localStorage.getItem(ACCESS_STORAGE_KEY) === "true";
    const hasSessionAccess = sessionStorage.getItem(ACCESS_STORAGE_KEY) === "true";
    setIsUnlocked(hasLocalAccess || hasSessionAccess);
    setIsReady(true);
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password === expectedPassword) {
      localStorage.setItem(ACCESS_STORAGE_KEY, "true");
      sessionStorage.setItem(ACCESS_STORAGE_KEY, "true");
      setIsUnlocked(true);
      setError("");
      return;
    }

    setError("Contraseña incorrecta.");
  };

  if (!isReady) return null;
  if (isUnlocked) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[var(--surface-0)] px-4 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-0)] bg-[var(--surface-1)] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/15 text-amber-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--text-0)]">Acceso protegido</h1>
            <p className="text-sm text-[var(--text-1)]">Ingresa la contraseña para continuar.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (error) setError("");
            }}
            placeholder="Contraseña"
            autoFocus
            className="w-full bg-[var(--surface-2)] border border-[var(--border-0)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-0)] placeholder-[var(--text-2)] focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 outline-none transition-all"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[oklch(0.090_0.025_255)] font-bold text-sm transition-all"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
