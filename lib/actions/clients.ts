"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Client, ClientBalance, ClientWork, ClientPayment } from "@/lib/types";

export async function listClients(): Promise<(Client & { balance: number })[]> {
  const supabase = await createClient();
  const [{ data: clients }, { data: balances }] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase.from("client_balances").select("*"),
  ]);

  const balanceMap = new Map<string, number>(
    (balances ?? []).map((b: ClientBalance) => [b.client_id, b.balance])
  );

  return (clients ?? []).map((c) => ({ ...c, balance: balanceMap.get(c.id) ?? 0 }));
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

export async function createClientRecord(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;

  const supabase = await createClient();
  await supabase.from("clients").insert({ name, phone, address });
  revalidatePath("/admin/clients");
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

export async function addClientWork(clientId: string, formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const work_date = String(formData.get("work_date") ?? "") || undefined;
  const project_id = String(formData.get("project_id") ?? "") || null;
  if (!description || !amount) return;

  const supabase = await createClient();
  const fy = await supabase.from("financial_years").select("id").eq("is_active", true).maybeSingle();
  await supabase.from("client_work").insert({
    client_id: clientId,
    project_id,
    description,
    amount,
    work_date,
    financial_year_id: fy.data?.id ?? null,
  });
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin");
}

export async function addClientPayment(clientId: string, formData: FormData) {
  const amount = Number(formData.get("amount") ?? 0);
  const payment_date = String(formData.get("payment_date") ?? "") || undefined;
  const note = String(formData.get("note") ?? "").trim() || null;
  const project_id = String(formData.get("project_id") ?? "") || null;
  if (!amount) return;

  const supabase = await createClient();
  const fy = await supabase.from("financial_years").select("id").eq("is_active", true).maybeSingle();
  await supabase.from("client_payments").insert({
    client_id: clientId,
    project_id,
    amount,
    payment_date,
    note,
    financial_year_id: fy.data?.id ?? null,
  });
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin");
}
