"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Plus, Printer, Settings2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteRowButton } from "@/components/admin/dialogs/DeleteRowButton";
import { ClientPicker, Field, SetupNotice, WORK_TYPES, selectCls } from "@/components/admin/docs/shared";
import {
  addCatalogItem,
  convertToDetailSheet,
  deleteDocument,
  getNextDocNo,
  saveEstimate,
} from "@/lib/actions/documents";
import {
  CATALOG_KEYS,
  CATALOG_LABEL,
  GST_RATES,
  UNITS,
  calcEstimate,
  calcEstimateLine,
  type CatalogKey,
  type EstimateLineInput,
} from "@/lib/doc-calc";
import type { CatalogMap, DocClient, Estimate, Quotation } from "@/lib/doc-types";
import { printDetailSheet, printQuotationOrEstimate, type PrintDoc } from "@/lib/print/documents";
import { fmt, money } from "@/lib/print/frame";
import { formatDate } from "@/lib/format";

const today = () => new Date().toISOString().slice(0, 10);
const CUSTOM = "__custom__";

const FIELD_OF: Record<CatalogKey, keyof EstimateLineInput> = {
  product: "productType",
  sheet: "sheetType",
  material: "materialType",
  glass: "glassType",
  shade: "shadeType",
  floor: "floorType",
};

const newLine = (cat: CatalogMap): EstimateLineInput => ({
  productType: cat.product?.[0] ?? "",
  sheetType: cat.sheet?.[0] ?? "",
  materialType: cat.material?.[0] ?? "",
  glassType: cat.glass?.[0] ?? "",
  shadeType: cat.shade?.[0] ?? "",
  floorType: cat.floor?.[0] ?? "",
  height: "0",
  length: "0",
  qty: 1,
  unit: "Sq.Ft.",
  rate: 0,
});

export function estimatePrintDoc(e: Estimate): PrintDoc {
  return {
    no: e.no,
    date: e.doc_date,
    client: e.client?.name ?? "",
    clientMobile: e.client?.phone,
    clientAddress: e.client?.address,
    siteName: e.site_name,
    workType: e.work_type,
    subtotal: Number(e.subtotal),
    discount: Number(e.discount),
    afterDiscount: Number(e.after_discount),
    transport: Number(e.transport),
    hamali: Number(e.hamali),
    taxable: Number(e.taxable),
    gstRate: Number(e.gst_rate),
    tax: Number(e.tax),
    total: Number(e.total),
  };
}

export function printEstimate(e: Estimate) {
  printQuotationOrEstimate("estimate", estimatePrintDoc(e), e.lines, {
    name: e.client?.name ?? "",
    phone: e.client?.phone,
    address: e.client?.address,
  });
}

export function openDetailSheet(e: Estimate) {
  printDetailSheet(estimatePrintDoc(e), e.lines);
}

export function EstimateManager({
  initialClients,
  initialNo,
  catalog: initialCatalog,
  rows,
  quotations,
  setup,
}: {
  initialClients: DocClient[];
  initialNo: string;
  catalog: CatalogMap;
  rows: Estimate[];
  quotations: Quotation[];
  setup: boolean;
}) {
  const [clients, setClients] = useState(initialClients);
  const [catalog, setCatalog] = useState(initialCatalog);
  const [no, setNo] = useState(initialNo);
  const [date, setDate] = useState(today());
  const [clientId, setClientId] = useState("");
  const [site, setSite] = useState("");
  const [workType, setWorkType] = useState(WORK_TYPES[0]);
  const [note, setNote] = useState("");
  const [gstRate, setGstRate] = useState(18);
  const [discountPct, setDiscountPct] = useState(0);
  const [transport, setTransport] = useState(0);
  const [hamali, setHamali] = useState(0);
  const [lines, setLines] = useState<EstimateLineInput[]>([newLine(initialCatalog)]);
  const [sourceQuoteId, setSourceQuoteId] = useState("");
  const [manageOpen, setManageOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const totals = useMemo(
    () => calcEstimate(lines, { discountPct, transport, hamali, gstRate }),
    [lines, discountPct, transport, hamali, gstRate]
  );

  const patch = (i: number, p: Partial<EstimateLineInput>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...p } : l)));

  async function addOption(key: CatalogKey, value: string): Promise<boolean> {
    const v = value.trim();
    if (!v) return false;
    const res = await addCatalogItem(key, v);
    if (!res.ok) {
      toast.error(res.error);
      return false;
    }
    setCatalog((c) =>
      (c[key] ?? []).some((x) => x.toLowerCase() === v.toLowerCase()) ? c : { ...c, [key]: [...(c[key] ?? []), v] }
    );
    return true;
  }

  async function onCatalogChange(i: number, key: CatalogKey, value: string) {
    if (value !== CUSTOM) return patch(i, { [FIELD_OF[key]]: value } as Partial<EstimateLineInput>);
    const v = window.prompt(`New ${CATALOG_LABEL[key]} — enter:`);
    if (v && (await addOption(key, v))) patch(i, { [FIELD_OF[key]]: v.trim() } as Partial<EstimateLineInput>);
  }

  function loadQuote(id: string) {
    setSourceQuoteId(id);
    const q = quotations.find((x) => x.id === id);
    if (!q) return;
    setClientId(q.client_id);
    setDate(today());
    setWorkType(q.work_type ?? WORK_TYPES[0]);
    setSite(q.site_name ?? "");
    setNote(q.note ?? "");
    setLines([newLine(catalog)]);
    toast.info("Client / Site / Work Type loaded. Quotation descriptions were not copied — select Estimate items separately.");
  }

  function save() {
    startTransition(async () => {
      const res = await saveEstimate(
        { no, date, clientId, siteName: site, workType, note, sourceQuoteId, discountPct, transport, hamali, gstRate },
        lines
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Estimate saved.");
      setLines([newLine(catalog)]);
      setSite("");
      setNote("");
      setSourceQuoteId("");
      setDiscountPct(0);
      setTransport(0);
      setHamali(0);
      setNo(await getNextDocNo("estimate"));
    });
  }

  function convert(e: Estimate) {
    if (!window.confirm(`${e.client?.name}: confirm Estimate ${e.no} as a Detail Sheet? This will create a Due entry in the Client Ledger.`)) return;
    startTransition(async () => {
      const res = await convertToDetailSheet(e.id);
      if (res.ok) toast.success(res.message ?? "Detail Sheet created.");
      else toast.error(res.error);
    });
  }

  const catSelect = (l: EstimateLineInput, i: number, key: CatalogKey) => (
    <select
      className={selectCls}
      value={l[FIELD_OF[key]] as string}
      onChange={(e) => onCatalogChange(i, key, e.target.value)}
    >
      {(catalog[key] ?? []).map((o) => (
        <option key={o}>{o}</option>
      ))}
      {!(catalog[key] ?? []).includes(l[FIELD_OF[key]] as string) && l[FIELD_OF[key]] && (
        <option>{l[FIELD_OF[key]] as string}</option>
      )}
      <option value={CUSTOM}>+ Add new option…</option>
    </select>
  );

  return (
    <div className="space-y-6">
      {setup && <SetupNotice />}

      <div className="rounded-xl border border-[var(--border)] bg-white p-4 space-y-4">
        <h2 className="font-semibold text-sm">Create Estimate</h2>

        <Field label="Create Estimate from an existing Quotation (optional)">
          <select className={`${selectCls} max-w-xl`} value={sourceQuoteId} onChange={(e) => loadQuote(e.target.value)}>
            <option value="">Select quotation</option>
            {quotations.map((q) => (
              <option key={q.id} value={q.id}>
                {q.no} — {q.client?.name} — {q.site_name ?? ""}
              </option>
            ))}
          </select>
        </Field>

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
          <Field label="GST % (Estimate)">
            <select className={selectCls} value={gstRate} onChange={(e) => setGstRate(Number(e.target.value))}>
              {GST_RATES.map((g) => (
                <option key={g} value={g}>
                  {g === 0 ? "0% / Non-GST" : `${g}%`}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notes / Terms" className="md:col-span-3">
            <Input value={note} placeholder="Notes / Terms" onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>

        <p className="rounded-md border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-sm">
          Measurement rules: enter inches as decimals (45.375) or fractions (45 3/8). &quot;45 1&quot; is read as 45 + 1/8
          inch. Each dimension is rounded up to the next half-foot — 62.25″ → 5.5 ft, 68.5″ → 6 ft. Sq.Ft. = Height(ft)
          × Length(ft) × Qty.
        </p>

        <div className="overflow-x-auto">
          <Table className="min-w-[1500px]">
            <TableHeader>
              <TableRow>
                {["Product Type", "Sheet Type", "Material Type", "Glass Type", "Shade Type", "Floor Type", "Height (inch)", "Length (inch)", "Qty", "Height (ft)", "Length (ft)", "Sq.Ft.", "Unit", "Rate ₹", "Amount ₹", ""].map(
                  (h, i) => (
                    <TableHead key={i} className="whitespace-normal">
                      {h}
                    </TableHead>
                  )
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((l, i) => {
                const c = calcEstimateLine(l);
                return (
                  <TableRow key={i}>
                    <TableCell className="min-w-36">{catSelect(l, i, "product")}</TableCell>
                    <TableCell className="min-w-28">{catSelect(l, i, "sheet")}</TableCell>
                    <TableCell className="min-w-32">{catSelect(l, i, "material")}</TableCell>
                    <TableCell className="min-w-40">{catSelect(l, i, "glass")}</TableCell>
                    <TableCell className="min-w-32">{catSelect(l, i, "shade")}</TableCell>
                    <TableCell className="min-w-32">{catSelect(l, i, "floor")}</TableCell>
                    <TableCell className="min-w-28">
                      <Input inputMode="decimal" placeholder="e.g. 45 1/8" value={l.height} onChange={(e) => patch(i, { height: e.target.value })} />
                    </TableCell>
                    <TableCell className="min-w-28">
                      <Input inputMode="decimal" placeholder="e.g. 45 1/8" value={l.length} onChange={(e) => patch(i, { length: e.target.value })} />
                    </TableCell>
                    <TableCell className="min-w-20">
                      <Input type="number" min="1" value={l.qty} onChange={(e) => patch(i, { qty: Number(e.target.value) })} />
                    </TableCell>
                    <TableCell>{c.heightFt.toFixed(2)}</TableCell>
                    <TableCell>{c.lengthFt.toFixed(2)}</TableCell>
                    <TableCell>{c.sqft.toFixed(2)}</TableCell>
                    <TableCell className="min-w-24">
                      <select className={selectCls} value={l.unit} onChange={(e) => patch(i, { unit: e.target.value })}>
                        {UNITS.map((u) => (
                          <option key={u}>{u}</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="min-w-28">
                      <Input type="number" min="0" step="0.01" value={l.rate} onChange={(e) => patch(i, { rate: Number(e.target.value) })} />
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{fmt(c.amount)}</TableCell>
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
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setLines((ls) => [...ls, newLine(catalog)])}>
            <Plus className="size-4" /> Add Estimate Item
          </Button>
          <Button type="button" variant="outline" onClick={() => setManageOpen(true)}>
            <Settings2 className="size-4" /> Manage Items / Add Dropdown Options
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
          <Field label="Discount (%)">
            <Input type="number" min="0" max="100" step="0.01" value={discountPct} onChange={(e) => setDiscountPct(Number(e.target.value))} />
          </Field>
          <Field label="Transport ₹">
            <Input type="number" min="0" step="0.01" value={transport} onChange={(e) => setTransport(Number(e.target.value))} />
          </Field>
          <Field label="Hamali ₹">
            <Input type="number" min="0" step="0.01" value={hamali} onChange={(e) => setHamali(Number(e.target.value))} />
          </Field>
        </div>

        <div className="text-right text-sm font-medium space-y-0.5">
          <div>Subtotal: {money(totals.subtotal)}</div>
          <div>
            Discount ({totals.discountPct}%): − {money(totals.discount)}
          </div>
          <div>After Discount: {money(totals.afterDiscount)}</div>
          <div>Transport: {money(totals.transport)}</div>
          <div>Hamali: {money(totals.hamali)}</div>
          <div>Taxable Amount: {money(totals.taxable)}</div>
          <div>
            GST ({totals.gstRate}%): {money(totals.tax)}
          </div>
          <div className="text-lg font-semibold">Total Amount: {money(totals.total)}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={save} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />} Save Estimate
          </Button>
          <Button type="button" variant="outline" disabled={!rows.length} onClick={() => printEstimate(rows[0])}>
            <Printer className="size-4" /> Print / PDF
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] font-semibold text-sm">Saved Estimates</div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.no}</TableCell>
                  <TableCell className="text-[var(--text-muted)]">{formatDate(e.doc_date)}</TableCell>
                  <TableCell>{e.client?.name}</TableCell>
                  <TableCell className="text-right">{money(e.total)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => printEstimate(e)}>
                        View / Print
                      </Button>
                      <Button size="sm" disabled={pending} onClick={() => convert(e)}>
                        Convert to Detail Sheet
                      </Button>
                      <DeleteRowButton
                        what="estimate"
                        action={async () => {
                          const r = await deleteDocument("estimate", e.id);
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
                    No unconverted Estimates. Converted Estimates are available as Detail Sheets in the Client page.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ManageItemsDialog open={manageOpen} onOpenChange={setManageOpen} catalog={catalog} onAdd={addOption} />
    </div>
  );
}

function ManageItemsDialog({
  open,
  onOpenChange,
  catalog,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  catalog: CatalogMap;
  onAdd: (key: CatalogKey, value: string) => Promise<boolean>;
}) {
  const [key, setKey] = useState<CatalogKey>("product");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    setBusy(true);
    if (await onAdd(key, value)) {
      toast.success("New option saved.");
      setValue("");
    }
    setBusy(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Items / Dropdown Options</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="List">
            <select className={selectCls} value={key} onChange={(e) => setKey(e.target.value as CatalogKey)}>
              {CATALOG_KEYS.map((k) => (
                <option key={k} value={k}>
                  {CATALOG_LABEL[k]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`New ${CATALOG_LABEL[key]} option`}>
            <Input value={value} onChange={(e) => setValue(e.target.value)} />
          </Field>
          <p className="text-xs text-[var(--text-muted)]">Current: {(catalog[key] ?? []).join(", ")}</p>
        </div>
        <DialogFooter>
          <Button onClick={add} disabled={busy || !value.trim()}>
            {busy && <Loader2 className="size-4 animate-spin" />} Add option
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
