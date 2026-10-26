import { Suspense, cache } from "react";
import { Users, Truck, HardHat, Wallet, TrendingUp, UserSquare2, FileText } from "lucide-react";
import Link from "next/link";
import { getDashboardData, getDailyPerformance } from "@/lib/actions/dashboard";
import { listPartyOptions } from "@/lib/actions/month-view";
import { listTransactions } from "@/lib/actions/transactions";
import { countQuotations } from "@/lib/actions/documents";
import { QuickAddTransaction } from "@/components/admin/QuickAddTransaction";
import { formatDate, formatMoney } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/admin/StatCard";
import { StatCardsSkeleton, TableSkeleton } from "@/components/admin/Skeleton";
// LedgerTable is unused now that the three ledgers are commented out.
import { /* QuickAccess, */ MonthlyPerformance /*, LedgerTable */ } from "@/components/admin/LedgerBlocks";
import { AddEntityDropdown } from "@/components/admin/AddEntityDropdown";
import { Button } from "@/components/ui/button";
import { getGreeting } from "@/lib/format";

// One query batch shared by every section below (React dedupes it within the request).
const dashboardData = cache(getDashboardData);

/**
 * Each section streams in on its own: the greeting and skeletons appear immediately,
 * and the numbers fill in as soon as their own data arrives instead of the whole
 * page waiting for the slowest query.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const validRange =
    !!from && !!to && /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to) && from <= to;

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
          <AddEntityDropdown />
          <Button asChild variant="outline">
            <Link href="/admin/transactions">View Transactions</Link>
          </Button>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="space-y-3 animate-pulse">
            <StatCardsSkeleton />
            <StatCardsSkeleton />
          </div>
        }
      >
        <Stats />
      </Suspense>

      {/* Quick Access hidden for now — uncomment (and the import above) to bring it back.
      <QuickAccess />
      */}

      <Suspense fallback={<div className="animate-pulse"><TableSkeleton columns={4} rows={5} /></div>}>
        <Operations />
      </Suspense>

      {/* Two columns on wide screens instead of one long stack. */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <Suspense fallback={<div className="animate-pulse"><TableSkeleton columns={6} rows={8} /></div>}>
          <RecentTransactions />
        </Suspense>
        <Suspense fallback={<div className="animate-pulse"><TableSkeleton columns={5} rows={8} /></div>}>
          <Monthly from={validRange ? from : undefined} to={validRange ? to : undefined} />
        </Suspense>
      </div>
    </div>
  );
}

async function Stats() {
  const data = await dashboardData();
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Client Receivable" value={data.clientReceivable} sublabel="From clients" tone="green" />
        <StatCard icon={Truck} label="Vendor Payable" value={data.vendorPayable} sublabel="Materials & bills" tone="red" />
        <StatCard icon={HardHat} label="Labour Due" value={data.labourDue} sublabel="Owed to workers" tone="amber" />
        <StatCard icon={Wallet} label="Net Position" value={data.netPosition} sublabel="Overall balance" tone="blue" />
      </div>

      {/* Second row lines up under the first: Vendor Cost under Vendor
          Payable, Labour Cost under Labour Due. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={TrendingUp} label="Total FY Received" value={data.totalRevenue} sublabel="Payments from clients" />
        <StatCard icon={Truck} label="Total Vendor Paid" value={data.totalVendorCost} sublabel="Payments to vendors" />
        <StatCard icon={HardHat} label="Total Labour Paid" value={data.totalLabourCost} sublabel="Payments to workers" />
        <StatCard
          icon={UserSquare2}
          label="Active Accounts"
          value={data.activeAccounts}
          sublabel="Clients, workers, vendors"
          isMoney={false}
        />
      </div>
    </>
  );
}

async function Operations() {
  const [parties, quotationCount] = await Promise.all([listPartyOptions(), countQuotations()]);

  return (
    <div className="space-y-6">
      <QuickAddTransaction clients={parties.clients} labourers={parties.labourers} vendors={parties.vendors} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Clients" value={parties.clients.length} isMoney={false} />
        <StatCard icon={Truck} label="Vendors" value={parties.vendors.length} isMoney={false} />
        <StatCard icon={HardHat} label="Labour" value={parties.labourers.length} isMoney={false} />
        <StatCard icon={FileText} label="Quotations" value={quotationCount} isMoney={false} />
      </div>
    </div>
  );
}

async function RecentTransactions() {
  const recent = await listTransactions(12);
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-2)]">
        <p className="font-semibold text-sm">Recent Transactions</p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Party</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Transaction</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Mode</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="whitespace-nowrap">{formatDate(t.date)}</TableCell>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="text-[var(--text-muted)]">{t.category}</TableCell>
                <TableCell className="text-[var(--text-muted)]">
                  {t.isRefund
                    ? "Refund"
                    : t.kind === "client_payment"
                    ? "Payment Received"
                    : t.kind.endsWith("_payment")
                    ? "Payment Paid"
                    : "Due / Payable Added"}
                </TableCell>
                <TableCell className="text-right">{formatMoney(t.amount)}</TableCell>
                <TableCell className="text-[var(--text-muted)]">{t.mode ?? ""}</TableCell>
              </TableRow>
            ))}
            {recent.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-[var(--text-muted)] py-8">
                  No transactions saved yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

async function Monthly({ from, to }: { from?: string; to?: string }) {
  const [data, dailyRows] = await Promise.all([
    dashboardData(),
    from && to ? getDailyPerformance(from, to) : Promise.resolve(undefined),
  ]);
  return <MonthlyPerformance rows={data.monthly} dailyRows={dailyRows} from={from} to={to} />;
}
