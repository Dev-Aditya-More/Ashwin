"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasRecentDuplicate, duplicateWarning } from "@/lib/actions/duplicate-check";
import { currentUserEmail, insertWithActor, updateSafely } from "@/lib/actions/audit-helper";
import { applyOpeningBalance } from "@/lib/actions/import";
import { isAfterCurrentMonth, FUTURE_MONTH_WARNING } from "@/lib/date-limits";
import type { Client, ClientBalance, ClientWork, ClientPayment } from "@/lib/types";

export type ClientWithTotals = Client & { balance: number; totalWork: number; totalPaid: number };

export async function listClients(): Promise<ClientWithTotals[]> {
  const supabase = await createClient();
  const [{ data: clients }, { data: balances }] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase.from("client_balances").select("*"),
  ]);

  const balanceMap = new Map<string, ClientBalance>(
    (balances ?? []).map((b: ClientBalance) => [b.client_id, b])
  );

  return (clients ?? []).map((c) => {
    const b = balanceMap.get(c.id);
    return { ...c, balance: b?.balance ?? 0, totalWork: b?.total_work ?? 0, totalPaid: b?.total_paid ?? 0 };
  });
}

export async function getClient(id: string) {
  const supabase = await createClient();
  const [{ data: client }, { data: balance }, { data: work }, { data: payments }, { data: projects }] =
    await Promise.all([
      supabase.from("clients").select("*").eq("id", id).single(),
      supabase.from("client_balances").select("*").eq("client_id", id).maybeSingle(),
      supabase
        .from("client_work")
        .select("*")
        .eq("client_id", id)
        .order("work_date", { ascending: false }),
      supabase
        .from("client_payments")
        .select("*")
        .eq("client_id", id)
        .order("payment_date", { ascending: false }),
      supabase.from("projects").select("id, name").eq("client_id", id),
    ]);

  return {
    client: client as Client,
    balance: (balance as ClientBalance | null) ?? {
      client_id: id,
      name: client?.name ?? "",
      total_work: 0,
      total_paid: 0,
      balance: 0,
    },
    work: (work ?? []) as ClientWork[],
    payments: (payments ?? []) as ClientPayment[],
    projects: projects ?? [],
  };
}

export async function createClientRecord(formData: FormData): Promise<{ id?: string }> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return {};
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const opening_balance = Number(formData.get("opening_balance") ?? 0) || 0;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({ name, phone, address })
    .select("id")
    .single();
  if (error || !data) return {};

  if (opening_balance) {
    const [fy, actorEmail] = await Promise.all([
      supabase.from("financial_years").select("id").eq("is_active", true).maybeSingle(),
      currentUserEmail(supabase),
    ]);
    await applyOpeningBalance(supabase, "clients", data.id, opening_balance, fy.data?.id ?? null, actorEmail);
  }

  revalidatePath("/admin/clients");
  revalidatePath("/admin");
  return { id: data.id };
}

export async function updateClientRecord(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const supabase = await createClient();
  await supabase.from("clients").update({ name, phone, address, notes }).eq("id", id);
  revalidatePath(`/admin/clients/${id}`);
  revalidatePath("/admin/clients");
}

export async function deleteClientRecord(id: string) {
  const supabase = await createClient();
  await supabase.from("clients").delete().eq("id", id);
  revalidatePath("/admin/clients");
  redirect("/admin/clients");
}

export async function addClientWork(
  clientId: string,
  formData: FormData
): Promise<{ warning?: string; id?: string } | void> {
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const work_date = String(formData.get("work_date") ?? "") || new Date().toISOString().slice(0, 10);
  const project_id = String(formData.get("project_id") ?? "") || null;
  const confirmed = formData.get("confirm") === "1";
  if (!description || !amount) return;
  if (isAfterCurrentMonth(work_date)) return { warning: FUTURE_MONTH_WARNING };

  const supabase = await createClient();

  if (!confirmed) {
    const isDuplicate = await hasRecentDuplicate(
      supabase,
      "client_work",
      "client_id",
      clientId,
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
    "client_work",
    {
      client_id: clientId,
      project_id,
      description,
      amount,
      work_date,
      financial_year_id: fy.data?.id ?? null,
    },
    actorEmail
  );
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin");
  return { id: data?.[0]?.id };
}

export async function updateClientWork(id: string, clientId: string, formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const work_date = String(formData.get("work_date") ?? "") || new Date().toISOString().slice(0, 10);
  const project_id = String(formData.get("project_id") ?? "") || null;
  if (!description || !amount) return;

  const supabase = await createClient();
  await supabase
    .from("client_work")
    .update({ description, amount, work_date, project_id })
    .eq("id", id);
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin");
}

export async function updateClientPayment(id: string, clientId: string, formData: FormData) {
  const amount = Number(formData.get("amount") ?? 0);
  const payment_date =
    String(formData.get("payment_date") ?? "") || new Date().toISOString().slice(0, 10);
  const note = String(formData.get("note") ?? "").trim() || null;
  const payment_mode = String(formData.get("payment_mode") ?? "").trim() || null;
  const project_id = String(formData.get("project_id") ?? "") || null;
  if (!amount) return;

  const supabase = await createClient();
  await updateSafely(
    supabase,
    "client_payments",
    id,
    { amount, payment_date, note, project_id },
    { payment_mode }
  );
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin");
}

export async function addClientPayment(
  clientId: string,
  formData: FormData
): Promise<{ warning?: string; id?: string } | void> {
  const amount = Number(formData.get("amount") ?? 0);
  const payment_date =
    String(formData.get("payment_date") ?? "") || new Date().toISOString().slice(0, 10);
  const note = String(formData.get("note") ?? "").trim() || null;
  const payment_mode = String(formData.get("payment_mode") ?? "").trim() || null;
  const project_id = String(formData.get("project_id") ?? "") || null;
  const confirmed = formData.get("confirm") === "1";
  if (!amount) return;
  if (isAfterCurrentMonth(payment_date)) return { warning: FUTURE_MONTH_WARNING };

  const supabase = await createClient();

  if (!confirmed) {
    const isDuplicate = await hasRecentDuplicate(
      supabase,
      "client_payments",
      "client_id",
      clientId,
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
    "client_payments",
    {
      client_id: clientId,
      project_id,
      amount,
      payment_date,
      note,
      financial_year_id: fy.data?.id ?? null,
    },
    actorEmail,
    { payment_mode }
  );
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin");
  return { id: data?.[0]?.id };
}

export async function deleteClientWork(id: string, clientId: string) {
  const supabase = await createClient();
  await supabase.from("client_work").delete().eq("id", id);
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin");
}

export async function deleteClientPayment(id: string, clientId: string) {
  const supabase = await createClient();
  await supabase.from("client_payments").delete().eq("id", id);
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin");
}
