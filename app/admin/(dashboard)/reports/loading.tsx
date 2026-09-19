import { StatCardsSkeleton, TableSkeleton } from "@/components/admin/Skeleton";

export default function ReportsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-32 rounded bg-[var(--bg-2)]" />
        <div className="h-4 w-72 rounded bg-[var(--bg-2)]" />
      </div>
      <StatCardsSkeleton count={3} />
      <StatCardsSkeleton count={3} />
      <div className="h-72 rounded-xl border border-[var(--border)] bg-[var(--bg-2)]" />
      <TableSkeleton columns={5} rows={6} />
      <TableSkeleton columns={4} rows={4} />
      <TableSkeleton columns={4} rows={4} />
      <TableSkeleton columns={4} rows={4} />
    </div>
  );
}
