"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentUserEmail } from "@/lib/actions/audit-helper";
import { DEFAULT_PRINT_THEME, normalizeTheme, type PrintTheme } from "@/lib/print/theme";

const ROW_ID = "default";

/** Saved print look; the built-in default when nothing is saved yet or migration 0013 hasn't been run. */
export async function getPrintTheme(): Promise<PrintTheme> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("print_settings")
    .select("invoice_layout, accent, accent2")
    .eq("id", ROW_ID)
    .maybeSingle();
  if (error || !data) return DEFAULT_PRINT_THEME;
  return normalizeTheme({ invoiceLayout: data.invoice_layout, accent: data.accent, accent2: data.accent2 });
}

export async function savePrintTheme(input: PrintTheme): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const email = await currentUserEmail(supabase);
  if (!email) return { ok: false, error: "Please sign in again." };
  const t = normalizeTheme(input);
  const { error } = await supabase.from("print_settings").upsert({
    id: ROW_ID,
    invoice_layout: t.invoiceLayout,
    accent: t.accent,
    accent2: t.accent2,
    updated_at: new Date().toISOString(),
    updated_by: email,
  });
  if (error) {
    const missing = /print_settings|relation|schema cache/i.test(error.message);
    return { ok: false, error: missing ? "Run migration 0013_print_settings.sql in the Supabase SQL editor first." : "Couldn't save. Please try again." };
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}
