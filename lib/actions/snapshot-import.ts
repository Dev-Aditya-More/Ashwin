"use server";

import { bulkImport, type ImportResult, type ImportRow } from "@/lib/actions/import";
import { createClient } from "@/lib/supabase/server";

type SnapshotParty = {
  name?: string;
  mobile?: string | number | null;
  balance?: number | null;
  workStatus?: string | null;
  gstin?: string | null;
  address?: string | null;
};

type Snapshot = {
  clients?: SnapshotParty[];
  labours?: SnapshotParty[];
  vendors?: SnapshotParty[];
};

export type SnapshotResult = {
  ok: boolean;
  error?: string;
  clients?: ImportResult;
  labour?: ImportResult;
  vendors?: ImportResult;
  existing: number;
};

/**
 * Imports an ASHWIN snapshot JSON (ashwin_migration_data.json): clients, labour and
 * vendors with their mobile numbers, status and current balance (carried over as an
 * opening-balance entry). Parties that already exist by name are skipped so the
 * import can never duplicate or overwrite live data.
 */
export async function importSnapshot(json: string): Promise<SnapshotResult> {
  let data: Snapshot;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, error: "That file is not valid JSON.", existing: 0 };
  }
  if (!Array.isArray(data.clients) || !Array.isArray(data.labours) || !Array.isArray(data.vendors)) {
    return { ok: false, error: "Unexpected JSON format (expected clients, labours and vendors lists).", existing: 0 };
  }

  const supabase = await createClient();
  const [c, l, v] = await Promise.all([
    supabase.from("clients").select("name"),
    supabase.from("labourers").select("name"),
    supabase.from("vendors").select("name"),
  ]);
  const have = (rows: { name: string }[] | null) =>
    new Set((rows ?? []).map((r) => r.name.trim().toLowerCase()));
  const haveC = have(c.data);
  const haveL = have(l.data);
  const haveV = have(v.data);

  let existing = 0;
  const pick = (list: SnapshotParty[], seen: Set<string>): ImportRow[] => {
    const out: ImportRow[] = [];
    for (const p of list) {
      const name = String(p.name ?? "").trim();
      if (!name) continue;
      if (seen.has(name.toLowerCase())) {
        existing++;
        continue;
      }
      seen.add(name.toLowerCase());
      out.push({
        name,
        phone: p.mobile ? String(p.mobile) : undefined,
        address: p.address ?? undefined,
        gstin: p.gstin ?? undefined,
        work_status: p.workStatus ?? undefined,
        opening_balance: Number(p.balance ?? 0) || 0,
      });
    }
    return out;
  };

  const clientRows = pick(data.clients, haveC);
  const labourRows = pick(data.labours, haveL);
  const vendorRows = pick(data.vendors, haveV);

  return {
    ok: true,
    existing,
    clients: await bulkImport("clients", clientRows),
    labour: await bulkImport("labour", labourRows),
    vendors: await bulkImport("vendors", vendorRows),
  };
}
