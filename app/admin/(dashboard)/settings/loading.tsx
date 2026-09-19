import { TableSkeleton } from "@/components/admin/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-2xl animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-32 rounded bg-[var(--bg-2)]" />
        <div className="h-4 w-56 rounded bg-[var(--bg-2)]" />
      </div>
      <TableSkeleton columns={2} rows={3} />
      <div className="h-40 rounded-xl border border-[var(--border)] bg-[var(--bg-2)]" />
      <div className="h-20 rounded-xl border border-[var(--border)] bg-[var(--bg-2)]" />
    </div>
  );
}
