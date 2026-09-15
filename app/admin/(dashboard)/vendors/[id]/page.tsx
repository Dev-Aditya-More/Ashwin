import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { getVendor, deleteVendorRecord } from "@/lib/actions/vendors";
import { listProjects } from "@/lib/actions/projects";
import {
  EditVendorDialog,
  AddVendorBillDialog,
  AddVendorPaymentDialog,
  EditVendorBillDialog,
  EditVendorPaymentDialog,
} from "@/components/admin/dialogs/VendorDialogs";
import { TrackVisit } from "@/components/admin/TrackVisit";
import { BackButton } from "@/components/admin/BackButton";
import { VendorLedgerTable } from "@/components/admin/EntityLedger";
import { formatDate, formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let data;
  try {
    data = await getVendor(id);
  } catch {
    notFound();
  }
  const { vendor, balance, bills, payments } = data;
  if (!vendor) notFound();
  const projects = await listProjects();

  return (
    <div className="space-y-6">
      <TrackVisit id={id} name={vendor.name} category="Vendor" href={`/admin/vendors/${id}`} />
      <div className="flex items-center gap-2">
        <BackButton fallbackHref="/admin/vendors" />
        <h1 className="text-xl font-semibold flex-1 min-w-0 truncate">{vendor.name}</h1>
        <EditVendorDialog vendor={vendor} />
        <form action={deleteVendorRecord.bind(null, id)}>
          <Button variant="destructive" size="sm" type="submit">
            <Trash2 className="size-4" />
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard label="Total Billed" value={balance.total_billed} />
        <SummaryCard label="Total Payment Made" value={balance.total_paid} />
        <SummaryCard label="Remaining to Pay" value={balance.balance} tone="rose" />
      </div>

      <div className="text-sm text-[var(--text-muted)] flex flex-wrap gap-4">
        {vendor.phone && <span>📞 {vendor.phone}</span>}
        {vendor.category && <span>🏷️ {vendor.category}</span>}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Section title="Bills" action={<AddVendorBillDialog vendorId={id} projects={projects} />}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item / Material</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-9" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>{b.description}</TableCell>
                      <TableCell className="text-[var(--text-muted)]">{formatDate(b.bill_date)}</TableCell>
                      <TableCell className="text-right font-medium">{formatMoney(b.amount)}</TableCell>
                      <TableCell>
                        <EditVendorBillDialog bill={b} vendorId={id} projects={projects} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {bills.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-[var(--text-muted)] py-6">
                        No bills recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Section>

            <Section title="Payments Made" action={<AddVendorPaymentDialog vendorId={id} />}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Note</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-9" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.note ?? "—"}</TableCell>
                      <TableCell className="text-[var(--text-muted)]">{formatDate(p.payment_date)}</TableCell>
                      <TableCell className="text-right font-medium text-rose-600">
                        - {formatMoney(p.amount)}
                      </TableCell>
                      <TableCell>
                        <EditVendorPaymentDialog payment={p} vendorId={id} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {payments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-[var(--text-muted)] py-6">
                        No payments recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Section>
          </div>
        </TabsContent>

        <TabsContent value="ledger">
          <VendorLedgerTable bills={bills} payments={payments} vendorId={id} projects={projects} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "rose";
}) {
  const toneClass = tone === "rose" ? "text-rose-600" : "text-[var(--text-primary)]";
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-4">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className={`text-xl font-semibold mt-1 ${toneClass}`}>{formatMoney(value)}</p>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <p className="font-semibold text-sm">{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}
