import Link from "next/link";
import { Download, X } from "lucide-react";
import { listTransactions } from "@/lib/actions/transactions";
import { formatDate, formatMoney, shortName } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const KIND_LABEL: Record<string, string> = {
  client_work: "Work Billed",
  client_payment: "Payment Received",
  labour_work: "Work Entry",
  labour_payment: "Payment Made",
  vendor_bill: "Bill Added",
  vendor_payment: "Payment Made",
};

const CATEGORY_TONE: Record<string, string> = {
  Client: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Labour: "bg-amber-50 text-amber-700 border-amber-200",
  Vendor: "bg-rose-50 text-rose-700 border-rose-200",
};

const MONTH_LABEL: Record<string, string> = {
  "01": "January", "02": "February", "03": "March", "04": "April",
  "05": "May", "06": "June", "07": "July", "08": "August",
  "09": "September", "10": "October", "11": "November", "12": "December",
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const transactions = await listTransactions(200, undefined, month);
  const monthLabel = month ? `${MONTH_LABEL[month.slice(5, 7)] ?? ""} ${month.slice(0, 4)}` : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Transactions</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Every money-moving event, newest first — the single source of truth behind every balance.
          </p>
        </div>
        <Button asChild variant="outline">
          <a href={`/admin/transactions/export${month ? `?month=${month}` : ""}`}>
            <Download className="size-4" /> Export CSV
          </a>
        </Button>
      </div>

      {monthLabel && (
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 gap-1.5">
            Filtered: {monthLabel}
          </Badge>
          <Link
            href="/admin/transactions"
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1"
          >
            <X className="size-3" /> Clear
          </Link>
        </div>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Added By</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <Badge className={CATEGORY_TONE[t.category]}>{t.category}</Badge>
                </TableCell>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="text-[var(--text-muted)]">{KIND_LABEL[t.kind]}</TableCell>
                <TableCell className="text-[var(--text-muted)] max-w-[280px] truncate">
                  {t.description}
                </TableCell>
                <TableCell className="text-[var(--text-muted)]">{formatDate(t.date)}</TableCell>
                <TableCell className="text-[var(--text-muted)]">
                  {t.addedBy ? shortName(t.addedBy) : "—"}
                </TableCell>
                <TableCell
                  className={
                    "text-right font-medium " +
                    (t.direction === "in"
                      ? "text-emerald-600"
                      : t.direction === "out"
                      ? "text-rose-600"
                      : "")
                  }
                >
                  {t.direction === "in" ? "+ " : t.direction === "out" ? "- " : ""}
                  {formatMoney(t.amount)}
                </TableCell>
              </TableRow>
            ))}
            {transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-[var(--text-muted)] py-10">
                  No transactions yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
