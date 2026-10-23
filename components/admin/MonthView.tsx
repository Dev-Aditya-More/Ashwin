"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getDaywiseTransactions,
  getMonthSummary,
  type DaywiseRow,
  type MonthSummary,
} from "@/lib/actions/month-view";
import { formatDate, formatMoney } from "@/lib/format";

/** Dashboard "Month View": totals for a chosen month, per-party-type split, and a day-wise drill-down. */
export function MonthView() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [data, setData] = useState<MonthSummary | null>(null);
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState<DaywiseRow[] | null>(null);

  useEffect(() => {
    let live = true;
    getMonthSummary(month).then((d) => live && setData(d));
    return () => {
      live = false;
    };
  }, [month]);

  async function openDaywise() {
    if (!month) return;
    setOpen(true);
    setDays(null);
    setDays(await getDaywiseTransactions(month));
  }

  const dates = Array.from(new Set((days ?? []).map((d) => d.date))).sort();

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-2)] flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-sm">Month View</p>
        <Button variant="outline" size="sm" onClick={openDaywise}>
          <CalendarDays className="size-4" /> Day-wise transactions
        </Button>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1.5 col-span-2 lg:col-span-1">
            <p className="text-xs text-[var(--text-muted)]">Select Month (double-click for day-wise)</p>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} onDoubleClick={openDaywise} />
          </div>
          <Stat label="Document / Transaction Count" value={String(data?.documentCount ?? 0)} />
          <Stat label="Transactions Total" value={formatMoney(data?.paymentTotal ?? 0)} />
          <Stat label="GST Invoice Total" value={formatMoney(data?.invoiceTotal ?? 0)} />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Party Type</TableHead>
                <TableHead className="text-right">Money Received</TableHead>
                <TableHead className="text-right">Money Paid / Refunded</TableHead>
                <TableHead className="text-right">Payment Transactions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.breakdown ?? []).map((b) => (
                <TableRow key={b.type}>
                  <TableCell className="font-medium">{b.type}</TableCell>
                  <TableCell className="text-right">{formatMoney(b.incoming)}</TableCell>
                  <TableCell className="text-right">{formatMoney(b.outgoing)}</TableCell>
                  <TableCell className="text-right">{b.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Day-wise Transactions ({month})</DialogTitle>
          </DialogHeader>
          {days === null ? (
            <p className="text-sm text-[var(--text-muted)] py-6 text-center">Loading…</p>
          ) : dates.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-6 text-center">No transactions found for this month.</p>
          ) : (
            dates.map((d) => (
              <div key={d} className="space-y-1.5">
                <p className="text-sm font-semibold">{formatDate(d)}</p>
                <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Party</TableHead>
                        <TableHead>Party Type</TableHead>
                        <TableHead>Transaction</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {days.filter((r) => r.date === d).map((r, i) => (
                        <TableRow key={i}>
                          <TableCell>{r.party}</TableCell>
                          <TableCell>{r.partyType}</TableCell>
                          <TableCell>{r.transaction}</TableCell>
                          <TableCell className="text-right">{formatMoney(r.amount)}</TableCell>
                          <TableCell>{r.mode ?? ""}</TableCell>
                          <TableCell className="max-w-48 truncate">{r.note ?? ""}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}
