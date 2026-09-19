/**
 * Shared loading-skeleton primitives so every admin route pulses the same
 * way while its data loads, instead of each page inventing its own.
 */

function Bar({ className = "" }: { className?: string }) {
  return <div className={`rounded bg-[var(--bg-2)] ${className}`} />;
}

export function PageHeaderSkeleton({ withAction = true }: { withAction?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Bar className="h-6 w-40" />
        <Bar className="h-4 w-24" />
      </div>
      {withAction && <Bar className="h-9 w-32 rounded-lg" />}
    </div>
  );
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-28 rounded-xl border border-[var(--border)] bg-[var(--bg-2)]" />
      ))}
    </div>
  );
}

export function TableSkeleton({ columns = 5, rows = 6 }: { columns?: number; rows?: number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
      <div className="flex gap-4 px-4 h-10 items-center border-b border-[var(--border)]">
        {Array.from({ length: columns }).map((_, i) => (
          <Bar key={i} className="h-3 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-[var(--border)]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 px-4 h-12 items-center">
            {Array.from({ length: columns }).map((_, c) => (
              <Bar key={c} className={`h-3.5 flex-1 ${c === 0 ? "max-w-32" : ""}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-56 rounded-xl border border-[var(--border)] bg-[var(--bg-2)]" />
      ))}
    </div>
  );
}

/** For a list page: header + optional stat row + a table. */
export function ListPageSkeleton({
  columns = 5,
  rows = 6,
  withStats = false,
}: {
  columns?: number;
  rows?: number;
  withStats?: boolean;
}) {
  return (
    <div className="space-y-4 animate-pulse">
      <PageHeaderSkeleton />
      {withStats && <StatCardsSkeleton />}
      <TableSkeleton columns={columns} rows={rows} />
    </div>
  );
}

/** For an entity detail page: back link + name block + balance stats + a table. */
export function DetailPageSkeleton({ tables = 1 }: { tables?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center gap-2">
        <Bar className="size-4" />
        <Bar className="h-6 w-48" />
      </div>
      <StatCardsSkeleton count={3} />
      {Array.from({ length: tables }).map((_, i) => (
        <TableSkeleton key={i} columns={4} rows={4} />
      ))}
    </div>
  );
}
