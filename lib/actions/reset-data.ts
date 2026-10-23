"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Children first so foreign keys never block a delete. Financial years, the PIN lock,
// the estimate dropdown catalog and user accounts are kept.
const TABLES = [
  "gst_invoices",
  "estimates",
  "quotations",
  "client_payments",
  "client_work",
  "labour_payments",
  "labour_work",
  "vendor_payments",
  "vendor_bills",
  "projects",
  "clients",
  "labourers",
  "vendors",
] as const;

/** Deletes ALL parties, ledger entries, projects and documents so you can start fresh (e.g. import a new JSON). */
export async function resetAllData(confirmation: string): Promise<{ ok: boolean; error?: string }> {
  if (confirmation.trim() !== "DELETE ALL") return { ok: false, error: 'Type "DELETE ALL" to confirm.' };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false, error: "Not signed in." };

  for (const table of TABLES) {
    // Newer tables (migration 0007) may not exist yet — skip those quietly.
    const { error } = await supabase.from(table).delete().not("id", "is", null);
    if (error && !/does not exist|schema cache/i.test(error.message)) {
      return { ok: false, error: `Could not clear ${table}: ${error.message}` };
    }
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}
