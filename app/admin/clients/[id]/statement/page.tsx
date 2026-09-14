import { notFound } from "next/navigation";
import { getClient } from "@/lib/actions/clients";
import { formatDate, formatMoney } from "@/lib/format";
import { PrintButton } from "@/components/admin/PrintButton";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ClientStatementPage({
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
  const { client, work, payments } = data;
  if (!client) notFound();

  type Row = {
    date: string;
    description: string;
    debit: number; // work billed — increases what client owes
    credit: number; // payment received — decreases what client owes
    sortKey: string;
  };

  const rows: Row[] = [
    ...work.map((w) => ({
      date: w.work_date,
      description: w.description,
      debit: Number(w.amount),
      credit: 0,
      sortKey: `${w.work_date}-${w.created_at}`,
    })),
    ...payments.map((p) => ({
      date: p.payment_date,
      description: p.note ?? "Payment received",
      debit: 0,
      credit: Number(p.amount),
      sortKey: `${p.payment_date}-${p.created_at}`,
    })),
  ].sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  const withBalance: (Row & { balance: number })[] = [];
  for (const r of rows) {
    const previousBalance = withBalance.at(-1)?.balance ?? 0;
    withBalance.push({ ...r, balance: previousBalance + r.debit - r.credit });
  }

  const totalBilled = rows.reduce((a, r) => a + r.debit, 0);
  const totalPaid = rows.reduce((a, r) => a + r.credit, 0);

  const today = formatDate(new Date());

  return (
    <div className="max-w-3xl mx-auto p-6 sm:p-10 print:p-0">
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Link
          href={`/admin/clients/${id}`}
          className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="size-4" /> Back to client
        </Link>
        <PrintButton />
      </div>

      <header className="flex items-start justify-between border-b border-[var(--border)] pb-6 mb-6">
        <div>
          <p className="font-semibold text-lg">Ashwin Enterprises</p>
          <p className="text-sm text-[var(--text-muted)]">Statement of Account</p>
        </div>
        <p className="text-sm text-[var(--text-muted)]">{today}</p>
      </header>

      <div className="mb-8">
        <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">Billed To</p>
        <p className="font-semibold">{client.name}</p>
        {client.address && <p className="text-sm text-[var(--text-muted)]">{client.address}</p>}
        {client.phone && <p className="text-sm text-[var(--text-muted)]">{client.phone}</p>}
      </div>

      <table className="w-full text-sm mb-8">
        <thead>
          <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
            <th className="py-2 font-medium">Date</th>
            <th className="py-2 font-medium">Description</th>
            <th className="py-2 font-medium text-right">Billed</th>
            <th className="py-2 font-medium text-right">Paid</th>
            <th className="py-2 font-medium text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {withBalance.map((r, i) => (
            <tr key={i} className="border-b border-[var(--border)]">
              <td className="py-2 whitespace-nowrap">{formatDate(r.date)}</td>
              <td className="py-2">{r.description}</td>
              <td className="py-2 text-right">{r.debit ? formatMoney(r.debit) : ""}</td>
              <td className="py-2 text-right">{r.credit ? formatMoney(r.credit) : ""}</td>
              <td className="py-2 text-right font-medium">{formatMoney(r.balance)}</td>
            </tr>
          ))}
          {withBalance.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-[var(--text-muted)]">
                No transactions recorded yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-full sm:w-64 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Total Billed</span>
            <span className="font-medium">{formatMoney(totalBilled)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Total Paid</span>
            <span className="font-medium">{formatMoney(totalPaid)}</span>
          </div>
          <div className="flex justify-between border-t border-[var(--border)] pt-1.5 text-base">
            <span className="font-semibold">Balance Due</span>
            <span className="font-semibold">{formatMoney(totalBilled - totalPaid)}</span>
          </div>
        </div>
      </div>

      <p className="mt-16 text-xs text-[var(--text-muted)] text-center">
        This is a system-generated statement from Ashwin Enterprises.
      </p>
    </div>
  );
}
