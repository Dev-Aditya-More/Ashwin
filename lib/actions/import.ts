"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { currentUserEmail, insertWithActor } from "@/lib/actions/audit-helper";

export type ImportEntity = "clients" | "vendors" | "labour";

export type ImportRow = {
  name: string;
  phone?: string;
  address?: string; // clients only
  category?: string; // vendors only
  default_rate?: number; // labour only
  opening_balance?: number; // positive = they owe us / we owe them (per entity); negative = the reverse
};

export type ImportResult = {
  imported: number;
  skipped: number;
  errors: string[];
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Turns an opening balance into a real ledger entry (work/bill or payment)
 * dated today, so a freshly created contact carries over its existing due
 * instead of starting at zero. Shared by the CSV importer and the "Add
 * Client/Vendor/Labour" dialogs, which both let you set a starting balance.
 */
export async function applyOpeningBalance(
  supabase: SupabaseClient,
  entity: ImportEntity,
  entityId: string,
  opening: number,
  financial_year_id: string | null,
  actorEmail: string | null
) {
  if (!opening) return;

  if (entity === "clients") {
    if (opening > 0) {
      await insertWithActor(
        supabase,
        "client_work",
        {
          client_id: entityId,
          description: "Opening balance",
          amount: opening,
          work_date: today(),
          financial_year_id,
        },
        actorEmail
      );
    } else {
      await insertWithActor(
        supabase,
        "client_payments",
        {
          client_id: entityId,
          amount: Math.abs(opening),
          payment_date: today(),
          note: "Opening advance",
          financial_year_id,
        },
        actorEmail
      );
    }
  } else if (entity === "vendors") {
    if (opening > 0) {
      await insertWithActor(
        supabase,
        "vendor_bills",
        {
          vendor_id: entityId,
          description: "Opening balance",
          amount: opening,
          bill_date: today(),
          financial_year_id,
        },
        actorEmail
      );
    } else {
      await insertWithActor(
        supabase,
        "vendor_payments",
        {
          vendor_id: entityId,
          amount: Math.abs(opening),
          payment_date: today(),
          note: "Opening advance",
          financial_year_id,
        },
        actorEmail
      );
    }
  } else {
    if (opening > 0) {
      await insertWithActor(
        supabase,
        "labour_work",
        {
          labourer_id: entityId,
          description: "Opening balance",
          quantity: 1,
          rate: opening,
          amount: opening,
          work_date: today(),
          financial_year_id,
        },
        actorEmail
      );
    } else {
      await insertWithActor(
        supabase,
        "labour_payments",
        {
          labourer_id: entityId,
          amount: Math.abs(opening),
          payment_date: today(),
          note: "Opening advance",
          financial_year_id,
        },
        actorEmail,
        { entry_type: "Advance" }
      );
    }
  }
}

/**
 * Imports a batch of parsed spreadsheet rows for one entity type. Each row
 * becomes a master record plus, when an opening balance is given, a single
 * work/bill or payment entry dated today so existing balances carry over
 * instead of importing contacts with a blank slate.
 */
export async function bulkImport(entity: ImportEntity, rows: ImportRow[]): Promise<ImportResult> {
  const supabase = await createClient();
  const [fy, actorEmail] = await Promise.all([
    supabase.from("financial_years").select("id").eq("is_active", true).maybeSingle(),
    currentUserEmail(supabase),
  ]);
  const financial_year_id = fy.data?.id ?? null;

  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

  for (const row of rows) {
    const name = (row.name ?? "").trim();
    if (!name) {
      result.skipped++;
      continue;
    }

    try {
      if (entity === "clients") {
        const { data, error } = await supabase
          .from("clients")
          .insert({
            name,
            phone: row.phone?.trim() || null,
            address: row.address?.trim() || null,
          })
          .select("id")
          .single();
        if (error || !data) throw error ?? new Error("insert failed");
        await applyOpeningBalance(
          supabase,
          entity,
          data.id,
          Number(row.opening_balance ?? 0),
          financial_year_id,
          actorEmail
        );
      } else if (entity === "vendors") {
        const { data, error } = await supabase
          .from("vendors")
          .insert({
            name,
            phone: row.phone?.trim() || null,
            category: row.category?.trim() || null,
          })
          .select("id")
          .single();
        if (error || !data) throw error ?? new Error("insert failed");
        await applyOpeningBalance(
          supabase,
          entity,
          data.id,
          Number(row.opening_balance ?? 0),
          financial_year_id,
          actorEmail
        );
      } else {
        const { data, error } = await supabase
          .from("labourers")
          .insert({
            name,
            phone: row.phone?.trim() || null,
            default_rate: row.default_rate ?? null,
          })
          .select("id")
          .single();
        if (error || !data) throw error ?? new Error("insert failed");
        await applyOpeningBalance(
          supabase,
          entity,
          data.id,
          Number(row.opening_balance ?? 0),
          financial_year_id,
          actorEmail
        );
      }

      result.imported++;
    } catch (err) {
      result.errors.push(`${name}: ${err instanceof Error ? err.message : "failed to import"}`);
    }
  }

  revalidatePath(`/admin/${entity}`);
  revalidatePath("/admin");
  return result;
}
