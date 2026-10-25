"use server";

import { createClient } from "@/lib/supabase/server";
import { listClients } from "@/lib/actions/clients";
import { listLabourers } from "@/lib/actions/labour";
import { listVendors } from "@/lib/actions/vendors";

export type LastTxn = {
  kind: "due" | "received" | "paid" | "refund";
  amount: number;
  note: string | null;
  date: string;
};

export type WhatsappContact = {
  id: string;
  name: string;
  phone: string | null;
  balance: number;
  category: "Client" | "Labour" | "Vendor";
  lastTxn?: LastTxn | null;
  /** Signature used in the message (clients only). */
  brand?: string;
};

export type ContactContext = {
  last: Record<string, LastTxn>;
  brand: Record<string, string>;
};

const GLASS_RE = /(glass|aluminium|aluminum|upvc)/i;

/**
 * Per-party data the WhatsApp wording depends on: the most recent saved
 * transaction (newest date, then newest entry) and, for clients, whether the
 * signature is ASHWIN or ASHWIN ENTERPRISES (Glass/Aluminium/UPVC work).
 */
export async function getContactContext(): Promise<ContactContext> {
  const supabase = await createClient();
  const [latest, clients, quotes, estimates] = await Promise.all([
    // One row per party (view from migration 0009) — no need to scan the whole history.
    supabase.from("party_last_txn").select("kind, entity_id, amount, txn_date, is_refund, note"),
    supabase.from("clients").select("id, work_status"),
    supabase.from("quotations").select("client_id, work_type"),
    supabase.from("estimates").select("client_id, work_type"),
  ]);

  // Fallback while migration 0009 is pending: scan recent history newest-first.
  const txns = latest.error
    ? await supabase
        .from("all_transactions")
        .select("kind, entity_id, amount, txn_date, is_refund, note")
        .order("txn_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5000)
    : latest;

  const last: Record<string, LastTxn> = {};
  for (const t of (txns.data ?? []) as {
    kind: string;
    entity_id: string;
    amount: number;
    txn_date: string;
    is_refund?: boolean;
    note?: string | null;
  }[]) {
    if (last[t.entity_id]) continue;
    const isPayment = t.kind.endsWith("_payment");
    const kind: LastTxn["kind"] = t.is_refund
      ? "refund"
      : isPayment
      ? t.kind === "client_payment"
        ? "received"
        : "paid"
      : "due";
    last[t.entity_id] = { kind, amount: Number(t.amount), note: t.note ?? null, date: t.txn_date };
  }

  const types = new Map<string, string[]>();
  const push = (id: string, v: string | null | undefined) => {
    if (!v) return;
    types.set(id, [...(types.get(id) ?? []), v]);
  };
  ((clients.data ?? []) as { id: string; work_status?: string | null }[]).forEach((c) =>
    push(c.id, c.work_status)
  );
  [...(quotes.data ?? []), ...(estimates.data ?? [])].forEach((d: { client_id: string; work_type: string | null }) =>
    push(d.client_id, d.work_type)
  );

  const brand: Record<string, string> = {};
  for (const c of (clients.data ?? []) as { id: string }[]) {
    brand[c.id] = GLASS_RE.test((types.get(c.id) ?? []).join(" ")) ? "ASHWIN ENTERPRISES" : "ASHWIN";
  }
  return { last, brand };
}

export async function listWhatsappContacts(): Promise<WhatsappContact[]> {
  const [clients, labourers, vendors, ctx] = await Promise.all([
    listClients(),
    listLabourers(),
    listVendors(),
    getContactContext(),
  ]);

  return [
    ...clients.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      balance: c.balance,
      category: "Client" as const,
      lastTxn: ctx.last[c.id] ?? null,
      brand: ctx.brand[c.id],
    })),
    ...labourers.map((l) => ({
      id: l.id,
      name: l.name,
      phone: l.phone,
      balance: l.balance,
      category: "Labour" as const,
      lastTxn: ctx.last[l.id] ?? null,
    })),
    ...vendors.map((v) => ({
      id: v.id,
      name: v.name,
      phone: v.phone,
      balance: v.balance,
      category: "Vendor" as const,
      lastTxn: ctx.last[v.id] ?? null,
    })),
  ];
}
