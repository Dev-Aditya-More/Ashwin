"use server";

import { createClient } from "@/lib/supabase/server";
import type { Transaction, TransactionKind } from "@/lib/types";

export type TransactionRow = {
  id: string;
  kind: TransactionKind;
  category: "Client" | "Labour" | "Vendor";
  name: string;
  description: string;
  amount: number;
  direction: "in" | "out" | "neutral";
  date: string;
  addedBy: string | null;
};

const CATEGORY_BY_KIND: Record<TransactionKind, "Client" | "Labour" | "Vendor"> = {
  client_work: "Client",
  client_payment: "Client",
  labour_work: "Labour",
  labour_payment: "Labour",
  vendor_bill: "Vendor",
  vendor_payment: "Vendor",
};

const DIRECTION_BY_KIND: Record<TransactionKind, "in" | "out" | "neutral"> = {
  client_work: "neutral",
  client_payment: "in",
  labour_work: "neutral",
  labour_payment: "out",
  vendor_bill: "neutral",
  vendor_payment: "out",
};

export async function listTransactions(
  limit = 100,
  projectId?: string,
  monthKey?: string // "YYYY-MM" — filters to that calendar month
): Promise<TransactionRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("all_transactions")
    .select("*")
    .order("txn_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (projectId) query = query.eq("project_id", projectId);

  if (monthKey && /^\d{4}-\d{2}$/.test(monthKey)) {
    const [year, month] = monthKey.split("-").map(Number);
    const from = `${monthKey}-01`;
    const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
    query = query.gte("txn_date", from).lt("txn_date", nextMonth);
  }

  const [{ data: rows }, { data: clients }, { data: labourers }, { data: vendors }] =
    await Promise.all([
      query,
      supabase.from("clients").select("id, name"),
      supabase.from("labourers").select("id, name"),
      supabase.from("vendors").select("id, name"),
    ]);

  const clientNames = new Map((clients ?? []).map((c) => [c.id, c.name]));
  const labourNames = new Map((labourers ?? []).map((l) => [l.id, l.name]));
  const vendorNames = new Map((vendors ?? []).map((v) => [v.id, v.name]));

  return ((rows ?? []) as Transaction[]).map((t) => {
    const category = CATEGORY_BY_KIND[t.kind];
    const name =
      category === "Client"
        ? clientNames.get(t.entity_id)
        : category === "Labour"
        ? labourNames.get(t.entity_id)
        : vendorNames.get(t.entity_id);

    return {
      id: t.id,
      kind: t.kind,
      category,
      name: name ?? "Unknown",
      description: t.description,
      amount: Number(t.amount),
      direction: DIRECTION_BY_KIND[t.kind],
      date: t.txn_date,
      addedBy: t.created_by ?? null,
    };
  });
}
