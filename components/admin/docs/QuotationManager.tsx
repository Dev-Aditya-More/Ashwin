"use client";

import { todayIST } from "@/lib/today";

import { useState, useTransition } from "react";
import { Loader2, Plus, Printer, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteRowButton } from "@/components/admin/dialogs/DeleteRowButton";
import { ClientPicker, DocCard, DocCardList, Field, SetupNotice, WORK_TYPES, selectCls } from "@/components/admin/docs/shared";
import { deleteDocument, getNextDocNo, saveQuotation } from "@/lib/actions/documents";
import { UNITS, type QuoteLine } from "@/lib/doc-calc";
import type { DocClient, Quotation } from "@/lib/doc-types";
import { printQuotationOrEstimate } from "@/lib/print/documents";
import { formatDate } from "@/lib/format";
import { SharePdfButton } from "@/components/admin/docs/SharePdfButton";

const blank = (): QuoteLine => ({ name: "", unit: "Sq.Ft.", rate: 0 });
const today = () => todayIST();

export function printQuotation(q: Quotation) {
  printQuotationOrEstimate(
    "quotation",
    {
      no: q.no,
      date: q.doc_date,
      client: q.client?.name ?? "",
      clientMobile: q.client?.phone,
      clientAddress: q.client?.address,
      siteName: q.site_name,
      workType: q.work_type,
    },
    q.lines,
    { name: q.client?.name ?? "", phone: q.client?.phone, address: q.client?.address }
  );
}

export function QuotationManager({
  initialClients,
  initialNo,
  rows,
  setup,
}: {
  initialClients: DocClient[];
  initialNo: string;
  rows: Quotation[];
  setup: boolean;
}) {
  const [clients, setClients] = useState(initialClients);
  const [no, setNo] = useState(initialNo);
  const [date, setDate] = useState(today());
  const [clientId, setClientId] = useState("");
  const [site, setSite] = useState("");
  const [workType, setWorkType] = useState(WORK_TYPES[0]);
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<QuoteLine[]>([blank()]);
  const [pending, startTransition] = useTransition();

  const patch = (i: number, p: Partial<QuoteLine>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...p } : l)));

  function save() {
    startTransition(async () => {
      const res = await saveQuotation({ no, date, clientId, siteName: site, workType, note }, lines);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Quotation saved.");
      setLines([blank()]);
      setSite("");
      setNote("");
      setNo(await getNextDocNo("quotation"));
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
        <h2 className="font-semibold text-sm">Create Quotation</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Document Number">
            <Input value={no} onChange={(e) => setNo(e.target.value)} />
          </Field>
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Client">
            <ClientPicker
              clients={clients}
              value={clientId}
              onChange={setClientId}
              onCreated={(c) => setClients((cs) => [...cs, c].sort((a, b) => a.name.localeCompare(b.name)))}
            />
          </Field>
          <Field label="Site Name">
            <Input value={site} placeholder="Site / Project Name" onChange={(e) => setSite(e.target.value)} />
          </Field>
          <Field label="Work Type">
            <select className={selectCls} value={workType} onChange={(e) => setWorkType(e.target.value)}>
              {WORK_TYPES.map((w) => (
                <option key={w}>{w}</option>
              ))}
            </select>
          </Field>
          <Field label="Notes / Terms">
            <Input value={note} placeholder="Notes / Terms" onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>

        <p className="rounded-md border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-sm">
          A Quotation only needs Description, Unit and Rate. Dimensions, Qty, Amount and GST are available in
          Estimate.
        </p>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="w-36">Unit</TableHead>
                <TableHead className="w-36">Rate ₹</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((l, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Input value={l.name} placeholder="Description / Work" onChange={(e) => patch(i, { name: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <select className={selectCls} value={l.unit} onChange={(e) => patch(i, { unit: e.target.value })}>
                      {UNITS.map((u) => (
                        <option key={u}>{u}</option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <Input type="number" min="0" step="0.01" placeholder="0" value={l.rate || ""} onChange={(e) => patch(i, { rate: Number(e.target.value) })} />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={lines.length === 1}
                      onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                    >
                      <X className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setLines((ls) => [...ls, blank()])}>
            <Plus className="size-4" /> Add Description
          </Button>
          <Button type="button" onClick={save} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />} Save Quotation
          </Button>
          <Button type="button" variant="outline" disabled={!rows.length} onClick={() => printQuotation(rows[0])}>
            <Printer className="size-4" /> Print / PDF
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] font-semibold text-sm">Saved Quotations</div>
        <DocCardList empty={rows.length === 0 && "No saved records yet."}>
          {rows.map((q) => (
            <DocCard
              key={q.id}
              title={q.client?.name}
              subtitle={[q.no, formatDate(q.doc_date), q.site_name].filter(Boolean).join(" · ")}
              corner={
                <DeleteRowButton
                  what="quotation"
                  action={async () => {
                    const r = await deleteDocument("quotation", q.id);
                    if (!r.ok) throw new Error(r.error);
                  }}
                />
              }
            >
              <Button size="sm" variant="outline" onClick={() => printQuotation(q)}>
                <Printer className="size-3.5" /> View / Print
              </Button>
              <SharePdfButton print={() => printQuotation(q)} title={`${q.client?.name ?? ""} Q-${q.no}`} />
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
                <TableHead>Site</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="text-[var(--text-muted)] whitespace-nowrap">{formatDate(q.doc_date)}</TableCell>
                  <TableCell className="font-medium">{q.no}</TableCell>
                  <TableCell>{q.client?.name}</TableCell>
                  <TableCell className="text-[var(--text-muted)]">{q.site_name ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => printQuotation(q)}>
                        View / Print
                      </Button>
                      <SharePdfButton print={() => printQuotation(q)} title={`${q.client?.name ?? ""} Q-${q.no}`} />
                      <DeleteRowButton
                        what="quotation"
                        action={async () => {
                          const r = await deleteDocument("quotation", q.id);
                          if (!r.ok) throw new Error(r.error);
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-[var(--text-muted)] py-8">
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
