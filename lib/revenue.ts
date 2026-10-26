import type { SupabaseClient } from "@supabase/supabase-js";

export type RevenueRow = {
  work_date: string;
  amount: number;
  financial_year_id: string | null;
  client_id: string;
  client_name: string | null;
  description: string;
  bill_no: string | null;
};

const DETAIL_SHEET_PREFIX = "Estimate / Detail Sheet";

/**
 * What counts as Revenue in the performance figures:
 *  - work billed to clients in their ledger (normal dues, opening balances…), EXCEPT the dues booked
 *    by confirming an Estimate as a Detail Sheet — an estimate is paperwork, not a sale;
 *  - plus every GST / Non-GST invoice, at its taxable value (GST collected belongs to the government),
 *    on the invoice date. An estimate therefore counts only once it is actually invoiced.
 * Quotations never count. The client ledger itself is unchanged — this only affects revenue figures.
 */
export async function loadRevenue(
  supabase: SupabaseClient,
  range?: { from: string; to: string }
): Promise<RevenueRow[]> {
  let work = supabase
    .from("client_work")
    .select("id, client_id, amount, work_date, financial_year_id, description, bill_no, clients(name)");
  let invoices = supabase
    .from("gst_invoices")
    .select("client_id, taxable, doc_date, financial_year_id, no, invoice_type, estimate_no, clients(name)");
  if (range) {
    work = work.gte("work_date", range.from).lte("work_date", range.to);
    invoices = invoices.gte("doc_date", range.from).lte("doc_date", range.to);
  }

  const [w, est, inv] = await Promise.all([
    work,
    supabase.from("estimates").select("client_work_id").not("client_work_id", "is", null),
    invoices,
  ]);

  // Tables from migration 0007 may be missing: then there is nothing to exclude or add.
  const fromEstimates = new Set(((est.data ?? []) as { client_work_id: string }[]).map((r) => r.client_work_id));

  type W = {
    id: string; client_id: string; amount: number; work_date: string; financial_year_id: string | null;
    description: string; bill_no: string | null; clients: { name: string } | null;
  };
  type I = {
    client_id: string; taxable: number; doc_date: string; financial_year_id: string | null;
    no: string; invoice_type: string; estimate_no: string | null; clients: { name: string } | null;
  };

  const rows: RevenueRow[] = [];
  for (const r of (w.data ?? []) as unknown as W[]) {
    if (fromEstimates.has(r.id) || String(r.description ?? "").startsWith(DETAIL_SHEET_PREFIX)) continue;
    rows.push({
      work_date: r.work_date, amount: Number(r.amount), financial_year_id: r.financial_year_id,
      client_id: r.client_id, client_name: r.clients?.name ?? null, description: r.description, bill_no: r.bill_no,
    });
  }
  for (const r of (inv.data ?? []) as unknown as I[]) {
    rows.push({
      work_date: r.doc_date, amount: Number(r.taxable), financial_year_id: r.financial_year_id,
      client_id: r.client_id, client_name: r.clients?.name ?? null,
      description: `${r.invoice_type} Invoice${r.estimate_no ? ` (Estimate ${r.estimate_no})` : ""}`,
      bill_no: r.no,
    });
  }
  return rows;
}
