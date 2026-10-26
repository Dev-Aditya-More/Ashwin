import type { SupabaseClient } from "@supabase/supabase-js";

export type FlowRow = {
  date: string;
  /** Positive = money moved the normal way; a refund is negative so it cancels a payment. */
  amount: number;
  entity: string;
  name: string | null;
  description: string;
};

export type CashFlows = { revenue: FlowRow[]; labour: FlowRow[]; vendor: FlowRow[] };

/**
 * The performance figures follow actual money movements — the same transactions as the
 * Transactions page — like the workbook's day-wise "Total Credit":
 *  - Revenue = payments received from clients (refunds to clients subtract)
 *  - Labour  = payments made to labour (refunds from labour subtract)
 *  - Vendor  = payments made to vendors (refunds from vendors subtract)
 * Documents (quotations, estimates, Detail Sheet dues, invoices) are never counted: they say what
 * is owed, not what was paid, and counting them would double up with the payment that settles them.
 */
export async function loadCashFlows(
  supabase: SupabaseClient,
  range?: { from: string; to: string }
): Promise<CashFlows> {
  const sel = "amount, payment_date, note, payment_mode, is_refund";
  let c = supabase.from("client_payments").select(`client_id, ${sel}, clients(name)`);
  let l = supabase.from("labour_payments").select(`labourer_id, ${sel}, labourers(name)`);
  let v = supabase.from("vendor_payments").select(`vendor_id, ${sel}, vendors(name)`);
  if (range) {
    c = c.gte("payment_date", range.from).lte("payment_date", range.to);
    l = l.gte("payment_date", range.from).lte("payment_date", range.to);
    v = v.gte("payment_date", range.from).lte("payment_date", range.to);
  }
  const [cr, lr, vr] = await Promise.all([c, l, v]);

  type P = {
    amount: number; payment_date: string; note: string | null; payment_mode: string | null; is_refund?: boolean;
    client_id?: string; labourer_id?: string; vendor_id?: string;
    clients?: { name: string } | null; labourers?: { name: string } | null; vendors?: { name: string } | null;
  };
  const map = (rows: unknown, entityKey: "client_id" | "labourer_id" | "vendor_id", rel: "clients" | "labourers" | "vendors", word: string) =>
    ((rows ?? []) as P[]).map((r) => ({
      date: r.payment_date,
      amount: r.is_refund ? -Number(r.amount) : Number(r.amount),
      entity: r[entityKey] ?? "",
      name: r[rel]?.name ?? null,
      description:
        [r.is_refund ? "Refund" : word, r.payment_mode, r.note].filter(Boolean).join(" · "),
    }));

  return {
    revenue: map(cr.data, "client_id", "clients", "Payment received"),
    labour: map(lr.data, "labourer_id", "labourers", "Payment made"),
    vendor: map(vr.data, "vendor_id", "vendors", "Payment made"),
  };
}
