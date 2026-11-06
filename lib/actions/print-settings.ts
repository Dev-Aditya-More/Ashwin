"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentUserEmail } from "@/lib/actions/audit-helper";
import { DEFAULT_PRINT_THEME, normalizeTheme, type PrintTheme } from "@/lib/print/theme";

const ROW_ID = "default";

/** Saved print look; the built-in default when nothing is saved yet or the migrations haven't been run. */
export async function getPrintTheme(): Promise<PrintTheme> {
  const supabase = await createClient();
  let res: { data: Record<string, unknown> | null; error: unknown } = await supabase
    .from("print_settings")
    .select("invoice_layout, accent, accent2, invoice_toggles")
    .eq("id", ROW_ID)
    .maybeSingle();
  if (res.error) {
    // invoice_toggles comes from migration 0014; read the older shape while it is pending.
    res = await supabase.from("print_settings").select("invoice_layout, accent, accent2").eq("id", ROW_ID).maybeSingle();
  }
  const data = res.data;
  if (res.error || !data) return DEFAULT_PRINT_THEME;
  return normalizeTheme({
    invoiceLayout: data.invoice_layout,
    accent: data.accent,
    accent2: data.accent2,
    invoice: data.invoice_toggles,
  });
}

export async function savePrintTheme(input: PrintTheme): Promise<{ ok: true; warning?: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const email = await currentUserEmail(supabase);
  if (!email) return { ok: false, error: "Please sign in again." };
  const t = normalizeTheme(input);
  const base = {
    id: ROW_ID,
    invoice_layout: t.invoiceLayout,
    accent: t.accent,
    accent2: t.accent2,
    updated_at: new Date().toISOString(),
    updated_by: email,
  };

  let warning: string | undefined;
  let { error } = await supabase.from("print_settings").upsert({ ...base, invoice_toggles: t.invoice });
  if (error) {
    // Migration 0014 not run yet: still save the layout and colours, and say the switches need it.
    ({ error } = await supabase.from("print_settings").upsert(base));
    if (!error) warning = "Layout and colours saved, but the show/hide switches need migration 0014_print_toggles.sql to be run first.";
  }
  if (error) {
    const missing = /print_settings|relation|schema cache/i.test(error.message);
    return { ok: false, error: missing ? "Run migration 0013_print_settings.sql in the Supabase SQL editor first." : "Couldn't save. Please try again." };
  }
  revalidatePath("/admin", "layout");
  return { ok: true, warning };
}
