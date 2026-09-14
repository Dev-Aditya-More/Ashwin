export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="space-y-2">
          <div className="h-6 w-48 rounded bg-[var(--bg-2)]" />
          <div className="h-4 w-64 rounded bg-[var(--bg-2)]" />
        </div>
        <div className="h-9 w-40 rounded-lg bg-[var(--bg-2)]" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-[var(--border)] bg-[var(--bg-2)]" />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-56 rounded-xl border border-[var(--border)] bg-[var(--bg-2)]" />
        ))}
      </div>
    </div>
  );
}
