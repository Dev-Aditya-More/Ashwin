import Link from "next/link";
import { formatDate, formatMoney, initials } from "@/lib/format";
import type { ActivityRow } from "@/lib/actions/dashboard";

export function ActivityList({
  title,
  viewAllHref,
  rows,
}: {
  title: string;
  viewAllHref: string;
  rows: ActivityRow[];
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <p className="font-semibold text-sm">{title}</p>
        <Link href={viewAllHref} className="text-xs font-medium text-[var(--accent-blue)] hover:underline">
          View All →
        </Link>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {rows.length === 0 && (
          <p className="px-4 py-6 text-sm text-[var(--text-muted)] text-center">No activity yet.</p>
        )}
        {rows.map((row) => (
          <div key={row.id} className="flex items-center gap-3 px-4 py-3">
            <div className="size-9 rounded-full bg-[var(--bg-2)] flex items-center justify-center text-xs font-semibold text-[var(--text-secondary)] shrink-0">
              {initials(row.name) || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{row.name}</p>
              <p className="text-xs text-[var(--text-muted)]">{row.label}</p>
            </div>
            <div className="text-right shrink-0">
              <p
                className={
                  row.direction === "in"
                    ? "text-sm font-semibold text-emerald-600"
                    : row.direction === "out"
                    ? "text-sm font-semibold text-rose-600"
                    : "text-sm font-semibold text-[var(--text-primary)]"
                }
              >
                {row.direction === "in" ? "+ " : row.direction === "out" ? "- " : ""}
                {formatMoney(row.amount)}
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">{formatDate(row.date)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
