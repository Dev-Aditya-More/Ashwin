"use client";

import { useState, useTransition } from "react";
import { Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteRowButton } from "@/components/admin/dialogs/DeleteRowButton";
import { Field, SetupNotice, selectCls } from "@/components/admin/docs/shared";
import { deleteDocument, getNextDocNo, saveInvoice } from "@/lib/actions/documents";
import type { Estimate, GstInvoice } from "@/lib/doc-types";
import { printTaxInvoice } from "@/lib/print/documents";
import { money } from "@/lib/print/frame";
import { formatDate } from "@/lib/format";

const today = () => new Date().toISOString().slice(0, 10);

export function printInvoice(inv: GstInvoice) {
  printTaxInvoice(
    {
      no: inv.no,
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
  estimates: Estimate[];
  rows: GstInvoice[];
  setup: boolean;
}) {
  const [estimateId, setEstimateId] = useState("");
  const [no, setNo] = useState(initialNo);
  const [date, setDate] = useState(today());
  const [type, setType] = useState<"GST" | "Non-GST">("GST");
  const [gst, setGst] = useState(18);
  const [pending, startTransition] = useTransition();

  const est = estimates.find((e) => e.id === estimateId);
  const taxable = Number(est?.taxable ?? est?.subtotal ?? 0);
  const rate = type === "GST" ? gst : 0;
  const tax = (taxable * rate) / 100;

  function save() {
    startTransition(async () => {
      const res = await saveInvoice({ estimateId, no, date, type, gstRate: gst });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Invoice saved. GST statutory reporting must be verified with your accountant.");
      setEstimateId("");
      setNo(await getNextDocNo("invoice"));
    });
  }

  return (
    <div className="space-y-6">
      {setup && <SetupNotice />}

      <div className="rounded-xl border border-[var(--border)] bg-white p-4 space-y-4">
        <h2 className="font-semibold text-sm">Create Invoice from Estimate</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Estimate">
            <select className={selectCls} value={estimateId} onChange={(e) => setEstimateId(e.target.value)}>
              <option value="">Select saved estimate</option>
              {estimates.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.no} — {e.client?.name} — {money(e.total)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Invoice Number">
            <Input value={no} onChange={(e) => setNo(e.target.value)} />
          </Field>
          <Field label="Invoice Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Invoice Type">
            <select className={selectCls} value={type} onChange={(e) => setType(e.target.value as "GST" | "Non-GST")}>
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
        </div>

        <p className="rounded-md border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-sm">
          {est ? (
            <>
              Client: <b>{est.client?.name}</b> · GSTIN: {est.client?.gstin || "Not entered"} · Estimate: {est.no}
              <br />
              Taxable value: {money(taxable)} · GST {rate}%: {money(tax)} ·{" "}
              <b>Invoice total: {money(Math.round(taxable + tax))}</b>
              <br />
              Payment QR will use UPI ID ashwinenterprises@icici and the invoice total.
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.no}</TableCell>
                  <TableCell className="text-[var(--text-muted)]">{formatDate(inv.doc_date)}</TableCell>
                  <TableCell>{inv.client?.name}</TableCell>
                  <TableCell className="text-[var(--text-muted)]">{inv.invoice_type}</TableCell>
                  <TableCell className="text-right">{money(inv.total)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => printInvoice(inv)}>
                        View / Print
                      </Button>
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
