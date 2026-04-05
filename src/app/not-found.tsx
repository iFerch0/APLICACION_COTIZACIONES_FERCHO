import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-amber-400/10 flex items-center justify-center mb-2">
        <svg
          className="w-7 h-7 text-amber-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-[var(--text-0)]">Página no encontrada</h2>
      <p className="text-[var(--text-2)] text-center max-w-md">
        La página que buscas no existe o fue movida.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-[oklch(0.090_0.025_255)] font-bold rounded-xl transition-all text-sm shadow-md shadow-amber-400/20"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
