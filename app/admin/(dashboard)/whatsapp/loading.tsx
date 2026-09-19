import { PageHeaderSkeleton } from "@/components/admin/Skeleton";

export default function WhatsappLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <PageHeaderSkeleton withAction={false} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-72 rounded-xl border border-[var(--border)] bg-[var(--bg-2)]" />
        <div className="h-72 rounded-xl border border-[var(--border)] bg-[var(--bg-2)]" />
      </div>
    </div>
  );
}
