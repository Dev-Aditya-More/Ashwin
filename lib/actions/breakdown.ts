"use server";

import { createClient } from "@/lib/supabase/server";
import { loadRevenue } from "@/lib/revenue";

export type BreakdownCategory = "revenue" | "labour" | "vendor";

export type BreakdownEntry = { date: string; description: string; amount: number };

export type BreakdownParty = {
  id: string;
  name: string;
  href: string;
  amount: number;
  entries: BreakdownEntry[];
};

export type Breakdown = Record<BreakdownCategory, { parties: BreakdownParty[]; total: number }>;

type Row = {
  entity: string;
  name: string | null;
  date: string;
  description: string;
  billNo?: string | null;
  amount: number;
};

/**
 * Party-wise detail behind a Revenue / Labour / Vendor figure for a date range — the numbers
 * the Monthly Performance table adds up, grouped by who they came from:
 *  - Revenue = ledger work billed to clients + invoices (taxable value). Estimates/Detail Sheets
 *    and quotations never count — an estimate counts only through the invoice made from it.
 *  - Labour  = labour work entries
 *  - Vendor  = vendor bills
 * `fyOnly` mirrors the FY-month rows, which only include entries tagged to the active financial year.
 */
export async function getBreakdown(from: string, to: string, fyOnly: boolean): Promise<Breakdown> {
  const supabase = await createClient();
  const fyId = fyOnly
    ? (await supabase.from("financial_years").select("id").eq("is_active", true).maybeSingle()).data?.id ?? null
    : null;

  let labourQ = supabase
    .from("labour_work")
    .select("labourer_id, amount, work_date, description, labourers(name)")
    .gte("work_date", from)
    .lte("work_date", to);
  let billsQ = supabase
    .from("vendor_bills")
    .select("vendor_id, amount, bill_date, description, bill_no, vendors(name)")
    .gte("bill_date", from)
    .lte("bill_date", to);
  if (fyId) {
    labourQ = labourQ.eq("financial_year_id", fyId);
    billsQ = billsQ.eq("financial_year_id", fyId);
  }
  const [revenueRows, labour, bills] = await Promise.all([loadRevenue(supabase, { from, to }), labourQ, billsQ]);

  type L = { labourer_id: string; amount: number; work_date: string; description: string; labourers: { name: string } | null };
  type V = { vendor_id: string; amount: number; bill_date: string; description: string; bill_no: string | null; vendors: { name: string } | null };

  return {
    revenue: group(
      revenueRows
        .filter((r) => !fyId || r.financial_year_id === fyId)
        .map((r) => ({
          entity: r.client_id, name: r.client_name, date: r.work_date, description: r.description, billNo: r.bill_no, amount: r.amount,
        })),
      "/admin/clients/"
    ),
    labour: group(
      ((labour.data ?? []) as unknown as L[]).map((r) => ({
        entity: r.labourer_id, name: r.labourers?.name ?? null, date: r.work_date, description: r.description, amount: Number(r.amount),
      })),
      "/admin/labour/"
    ),
    vendor: group(
      ((bills.data ?? []) as unknown as V[]).map((r) => ({
        entity: r.vendor_id, name: r.vendors?.name ?? null, date: r.bill_date, description: r.description, billNo: r.bill_no, amount: Number(r.amount),
      })),
      "/admin/vendors/"
    ),
  };
}

function group(rows: Row[], base: string) {
  const map = new Map<string, BreakdownParty>();
  for (const r of rows) {
    const p =
      map.get(r.entity) ??
      { id: r.entity, name: r.name ?? "Unknown", href: base + r.entity, amount: 0, entries: [] as BreakdownEntry[] };
    p.amount += r.amount;
    p.entries.push({
      date: r.date,
      description: [r.billNo ? `Bill ${r.billNo}` : "", r.description].filter(Boolean).join(" — "),
      amount: r.amount,
    });
    map.set(r.entity, p);
  }
  const parties = [...map.values()].sort((a, b) => b.amount - a.amount);
  parties.forEach((p) => p.entries.sort((a, b) => a.date.localeCompare(b.date)));
  return { parties, total: parties.reduce((a, p) => a + p.amount, 0) };
}
