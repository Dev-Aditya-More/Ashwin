"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";

export async function listProjects(): Promise<
  (Project & { client_name: string | null })[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p) => ({
    ...p,
    client_name: (p as unknown as { clients: { name: string } | null }).clients?.name ?? null,
  }));
}

export async function getProject(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(id, name)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function listClientsForSelect() {
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("id, name").order("name");
  return data ?? [];
}

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const client_id = String(formData.get("client_id") ?? "") || null;
  const site_address = String(formData.get("site_address") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "ongoing");

  const supabase = await createClient();
  const fy = await supabase.from("financial_years").select("id").eq("is_active", true).maybeSingle();
  await supabase.from("projects").insert({
    name,
    client_id,
    site_address,
    status,
    financial_year_id: fy.data?.id ?? null,
  });
  revalidatePath("/admin/projects");
}

export async function updateProject(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const client_id = String(formData.get("client_id") ?? "") || null;
  const site_address = String(formData.get("site_address") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "ongoing");

  const supabase = await createClient();
  await supabase.from("projects").update({ name, client_id, site_address, status }).eq("id", id);
  revalidatePath(`/admin/projects/${id}`);
  revalidatePath("/admin/projects");
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  await supabase.from("projects").delete().eq("id", id);
  revalidatePath("/admin/projects");
  redirect("/admin/projects");
}
