// Monthly GST report: sales (B2B / B2C), HSN summary, input credit from vendor bills, and the net payable.
// Pure functions only — the page fetches the rows, this turns them into the report.

import { hsnFor } from "@/lib/doc-calc";
import type { EstimateLine } from "@/lib/doc-calc";

export type InvoiceRow = {
  no: string;
  doc_date: string;
  invoice_type: string; // 'GST' | 'Non-GST'
  client_name: string;
  client_gstin: string | null;
  lines: EstimateLine[] | null;
  taxable: number;
  gst_rate: number;
  tax: number;
  total: number;
};

export type PurchaseRow = {
  bill_no: string | null;
  bill_date: string;
  vendor_name: string;
  vendor_gstin: string | null;
  amount: number;
  taxable_amount: number | null;
  gst_amount: number | null;
};

export type SaleLine = {
  no: string;
  date: string;
  party: string;
  gstin: string;
  taxable: number;
  cgst: number;
  sgst: number;
  total: number;
  rate: number;
};

export type HsnRow = { hsn: string; taxable: number; cgst: number; sgst: number; tax: number };

export type PurchaseLine = {
  billNo: string;
  date: string;
  vendor: string;
  gstin: string;
  taxable: number;
  gst: number;
  total: number;
  /** Input credit needs the supplier's GSTIN on the bill. */
  claimable: boolean;
};

export type GstReport = {
  b2b: SaleLine[];
  b2c: SaleLine[];
  hsn: HsnRow[];
  purchases: PurchaseLine[];
  summary: {
    outwardTaxable: number;
    cgst: number;
    sgst: number;
    outputTax: number;
    itcClaimable: number;
    itcUnclaimable: number;
    /** Output tax minus claimable input credit. Negative means credit carried forward. */
    netPayable: number;
    nonGstTurnover: number;
    nonGstCount: number;
    /** Invoices billed to a GSTIN outside Maharashtra (27): they print CGST+SGST, but should be IGST. */
    outOfStateCount: number;
  };
};

const r2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
const num = (n: unknown) => Number(n) || 0;

/** Splits an invoice's taxable value and tax across its HSN codes by line amount; the last code takes the rounding. */
function hsnShares(inv: InvoiceRow) {
  const taxable = num(inv.taxable);
  const tax = num(inv.tax);
  const half = r2(tax / 2);
  const by = new Map<string, number>();
  for (const l of inv.lines ?? []) by.set(hsnFor(l), (by.get(hsnFor(l)) ?? 0) + num(l.amount));
  if (!by.size) by.set("—", 0);
  const sum = [...by.values()].reduce((a, b) => a + b, 0);
  let leftT = taxable, leftC = half, leftS = r2(tax - half);
  return [...by.entries()].map(([hsn, amt], i, all) => {
    const last = i === all.length - 1;
    const share = sum ? amt / sum : 1 / all.length;
    const t = last ? r2(leftT) : r2(taxable * share);
    const c = last ? r2(leftC) : r2(half * share);
    const s = last ? r2(leftS) : r2((tax - half) * share);
    leftT -= t;
    leftC -= c;
    leftS -= s;
    return { hsn, taxable: t, cgst: c, sgst: s };
  });
}

export function buildGstReport(invoices: InvoiceRow[], bills: PurchaseRow[]): GstReport {
  const b2b: SaleLine[] = [];
  const b2c: SaleLine[] = [];
  const hsnMap = new Map<string, HsnRow>();
  let nonGstTurnover = 0, nonGstCount = 0, outOfState = 0;

  for (const inv of [...invoices].sort((a, b) => a.doc_date.localeCompare(b.doc_date) || a.no.localeCompare(b.no))) {
    if (inv.invoice_type !== "GST") {
      nonGstTurnover += num(inv.total);
      nonGstCount++;
      continue;
    }
    const tax = num(inv.tax);
    const cgst = r2(tax / 2);
    const gstin = String(inv.client_gstin ?? "").trim().toUpperCase();
    const line: SaleLine = {
      no: inv.no,
      date: inv.doc_date,
      party: inv.client_name,
      gstin,
      taxable: r2(inv.taxable),
      cgst,
      sgst: r2(tax - cgst),
      total: r2(inv.total),
      rate: num(inv.gst_rate),
    };
    (gstin ? b2b : b2c).push(line);
    if (gstin && !gstin.startsWith("27")) outOfState++;
    for (const s of hsnShares(inv)) {
      const row = hsnMap.get(s.hsn) ?? { hsn: s.hsn, taxable: 0, cgst: 0, sgst: 0, tax: 0 };
      row.taxable = r2(row.taxable + s.taxable);
      row.cgst = r2(row.cgst + s.cgst);
      row.sgst = r2(row.sgst + s.sgst);
      row.tax = r2(row.cgst + row.sgst);
      hsnMap.set(s.hsn, row);
    }
  }

  const purchases: PurchaseLine[] = bills
    .filter((b) => num(b.gst_amount) > 0)
    .sort((a, b) => a.bill_date.localeCompare(b.bill_date))
    .map((b) => {
      const gstin = String(b.vendor_gstin ?? "").trim().toUpperCase();
      return {
        billNo: b.bill_no ?? "—",
        date: b.bill_date,
        vendor: b.vendor_name,
        gstin,
        taxable: r2(b.taxable_amount ?? num(b.amount) - num(b.gst_amount)),
        gst: r2(num(b.gst_amount)),
        total: r2(b.amount),
        claimable: gstin.length === 15,
      };
    });

  const sales = [...b2b, ...b2c];
  const outwardTaxable = r2(sales.reduce((s, l) => s + l.taxable, 0));
  const cgst = r2(sales.reduce((s, l) => s + l.cgst, 0));
  const sgst = r2(sales.reduce((s, l) => s + l.sgst, 0));
  const itcClaimable = r2(purchases.filter((p) => p.claimable).reduce((s, p) => s + p.gst, 0));
  const itcUnclaimable = r2(purchases.filter((p) => !p.claimable).reduce((s, p) => s + p.gst, 0));

  return {
    b2b,
    b2c,
    hsn: [...hsnMap.values()].sort((a, b) => a.hsn.localeCompare(b.hsn)),
    purchases,
    summary: {
      outwardTaxable,
      cgst,
      sgst,
      outputTax: r2(cgst + sgst),
      itcClaimable,
      itcUnclaimable,
      netPayable: r2(cgst + sgst - itcClaimable),
      nonGstTurnover: r2(nonGstTurnover),
      nonGstCount,
      outOfStateCount: outOfState,
    },
  };
}
