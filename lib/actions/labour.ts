"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasRecentDuplicate, duplicateWarning } from "@/lib/actions/duplicate-check";
import { currentUserEmail, insertWithActor, updateSafely } from "@/lib/actions/audit-helper";
import { applyOpeningBalance } from "@/lib/actions/import";
import { isAfterCurrentMonth, FUTURE_MONTH_WARNING } from "@/lib/date-limits";
import type { Labourer, LabourBalance, LabourWork, LabourPayment } from "@/lib/types";

export type LabourerWithTotals = Labourer & { balance: number; totalWork: number; totalPaid: number };

export async function listLabourers(): Promise<LabourerWithTotals[]> {
  const supabase = await createClient();
  const [{ data: labourers }, { data: balances }] = await Promise.all([
    supabase.from("labourers").select("*").order("name"),
    supabase.from("labour_balances").select("*"),
  ]);

  const balanceMap = new Map<string, LabourBalance>(
    (balances ?? []).map((b: LabourBalance) => [b.labourer_id, b])
  );

  return (labourers ?? []).map((l) => {
    const b = balanceMap.get(l.id);
    return { ...l, balance: b?.balance ?? 0, totalWork: b?.total_work ?? 0, totalPaid: b?.total_paid ?? 0 };
  });
}

export type LabourWorkWithSite = LabourWork & {
  site_location: string | null;
  client_name: string | null;
};

export async function getLabourer(id: string) {
  const supabase = await createClient();
  const [{ data: labourer }, { data: balance }, { data: work }, { data: payments }] = await Promise.all([
    supabase.from("labourers").select("*").eq("id", id).single(),
    supabase.from("labour_balances").select("*").eq("labourer_id", id).maybeSingle(),
    supabase
      .from("labour_work")
      .select("*, projects(site_address, clients(name))")
      .eq("labourer_id", id)
      .order("work_date", { ascending: false }),
    supabase
      .from("labour_payments")
      .select("*")
      .eq("labourer_id", id)
      .order("payment_date", { ascending: false }),
  ]);

  type WorkRow = LabourWork & {
    projects: { site_address: string | null; clients: { name: string } | null } | null;
  };

  // A work entry's own site_location/client_name (typed in directly) wins;
  // fall back to the linked project's site/client when it wasn't typed in.
  const workWithSite: LabourWorkWithSite[] = ((work ?? []) as WorkRow[]).map((w) => ({
    ...w,
    site_location: w.site_location ?? w.projects?.site_address ?? null,
    client_name: w.client_name ?? w.projects?.clients?.name ?? null,
  }));

  return {
    labourer: labourer as Labourer,
    balance: (balance as LabourBalance | null) ?? {
      labourer_id: id,
      name: labourer?.name ?? "",
      total_work: 0,
      total_paid: 0,
      balance: 0,
    },
    work: workWithSite,
    payments: (payments ?? []) as LabourPayment[],
  };
}

export async function createLabourerRecord(formData: FormData): Promise<{ id?: string }> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return {};
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const default_rate = formData.get("default_rate")
    ? Number(formData.get("default_rate"))
    : null;
  const opening_balance = Number(formData.get("opening_balance") ?? 0) || 0;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("labourers")
    .insert({ name, phone, default_rate })
    .select("id")
    .single();
  if (error || !data) return {};

  if (opening_balance) {
    const [fy, actorEmail] = await Promise.all([
      supabase.from("financial_years").select("id").eq("is_active", true).maybeSingle(),
      currentUserEmail(supabase),
    ]);
    await applyOpeningBalance(supabase, "labour", data.id, opening_balance, fy.data?.id ?? null, actorEmail);
  }

  revalidatePath("/admin/labour");
  revalidatePath("/admin");
  return { id: data.id };
}

export async function updateLabourerRecord(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const default_rate = formData.get("default_rate")
    ? Number(formData.get("default_rate"))
    : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const supabase = await createClient();
  await supabase.from("labourers").update({ name, phone, default_rate, notes }).eq("id", id);
  revalidatePath(`/admin/labour/${id}`);
  revalidatePath("/admin/labour");
}

export async function deleteLabourerRecord(id: string) {
  const supabase = await createClient();
  await supabase.from("labourers").delete().eq("id", id);
  revalidatePath("/admin/labour");
  redirect("/admin/labour");
}

export async function addLabourWork(
  labourerId: string,
  formData: FormData
): Promise<{ warning?: string; id?: string } | void> {
  const description = String(formData.get("description") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1);
  const rate = Number(formData.get("rate") ?? 0);
  const work_date = String(formData.get("work_date") ?? "") || new Date().toISOString().slice(0, 10);
  const project_id = String(formData.get("project_id") ?? "") || null;
  const site_location = String(formData.get("site_location") ?? "").trim() || null;
  const client_name = String(formData.get("client_name") ?? "").trim() || null;
  const confirmed = formData.get("confirm") === "1";
  const amountOverride = Number(formData.get("amount") ?? 0);
  const amount = amountOverride > 0 ? amountOverride : quantity * rate;
  if (!description || !amount) return;
  if (isAfterCurrentMonth(work_date)) return { warning: FUTURE_MONTH_WARNING };

  const supabase = await createClient();

  if (!confirmed) {
    const isDuplicate = await hasRecentDuplicate(
      supabase,
      "labour_work",
      "labourer_id",
      labourerId,
      amount,
      "work_date",
      work_date
    );
    if (isDuplicate) return { warning: duplicateWarning(amount, work_date) };
  }

  const [fy, actorEmail] = await Promise.all([
    supabase.from("financial_years").select("id").eq("is_active", true).maybeSingle(),
    currentUserEmail(supabase),
  ]);
  const { data } = await insertWithActor(
    supabase,
    "labour_work",
    {
      labourer_id: labourerId,
      project_id,
      description,
      quantity,
      rate,
      amount,
      work_date,
      financial_year_id: fy.data?.id ?? null,
    },
    actorEmail,
    { site_location, client_name }
  );
  revalidatePath(`/admin/labour/${labourerId}`);
  revalidatePath("/admin");
  return { id: data?.[0]?.id };
}

export async function updateLabourWork(id: string, labourerId: string, formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1);
  const rate = Number(formData.get("rate") ?? 0);
  const work_date = String(formData.get("work_date") ?? "") || new Date().toISOString().slice(0, 10);
  const project_id = String(formData.get("project_id") ?? "") || null;
  const site_location = String(formData.get("site_location") ?? "").trim() || null;
  const client_name = String(formData.get("client_name") ?? "").trim() || null;
  const amountOverride = Number(formData.get("amount") ?? 0);
  const amount = amountOverride > 0 ? amountOverride : quantity * rate;
  if (!description || !amount) return;

  const supabase = await createClient();
  await updateSafely(
    supabase,
    "labour_work",
    id,
    { description, quantity, rate, amount, work_date, project_id },
    { site_location, client_name }
  );
  revalidatePath(`/admin/labour/${labourerId}`);
  revalidatePath("/admin");
}

export async function updateLabourPayment(id: string, labourerId: string, formData: FormData) {
  const amount = Number(formData.get("amount") ?? 0);
  const payment_date =
    String(formData.get("payment_date") ?? "") || new Date().toISOString().slice(0, 10);
  const note = String(formData.get("note") ?? "").trim() || null;
  const payment_mode = String(formData.get("payment_mode") ?? "").trim() || null;
  const entry_type = String(formData.get("entry_type") ?? "Payment").trim() || "Payment";
  if (!amount) return;

  const supabase = await createClient();
  await updateSafely(
    supabase,
    "labour_payments",
    id,
    { amount, payment_date, note },
    { payment_mode, entry_type }
  );
  revalidatePath(`/admin/labour/${labourerId}`);
  revalidatePath("/admin");
}

/**
 * Pays several labourers in one go (e.g. weekly wage day) — one shared
 * payment date/note, one amount field per labourer, a single bulk insert.
 */
export async function addBulkLabourPayments(
  formData: FormData
): Promise<{ error: string | null; count: number }> {
  const payment_date = String(formData.get("payment_date") ?? "") || undefined;
  const note = String(formData.get("note") ?? "").trim() || null;
  if (payment_date && isAfterCurrentMonth(payment_date)) {
    return { error: FUTURE_MONTH_WARNING, count: 0 };
  }

  const rows: { labourer_id: string; amount: number; payment_date?: string; note: string | null; financial_year_id: string | null }[] = [];

  const supabase = await createClient();
  const [fy, actorEmail] = await Promise.all([
    supabase.from("financial_years").select("id").eq("is_active", true).maybeSingle(),
    currentUserEmail(supabase),
  ]);

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("amount_")) continue;
    const amount = Number(value);
    if (!amount || amount <= 0) continue;
    rows.push({
      labourer_id: key.slice("amount_".length),
      amount,
      payment_date,
      note,
      financial_year_id: fy.data?.id ?? null,
    });
  }

  if (rows.length === 0) {
    return { error: "Enter at least one amount.", count: 0 };
  }

  try {
    await insertWithActor(supabase, "labour_payments", rows, actorEmail);
  } catch {
    return { error: "Something went wrong. Please try again.", count: 0 };
  }

  revalidatePath("/admin/labour");
  revalidatePath("/admin");
  return { error: null, count: rows.length };
}

export async function addLabourPayment(
  labourerId: string,
  formData: FormData
): Promise<{ warning?: string; id?: string } | void> {
  const amount = Number(formData.get("amount") ?? 0);
  const payment_date =
    String(formData.get("payment_date") ?? "") || new Date().toISOString().slice(0, 10);
  const note = String(formData.get("note") ?? "").trim() || null;
  const payment_mode = String(formData.get("payment_mode") ?? "").trim() || null;
  const entry_type = String(formData.get("entry_type") ?? "Payment").trim() || "Payment";
  const confirmed = formData.get("confirm") === "1";
  if (!amount) return;
  if (isAfterCurrentMonth(payment_date)) return { warning: FUTURE_MONTH_WARNING };

  const supabase = await createClient();

  if (!confirmed) {
    const isDuplicate = await hasRecentDuplicate(
      supabase,
      "labour_payments",
      "labourer_id",
      labourerId,
      amount,
      "payment_date",
      payment_date
    );
    if (isDuplicate) return { warning: duplicateWarning(amount, payment_date) };
  }

  const [fy, actorEmail] = await Promise.all([
    supabase.from("financial_years").select("id").eq("is_active", true).maybeSingle(),
    currentUserEmail(supabase),
  ]);
  const { data } = await insertWithActor(
    supabase,
    "labour_payments",
    {
      labourer_id: labourerId,
      amount,
      payment_date,
      note,
      financial_year_id: fy.data?.id ?? null,
    },
    actorEmail,
    { payment_mode, entry_type }
  );
  revalidatePath(`/admin/labour/${labourerId}`);
  revalidatePath("/admin");
  return { id: data?.[0]?.id };
}

export async function deleteLabourWork(id: string, labourerId: string) {
  const supabase = await createClient();
  await supabase.from("labour_work").delete().eq("id", id);
  revalidatePath(`/admin/labour/${labourerId}`);
  revalidatePath("/admin");
}

export async function deleteLabourPayment(id: string, labourerId: string) {
  const supabase = await createClient();
  await supabase.from("labour_payments").delete().eq("id", id);
  revalidatePath(`/admin/labour/${labourerId}`);
  revalidatePath("/admin");
}
