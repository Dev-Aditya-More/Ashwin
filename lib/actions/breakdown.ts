"use server";

import { createClient } from "@/lib/supabase/server";
import { loadCashFlows, type FlowRow } from "@/lib/revenue";

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
 * Party-wise detail behind a Revenue / Labour / Vendor figure for a date range — the payments the
 * performance table adds up, grouped by party (Revenue = received from clients, Labour/Vendor = paid
 * out; refunds subtract). Documents such as estimates, Detail Sheets and invoices are not counted.
 */
export async function getBreakdown(from: string, to: string): Promise<Breakdown> {
  const supabase = await createClient();
  const flows = await loadCashFlows(supabase, { from, to });
  const rows = (list: FlowRow[]): Row[] =>
    list.map((r) => ({ entity: r.entity, name: r.name, date: r.date, description: r.description, amount: r.amount }));
  return {
    revenue: group(rows(flows.revenue), "/admin/clients/"),
    labour: group(rows(flows.labour), "/admin/labour/"),
    vendor: group(rows(flows.vendor), "/admin/vendors/"),
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
