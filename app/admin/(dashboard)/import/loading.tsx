import { PageHeaderSkeleton } from "@/components/admin/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <PageHeaderSkeleton withAction={false} />
      <div className="h-64 rounded-xl border border-[var(--border)] bg-[var(--bg-2)]" />
    </div>
  );
}
