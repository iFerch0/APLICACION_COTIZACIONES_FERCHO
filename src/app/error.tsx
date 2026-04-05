"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-red-400/10 flex items-center justify-center mb-2">
        <svg
          className="w-7 h-7 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-[var(--text-0)]">Algo salió mal</h2>
      <p className="text-[var(--text-2)] text-center max-w-md">
        {error.message || "Ocurrió un error inesperado. Intenta de nuevo."}
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-[oklch(0.090_0.025_255)] font-bold rounded-xl transition-all text-sm shadow-md shadow-amber-400/20"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
