"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScanBillButton } from "@/components/admin/ScanBillButton";
import { endOfCurrentMonth } from "@/lib/date-limits";
import type { ScannedBill } from "@/lib/scan-bill";
import type { VendorBill } from "@/lib/types";

type Field = "description" | "billNo" | "amount" | "date" | "gstin" | "taxable" | "gst";

const FILLED = "ring-2 ring-emerald-300";
const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2);

/** Vendor-bill inputs shared by Add and Edit, with Scan Bill on top. Field names match what the server actions read. */
export function VendorBillFields({
  bill,
  today,
  vendorName,
}: {
  bill?: VendorBill;
  /** Default date for a new bill (ignored when editing). */
  today?: string;
  vendorName: string;
}) {
  const [description, setDescription] = useState(bill?.description ?? "");
  const [billNo, setBillNo] = useState(bill?.bill_no ?? "");
  const [amount, setAmount] = useState(bill ? String(bill.amount) : "");
  const [date, setDate] = useState(bill?.bill_date ?? today ?? "");
  const [gstin, setGstin] = useState(bill?.vendor_gstin ?? "");
  const [taxable, setTaxable] = useState(bill?.taxable_amount != null ? String(bill.taxable_amount) : "");
  const [gst, setGst] = useState(bill?.gst_amount != null ? String(bill.gst_amount) : "");
  const [filled, setFilled] = useState<Set<Field>>(new Set());
  const [notes, setNotes] = useState<string[]>([]);

  const cls = (f: Field) => (filled.has(f) ? FILLED : "");
  const touch = (f: Field) =>
    setFilled((s) => {
      if (!s.has(f)) return s;
      const n = new Set(s);
      n.delete(f);
      return n;
    });

  function applyScan(b: ScannedBill, scanNotes: string[]) {
    const got = new Set<Field>();
    if (b.description) { setDescription(b.description); got.add("description"); }
    if (b.billNo) { setBillNo(b.billNo); got.add("billNo"); }
    if (b.total != null) { setAmount(String(b.total)); got.add("amount"); }
    if (b.billDate) { setDate(b.billDate); got.add("date"); }
    if (b.vendorGstin) { setGstin(b.vendorGstin); got.add("gstin"); }
    if (b.taxable != null) { setTaxable(String(b.taxable)); got.add("taxable"); }
    if (b.gst != null) { setGst(String(b.gst)); got.add("gst"); }
    setFilled(got);

    const out = [...scanNotes];
    // Warn when the bill seems to belong to a different vendor than the one this dialog is for.
    const a = words(b.vendorName);
    const v = words(vendorName);
    if (a.length && v.length && !a.some((w) => v.includes(w))) {
      out.push(`This bill looks like it's from "${b.vendorName}", but you're adding it to "${vendorName}".`);
    }
    if (!got.size) out.push("Nothing could be filled in from this photo.");
    else out.unshift(`Filled in ${got.size} field${got.size === 1 ? "" : "s"} (highlighted green). Please check them before saving.`);
    setNotes(out);
  }

  return (
    <>
      <ScanBillButton onScanned={applyScan} />
      {notes.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
          {notes.map((n, i) => (
            <li key={i} className="flex gap-1.5">
              {i > 0 || !n.startsWith("Filled") ? <TriangleAlert className="size-3.5 shrink-0 mt-px" /> : <span className="w-3.5 shrink-0" />}
              {n}
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="description">Item / Material</Label>
          <Input
            id="description"
            name="description"
            className={cls("description")}
            value={description}
            placeholder="e.g. 12mm toughened glass, 40 sqft"
            onChange={(e) => { setDescription(e.target.value); touch("description"); }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bill_no">Bill No.</Label>
          <Input
            id="bill_no"
            name="bill_no"
            className={cls("billNo")}
            value={billNo}
            placeholder="e.g. INV-2381"
            onChange={(e) => { setBillNo(e.target.value); touch("billNo"); }}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="bill_date">Date</Label>
          <Input
            id="bill_date"
            name="bill_date"
            type="date"
            className={cls("date")}
            value={date}
            max={endOfCurrentMonth()}
            onChange={(e) => { setDate(e.target.value); touch("date"); }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vendor_gstin">Vendor GSTIN</Label>
          <Input
            id="vendor_gstin"
            name="vendor_gstin"
            className={`uppercase ${cls("gstin")}`}
            value={gstin}
            maxLength={15}
            pattern="[0-9A-Za-z]{15}"
            title="15 letters/numbers, e.g. 27ABCDE1234F1Z5"
            placeholder="Optional"
            onChange={(e) => { setGstin(e.target.value.toUpperCase()); touch("gstin"); }}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="taxable_amount">Taxable (₹)</Label>
          <Input
            id="taxable_amount"
            name="taxable_amount"
            type="number"
            min="0"
            step="0.01"
            className={cls("taxable")}
            value={taxable}
            placeholder="Optional"
            onChange={(e) => { setTaxable(e.target.value); touch("taxable"); }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gst_amount">GST (₹)</Label>
          <Input
            id="gst_amount"
            name="gst_amount"
            type="number"
            min="0"
            step="0.01"
            className={cls("gst")}
            value={gst}
            placeholder="CGST+SGST / IGST"
            onChange={(e) => { setGst(e.target.value); touch("gst"); }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="amount">Bill Total (₹)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            className={cls("amount")}
            value={amount}
            onChange={(e) => { setAmount(e.target.value); touch("amount"); }}
          />
        </div>
      </div>
    </>
  );
}
