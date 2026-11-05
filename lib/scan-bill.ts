// Pure helpers for "Scan Bill": the shape the vision model returns and the clean-up that turns it into
// something safe to drop into the vendor-bill form. Nothing here touches the network.

import { GSTIN_RE } from "@/lib/doc-calc";

/** GSTINs that belong to us — they appear on a purchase bill as the BUYER, never as the supplier. */
const OWN_GSTINS = ["27AEGPT6645A1ZF"];

/** What the model is asked to read off the bill (every field optional: it leaves out what it can't see). */
export type RawScan = {
  vendor_name?: string | null;
  vendor_gstin?: string | null;
  bill_no?: string | null;
  bill_date?: string | null;
  taxable_amount?: number | null;
  cgst?: number | null;
  sgst?: number | null;
  igst?: number | null;
  total_amount?: number | null;
  items?: string | null;
};

/** What goes into the form. Empty string / null = not identified (the field is left as it was). */
export type ScannedBill = {
  vendorName: string;
  vendorGstin: string;
  billNo: string;
  billDate: string;
  taxable: number | null;
  gst: number | null;
  total: number | null;
  description: string;
};

const num = (v: unknown) => {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[₹,\s]/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};

/** State code (01–38/97/99) + PAN-shaped 10 chars + entity + Z + checksum. Stricter than GSTIN_RE, used only to warn. */
const GSTIN_STRICT = /^(0[1-9]|[12]\d|3[0-8]|9[79])[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function normalizeScan(raw: RawScan, todayYmd: string): { bill: ScannedBill; notes: string[] } {
  const notes: string[] = [];

  let gstin = String(raw.vendor_gstin ?? "").toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (OWN_GSTINS.includes(gstin)) gstin = "";
  if (gstin && !GSTIN_RE.test(gstin)) {
    notes.push(`GSTIN "${gstin}" doesn't look complete, so it was left blank.`);
    gstin = "";
  } else if (gstin && !GSTIN_STRICT.test(gstin)) {
    notes.push("GSTIN was read but its format looks off. Please check it against the bill.");
  }

  let date = String(raw.bill_date ?? "").trim();
  const dmy = date.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/); // tolerate dd-mm-yyyy
  if (dmy) date = `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) date = "";
  // The form only accepts dates up to the end of this month.
  if (date && date.slice(0, 7) > todayYmd.slice(0, 7)) {
    notes.push(`Bill date ${date} is in a future month, so it was left blank.`);
    date = "";
  }

  const parts = [num(raw.cgst), num(raw.sgst), num(raw.igst)];
  let gst = parts.some((p) => p != null) ? Math.round(parts.reduce<number>((a, p) => a + (p ?? 0), 0) * 100) / 100 : null;
  let taxable = num(raw.taxable_amount);
  const total = num(raw.total_amount);
  if (gst == null && taxable != null && total != null && total >= taxable) {
    gst = Math.round((total - taxable) * 100) / 100;
  } else if (taxable == null && gst != null && total != null && total >= gst) {
    taxable = Math.round((total - gst) * 100) / 100;
  }
  if (taxable != null && gst != null && total != null) {
    const diff = Math.abs(taxable + gst - total);
    // A few rupees is normal round-off; more means a discount, freight or a misread digit.
    if (diff > 5) {
      notes.push(`Taxable + GST (₹${(taxable + gst).toFixed(2)}) doesn't match the bill total (₹${total.toFixed(2)}). Please check the amounts.`);
    }
  }
  if (taxable != null && gst != null && taxable > 0 && gst / taxable > 0.4) {
    notes.push("GST looks unusually high for the taxable value. Please check the amounts.");
  }

  const bill: ScannedBill = {
    vendorName: String(raw.vendor_name ?? "").trim(),
    vendorGstin: gstin,
    billNo: String(raw.bill_no ?? "").trim(),
    billDate: date,
    taxable,
    gst,
    total,
    description: String(raw.items ?? "").trim().replace(/\s+/g, " ").slice(0, 120),
  };
  if (!bill.vendorGstin && !bill.billNo && !bill.billDate && bill.total == null) {
    notes.unshift("Couldn't read much from this photo. Try a clearer, flatter, well-lit shot of the whole bill.");
  }
  return { bill, notes };
}
