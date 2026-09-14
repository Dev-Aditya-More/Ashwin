"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasRecentDuplicate, duplicateWarning } from "@/lib/actions/duplicate-check";
import { currentUserEmail, insertWithActor } from "@/lib/actions/audit-helper";
import type { Labourer, LabourBalance, LabourWork, LabourPayment } from "@/lib/types";

export async function listLabourers(): Promise<(Labourer & { balance: number })[]> {
  const supabase = await createClient();
  const [{ data: labourers }, { data: balances }] = await Promise.all([
    supabase.from("labourers").select("*").order("name"),
    supabase.from("labour_balances").select("*"),
  ]);

  const balanceMap = new Map<string, number>(
    (balances ?? []).map((b: LabourBalance) => [b.labourer_id, b.balance])
  );

  return (labourers ?? []).map((l) => ({ ...l, balance: balanceMap.get(l.id) ?? 0 }));
}

export async function getLabourer(id: string) {
  const supabase = await createClient();
  const [{ data: labourer }, { data: balance }, { data: work }, { data: payments }] = await Promise.all([
    supabase.from("labourers").select("*").eq("id", id).single(),
    supabase.from("labour_balances").select("*").eq("labourer_id", id).maybeSingle(),
    supabase.from("labour_work").select("*").eq("labourer_id", id).order("work_date", { ascending: false }),
    supabase
      .from("labour_payments")
      .select("*")
      .eq("labourer_id", id)
      .order("payment_date", { ascending: false }),
  ]);

  return {
    labourer: labourer as Labourer,
    balance: (balance as LabourBalance | null) ?? {
      labourer_id: id,
      name: labourer?.name ?? "",
      total_work: 0,
      total_paid: 0,
      balance: 0,
    },
    work: (work ?? []) as LabourWork[],
    payments: (payments ?? []) as LabourPayment[],
  };
}

export async function createLabourerRecord(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const default_rate = formData.get("default_rate")
    ? Number(formData.get("default_rate"))
    : null;

  const supabase = await createClient();
  await supabase.from("labourers").insert({ name, phone, default_rate });
  revalidatePath("/admin/labour");
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
): Promise<{ warning?: string } | void> {
  const description = String(formData.get("description") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1);
  const rate = Number(formData.get("rate") ?? 0);
  const work_date = String(formData.get("work_date") ?? "") || new Date().toISOString().slice(0, 10);
  const project_id = String(formData.get("project_id") ?? "") || null;
  const confirmed = formData.get("confirm") === "1";
  const amount = quantity * rate;
  if (!description || !amount) return;

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
  await insertWithActor(
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
    actorEmail
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
): Promise<{ warning?: string } | void> {
  const amount = Number(formData.get("amount") ?? 0);
  const payment_date =
    String(formData.get("payment_date") ?? "") || new Date().toISOString().slice(0, 10);
  const note = String(formData.get("note") ?? "").trim() || null;
  const confirmed = formData.get("confirm") === "1";
  if (!amount) return;

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
  await insertWithActor(
    supabase,
    "labour_payments",
    {
      labourer_id: labourerId,
      amount,
      payment_date,
      note,
      financial_year_id: fy.data?.id ?? null,
    },
    actorEmail
  );
  revalidatePath(`/admin/labour/${labourerId}`);
  revalidatePath("/admin");
}
