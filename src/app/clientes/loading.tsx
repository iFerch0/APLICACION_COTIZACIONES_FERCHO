export default function ClientesLoading() {
  return (
    <div className="fade-up space-y-6">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-1.5">
        <div className="h-4 w-12 rounded bg-[var(--surface-2)] animate-pulse" />
        <div className="h-3 w-3 rounded bg-[var(--surface-2)] animate-pulse" />
        <div className="h-4 w-16 rounded bg-[var(--surface-2)] animate-pulse" />
      </div>

      {/* Header skeleton */}
      <div>
        <div className="h-8 w-32 rounded-lg bg-[var(--surface-2)] animate-pulse" />
        <div className="mt-2 h-4 w-64 rounded bg-[var(--surface-2)] animate-pulse" />
      </div>

      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between gap-3">
        <div className="h-10 w-64 rounded-xl bg-[var(--surface-2)] animate-pulse" />
        <div className="h-10 w-32 rounded-xl bg-[var(--surface-2)] animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl overflow-hidden">
        <div className="hidden md:block">
          <div className="border-b border-[var(--border-0)] px-5 py-3 flex gap-6">
            {[80, 120, 160, 60, 60].map((w, i) => (
              <div key={i} className="h-3 rounded bg-[var(--surface-2)] animate-pulse" style={{ width: `${w}px` }} />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="border-b border-[var(--border-0)]/50 px-5 py-4 flex gap-6">
              {[100, 140, 180, 50, 40].map((w, j) => (
                <div key={j} className="h-4 rounded bg-[var(--surface-2)] animate-pulse" style={{ width: `${w}px` }} />
              ))}
            </div>
          ))}
        </div>

        {/* Mobile skeleton */}
        <div className="md:hidden divide-y divide-[var(--border-0)]/50">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 space-y-3">
              <div className="h-4 w-40 rounded bg-[var(--surface-2)] animate-pulse" />
              <div className="flex gap-4">
                <div className="h-3 w-24 rounded bg-[var(--surface-2)] animate-pulse" />
                <div className="h-3 w-20 rounded bg-[var(--surface-2)] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
