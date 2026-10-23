"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { openDetailSheet } from "@/components/admin/docs/EstimateManager";
import type { Estimate } from "@/lib/doc-types";
import { formatDate, formatMoney } from "@/lib/format";

/** Confirmed estimates for a client — the "Client Estimate / Detail Sheets" panel of the ledger. */
export function DetailSheets({ sheets }: { sheets: Estimate[] }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] font-semibold text-sm">
        Client Estimate / Detail Sheets
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Estimate / Bill No.</TableHead>
              <TableHead>Site</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sheets.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{formatDate(s.doc_date)}</TableCell>
                <TableCell className="font-medium">{s.no}</TableCell>
                <TableCell className="text-[var(--text-muted)]">{s.site_name ?? "—"}</TableCell>
                <TableCell className="text-right">{formatMoney(Number(s.total))}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => openDetailSheet(s)}>
                    Open Detail Sheet
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {sheets.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-[var(--text-muted)] py-6">
                  No confirmed detail sheets for this client yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
