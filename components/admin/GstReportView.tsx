"use client";

import { useRouter } from "next/navigation";
import { Download, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { GstReport, SaleLine } from "@/lib/gst-report";
import { formatDate, formatMoney } from "@/lib/format";

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

function downloadCsv(name: string, header: string[], rows: (string | number)[][]) {
  const csv = "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const sum = <T,>(rows: T[], f: (r: T) => number) => Math.round(rows.reduce((s, r) => s + f(r), 0) * 100) / 100;

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-2)] flex items-center justify-between gap-2">
        <p className="font-semibold text-sm">{title}</p>
        {action}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function ExportBtn({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={disabled}>
      <Download className="size-4" /> CSV
    </Button>
  );
}

function SalesTable({ rows, withGstin }: { rows: SaleLine[]; withGstin: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Invoice</TableHead>
          <TableHead>Party</TableHead>
          {withGstin && <TableHead>GSTIN</TableHead>}
          <TableHead className="text-right">Taxable</TableHead>
          <TableHead className="text-right">CGST</TableHead>
          <TableHead className="text-right">SGST</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.no}>
            <TableCell className="whitespace-nowrap">{formatDate(r.date)}</TableCell>
            <TableCell className="font-medium">{r.no}</TableCell>
            <TableCell>{r.party}</TableCell>
            {withGstin && <TableCell className="font-mono text-xs">{r.gstin}</TableCell>}
            <TableCell className="text-right">{formatMoney(r.taxable)}</TableCell>
            <TableCell className="text-right">{formatMoney(r.cgst)}</TableCell>
            <TableCell className="text-right">{formatMoney(r.sgst)}</TableCell>
            <TableCell className="text-right">{formatMoney(r.total)}</TableCell>
          </TableRow>
        ))}
        {!rows.length && (
          <TableRow>
            <TableCell colSpan={withGstin ? 8 : 7} className="text-center text-[var(--text-muted)] py-6">
              None this month.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
      {rows.length > 0 && (
        <TableFooter>
          <TableRow>
            <TableCell colSpan={withGstin ? 4 : 3}>Total ({rows.length})</TableCell>
            <TableCell className="text-right">{formatMoney(sum(rows, (r) => r.taxable))}</TableCell>
            <TableCell className="text-right">{formatMoney(sum(rows, (r) => r.cgst))}</TableCell>
            <TableCell className="text-right">{formatMoney(sum(rows, (r) => r.sgst))}</TableCell>
            <TableCell className="text-right">{formatMoney(sum(rows, (r) => r.total))}</TableCell>
          </TableRow>
        </TableFooter>
      )}
    </Table>
  );
}

export function GstReportView({ month, report }: { month: string; report: GstReport }) {
  const router = useRouter();
  const s = report.summary;
  const saleHeader = ["Date", "Invoice No", "Party", "GSTIN", "Taxable", "CGST", "SGST", "Total"];
  const saleRows = (rows: SaleLine[]) => rows.map((r) => [r.date, r.no, r.party, r.gstin, r.taxable, r.cgst, r.sgst, r.total]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">GST Reports</h1>
          <p className="text-sm text-[var(--text-muted)]">Monthly summary for your CA: sales, HSN, and input credit.</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs text-[var(--text-muted)]">Month</p>
          <Input type="month" value={month} onChange={(e) => e.target.value && router.push(`/admin/gst-reports?month=${e.target.value}`)} className="w-44" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ["Outward taxable value", formatMoney(s.outwardTaxable), `${report.b2b.length + report.b2c.length} GST invoice${report.b2b.length + report.b2c.length === 1 ? "" : "s"}`],
          ["Output tax (CGST + SGST)", formatMoney(s.outputTax), `CGST ${formatMoney(s.cgst)} · SGST ${formatMoney(s.sgst)}`],
          ["Input credit (purchases)", formatMoney(s.itcClaimable), s.itcUnclaimable ? `${formatMoney(s.itcUnclaimable)} more has no supplier GSTIN` : "From vendor bills with a GSTIN"],
          [s.netPayable < 0 ? "Credit to carry forward" : "Net GST payable", formatMoney(Math.abs(s.netPayable)), "Output tax − input credit"],
        ].map(([label, value, hint], i) => (
          <div key={label} className={`rounded-xl border p-4 ${i === 3 ? "border-blue-200 bg-blue-50/50" : "border-[var(--border)] bg-white"}`}>
            <p className="text-xs text-[var(--text-muted)]">{label}</p>
            <p className="text-xl font-semibold mt-1">{value}</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{hint}</p>
          </div>
        ))}
      </div>

      {(s.outOfStateCount > 0 || s.nonGstCount > 0 || s.itcUnclaimable > 0) && (
        <ul className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          {s.outOfStateCount > 0 && (
            <li className="flex gap-1.5">
              <TriangleAlert className="size-3.5 shrink-0 mt-px" />
              {s.outOfStateCount} invoice{s.outOfStateCount === 1 ? " is" : "s are"} billed to a GSTIN outside Maharashtra but print CGST + SGST. Out-of-state sales are normally IGST, so check these with your CA.
            </li>
          )}
          {s.itcUnclaimable > 0 && (
            <li className="flex gap-1.5">
              <TriangleAlert className="size-3.5 shrink-0 mt-px" />
              {formatMoney(s.itcUnclaimable)} of purchase GST is left out of the credit because the vendor bill has no GSTIN. Add it on the bill to claim it.
            </li>
          )}
          {s.nonGstCount > 0 && (
            <li className="flex gap-1.5">
              <TriangleAlert className="size-3.5 shrink-0 mt-px" />
              {s.nonGstCount} Non-GST bill{s.nonGstCount === 1 ? "" : "s"} ({formatMoney(s.nonGstTurnover)}) are not in these figures. They are Bills of Supply with no GST.
            </li>
          )}
        </ul>
      )}

      <Card
        title="B2B sales (to GST-registered clients)"
        action={<ExportBtn disabled={!report.b2b.length} onClick={() => downloadCsv(`ASHWIN_B2B_${month}.csv`, saleHeader, saleRows(report.b2b))} />}
      >
        <SalesTable rows={report.b2b} withGstin />
      </Card>

      <Card
        title="B2C sales (clients without a GSTIN)"
        action={<ExportBtn disabled={!report.b2c.length} onClick={() => downloadCsv(`ASHWIN_B2C_${month}.csv`, saleHeader, saleRows(report.b2c))} />}
      >
        <SalesTable rows={report.b2c} withGstin={false} />
      </Card>

      <Card
        title="HSN summary"
        action={
          <ExportBtn
            disabled={!report.hsn.length}
            onClick={() => downloadCsv(`ASHWIN_HSN_${month}.csv`, ["HSN", "Taxable", "CGST", "SGST", "Total Tax"], report.hsn.map((h) => [h.hsn, h.taxable, h.cgst, h.sgst, h.tax]))}
          />
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>HSN / SAC</TableHead>
              <TableHead className="text-right">Taxable</TableHead>
              <TableHead className="text-right">CGST</TableHead>
              <TableHead className="text-right">SGST</TableHead>
              <TableHead className="text-right">Total tax</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.hsn.map((h) => (
              <TableRow key={h.hsn}>
                <TableCell className="font-medium">{h.hsn}</TableCell>
                <TableCell className="text-right">{formatMoney(h.taxable)}</TableCell>
                <TableCell className="text-right">{formatMoney(h.cgst)}</TableCell>
                <TableCell className="text-right">{formatMoney(h.sgst)}</TableCell>
                <TableCell className="text-right">{formatMoney(h.tax)}</TableCell>
              </TableRow>
            ))}
            {!report.hsn.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-[var(--text-muted)] py-6">None this month.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Card
        title="Purchases with GST (input credit)"
        action={
          <ExportBtn
            disabled={!report.purchases.length}
            onClick={() =>
              downloadCsv(
                `ASHWIN_Purchases_${month}.csv`,
                ["Date", "Bill No", "Vendor", "Vendor GSTIN", "Taxable", "GST", "Total", "Credit claimable"],
                report.purchases.map((p) => [p.date, p.billNo, p.vendor, p.gstin, p.taxable, p.gst, p.total, p.claimable ? "Yes" : "No - no GSTIN"])
              )
            }
          />
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Bill</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead className="text-right">Taxable</TableHead>
              <TableHead className="text-right">GST</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.purchases.map((p, i) => (
              <TableRow key={i}>
                <TableCell className="whitespace-nowrap">{formatDate(p.date)}</TableCell>
                <TableCell className="font-medium">{p.billNo}</TableCell>
                <TableCell>{p.vendor}</TableCell>
                <TableCell className="font-mono text-xs">{p.gstin || "—"}</TableCell>
                <TableCell className="text-right">{formatMoney(p.taxable)}</TableCell>
                <TableCell className="text-right">{formatMoney(p.gst)}</TableCell>
                <TableCell className="text-right">{formatMoney(p.total)}</TableCell>
                <TableCell>{p.claimable ? <span className="text-emerald-700 font-medium">Yes</span> : <span className="text-amber-700">No GSTIN</span>}</TableCell>
              </TableRow>
            ))}
            {!report.purchases.length && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-[var(--text-muted)] py-6">
                  No vendor bills with GST this month. Add the GST on a vendor bill (or scan it) to see it here.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
