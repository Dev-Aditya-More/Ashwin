"use client";

import { todayIST } from "@/lib/today";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Pencil, Plus, Printer, Settings2, X } from "lucide-react";
import { SharePdfButton } from "@/components/admin/docs/SharePdfButton";
import { useRouter } from "next/navigation";
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
import { ClientPicker, DocCard, DocCardList, Field, SetupNotice, WORK_TYPES, selectCls } from "@/components/admin/docs/shared";
import {
  addCatalogItem,
  convertToDetailSheet,
  deleteDocument,
  getNextDocNo,
  saveEstimate,
  updateEstimate,
} from "@/lib/actions/documents";
import {
  CATALOG_KEYS,
  CATALOG_LABEL,
  GST_RATES,
  UNITS,
  calcEstimate,
  calcEstimateLine,
  measureLabel,
  measureText,
  unitKind,
  unitNeedsSize,
  describeInches,
  lineToInput,
  sameItemKey,
  sizeAsWritten,
  sizeInFeet,
  type CatalogKey,
  type EstimateLineInput,
} from "@/lib/doc-calc";
import type { CatalogMap, DocClient, Estimate, Quotation } from "@/lib/doc-types";
import { printDetailSheet, printQuotationOrEstimate, type PrintDoc } from "@/lib/print/documents";
import { fmt, money } from "@/lib/print/frame";
import { formatDate } from "@/lib/format";

const today = () => todayIST();
const CUSTOM = "__custom__";

const FIELD_OF: Record<CatalogKey, keyof EstimateLineInput> = {
  product: "productType",
  sheet: "sheetType",
  material: "materialType",
  glass: "glassType",
  shade: "shadeType",
  floor: "floorType",
};

/** Civil / Interior estimates are charged as fees; Glass & Aluminium is measured item by item. */
const FEES_FOR: Record<string, string[]> = {
  Civil: ["Civil Fees"],
  Interior: ["Interior Fees"],
  "Civil & Interior": ["Civil Fees", "Interior Fees"],
};

const newLine = (cat: CatalogMap): EstimateLineInput => ({
  productType: cat.product?.[0] ?? "",
  sheetType: cat.sheet?.[0] ?? "",
  materialType: cat.material?.[0] ?? "",
  glassType: cat.glass?.[0] ?? "",
  shadeType: cat.shade?.[0] ?? "",
  floorType: cat.floor?.[0] ?? "",
  height: "",
  length: "",
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

function formFrom(e: Estimate) {
  const inputs = (e.lines ?? []).map(lineToInput);
  const isFees = inputs.length > 0 && inputs.every((l) => l.lumpSum);
  return {
    no: e.no,
    date: e.doc_date,
    clientId: e.client_id,
    site: e.site_name ?? "",
    workType: e.work_type ?? "Glass & Aluminium",
    note: e.note ?? "",
    gstRate: Number(e.gst_rate) || 0,
    discountPct: Number(e.discount_pct) || 0,
    transport: Number(e.transport) || 0,
    hamali: Number(e.hamali) || 0,
    lines: isFees ? [] : inputs,
    fees: isFees ? Object.fromEntries(inputs.map((l) => [l.productType, (Number(l.rate) || 0) * (Number(l.qty) || 1)])) : {},
  };
}

export function EstimateManager({
  initialClients,
  initialNo,
  catalog: initialCatalog,
  rows,
  quotations,
  setup,
  editing,
}: {
  initialClients: DocClient[];
  initialNo: string;
  catalog: CatalogMap;
  rows: Estimate[];
  quotations: Quotation[];
  setup: boolean;
  /** Opened from a client's ledger with ?edit=<id>: start with that estimate loaded. */
  editing?: Estimate | null;
}) {
  const router = useRouter();
  const init = editing ? formFrom(editing) : null;
  const [editingId, setEditingId] = useState<string | null>(editing?.id ?? null);
  const [editingConfirmed, setEditingConfirmed] = useState(!!editing?.confirmed_at);
  const [clients, setClients] = useState(initialClients);
  const [catalog, setCatalog] = useState(initialCatalog);
  const [no, setNo] = useState(init?.no ?? initialNo);
  const [date, setDate] = useState(init?.date ?? today());
  const [clientId, setClientId] = useState(init?.clientId ?? "");
  const [site, setSite] = useState(init?.site ?? "");
  const [workType, setWorkType] = useState(init?.workType ?? "Glass & Aluminium");
  const [note, setNote] = useState(init?.note ?? "");
  const [gstRate, setGstRate] = useState(init?.gstRate ?? 18);
  const [discountPct, setDiscountPct] = useState(init?.discountPct ?? 0);
  // Transport and Hamali are entered for Glass & Aluminium only; Civil / Interior fee estimates never carry them.
  const [transportInput, setTransport] = useState(init?.transport ?? 0);
  const [hamaliInput, setHamali] = useState(init?.hamali ?? 0);
  // Items already added to the estimate, and the one being filled in (like the workbook's item panel).
  const [lines, setLines] = useState<EstimateLineInput[]>(init?.lines ?? []);
  const [draft, setDraft] = useState<EstimateLineInput>(() => newLine(initialCatalog));
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [fees, setFees] = useState<Record<string, number>>(init?.fees ?? {});
  const [sourceQuoteId, setSourceQuoteId] = useState("");
  const [manageOpen, setManageOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const client = clients.find((c) => c.id === clientId);
  const feeLabels = FEES_FOR[workType] ?? [];
  const byFees = feeLabels.length > 0;
  const transport = byFees ? 0 : transportInput;
  const hamali = byFees ? 0 : hamaliInput;
  // What gets saved: the measured items, or one line per fee for Civil / Interior work.
  const docLines = useMemo<EstimateLineInput[]>(
    () =>
      byFees
        ? feeLabels
            .filter((f) => (fees[f] ?? 0) > 0)
            .map((f) => ({ ...newLine({}), productType: f, unit: "LS", qty: 1, rate: fees[f], lumpSum: true }))
        : lines,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [byFees, workType, fees, lines]
  );
  const totals = useMemo(
    () => calcEstimate(docLines, { discountPct, transport, hamali, gstRate }),
    [docLines, discountPct, transport, hamali, gstRate]
  );
  const d = calcEstimateLine(draft);

  const patchDraft = (p: Partial<EstimateLineInput>) => setDraft((cur) => ({ ...cur, ...p }));

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

  async function onCatalogChange(key: CatalogKey, value: string) {
    if (value !== CUSTOM) return patchDraft({ [FIELD_OF[key]]: value } as Partial<EstimateLineInput>);
    const v = window.prompt(`New ${CATALOG_LABEL[key]} — enter:`);
    if (v && (await addOption(key, v))) patchDraft({ [FIELD_OF[key]]: v.trim() } as Partial<EstimateLineInput>);
  }

  function resetDraft() {
    // Keep the dropdown choices (most items on a site share material/glass/shade); clear the numbers.
    setDraft((cur) => ({ ...cur, height: "", length: "", qty: 1, rate: 0, note: "" }));
    setEditIdx(null);
  }

  function addItem() {
    const kind = unitKind(draft.unit);
    if ((kind === "sqft" || kind === "sqm") && (!d.heightIn || !d.lengthIn)) {
      toast.error("Enter Height and Length in inches (e.g. 45 3/8).");
      return;
    }
    if (kind === "rft" && !d.heightIn && !d.lengthIn) {
      toast.error("Enter the Length in inches (e.g. 62½) for a running-feet item.");
      return;
    }
    if (!(d.qty > 0)) {
      toast.error("Qty must be at least 1.");
      return;
    }
    if (editIdx !== null) {
      setLines((ls) => ls.map((l, i) => (i === editIdx ? draft : l)));
      toast.success(`Item ${editIdx + 1} updated.`);
    } else {
      // The same item again (same product, finish, size and rate) just raises the Qty of the existing line.
      const k = sameItemKey(draft);
      const at = lines.findIndex((l) => sameItemKey(l) === k);
      if (at >= 0) {
        const qty = (Number(lines[at].qty) || 0) + (Number(draft.qty) || 0);
        setLines((ls) => ls.map((l, i) => (i === at ? { ...l, qty } : l)));
        toast.success(`Same item already added — Qty of item ${at + 1} is now ${qty}.`);
      } else {
        setLines((ls) => [...ls, draft]);
      }
    }
    resetDraft();
  }

  function editItem(i: number) {
    setDraft(lines[i]);
    setEditIdx(i);
  }

  function removeItem(i: number) {
    setLines((ls) => ls.filter((_, idx) => idx !== i));
    if (editIdx === i) resetDraft();
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
    setLines([]);
    setDraft(newLine(catalog));
    setEditIdx(null);
    toast.info("Client / Site / Work Category loaded. Quotation descriptions were not copied — add Estimate items separately.");
  }

  function save() {
    if (byFees && !docLines.length) {
      toast.error(`Enter the ${feeLabels.join(" / ")}.`);
      return;
    }
    if (!byFees && !lines.length) {
      toast.error(
        draft.height || draft.length ? "Press “Add Item” to add the item you filled in, then save." : "Add at least one item."
      );
      return;
    }
    startTransition(async () => {
      const header = { no, date, clientId, siteName: site, workType, note, discountPct, transport, hamali, gstRate };
      const res = editingId
        ? await updateEstimate(editingId, header, docLines)
        : await saveEstimate({ ...header, sourceQuoteId }, docLines);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(editingId ? res.message ?? "Estimate updated." : "Estimate saved.");
      await startNew();
    });
  }

  /** Clear the form for a brand-new estimate (also leaves edit mode). */
  async function startNew() {
    setLines([]);
    setFees({});
    setDraft(newLine(catalog));
    setEditIdx(null);
    setSite("");
    setNote("");
    setSourceQuoteId("");
    setDiscountPct(0);
    setTransport(0);
    setHamali(0);
    setEditingId(null);
    setEditingConfirmed(false);
    if (editing) router.replace("/admin/estimates");
    setNo(await getNextDocNo("estimate"));
  }

  /** Load a saved estimate into the form to change it. */
  function loadForEdit(e: Estimate) {
    const f = formFrom(e);
    setEditingId(e.id);
    setEditingConfirmed(!!e.confirmed_at);
    setNo(f.no);
    setDate(f.date);
    setClientId(f.clientId);
    setSite(f.site);
    setWorkType(f.workType);
    setNote(f.note);
    setGstRate(f.gstRate);
    setDiscountPct(f.discountPct);
    setTransport(f.transport);
    setHamali(f.hamali);
    setLines(f.lines);
    setFees(f.fees);
    setDraft(newLine(catalog));
    setEditIdx(null);
    setSourceQuoteId("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function convert(e: Estimate) {
    if (!window.confirm(`${e.client?.name}: confirm Estimate ${e.no} as a Detail Sheet? This will create a Due entry in the Client Ledger.`)) return;
    startTransition(async () => {
      const res = await convertToDetailSheet(e.id);
      if (res.ok) toast.success(res.message ?? "Detail Sheet created.");
      else toast.error(res.error);
    });
  }

  const catSelect = (key: CatalogKey) => {
    const v = draft[FIELD_OF[key]] as string;
    return (
      <select className={selectCls} value={v} onChange={(e) => onCatalogChange(key, e.target.value)}>
        {(catalog[key] ?? []).map((o) => (
          <option key={o}>{o}</option>
        ))}
        {!(catalog[key] ?? []).includes(v) && v && <option>{v}</option>}
        <option value={CUSTOM}>+ Add new option…</option>
      </select>
    );
  };

  const readOnly = "bg-[var(--bg-2)] text-[var(--text-secondary)]";

  return (
    <div className="space-y-6">
      {setup && <SetupNotice />}

      <div className="rounded-xl border border-[var(--border)] bg-white p-4 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-sm">{editingId ? `Edit Estimate ${no}` : "Create Estimate"}</h2>
          {editingId && (
            <Button type="button" variant="outline" size="sm" onClick={() => startNew()}>
              Cancel edit — new estimate
            </Button>
          )}
        </div>
        {editingId && editingConfirmed && (
          <p className="rounded-md border-l-4 border-blue-400 bg-blue-50 px-3 py-2 text-sm">
            This estimate is confirmed as a Detail Sheet. Saving updates the Detail Sheet, the due in the client&apos;s
            ledger and any bill made from it.
          </p>
        )}

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

        {/* Client block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="Client Name" className="sm:col-span-2 lg:col-span-1">
            <ClientPicker
              clients={clients}
              value={clientId}
              onChange={setClientId}
              onCreated={(c) => setClients((cs) => [...cs, c].sort((a, b) => a.name.localeCompare(b.name)))}
            />
          </Field>
          <Field label="Mobile Number">
            <Input value={client?.phone ?? ""} readOnly placeholder="Select a client" className={readOnly} />
          </Field>
          <Field label="Client Address">
            <Input value={client?.address ?? ""} readOnly placeholder="Select a client" className={readOnly} />
          </Field>
          <Field label="Work Category">
            <select className={selectCls} value={workType} onChange={(e) => setWorkType(e.target.value)}>
              {WORK_TYPES.map((w) => (
                <option key={w}>{w}</option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Estimate Number">
            <Input value={no} onChange={(e) => setNo(e.target.value)} />
          </Field>
          <Field label="Site Name">
            <Input value={site} placeholder="Site / Project Name" onChange={(e) => setSite(e.target.value)} />
          </Field>
          <Field label="Notes / Terms" className="sm:col-span-2 lg:col-span-2">
            <Input value={note} placeholder="Notes / Terms" onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>

        {byFees ? (
          <div className="rounded-lg border border-[var(--border)] p-4 space-y-3">
            <p className="font-semibold text-sm uppercase tracking-wide">{workType} Fees</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
              {feeLabels.map((f) => (
                <Field key={f} label={`${f} ₹`}>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={fees[f] || ""}
                    onChange={(e) => setFees((cur) => ({ ...cur, [f]: Number(e.target.value) }))}
                  />
                </Field>
              ))}
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              {workType} estimates are charged as fees. Choose “Glass &amp; Aluminium” as the Work Category to enter measured
              items instead.
            </p>
          </div>
        ) : (
          <>
        {/* Item panel */}
        <div className="rounded-lg border border-[var(--border)] p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-sm uppercase tracking-wide">
              {editIdx !== null ? `Edit Item ${editIdx + 1}` : `${workType} Work Details`}
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={() => setManageOpen(true)}>
              <Settings2 className="size-4" /> Manage dropdown options
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <Field label="Material">{catSelect("material")}</Field>
            <Field label="Floor Type">{catSelect("floor")}</Field>
            <Field label="Product / Type">{catSelect("product")}</Field>
            <Field label="Glass Type">{catSelect("glass")}</Field>
            <Field label="Shade Type">{catSelect("shade")}</Field>
            <Field label="Unit">
              <select className={selectCls} value={draft.unit} onChange={(e) => patchDraft({ unit: e.target.value })}>
                {UNITS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </Field>
            <Field label={unitNeedsSize(draft.unit) && unitKind(draft.unit) !== "rft" ? "Height (Inch)" : "Height (Inch, optional)"}>
              <Input
                type="text"
                inputMode="text"
                autoComplete="off"
                placeholder="e.g. 45 3/8"
                value={draft.height}
                onChange={(e) => patchDraft({ height: e.target.value })}
              />
              <p className="text-[11px] text-[var(--text-muted)]">{describeInches(draft.height)}</p>
            </Field>
            <Field label={unitNeedsSize(draft.unit) ? "Length (Inch)" : "Length (Inch, optional)"}>
              <Input
                type="text"
                inputMode="text"
                autoComplete="off"
                placeholder="e.g. 62½"
                value={draft.length}
                onChange={(e) => patchDraft({ length: e.target.value })}
              />
              <p className="text-[11px] text-[var(--text-muted)]">{describeInches(draft.length)}</p>
            </Field>
            <Field label="Height (Ft)">
              <Input value={d.heightIn ? d.heightFt : ""} readOnly tabIndex={-1} className={readOnly} />
            </Field>
            <Field label="Length (Ft)">
              <Input value={d.lengthIn ? d.lengthFt : ""} readOnly tabIndex={-1} className={readOnly} />
            </Field>
            <Field label="Size">
              <Input value={sizeAsWritten(d)} readOnly tabIndex={-1} className={readOnly} />
            </Field>
            <Field label="Qty">
              <Input type="number" min="1" value={draft.qty || ""} placeholder="1" onChange={(e) => patchDraft({ qty: Number(e.target.value) })} />
            </Field>
            <Field label={`Billed ${measureLabel(draft.unit)}`}>
              <Input value={d.sqft ? measureText(d) : ""} readOnly tabIndex={-1} className={readOnly} />
            </Field>
            <Field label="Rate ₹">
              <Input type="number" min="0" step="0.01" placeholder="0" value={draft.rate || ""} onChange={(e) => patchDraft({ rate: Number(e.target.value) })} />
            </Field>
            <Field label="Amount ₹">
              <Input value={d.amount ? fmt(d.amount) : ""} readOnly tabIndex={-1} className={`${readOnly} font-semibold`} />
            </Field>
            <Field label="Notes (optional)" className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
              <Input
                value={draft.note ?? ""}
                placeholder="Anything extra for this item, e.g. with mosquito net, client to supply handles"
                onChange={(e) => patchDraft({ note: e.target.value })}
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={addItem}>
              <Plus className="size-4" /> {editIdx !== null ? "Update Item" : "Add Item"}
            </Button>
            {editIdx !== null && (
              <Button type="button" variant="outline" onClick={resetDraft}>
                Cancel edit
              </Button>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Type inches as fractions (45 3/8, 45-3/8, 45½) or decimals; documents print the size exactly as you typed it.
            The Unit decides the amount: Sq.Ft. = height × length (each rounded up to the next half-foot) × Qty; Sq.Mtr. =
            exact area in square metres × Qty; Rft. = length in feet (rounded up to the next half-foot) × Qty; Nos. / Set =
            Qty; LS = the rate is the whole amount.
          </p>
        </div>

        {/* Added items */}
        <div className="rounded-lg border border-[var(--border)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Material / Glass</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Billed</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((l, i) => {
                const c = calcEstimateLine(l);
                return (
                  <TableRow key={i} className={editIdx === i ? "bg-blue-50" : ""}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">
                      {l.productType}
                      {l.note?.trim() && (
                        <span className="block text-xs font-normal italic text-[var(--text-muted)]">{l.note}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[var(--text-muted)]">
                      {[l.materialType, l.glassType].filter(Boolean).join(" · ")}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {sizeAsWritten(c)}
                      <span className="block text-xs text-[var(--text-muted)]">{sizeInFeet(c)}</span>
                    </TableCell>
                    <TableCell className="text-right">{c.qty}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{measureText(c)}</TableCell>
                    <TableCell className="text-right">{fmt(c.rate)}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(c.amount)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button type="button" variant="ghost" size="icon-sm" title="Edit item" onClick={() => editItem(i)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon-sm" title="Remove item" onClick={() => removeItem(i)}>
                          <X className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {lines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-[var(--text-muted)] py-6">
                    No items yet — fill in the item details above and press “Add Item”.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

          </>
        )}

        {/* Charges + totals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="grid grid-cols-2 gap-3">
            <Field label="GST">
              <select className={selectCls} value={gstRate} onChange={(e) => setGstRate(Number(e.target.value))}>
                {GST_RATES.map((g) => (
                  <option key={g} value={g}>
                    {g === 0 ? "0% / Non-GST" : `${g}%`}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Discount (%)">
              <Input type="number" min="0" max="100" step="0.01" placeholder="0" value={discountPct || ""} onChange={(e) => setDiscountPct(Number(e.target.value))} />
            </Field>
            {!byFees && (
              <>
                <Field label="Transport ₹">
                  <Input type="number" min="0" step="0.01" placeholder="0" value={transportInput || ""} onChange={(e) => setTransport(Number(e.target.value))} />
                </Field>
                <Field label="Hamali ₹">
                  <Input type="number" min="0" step="0.01" placeholder="0" value={hamaliInput || ""} onChange={(e) => setHamali(Number(e.target.value))} />
                </Field>
              </>
            )}
          </div>

          <div className="rounded-lg bg-[var(--bg-2)] p-4 text-sm space-y-1">
            <Row label="Subtotal" value={money(totals.subtotal)} />
            {totals.discount > 0 && <Row label={`Discount (${totals.discountPct}%)`} value={`− ${money(totals.discount)}`} />}
            {totals.transport > 0 && <Row label="Transport" value={money(totals.transport)} />}
            {totals.hamali > 0 && <Row label="Hamali" value={money(totals.hamali)} />}
            <Row label="Taxable Amount" value={money(totals.taxable)} />
            <Row label={`GST (${totals.gstRate}%)`} value={money(totals.tax)} />
            <div className="flex justify-between border-t border-[var(--border)] pt-2 text-base font-semibold">
              <span>Total Amount</span>
              <span>{money(totals.total)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={save} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />} {editingId ? "Update Estimate" : "Save Estimate"}
          </Button>
          <Button type="button" variant="outline" disabled={!rows.length} onClick={() => printEstimate(rows[0])}>
            <Printer className="size-4" /> Print / PDF
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] font-semibold text-sm">Saved Estimates</div>
        <DocCardList
          empty={rows.length === 0 && "No unconverted Estimates. Converted Estimates are available as Detail Sheets in the Client page."}
        >
          {rows.map((e) => (
            <DocCard
              key={e.id}
              title={e.client?.name}
              subtitle={`${e.no} · ${formatDate(e.doc_date)}`}
              amount={money(e.total)}
              corner={
                <DeleteRowButton
                  what="estimate"
                  action={async () => {
                    const r = await deleteDocument("estimate", e.id);
                    if (!r.ok) throw new Error(r.error);
                  }}
                />
              }
            >
              <Button size="sm" className="col-span-2" disabled={pending} onClick={() => convert(e)}>
                Convert to Detail Sheet
              </Button>
              <Button size="sm" variant="outline" onClick={() => printEstimate(e)}>
                <Printer className="size-3.5" /> View / Print
              </Button>
              <Button size="sm" variant="outline" onClick={() => loadForEdit(e)}>
                <Pencil className="size-3.5" /> Edit
              </Button>
              <SharePdfButton className="col-span-2" print={() => printEstimate(e)} title={`${e.client?.name ?? ""} E-${e.no}`} />
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
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-[var(--text-muted)] whitespace-nowrap">{formatDate(e.doc_date)}</TableCell>
                  <TableCell className="font-medium">{e.no}</TableCell>
                  <TableCell>{e.client?.name}</TableCell>
                  <TableCell className="text-right">{money(e.total)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => printEstimate(e)}>
                        View / Print
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => loadForEdit(e)}>
                        <Pencil className="size-3.5" /> Edit
                      </Button>
                      <SharePdfButton print={() => printEstimate(e)} title={`${e.client?.name ?? ""} E-${e.no}`} />
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span>{value}</span>
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
