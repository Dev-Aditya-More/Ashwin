"use server";

import { createClient } from "@/lib/supabase/server";

export type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  category: "Client" | "Labour" | "Vendor" | "Project";
  href: string;
};

export async function searchAll(rawQuery: string): Promise<SearchResult[]> {
  const query = rawQuery.trim();
  if (query.length < 2) return [];

  const supabase = await createClient();
  const like = `%${query}%`;

  const [clients, labourers, vendors, projects] = await Promise.all([
    supabase.from("clients").select("id, name, phone").ilike("name", like).limit(5),
    supabase.from("labourers").select("id, name, phone").ilike("name", like).limit(5),
    supabase.from("vendors").select("id, name, category").ilike("name", like).limit(5),
    supabase.from("projects").select("id, name, site_address").ilike("name", like).limit(5),
  ]);

  const results: SearchResult[] = [
    ...(clients.data ?? []).map((c) => ({
      id: c.id,
      title: c.name,
      subtitle: c.phone ?? "Client",
      category: "Client" as const,
      href: `/admin/clients/${c.id}`,
    })),
    ...(labourers.data ?? []).map((l) => ({
      id: l.id,
      title: l.name,
      subtitle: l.phone ?? "Labour",
      category: "Labour" as const,
      href: `/admin/labour/${l.id}`,
    })),
    ...(vendors.data ?? []).map((v) => ({
      id: v.id,
      title: v.name,
      subtitle: v.category ?? "Vendor",
      category: "Vendor" as const,
      href: `/admin/vendors/${v.id}`,
    })),
    ...(projects.data ?? []).map((p) => ({
      id: p.id,
      title: p.name,
      subtitle: p.site_address ?? "Project / Site",
      category: "Project" as const,
      href: `/admin/projects/${p.id}`,
    })),
  ];

  return results;
}
