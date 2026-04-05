export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-[var(--surface-2)] rounded-lg" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-96 bg-[var(--surface-2)] rounded-2xl" />
        <div className="h-96 bg-[var(--surface-2)] rounded-2xl" />
      </div>
    </div>
  );
}
