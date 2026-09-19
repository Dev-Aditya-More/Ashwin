import { TableSkeleton } from "@/components/admin/Skeleton";

export default function BulkPayLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="size-4 rounded bg-[var(--bg-2)]" />
        <div className="h-6 w-40 rounded bg-[var(--bg-2)]" />
      </div>
      <TableSkeleton columns={3} rows={6} />
    </div>
  );
}
