export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-[var(--surface-2)] rounded-lg" />
      <div className="max-w-2xl space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-[var(--surface-2)] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
