"use client";

import { todayIST } from "@/lib/today";

import { useState, useTransition } from "react";
import { Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteRowButton } from "@/components/admin/dialogs/DeleteRowButton";
import { DocCard, DocCardList, Field, SetupNotice, selectCls } from "@/components/admin/docs/shared";
import { deleteDocument, getNextDocNo, saveInvoice } from "@/lib/actions/documents";
import type { EstimateOption, GstInvoice } from "@/lib/doc-types";
import { printInvoiceDocument } from "@/lib/print/documents";
import { money } from "@/lib/print/frame";
import { formatDate } from "@/lib/format";
import { SharePdfButton } from "@/components/admin/docs/SharePdfButton";

const today = () => todayIST();

/** AE/2026/27-003 ⇄ AGS/2026/27-003: GST bills are ASHWIN ENTERPRISES (AE), Non-GST are ARNAV GLASS SERVICES (AGS). */
function withPrefix(no: string, type: "GST" | "Non-GST") {
  const prefix = type === "GST" ? "AE/" : "AGS/";
  return /^(AE|AGS)\//i.test(no) ? no.replace(/^(AE|AGS)\//i, prefix) : no;
}

export function printInvoice(inv: GstInvoice) {
  printInvoiceDocument(
    {
      no: inv.no,
      type: inv.invoice_type,
      siteName: inv.site_name,
      workType: inv.work_type,
      date: inv.doc_date,
      client: inv.client?.name ?? "",
      clientMobile: inv.client_mobile,
      clientAddress: inv.client_address,
      clientGstin: inv.client_gstin,
      subtotal: Number(inv.subtotal),
      discount: Number(inv.discount),
      transport: Number(inv.transport),
      hamali: Number(inv.hamali),
      taxable: Number(inv.taxable),
      gstRate: Number(inv.gst_rate),
      tax: Number(inv.tax),
      total: Number(inv.total),
      received: Number(inv.received),
    },
    inv.lines,
    { name: inv.client?.name ?? "", phone: inv.client?.phone, address: inv.client?.address, gstin: inv.client?.gstin }
  );
}

export function InvoiceManager({
  initialNo,
  estimates,
  rows,
  setup,
}: {
  initialNo: string;
  estimates: EstimateOption[];
  rows: GstInvoice[];
  setup: boolean;
}) {
  const [estimateId, setEstimateId] = useState("");
  const [no, setNo] = useState(initialNo);
  const [date, setDate] = useState(today());
  const [type, setType] = useState<"GST" | "Non-GST">("GST");
  const [gst, setGst] = useState(18);
  const [received, setReceived] = useState(0);
  const [pending, startTransition] = useTransition();

  const est = estimates.find((e) => e.id === estimateId);
  const taxable = Number(est?.taxable ?? est?.subtotal ?? 0);
  const rate = type === "GST" ? gst : 0;
  const tax = (taxable * rate) / 100;
  const invoiceTotal = type === "GST" ? Math.round(taxable + tax) : Math.round(taxable * 100) / 100;

  // GST bills are AE/…, Non-GST bills AGS/…, sharing one running serial. Switching the type only swaps
  // the prefix (no server round trip), so the number on screen can never lag behind the chosen type.
  function changeType(next: "GST" | "Non-GST") {
    setType(next);
    setNo((cur) => withPrefix(cur, next));
  }

  // An estimate can be billed once — as GST or Non-GST, not both.
  const invoicedBy = new Map(rows.filter((r) => r.estimate_id).map((r) => [r.estimate_id!, r.no]));

  function save() {
    startTransition(async () => {
      const res = await saveInvoice({ estimateId, no, date, type, gstRate: gst, received });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        type === "GST"
          ? "Invoice saved. GST statutory reporting must be verified with your accountant."
          : "Bill of Supply saved."
      );
      setEstimateId("");
      setReceived(0);
      setNo(withPrefix(await getNextDocNo("invoice"), type));
    });
  }

  return (
    <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6 items-start">
      {setup && (
        <div className="2xl:col-span-2">
          <SetupNotice />
        </div>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-white p-4 space-y-4">
        <h2 className="font-semibold text-sm">Create Invoice from Estimate</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Estimate">
            <select className={selectCls} value={estimateId} onChange={(e) => setEstimateId(e.target.value)}>
              <option value="">Select saved estimate</option>
              {estimates.map((e) => {
                const billed = invoicedBy.get(e.id);
                return (
                  <option key={e.id} value={e.id} disabled={!!billed}>
                    {e.no} — {e.client?.name} — {money(e.total)}
                    {billed ? ` (already billed: ${billed})` : ""}
                  </option>
                );
              })}
            </select>
          </Field>
          <Field label="Invoice Number">
            <Input value={no} onChange={(e) => setNo(e.target.value)} />
          </Field>
          <Field label="Invoice Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Invoice Type">
            <select className={selectCls} value={type} onChange={(e) => changeType(e.target.value as "GST" | "Non-GST")}>
              <option>GST</option>
              <option>Non-GST</option>
            </select>
          </Field>
          <Field label="GST % (GST invoice)">
            <select className={selectCls} value={gst} onChange={(e) => setGst(Number(e.target.value))}>
              {[0, 5, 12, 18, 28].map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </Field>
          <Field label="Advance / Received (₹)">
            <Input type="number" min="0" step="0.01" placeholder="0" value={received || ""} onChange={(e) => setReceived(Number(e.target.value))} />
          </Field>
        </div>

        <p className="rounded-md border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-sm">
          {est ? (
            <>
              Client: <b>{est.client?.name}</b> · GSTIN: {est.client?.gstin || "Not entered"} · Estimate: {est.no}
              <br />
              Taxable value: {money(taxable)} · GST {rate}%: {money(tax)} ·{" "}
              <b>{type === "GST" ? "Invoice total" : "Bill total (no GST)"}: {money(invoiceTotal)}</b>
              <br />
              {type === "GST"
                ? "Issued by ASHWIN ENTERPRISES. Payment QR will use UPI ID ashwinenterprises@icici and the invoice total."
                : "Bill of Supply issued by ARNAV GLASS SERVICES (no GST, no QR)."}
            </>
          ) : (
            "The bill amount will appear after you select an Estimate."
          )}
        </p>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={save} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />} Save Invoice
          </Button>
          <Button type="button" variant="outline" disabled={!rows.length} onClick={() => printInvoice(rows[0])}>
            <Printer className="size-4" /> Print / PDF
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] font-semibold text-sm">Saved Invoices</div>
        <DocCardList empty={rows.length === 0 && "No saved records yet."}>
          {rows.map((inv) => (
            <DocCard
              key={inv.id}
              title={inv.client?.name}
              subtitle={`${inv.no} · ${formatDate(inv.doc_date)}`}
              badge={
                <span className="text-[11px] text-[var(--text-muted)]">
                  {inv.invoice_type === "Non-GST" ? "ARNAV GLASS SERVICES (Non-GST)" : "ASHWIN ENTERPRISES (GST)"}
                </span>
              }
              amount={money(inv.total)}
              corner={
                <DeleteRowButton
                  what="invoice"
                  action={async () => {
                    const r = await deleteDocument("invoice", inv.id);
                    if (!r.ok) throw new Error(r.error);
                  }}
                />
              }
            >
              <Button size="sm" variant="outline" onClick={() => printInvoice(inv)}>
                <Printer className="size-3.5" /> View / Print
              </Button>
              <SharePdfButton print={() => printInvoice(inv)} title={`${inv.client?.name ?? ""} ${inv.no}`} />
            </DocCard>
          ))}
        </DocCardList>
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>No.</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Issued By</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="text-[var(--text-muted)] whitespace-nowrap">{formatDate(inv.doc_date)}</TableCell>
                  <TableCell className="font-medium">{inv.no}</TableCell>
                  <TableCell>{inv.client?.name}</TableCell>
                  <TableCell className="text-[var(--text-muted)]">
                    {inv.invoice_type === "Non-GST" ? "ARNAV GLASS SERVICES (Non-GST)" : "ASHWIN ENTERPRISES (GST)"}
                  </TableCell>
                  <TableCell className="text-right">{money(inv.total)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => printInvoice(inv)}>
                        View / Print
                      </Button>
                      <SharePdfButton print={() => printInvoice(inv)} title={`${inv.client?.name ?? ""} ${inv.no}`} />
                      <DeleteRowButton
                        what="invoice"
                        action={async () => {
                          const r = await deleteDocument("invoice", inv.id);
                          if (!r.ok) throw new Error(r.error);
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-[var(--text-muted)] py-8">
                    No saved records yet.
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
