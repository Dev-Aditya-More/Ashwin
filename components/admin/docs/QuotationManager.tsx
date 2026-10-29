"use client";

import { todayIST } from "@/lib/today";

import { useState, useTransition } from "react";
import { Loader2, Pencil, Plus, Printer, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteRowButton } from "@/components/admin/dialogs/DeleteRowButton";
import { ClientPicker, DocCard, DocCardList, Field, SetupNotice, WORK_TYPES, selectCls } from "@/components/admin/docs/shared";
import { deleteDocument, getNextDocNo, saveQuotation, updateQuotation } from "@/lib/actions/documents";
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
  converted = {},
}: {
  initialClients: DocClient[];
  initialNo: string;
  rows: Quotation[];
  setup: boolean;
  /** Quotation id → number of the estimate it became (those rows are struck through). */
  converted?: Record<string, string>;
}) {
  const [clients, setClients] = useState(initialClients);
  const [no, setNo] = useState(initialNo);
  const [date, setDate] = useState(today());
  const [clientId, setClientId] = useState("");
  const [site, setSite] = useState("");
  const [workType, setWorkType] = useState(WORK_TYPES[0]);
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<QuoteLine[]>([blank()]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const patch = (i: number, p: Partial<QuoteLine>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...p } : l)));

  /** Clear the form for a brand-new quotation (also leaves edit mode). */
  async function startNew() {
    setEditingId(null);
    setLines([blank()]);
    setSite("");
    setNote("");
    setNo(await getNextDocNo("quotation"));
  }

  /** Load a saved quotation into the form to change it. */
  function loadForEdit(q: Quotation) {
    setEditingId(q.id);
    setNo(q.no);
    setDate(q.doc_date);
    setClientId(q.client_id);
    setSite(q.site_name ?? "");
    setWorkType(q.work_type ?? WORK_TYPES[0]);
    setNote(q.note ?? "");
    setLines(q.lines?.length ? q.lines.map((l) => ({ ...l })) : [blank()]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function save() {
    startTransition(async () => {
      const header = { no, date, clientId, siteName: site, workType, note };
      const res = editingId ? await updateQuotation(editingId, header, lines) : await saveQuotation(header, lines);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(editingId ? "Quotation updated." : "Quotation saved.");
      await startNew();
    });
  }

  return (
    <div className="space-y-6">
      {setup && <SetupNotice />}

      <div className="rounded-xl border border-[var(--border)] bg-white p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-sm">{editingId ? `Edit Quotation ${no}` : "Create Quotation"}</h2>
          {editingId && (
            <Button type="button" variant="outline" size="sm" onClick={() => startNew()}>
              Cancel edit — new quotation
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="Client" className="sm:col-span-2">
            <ClientPicker
              clients={clients}
              value={clientId}
              onChange={setClientId}
              onCreated={(c) => setClients((cs) => [...cs, c].sort((a, b) => a.name.localeCompare(b.name)))}
            />
          </Field>
          <Field label="Document Number">
            <Input value={no} onChange={(e) => setNo(e.target.value)} />
          </Field>
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
          <Field label="Notes / Terms" className="sm:col-span-2 lg:col-span-3">
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
            {pending && <Loader2 className="size-4 animate-spin" />} {editingId ? "Update Quotation" : "Save Quotation"}
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
              title={<span className={converted[q.id] ? "line-through opacity-60" : ""}>{q.client?.name}</span>}
              subtitle={
                <span className={converted[q.id] ? "line-through opacity-60" : ""}>
                  {[q.no, formatDate(q.doc_date), q.site_name].filter(Boolean).join(" · ")}
                </span>
              }
              badge={converted[q.id] ? <span className="text-[11px] text-emerald-700">✓ Converted to Estimate {converted[q.id]}</span> : undefined}
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
              <Button size="sm" variant="outline" onClick={() => loadForEdit(q)}>
                <Pencil className="size-3.5" /> Edit
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
                <TableRow key={q.id} className={converted[q.id] ? "opacity-60" : ""}>
                  <TableCell className={`text-[var(--text-muted)] whitespace-nowrap ${converted[q.id] ? "line-through" : ""}`}>{formatDate(q.doc_date)}</TableCell>
                  <TableCell className={`font-medium ${converted[q.id] ? "line-through" : ""}`}>{q.no}</TableCell>
                  <TableCell className={converted[q.id] ? "line-through" : ""}>{q.client?.name}</TableCell>
                  <TableCell className="text-[var(--text-muted)]">
                    <span className={converted[q.id] ? "line-through" : ""}>{q.site_name ?? "—"}</span>
                    {converted[q.id] && <span className="ml-2 text-[11px] text-emerald-700">✓ Estimate {converted[q.id]}</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => printQuotation(q)}>
                        View / Print
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => loadForEdit(q)}>
                        <Pencil className="size-3.5" /> Edit
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
