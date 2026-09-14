import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { getClient, deleteClientRecord } from "@/lib/actions/clients";
import { EditClientDialog, AddClientWorkDialog, AddClientPaymentDialog } from "@/components/admin/dialogs/ClientDialogs";
import { formatDate, formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/clients" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="text-xl font-semibold flex-1">{client.name}</h1>
        <EditClientDialog client={client} />
        <form action={deleteClientRecord.bind(null, id)}>
          <Button variant="destructive" size="sm" type="submit">
            <Trash2 className="size-4" />
          </Button>
        </form>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section
          title="Work / Billed"
          action={<AddClientWorkDialog clientId={id} projects={projects} />}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {work.map((w) => (
                <TableRow key={w.id}>
                  <TableCell>{w.description}</TableCell>
                  <TableCell className="text-[var(--text-muted)]">{formatDate(w.work_date)}</TableCell>
                  <TableCell className="text-right font-medium">{formatMoney(w.amount)}</TableCell>
                </TableRow>
              ))}
              {work.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-[var(--text-muted)] py-6">
                    No work recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Section>

        <Section
          title="Payments Received"
          action={<AddClientPaymentDialog clientId={id} projects={projects} />}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Note</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.note ?? "—"}</TableCell>
                  <TableCell className="text-[var(--text-muted)]">{formatDate(p.payment_date)}</TableCell>
                  <TableCell className="text-right font-medium text-emerald-600">
                    + {formatMoney(p.amount)}
                  </TableCell>
                </TableRow>
              ))}
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-[var(--text-muted)] py-6">
                    No payments recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Section>
      </div>
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
