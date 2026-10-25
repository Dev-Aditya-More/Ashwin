import { todayIST } from "@/lib/today";
import { createClient } from "@/lib/supabase/server";

const TABLES = [
  "financial_years",
  "clients",
  "labourers",
  "vendors",
  "projects",
  "client_work",
  "client_payments",
  "labour_work",
  "labour_payments",
  "vendor_bills",
  "vendor_payments",
  "quotations",
  "estimates",
  "gst_invoices",
  "item_catalog",
] as const;

/** Full backup: every business table as one JSON file (download from Import & Backup). */
export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Response("Unauthorized", { status: 401 });

  const backup: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    exportedBy: auth.user.email ?? null,
  };
  for (const table of TABLES) {
    // Tables from migration 0007 may not exist yet — export what is there.
    const { data, error } = await supabase.from(table).select("*");
    backup[table] = error ? [] : data;
  }

  const filename = `ASHWIN_Backup_${todayIST()}.json`;
  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
