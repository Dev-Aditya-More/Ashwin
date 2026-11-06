import { getGstReport } from "@/lib/actions/gst-reports";
import { GstReportView } from "@/components/admin/GstReportView";
import { thisMonthIST } from "@/lib/today";

export default async function GstReportsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month: asked } = await searchParams;
  const month = asked && /^\d{4}-(0[1-9]|1[0-2])$/.test(asked) ? asked : thisMonthIST();
  const report = await getGstReport(month);
  if (!report) return <p className="text-sm text-[var(--text-muted)]">Couldn&apos;t read that month.</p>;
  return <GstReportView key={month} month={month} report={report} />;
}
