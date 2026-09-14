import type { SupabaseClient } from "@supabase/supabase-js";

export async function currentUserEmail(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

/**
 * Inserts row(s), tagging them with who added them and merging any
 * newer optional columns (payment_mode, bill_no, entry_type, …).
 * Falls back to a plain insert of just the base row if any of that
 * fails — e.g. the relevant migration (0002/0003) hasn't been run on
 * this project yet — so core functionality never breaks while a
 * migration is pending.
 */
export async function insertWithActor(
  supabase: SupabaseClient,
  table: string,
  rows: Record<string, unknown> | Record<string, unknown>[],
  actorEmail: string | null,
  extra?: Record<string, unknown>
) {
  const withExtra = (row: Record<string, unknown>) => ({
    ...row,
    ...(extra ?? {}),
    ...(actorEmail ? { created_by: actorEmail } : {}),
  });

  const tagged = Array.isArray(rows) ? rows.map(withExtra) : withExtra(rows);
  const { error } = await supabase.from(table).insert(tagged);
  if (!error) return;

  const { error: fallbackError } = await supabase.from(table).insert(rows);
  if (fallbackError) throw fallbackError;
}

/**
 * Same defensive fallback as insertWithActor, but for editing an
 * existing row: tries the update with the newer optional columns
 * merged in, and falls back to just the base fields if that fails
 * (migration pending).
 */
export async function updateSafely(
  supabase: SupabaseClient,
  table: string,
  id: string,
  row: Record<string, unknown>,
  extra?: Record<string, unknown>
) {
  if (extra) {
    const { error } = await supabase.from(table).update({ ...row, ...extra }).eq("id", id);
    if (!error) return;
  }

  const { error: fallbackError } = await supabase.from(table).update(row).eq("id", id);
  if (fallbackError) throw fallbackError;
}
