"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, FileJson, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { importSnapshot, type SnapshotResult } from "@/lib/actions/snapshot-import";

/** Import & Backup extras: ASHWIN snapshot JSON import and the full-data backup download. */
export function SnapshotAndBackup() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<SnapshotResult | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    if (!file) {
      toast.error("Choose ashwin_migration_data.json first.");
      return;
    }
    if (!window.confirm("Import this snapshot? Parties that already exist (same name) are skipped; new ones are added with their current balance as an opening balance.")) {
      return;
    }
    startTransition(async () => {
      try {
        const res = await importSnapshot(await file.text());
        setResult(res);
        if (res.ok) {
          toast.success("Snapshot imported. Review balances against your Excel before live use.");
          router.refresh();
        } else toast.error(res.error ?? "Import failed.");
      } catch {
        toast.error("Import failed.");
      }
    });
  }

  const line = (label: string, r?: { imported: number; skipped: number; errors: string[] }) =>
    r ? `${label}: ${r.imported} imported${r.errors.length ? `, ${r.errors.length} failed` : ""}` : "";

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--border)] bg-white p-4 space-y-3">
        <p className="font-semibold text-sm flex items-center gap-2">
          <FileJson className="size-4" /> Import ASHWIN snapshot JSON
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          Choose <code>ashwin_migration_data.json</code>. Clients, labour and vendors are added with their mobile
          numbers, status and balance. Existing parties are never overwritten.
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <Input
            type="file"
            accept=".json,application/json"
            className="max-w-sm"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setResult(null);
            }}
          />
          <Button onClick={run} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />} Import JSON
          </Button>
        </div>
        {result?.ok && (
          <p className="text-sm text-[var(--text-muted)]">
            {[line("Clients", result.clients), line("Labour", result.labour), line("Vendors", result.vendors)]
              .filter(Boolean)
              .join(" · ")}
            {result.existing ? ` · ${result.existing} already existed (skipped)` : ""}. Snapshot only; verify against Excel.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white p-4 space-y-3">
        <p className="font-semibold text-sm flex items-center gap-2">
          <Download className="size-4" /> Backup
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          Download everything — parties, ledgers, quotations, estimates, invoices — as one JSON file. Data lives in the
          cloud and syncs across all devices automatically; keep a weekly backup anyway.
        </p>
        <Button asChild variant="outline">
          <a href="/admin/import/backup">
            <Download className="size-4" /> Download Full Backup JSON
          </a>
        </Button>
      </div>
    </div>
  );
}
