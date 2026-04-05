export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-64 bg-[var(--surface-2)] rounded-lg" />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-24 bg-[var(--surface-2)] rounded-xl" />
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-[var(--surface-2)] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
