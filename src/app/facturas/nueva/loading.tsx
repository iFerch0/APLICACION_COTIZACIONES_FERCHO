export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-[var(--surface-2)] rounded-lg" />
      <div className="h-12 bg-[var(--surface-2)] rounded-2xl" />
      <div className="h-64 bg-[var(--surface-2)] rounded-2xl" />
      <div className="h-32 bg-[var(--surface-2)] rounded-2xl" />
      <div className="h-10 w-48 bg-[var(--surface-2)] rounded-2xl" />
    </div>
  );
}
