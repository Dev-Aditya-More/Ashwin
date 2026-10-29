"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { SharePdfButton } from "@/components/admin/docs/SharePdfButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { openDetailSheet, printEstimate } from "@/components/admin/docs/EstimateManager";
import { printQuotation } from "@/components/admin/docs/QuotationManager";
import { DocCard, DocCardList } from "@/components/admin/docs/shared";
import type { Estimate, Quotation } from "@/lib/doc-types";
import { formatDate, formatMoney } from "@/lib/format";

/**
 * Every estimate for this client. A confirmed one is also its Detail Sheet, so both documents are
 * offered side by side; editing either one updates the Detail Sheet, the ledger due and any bill.
 */
export function DetailSheets({
  estimates,
  quotations = [],
  converted = {},
}: {
  estimates: Estimate[];
  quotations?: Quotation[];
  /** Quotation id → estimate no. it was converted into. */
  converted?: Record<string, string>;
}) {
  const nothing = estimates.length === 0 && quotations.length === 0;
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] font-semibold text-sm">Quotations, Estimates &amp; Detail Sheets</div>
      <DocCardList empty={nothing && "No quotations or estimates for this client yet."}>
        {quotations.map((q) => (
          <DocCard
            key={q.id}
            title={<span className={converted[q.id] ? "line-through opacity-60" : ""}>{q.no}</span>}
            subtitle={[formatDate(q.doc_date), q.site_name].filter(Boolean).join(" · ")}
            badge={
              <Badge className="bg-amber-50 text-amber-800 border-amber-200">
                {converted[q.id] ? `Quotation → Estimate ${converted[q.id]}` : "Quotation"}
              </Badge>
            }
          >
            <Button size="sm" variant="outline" onClick={() => printQuotation(q)}>
              Quotation
            </Button>
            <SharePdfButton print={() => printQuotation(q)} title={`${q.client?.name ?? ""} Q-${q.no}`} />
          </DocCard>
        ))}
        {estimates.map((e) => (
          <DocCard
            key={e.id}
            title={e.no}
            subtitle={[formatDate(e.doc_date), e.site_name].filter(Boolean).join(" · ")}
            amount={formatMoney(Number(e.total))}
            badge={
              e.confirmed_at ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Detail Sheet</Badge>
              ) : (
                <Badge variant="secondary">Estimate</Badge>
              )
            }
          >
            <Button size="sm" variant="outline" onClick={() => printEstimate(e)}>
              Estimate
            </Button>
            {e.confirmed_at && (
              <Button size="sm" variant="outline" onClick={() => openDetailSheet(e)}>
                Detail Sheet
              </Button>
            )}
            <Button asChild size="sm" variant="outline">
              <Link href={`/admin/estimates?edit=${e.id}`}>
                <Pencil className="size-3.5" /> Edit
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
          </DocCard>
        ))}
      </DocCardList>
      <Table className="hidden md:table">
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Document No.</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Open</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotations.map((q) => (
            <TableRow key={q.id}>
              <TableCell className="whitespace-nowrap">{formatDate(q.doc_date)}</TableCell>
              <TableCell className="font-medium">
                <span className={converted[q.id] ? "line-through opacity-60" : ""}>{q.no}</span>
                {q.site_name && <span className="block text-xs text-[var(--text-muted)]">{q.site_name}</span>}
              </TableCell>
              <TableCell>
                <Badge className="bg-amber-50 text-amber-800 border-amber-200">
                  {converted[q.id] ? `Quotation → Estimate ${converted[q.id]}` : "Quotation"}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-[var(--text-muted)]">—</TableCell>
              <TableCell>
                <div className="flex justify-end flex-wrap gap-1">
                  <Button size="sm" variant="outline" onClick={() => printQuotation(q)}>
                    Quotation
                  </Button>
                  <SharePdfButton print={() => printQuotation(q)} title={`${q.client?.name ?? ""} Q-${q.no}`} />
                </div>
              </TableCell>
            </TableRow>
          ))}
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
          {nothing && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-[var(--text-muted)] py-6">
                No quotations or estimates for this client yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
