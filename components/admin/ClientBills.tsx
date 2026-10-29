"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { invoiceIssuer, printInvoice } from "@/components/admin/docs/InvoiceManager";
import type { GstInvoice } from "@/lib/doc-types";
import { formatDate, formatMoney } from "@/lib/format";
import { SharePdfButton } from "@/components/admin/docs/SharePdfButton";
import { DocCard, DocCardList } from "@/components/admin/docs/shared";
import { Printer } from "lucide-react";

/** Both companies' bills for a client in one list. They do not change the ledger balance (no double counting). */
export function ClientBills({ bills }: { bills: GstInvoice[] }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <p className="font-semibold text-sm">Client Bills (GST + Non-GST)</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Bills from ASHWIN ENTERPRISES and ARNAV GLASS SERVICES are listed together here. The ledger balance is not
          changed by these bills.
        </p>
      </div>
      <DocCardList empty={bills.length === 0 && "No bills for this client yet."}>
        {bills.map((b) => (
          <DocCard
            key={b.id}
            title={b.no}
            subtitle={`${formatDate(b.doc_date)} · ${invoiceIssuer(b)}`}
            amount={formatMoney(Number(b.total))}
          >
            <Button size="sm" variant="outline" onClick={() => printInvoice(b)}>
              <Printer className="size-3.5" /> View / Print
            </Button>
            <SharePdfButton print={() => printInvoice(b)} title={`${b.client?.name ?? ""} ${b.no}`} />
          </DocCard>
        ))}
      </DocCardList>
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Bill No.</TableHead>
              <TableHead>Issued By</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="whitespace-nowrap">{formatDate(b.doc_date)}</TableCell>
                <TableCell className="font-medium">{b.no}</TableCell>
                <TableCell className="text-[var(--text-muted)]">
                  {invoiceIssuer(b)}
                </TableCell>
                <TableCell className="text-right">{formatMoney(Number(b.total))}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="outline" onClick={() => printInvoice(b)}>
                      View / Print
                    </Button>
                    <SharePdfButton print={() => printInvoice(b)} title={`${b.client?.name ?? ""} ${b.no}`} compact />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {bills.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-[var(--text-muted)] py-6">
                  No bills for this client yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
