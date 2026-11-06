"use server";

import { createClient } from "@/lib/supabase/server";
import { computeAgeing, type Ageing } from "@/lib/ageing";
import { getContactContext } from "@/lib/actions/whatsapp";
import { todayIST } from "@/lib/today";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Receivable = Ageing & {
  id: string;
  name: string;
  phone: string | null;
  brand: string;
  /** Date of the client's most recent payment, if any. */
  lastPaymentDate: string | null;
};

/** Every row of a table, in pages (Supabase returns at most 1000 rows per request). */
async function fetchAll<T>(supabase: SupabaseClient, table: string, columns: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(columns).order("id").range(from, from + 999);
    if (error || !data) break;
    out.push(...(data as unknown as T[]));
    if (data.length < 1000) break;
  }
  return out;
}

/** Clients who owe money, with their ageing, oldest and largest first. */
export async function getReceivables(): Promise<Receivable[]> {
  const supabase = await createClient();
  type W = { client_id: string; amount: number; work_date: string };
  type P = { client_id: string; amount: number; payment_date: string; is_refund?: boolean | null };
  const [clients, work, payments, ctx] = await Promise.all([
    fetchAll<{ id: string; name: string; phone: string | null }>(supabase, "clients", "id, name, phone"),
    fetchAll<W>(supabase, "client_work", "id, client_id, amount, work_date"),
    fetchAll<P>(supabase, "client_payments", "id, client_id, amount, payment_date, is_refund"),
    getContactContext(),
  ]);

  const group = <T extends { client_id: string }>(rows: T[]) => {
    const m = new Map<string, T[]>();
    for (const r of rows) m.set(r.client_id, [...(m.get(r.client_id) ?? []), r]);
    return m;
  };
  const w = group(work);
  const p = group(payments);
  const today = todayIST();

  const out: Receivable[] = [];
  for (const c of clients) {
    const pay = p.get(c.id) ?? [];
    const a = computeAgeing(w.get(c.id) ?? [], pay, today);
    if (a.outstanding <= 0) continue;
    const real = pay.filter((x) => !x.is_refund).map((x) => x.payment_date).sort();
    out.push({
      ...a,
      id: c.id,
      name: c.name,
      phone: c.phone,
      brand: ctx.brand[c.id] ?? "ASHWIN",
      lastPaymentDate: real.length ? real[real.length - 1] : null,
    });
  }
  return out.sort((x, y) => y.oldestDays - x.oldestDays || y.outstanding - x.outstanding);
}
