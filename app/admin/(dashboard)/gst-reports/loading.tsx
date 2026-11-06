import { PageHeaderSkeleton } from "@/components/admin/Skeleton";

export default function GstReportsLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <PageHeaderSkeleton withAction={false} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-[var(--border)] bg-[var(--bg-2)]" />
        ))}
      </div>
      <div className="h-56 rounded-xl border border-[var(--border)] bg-[var(--bg-2)]" />
    </div>
  );
}
