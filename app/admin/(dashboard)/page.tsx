import {
  Users,
  Truck,
  HardHat,
  Wallet,
  TrendingUp,
  UserSquare2,
} from "lucide-react";
import Link from "next/link";
import { getDashboardData, getMonthlyPerformance } from "@/lib/actions/dashboard";
// import { listClients } from "@/lib/actions/clients";
// import { listLabourers } from "@/lib/actions/labour";
// import { listVendors } from "@/lib/actions/vendors";
import { StatCard } from "@/components/admin/StatCard";
// LedgerTable is unused now that the three ledgers below are commented out.
import { QuickAccess, MonthlyPerformance /*, LedgerTable */ } from "@/components/admin/LedgerBlocks";
import { Button } from "@/components/ui/button";
import { getGreeting } from "@/lib/format";

export default async function DashboardPage() {
  const [data, monthly] = await Promise.all([
    getDashboardData(),
    // listClients(),
    // listLabourers(),
    // listVendors(),
    getMonthlyPerformance(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{getGreeting()}</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Here&apos;s what&apos;s happening with your business.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/clients">+ Add Client</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/transactions">View Transactions</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Users}
          label="Client Receivable"
          value={data.clientReceivable}
          sublabel="From clients"
          tone="green"
        />
        <StatCard
          icon={Truck}
          label="Vendor Payable"
          value={data.vendorPayable}
          sublabel="Materials & bills"
          tone="red"
        />
        <StatCard
          icon={HardHat}
          label="Labour Due"
          value={data.labourDue}
          sublabel="Owed to workers"
          tone="amber"
        />
        <StatCard
          icon={Wallet}
          label="Net Position"
          value={data.netPosition}
          sublabel="Overall balance"
          tone="blue"
        />
      </div>

      {/* Second row lines up under the first: Vendor Cost under Vendor
          Payable, Labour Cost under Labour Due. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={TrendingUp}
          label="Total FY Revenue"
          value={data.totalRevenue}
          sublabel="From client work"
        />
        <StatCard
          icon={Truck}
          label="Total Vendor Cost"
          value={data.totalVendorCost}
          sublabel="Material purchases"
        />
        <StatCard
          icon={HardHat}
          label="Total Labour Cost"
          value={data.totalLabourCost}
          sublabel="Payments to workers"
        />
        <StatCard
          icon={UserSquare2}
          label="Active Accounts"
          value={data.activeAccounts}
          sublabel="Clients, workers, vendors"
          isMoney={false}
        />
      </div>

      <QuickAccess />

      <MonthlyPerformance rows={monthly} />

      {/* Ledger summaries removed from the dashboard per request — still
          available in full on /admin/reports. Uncomment (and restore the
          listClients/listLabourers/listVendors imports + Promise.all
          entries above) if these should come back here later.
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
      */}
    </div>
  );
}
