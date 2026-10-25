import { PageHeaderSkeleton, TableSkeleton } from "@/components/admin/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <PageHeaderSkeleton withAction={false} />
      <div className="h-72 rounded-xl border border-[var(--border)] bg-[var(--bg-2)]" />
      <TableSkeleton columns={5} rows={4} />
    </div>
  );
}
