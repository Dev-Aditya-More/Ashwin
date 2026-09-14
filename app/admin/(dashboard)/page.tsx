import {
  Users,
  Truck,
  HardHat,
  Wallet,
  TrendingUp,
  UserSquare2,
} from "lucide-react";
import Link from "next/link";
import { getDashboardData } from "@/lib/actions/dashboard";
import { listWhatsappContacts } from "@/lib/actions/whatsapp";
import { StatCard } from "@/components/admin/StatCard";
import { ActivityList } from "@/components/admin/ActivityList";
import { MonthlyChart } from "@/components/admin/MonthlyChart";
import { WhatsappComposer } from "@/components/admin/WhatsappComposer";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const [data, contacts] = await Promise.all([getDashboardData(), listWhatsappContacts()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Good Afternoon!</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Here&apos;s what&apos;s happening with your business.
          </p>
        </div>
        <div className="flex gap-2">
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
          label="Money to Receive"
          value={data.clientReceivable}
          sublabel="From clients"
          tone="green"
        />
        <StatCard
          icon={Truck}
          label="Money to Pay Vendors"
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={TrendingUp}
          label="Total Revenue (FY)"
          value={data.totalRevenue}
          sublabel="From client work"
        />
        <StatCard
          icon={HardHat}
          label="Total Labour Cost"
          value={data.totalLabourCost}
          sublabel="Payments to workers"
        />
        <StatCard
          icon={Truck}
          label="Total Vendor Cost"
          value={data.totalVendorCost}
          sublabel="Material purchases"
        />
        <StatCard
          icon={UserSquare2}
          label="Active Accounts"
          value={data.activeAccounts}
          sublabel="Clients, workers, vendors"
          isMoney={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ActivityList title="Recent Client Activity" viewAllHref="/admin/clients" rows={data.clientActivity} />
        <ActivityList title="Recent Labour Activity" viewAllHref="/admin/labour" rows={data.labourActivity} />
        <ActivityList title="Recent Vendor Activity" viewAllHref="/admin/vendors" rows={data.vendorActivity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-[var(--border)] bg-white p-4">
          <p className="font-semibold text-sm mb-2">Monthly Overview</p>
          <MonthlyChart data={data.monthly} />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-4">
          <WhatsappComposer contacts={contacts} compact />
        </div>
      </div>
    </div>
  );
}
