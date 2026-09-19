import { TableSkeleton } from "@/components/admin/Skeleton";

export default function StatementLoading() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4 animate-pulse">
      <div className="h-6 w-48 rounded bg-[var(--bg-2)]" />
      <TableSkeleton columns={4} rows={8} />
    </div>
  );
}
