"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FinancialYear } from "@/lib/types";

export async function listFinancialYears(): Promise<FinancialYear[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("financial_years")
    .select("*")
    .order("start_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getActiveFinancialYear(): Promise<FinancialYear | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("financial_years")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();
  return data ?? null;
}

export async function createFinancialYear(formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  const start_date = String(formData.get("start_date") ?? "");
  const end_date = String(formData.get("end_date") ?? "");
  if (!label || !start_date || !end_date) return;

  const supabase = await createClient();
  await supabase.from("financial_years").insert({ label, start_date, end_date });
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
}

export async function setActiveFinancialYear(id: string) {
  const supabase = await createClient();
  await supabase.from("financial_years").update({ is_active: false }).neq("id", id);
  await supabase.from("financial_years").update({ is_active: true }).eq("id", id);
  revalidatePath("/admin", "layout");
}
