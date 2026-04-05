export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-[var(--surface-2)] rounded-lg" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-[var(--surface-2)] rounded-2xl" />
        ))}
      </div>
      <div className="h-96 bg-[var(--surface-2)] rounded-2xl" />
    </div>
  );
}
