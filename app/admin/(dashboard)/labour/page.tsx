import Link from "next/link";
import { Banknote } from "lucide-react";
import { listLabourers } from "@/lib/actions/labour";
import { AddLabourerDialog } from "@/components/admin/dialogs/LabourDialogs";
import { formatMoney } from "@/lib/format";
import { QuickContactActions } from "@/components/admin/QuickContactActions";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function LabourPage() {
  const labourers = await listLabourers();
  const totals = labourers.reduce(
    (acc, l) => ({
      totalWork: acc.totalWork + l.totalWork,
      totalPaid: acc.totalPaid + l.totalPaid,
      balance: acc.balance + l.balance,
    }),
    { totalWork: 0, totalPaid: 0, balance: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Labour</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {labourers.length} worker{labourers.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/labour/bulk-pay">
              <Banknote className="size-4" /> Bulk Pay
            </Link>
          </Button>
          <AddLabourerDialog />
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Default Rate</TableHead>
              <TableHead className="text-right">Total Owed</TableHead>
              <TableHead className="text-right">Total Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-center w-24">Contact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {labourers.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/labour/${l.id}`} className="hover:underline">
                    {l.name}
                  </Link>
                </TableCell>
                <TableCell className="text-[var(--text-muted)]">{l.phone ?? "—"}</TableCell>
                <TableCell className="text-[var(--text-muted)]">
                  {l.default_rate ? formatMoney(l.default_rate) : "—"}
                </TableCell>
                <TableCell className="text-right text-[var(--text-muted)]">
                  {l.totalWork ? formatMoney(l.totalWork) : "—"}
                </TableCell>
                <TableCell className="text-right text-[var(--text-muted)]">
                  {l.totalPaid ? formatMoney(l.totalPaid) : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {l.balance > 0 ? (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                      {formatMoney(l.balance)}
                    </Badge>
                  ) : l.balance < 0 ? (
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                      Advance {formatMoney(Math.abs(l.balance))}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Settled</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <QuickContactActions
                    id={l.id}
                    name={l.name}
                    phone={l.phone}
                    balance={l.balance}
                    category="Labour"
                  />
                </TableCell>
              </TableRow>
            ))}
            {labourers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-[var(--text-muted)] py-10">
                  No labourers yet. Add your first worker to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {labourers.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className="text-right">{formatMoney(totals.totalWork)}</TableCell>
                <TableCell className="text-right">{formatMoney(totals.totalPaid)}</TableCell>
                <TableCell className="text-right">
                  {formatMoney(totals.balance)}
                  {totals.balance < 0 ? " advance" : ""}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
