"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { GSTIN_RE } from "@/lib/doc-calc";
import type { Transaction, TransactionKind } from "@/lib/types";

export type PartyType = "Client" | "Labour" | "Vendor";

const TYPE_OF: Record<TransactionKind, PartyType> = {
  client_work: "Client",
  client_payment: "Client",
  labour_work: "Labour",
  labour_payment: "Labour",
  vendor_bill: "Vendor",
  vendor_payment: "Vendor",
};

function monthRange(month: string): { from: string; to: string } | null {
  if (!/^\d{4}-\d{2}$/.test(month)) return null;
  const [y, m] = month.split("-").map(Number);
  return {
    from: `${month}-01`,
    to: m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`,
  };
}

function labelFor(kind: TransactionKind, isRefund: boolean) {
  if (isRefund) return "Refund";
  if (kind === "client_payment") return "Payment Received";
  if (kind.endsWith("_payment")) return "Payment Paid";
  return "Due / Payable Added";
}

export type MonthSummary = {
  paymentCount: number;
  documentCount: number; // payments + invoices
  paymentTotal: number;
  invoiceTotal: number;
  breakdown: { type: PartyType; incoming: number; outgoing: number; count: number }[];
};

/**
 * Month View: payments/refunds of the month (money in, money out, count per party type)
 * plus the month's GST invoice total.
 */
export async function getMonthSummary(month: string): Promise<MonthSummary> {
  const empty: MonthSummary = { paymentCount: 0, documentCount: 0, paymentTotal: 0, invoiceTotal: 0, breakdown: [] };
  const range = monthRange(month);
  if (!range) return empty;
  const supabase = await createClient();
  const [txns, invoices] = await Promise.all([
    supabase.from("all_transactions").select("*").gte("txn_date", range.from).lt("txn_date", range.to),
    supabase.from("gst_invoices").select("total").gte("doc_date", range.from).lt("doc_date", range.to),
  ]);

  const payments = ((txns.data ?? []) as Transaction[]).filter((t) => t.kind.endsWith("_payment"));
  const invoiceTotal = (invoices.data ?? []).reduce((a, r: { total: number }) => a + Number(r.total || 0), 0);
  const invoiceCount = invoices.data?.length ?? 0;

  const breakdown = (["Client", "Vendor", "Labour"] as PartyType[]).map((type) => {
    const rows = payments.filter((t) => TYPE_OF[t.kind] === type);
    const sum = (f: (t: Transaction) => boolean) =>
      rows.filter(f).reduce((a, t) => a + Number(t.amount || 0), 0);
    return {
      type,
      incoming: sum((t) => (type === "Client" ? !t.is_refund : !!t.is_refund)),
      outgoing: sum((t) => (type === "Client" ? !!t.is_refund : !t.is_refund)),
      count: rows.length,
    };
  });

  return {
    paymentCount: payments.length,
    documentCount: payments.length + invoiceCount,
    paymentTotal: payments.reduce((a, t) => a + Number(t.amount || 0), 0),
    invoiceTotal,
    breakdown,
  };
}

export type DaywiseRow = {
  date: string;
  party: string;
  partyType: PartyType;
  transaction: string;
  amount: number;
  mode: string | null;
  note: string | null;
};

/** Every transaction of the month (dues included), oldest first — for the day-wise view. */
export async function getDaywiseTransactions(month: string): Promise<DaywiseRow[]> {
  const range = monthRange(month);
  if (!range) return [];
  const supabase = await createClient();
  const [txns, clients, labourers, vendors] = await Promise.all([
    supabase
      .from("all_transactions")
      .select("*")
      .gte("txn_date", range.from)
      .lt("txn_date", range.to)
      .order("txn_date")
      .order("created_at"),
    supabase.from("clients").select("id, name"),
    supabase.from("labourers").select("id, name"),
    supabase.from("vendors").select("id, name"),
  ]);
  const names = new Map<string, string>();
  [clients.data, labourers.data, vendors.data].forEach((list) =>
    ((list ?? []) as { id: string; name: string }[]).forEach((r) => names.set(r.id, r.name))
  );
  return ((txns.data ?? []) as Transaction[]).map((t) => ({
    date: t.txn_date,
    party: names.get(t.entity_id) ?? "Unknown",
    partyType: TYPE_OF[t.kind],
    transaction: labelFor(t.kind, Boolean(t.is_refund)),
    amount: Number(t.amount),
    mode: t.payment_mode ?? null,
    note: t.note ?? t.description ?? null,
  }));
}

export type PartyOption = { id: string; name: string; gstin?: string | null };

/** id + name (+ GSTIN) of every party — all the Quick Add form needs, in three small parallel queries. */
export async function listPartyOptions(): Promise<{
  clients: PartyOption[];
  labourers: PartyOption[];
  vendors: PartyOption[];
}> {
  const supabase = await createClient();
  const [c, l, v] = await Promise.all([
    supabase.from("clients").select("id, name, gstin").order("name"),
    supabase.from("labourers").select("id, name").order("name"),
    supabase.from("vendors").select("id, name").order("name"),
  ]);
  // gstin column missing (migration 0007 pending) — fall back to names only.
  const clients = c.error
    ? ((await supabase.from("clients").select("id, name").order("name")).data ?? [])
    : c.data ?? [];
  return {
    clients: clients as PartyOption[],
    labourers: (l.data ?? []) as PartyOption[],
    vendors: (v.data ?? []) as PartyOption[],
  };
}

/** Stores the client's GSTIN (used by Quick Add, which shows it auto-filled and editable). */
export async function updateClientGstin(
  clientId: string,
  gstin: string
): Promise<{ ok: boolean; error?: string }> {
  const v = gstin.trim().toUpperCase();
  if (v && !GSTIN_RE.test(v)) return { ok: false, error: "GSTIN must contain exactly 15 letters/numbers." };
  const supabase = await createClient();
  const { error } = await supabase.from("clients").update({ gstin: v || null }).eq("id", clientId);
  if (error) return { ok: false, error: "Could not save the GSTIN (has migration 0007 been run?)." };
  revalidatePath("/admin/clients");
  return { ok: true };
}
