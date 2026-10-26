"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { SharePdfButton } from "@/components/admin/docs/SharePdfButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { openDetailSheet, printEstimate } from "@/components/admin/docs/EstimateManager";
import type { Estimate } from "@/lib/doc-types";
import { formatDate, formatMoney } from "@/lib/format";

/**
 * Every estimate for this client. A confirmed one is also its Detail Sheet, so both documents are
 * offered side by side; editing either one updates the Detail Sheet, the ledger due and any bill.
 */
export function DetailSheets({ estimates }: { estimates: Estimate[] }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] font-semibold text-sm">Estimates &amp; Detail Sheets</div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Estimate No.</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Open</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {estimates.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="whitespace-nowrap">{formatDate(e.doc_date)}</TableCell>
              <TableCell className="font-medium">
                {e.no}
                {e.site_name && <span className="block text-xs text-[var(--text-muted)]">{e.site_name}</span>}
              </TableCell>
              <TableCell>
                {e.confirmed_at ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Detail Sheet</Badge>
                ) : (
                  <Badge variant="secondary">Estimate</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">{formatMoney(Number(e.total))}</TableCell>
              <TableCell>
                <div className="flex justify-end flex-wrap gap-1">
                  <Button size="sm" variant="outline" onClick={() => printEstimate(e)}>
                    Estimate
                  </Button>
                  {e.confirmed_at && (
                    <Button size="sm" variant="outline" onClick={() => openDetailSheet(e)}>
                      Detail Sheet
                    </Button>
                  )}
                  <Button asChild size="sm" variant="outline" title="Edit">
                    <Link href={`/admin/estimates?edit=${e.id}`}>
                      <Pencil className="size-3.5" />
                    </Link>
                  </Button>
                  <SharePdfButton
                    print={() => (e.confirmed_at ? openDetailSheet(e) : printEstimate(e))}
                    title={`${e.client?.name ?? ""} ${e.confirmed_at ? "D" : "E"}-${e.no}`}
                    label={e.confirmed_at ? "Share Detail Sheet" : "Share"}
                  />
                  {e.confirmed_at && (
                    <SharePdfButton print={() => printEstimate(e)} title={`${e.client?.name ?? ""} E-${e.no}`} label="Share Estimate" />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {estimates.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-[var(--text-muted)] py-6">
                No estimates for this client yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
