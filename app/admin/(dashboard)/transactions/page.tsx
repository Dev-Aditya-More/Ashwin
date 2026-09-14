import { Download } from "lucide-react";
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

export default async function TransactionsPage() {
  const transactions = await listTransactions(200);

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
          <a href="/admin/transactions/export">
            <Download className="size-4" /> Export CSV
          </a>
        </Button>
      </div>

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
