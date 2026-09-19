import { PageHeaderSkeleton, StatCardsSkeleton, CardGridSkeleton } from "@/components/admin/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <PageHeaderSkeleton />
      <StatCardsSkeleton />
      <StatCardsSkeleton />
      <CardGridSkeleton />
    </div>
  );
}
