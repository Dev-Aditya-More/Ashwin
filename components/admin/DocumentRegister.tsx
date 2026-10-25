"use client";

import { thisMonthIST } from "@/lib/today";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDocumentRegister } from "@/lib/actions/documents";
import type { RegisterRow } from "@/lib/doc-types";
import { formatDate, formatMoney } from "@/lib/format";

type RegType = "all" | "quotation" | "estimate" | "invoice" | "purchase";
const selectCls = "h-9 w-full rounded-md border border-[var(--border)] bg-background px-2 text-sm";

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** Month-wise register of quotations, estimates, invoices and purchases, with CSV export. */
export function DocumentRegister() {
  const [month, setMonth] = useState(() => thisMonthIST());
  const [type, setType] = useState<RegType>("all");
  const [rows, setRows] = useState<RegisterRow[]>([]);
  const [invoiceGst, setInvoiceGst] = useState(0);
  const [loadedKey, setLoadedKey] = useState("");

  useEffect(() => {
    let live = true;
    getDocumentRegister(month, type).then((r) => {
      if (!live) return;
      setRows(r.rows);
      setInvoiceGst(r.invoiceGst);
      setLoadedKey(`${month}|${type}`);
    });
    return () => {
      live = false;
    };
  }, [month, type]);

  function exportCsv() {
    const header = ["Date", "Type", "No", "Party", "Taxable", "GST", "Total", "Counts in Sales"];
    const body = rows.map((r) => [r.date, r.kind, r.no, r.party, r.taxable, r.gst, r.total, r.inSales ? "Yes" : "No"]);
    const csv = "﻿" + [header, ...body].map((r) => r.map(csvCell).join(",")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = `ASHWIN_Document_Register_${month}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // Quotations and estimates are paperwork, not income: an estimate that later becomes an invoice
  // must not be counted twice. Only invoices (GST and Non-GST) make up the sales figure.
  const documents = rows.filter((r) => r.group === "document");
  const sales = rows.filter((r) => r.inSales).reduce((a, r) => a + r.total, 0);
  const salesCount = rows.filter((r) => r.inSales).length;
  const purchases = rows.filter((r) => r.group === "purchase").reduce((a, r) => a + r.total, 0);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-2)] flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-sm">Month-wise Register</p>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={!rows.length}>
          <Download className="size-4" /> Export CSV
        </Button>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
          <div className="space-y-1.5">
            <p className="text-xs text-[var(--text-muted)]">Month</p>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-[var(--text-muted)]">Register</p>
            <select className={selectCls} value={type} onChange={(e) => setType(e.target.value as RegType)}>
              <option value="all">All documents</option>
              <option value="quotation">Quotation</option>
              <option value="estimate">Estimate</option>
              <option value="invoice">Invoices</option>
              <option value="purchase">Purchases (vendor bills)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ["Documents Issued", String(documents.length), "Quotations, estimates & invoices"],
            ["Sales (Invoices)", formatMoney(sales), `${salesCount} GST / Non-GST invoice${salesCount === 1 ? "" : "s"}`],
            ["Invoice GST", formatMoney(invoiceGst), "Tax on GST invoices"],
            ["Purchases", formatMoney(purchases), "Vendor bills received"],
          ].map(([label, value, hint]) => (
            <div key={label} className="rounded-lg border border-[var(--border)] p-3">
              <p className="text-xs text-[var(--text-muted)]">{label}</p>
              <p className="text-lg font-semibold mt-1">{value}</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{hint}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          Quotations and estimates are counted as documents but not as sales — an estimate that is later invoiced is
          only earned once, through its invoice.
        </p>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>No.</TableHead>
                <TableHead>Party</TableHead>
                <TableHead className="text-right">Taxable</TableHead>
                <TableHead className="text-right">GST</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>In Sales?</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i} className={r.inSales ? "" : "text-[var(--text-muted)]"}>
                  <TableCell className="whitespace-nowrap">{formatDate(r.date)}</TableCell>
                  <TableCell>{r.kind}</TableCell>
                  <TableCell className="font-medium">{r.no}</TableCell>
                  <TableCell>{r.party}</TableCell>
                  <TableCell className="text-right">{formatMoney(r.taxable)}</TableCell>
                  <TableCell className="text-right">{formatMoney(r.gst)}</TableCell>
                  <TableCell className="text-right">{formatMoney(r.total)}</TableCell>
                  <TableCell>
                    {r.inSales ? (
                      <span className="text-emerald-700 font-medium">Yes</span>
                    ) : r.group === "purchase" ? (
                      "Purchase"
                    ) : (
                      "No — document only"
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-[var(--text-muted)] py-8">
                    {loadedKey !== `${month}|${type}` ? "Loading…" : "No records for this month."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
