import { listClients } from "@/lib/actions/clients";
import { listLabourers } from "@/lib/actions/labour";
import { listVendors } from "@/lib/actions/vendors";
import { getMonthlyPerformance } from "@/lib/actions/dashboard";
import { SummaryTile, QuickAccess, MonthlyPerformance, LedgerTable } from "@/components/admin/LedgerBlocks";

export default async function ReportsPage() {
  const [clients, labourers, vendors, monthly] = await Promise.all([
    listClients(),
    listLabourers(),
    listVendors(),
    getMonthlyPerformance(),
  ]);

  const totalReceivable = clients.reduce((a, c) => a + Math.max(c.balance, 0), 0);
  const totalLabourDue = labourers.reduce((a, l) => a + Math.max(l.balance, 0), 0);
  const totalVendorDue = vendors.reduce((a, v) => a + Math.max(v.balance, 0), 0);
  const totalRevenue = monthly.reduce((a, m) => a + m.revenue, 0);
  const totalLabourCost = monthly.reduce((a, m) => a + m.labour, 0);
  const totalVendorCost = monthly.reduce((a, m) => a + m.vendor, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Reports</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Who owes you, and who you owe — calculated live from work, bills and payments.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryTile label="Client Receivable" value={totalReceivable} tone="emerald" />
        <SummaryTile label="Vendor Payable" value={totalVendorDue} tone="rose" />
        <SummaryTile label="Labour Due" value={totalLabourDue} tone="amber" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryTile label="Total FY Revenue" value={totalRevenue} tone="blue" />
        <SummaryTile label="Total Labour Cost" value={totalLabourCost} tone="blue" />
        <SummaryTile label="Total Vendor Cost" value={totalVendorCost} tone="blue" />
      </div>

      <QuickAccess />

      <MonthlyPerformance rows={monthly} />

      <LedgerTable
        title="Client Ledger"
        category="Client"
        rows={clients.filter((c) => c.balance > 0)}
        tone="emerald"
      />
      <LedgerTable
        title="Labour Ledger"
        category="Labour"
        rows={labourers.filter((l) => l.balance > 0)}
        tone="amber"
      />
      <LedgerTable
        title="Vendor Ledger"
        category="Vendor"
        rows={vendors.filter((v) => v.balance > 0)}
        tone="rose"
      />
    </div>
  );
}
