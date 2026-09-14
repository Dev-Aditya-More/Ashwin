import type { SupabaseClient } from "@supabase/supabase-js";

const WINDOW_MINUTES = 15;

/**
 * True if a row with the same entity + amount + date was added in the
 * last 15 minutes — almost always an accidental double-submit (double
 * tap on a slow connection, browser back-button resubmit, etc.).
 */
export async function hasRecentDuplicate(
  supabase: SupabaseClient,
  table: string,
  entityColumn: string,
  entityId: string,
  amount: number,
  dateColumn: string,
  dateValue: string
): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const { data } = await supabase
    .from(table)
    .select("id")
    .eq(entityColumn, entityId)
    .eq("amount", amount)
    .eq(dateColumn, dateValue)
    .gte("created_at", since)
    .limit(1);

  return (data?.length ?? 0) > 0;
}

export function duplicateWarning(amount: number, dateValue: string): string {
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
  return `An entry for ${formattedAmount} on ${dateValue} was already added in the last few minutes. Add this one too?`;
}
