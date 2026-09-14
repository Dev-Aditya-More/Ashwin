import type { SupabaseClient } from "@supabase/supabase-js";

export async function currentUserEmail(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

/**
 * Inserts row(s), tagging them with who added them. Falls back to a
 * plain insert if the `created_by` column doesn't exist yet (e.g. the
 * 0002_audit_trail.sql migration hasn't been run on this project) —
 * core functionality never breaks while that migration is pending.
 */
export async function insertWithActor(
  supabase: SupabaseClient,
  table: string,
  rows: Record<string, unknown> | Record<string, unknown>[],
  actorEmail: string | null
) {
  if (actorEmail) {
    const tagged = Array.isArray(rows)
      ? rows.map((r) => ({ ...r, created_by: actorEmail }))
      : { ...rows, created_by: actorEmail };
    const { error } = await supabase.from(table).insert(tagged);
    if (!error) return;
  }
  const { error } = await supabase.from(table).insert(rows);
  if (error) throw error;
}
