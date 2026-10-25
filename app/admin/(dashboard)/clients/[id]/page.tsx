import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { getClient, deleteClientRecord } from "@/lib/actions/clients";
import {
  EditClientDialog,
  AddClientWorkDialog,
  AddClientPaymentDialog,
  EditClientWorkDialog,
  EditClientPaymentDialog,
} from "@/components/admin/dialogs/ClientDialogs";
import { DeleteRowButton } from "@/components/admin/dialogs/DeleteRowButton";
import { AddRefundDialog } from "@/components/admin/dialogs/RefundDialog";
import { PrintLedgerButton } from "@/components/admin/PrintLedgerButton";
import { DetailSheets } from "@/components/admin/DetailSheets";
import { ClientBills } from "@/components/admin/ClientBills";
import { listEstimates, listInvoices } from "@/lib/actions/documents";
import { clientLedgerRows } from "@/lib/ledger-rows";
import { TrackVisit } from "@/components/admin/TrackVisit";
import { BackButton } from "@/components/admin/BackButton";
import { ClientLedgerTable } from "@/components/admin/EntityLedger";
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

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let data;
  try {
    data = await getClient(id);
  } catch {
    notFound();
  }
  const { client, balance, work, payments, projects } = data;
  if (!client) notFound();
  const [{ rows: detailSheets }, { rows: allBills }] = await Promise.all([listEstimates(true, id), listInvoices()]);
  const bills = allBills.filter((b) => b.client_id === id);

  return (
    <div className="space-y-6">
      <TrackVisit id={id} name={client.name} category="Client" href={`/admin/clients/${id}`} />
      <div className="flex items-center gap-2">
        <BackButton fallbackHref="/admin/clients" />
        <h1 className="text-xl font-semibold flex-1 min-w-0 truncate">{client.name}</h1>
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/clients/${id}/statement`}>Statement</Link>
        </Button>
        <PrintLedgerButton
          party={{ name: client.name, phone: client.phone, address: client.address }}
          rows={clientLedgerRows(work, payments)}
        />
        <EditClientDialog client={client} />
        <DeleteRowButton
          what="client — this also removes all their work entries and payments"
          action={deleteClientRecord.bind(null, id)}
          trigger={
            <Button variant="destructive" size="sm">
              <Trash2 className="size-4" />
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard label="Total Work Billed" value={balance.total_work} />
        <SummaryCard label="Total Payment Received" value={balance.total_paid} />
        <SummaryCard
          label="Remaining Balance"
          value={balance.balance}
          tone={balance.balance > 0 ? "amber" : "green"}
        />
      </div>

      <div className="text-sm text-[var(--text-muted)] flex flex-wrap gap-4">
        {client.phone && <span>📞 {client.phone}</span>}
        {client.address && <span>📍 {client.address}</span>}
        {client.gstin && <span>GSTIN: <span className="font-mono">{client.gstin}</span></span>}
        {client.work_status && <span>Status: {client.work_status}</span>}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Section
              title="Work / Billed"
              action={<AddClientWorkDialog clientId={id} projects={projects} />}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-9" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {work.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="text-[var(--text-muted)] whitespace-nowrap">{formatDate(w.work_date)}</TableCell>
                      <TableCell>{w.description}</TableCell>
                      <TableCell className="text-right font-medium">{formatMoney(w.amount)}</TableCell>
                      <TableCell>
                        <EditClientWorkDialog work={w} clientId={id} projects={projects} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {work.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-[var(--text-muted)] py-6">
                        No work recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Section>

            <Section
              title="Payments Received"
              action={
                <div className="flex gap-1.5">
                  <AddRefundDialog kind="client" id={id} />
                  <AddClientPaymentDialog clientId={id} projects={projects} />
                </div>
              }
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-9" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-[var(--text-muted)] whitespace-nowrap">{formatDate(p.payment_date)}</TableCell>
                      <TableCell>{p.is_refund ? `Refund${p.note ? ` — ${p.note}` : ""}` : (p.note ?? "—")}</TableCell>
                      <TableCell className={`text-right font-medium ${p.is_refund ? "text-rose-600" : "text-emerald-600"}`}>
                        {p.is_refund ? "−" : "+"} {formatMoney(p.amount)}
                      </TableCell>
                      <TableCell>
                        <EditClientPaymentDialog payment={p} clientId={id} projects={projects} />
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
          <div className="space-y-4">
            <ClientLedgerTable work={work} payments={payments} clientId={id} projects={projects} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
              <DetailSheets sheets={detailSheets} />
              <ClientBills bills={bills} />
            </div>
          </div>
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
  tone?: "neutral" | "amber" | "green";
}) {
  const toneClass =
    tone === "amber" ? "text-amber-600" : tone === "green" ? "text-emerald-600" : "text-[var(--text-primary)]";
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
