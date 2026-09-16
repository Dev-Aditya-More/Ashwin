"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Download, CheckCircle2, TriangleAlert } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { bulkImport, type ImportEntity, type ImportResult } from "@/lib/actions/import";
import { detectColumnMap, parseSpreadsheet, rowsToImportRows, type ParsedSheet } from "@/lib/import-parse";

const ENTITY_LABEL: Record<ImportEntity, string> = {
  clients: "Clients",
  vendors: "Vendors",
  labour: "Labour",
};

const ENTITY_FIELDS: Record<ImportEntity, { key: string; label: string }[]> = {
  clients: [
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "address", label: "Address / Site" },
    { key: "opening_balance", label: "Opening Balance (₹, they owe us)" },
  ],
  vendors: [
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "category", label: "Category" },
    { key: "opening_balance", label: "Opening Balance (₹, we owe them)" },
  ],
  labour: [
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "default_rate", label: "Default Rate (₹/day)" },
    { key: "opening_balance", label: "Opening Balance (₹, we owe them)" },
  ],
};

const SAMPLE_TEMPLATES: Record<ImportEntity, string> = {
  clients: "name,phone,address,opening_balance\nRajesh Sharma,9822990577,Kranti Chowk site,15000\n",
  vendors: "name,phone,category,opening_balance\nSharma Hardware,9822990000,Hardware,8000\n",
  labour: "name,phone,default_rate,opening_balance\nRamesh,9822990111,600,2000\n",
};

function downloadSample(entity: ImportEntity) {
  const blob = new Blob([SAMPLE_TEMPLATES[entity]], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${entity}-import-template.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportWizard() {
  const router = useRouter();
  const [entity, setEntity] = useState<ImportEntity>("clients");
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ImportResult | null>(null);

  function reset() {
    setSheet(null);
    setFileName(null);
    setColumnMap({});
    setResult(null);
  }

  function selectEntity(next: string) {
    setEntity(next as ImportEntity);
    reset();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const parsed = await parseSpreadsheet(file);
      if (parsed.rows.length === 0) {
        toast.error("That file has no rows.");
        return;
      }
      setFileName(file.name);
      setSheet(parsed);
      setResult(null);
      const detected = detectColumnMap(parsed.headers, entity);
      setColumnMap(detected as Record<string, string>);
    } catch {
      toast.error("Couldn't read that file — is it a valid .csv or .xlsx?");
    }
  }

  const importRows = useMemo(() => {
    if (!sheet) return [];
    return rowsToImportRows(sheet.rows, columnMap as never);
  }, [sheet, columnMap]);

  const readyCount = importRows.filter((r) => r.name.trim()).length;

  function handleImport() {
    if (importRows.length === 0) return;
    startTransition(async () => {
      const res = await bulkImport(entity, importRows);
      setResult(res);
      if (res.imported > 0) {
        toast.success(`Imported ${res.imported} ${ENTITY_LABEL[entity].toLowerCase()}.`);
        router.refresh();
      }
      if (res.errors.length > 0) {
        toast.error(`${res.errors.length} row(s) failed to import.`);
      }
    });
  }

  return (
    <div className="space-y-5">
      <Tabs value={entity} onValueChange={selectEntity}>
        <TabsList>
          {(Object.keys(ENTITY_LABEL) as ImportEntity[]).map((e) => (
            <TabsTrigger key={e} value={e}>
              {ENTITY_LABEL[e]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="rounded-xl border border-[var(--border)] bg-white p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[var(--border)] px-4 py-2.5 text-sm cursor-pointer hover:bg-[var(--bg-2)] transition-colors">
            <Upload className="size-4" />
            {fileName ? "Choose a different file" : "Choose CSV or Excel file"}
            <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
          </label>
          <Button type="button" variant="ghost" size="sm" onClick={() => downloadSample(entity)}>
            <Download className="size-4" /> Download sample template
          </Button>
          {fileName && <span className="text-sm text-[var(--text-muted)]">{fileName}</span>}
        </div>

        {sheet && (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium">Match your columns</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {ENTITY_FIELDS[entity].map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <Label>{f.label}</Label>
                    <select
                      value={columnMap[f.key] ?? ""}
                      onChange={(e) =>
                        setColumnMap((m) => ({ ...m, [f.key]: e.target.value }))
                      }
                      className="w-full h-9 rounded-md border border-[var(--border)] bg-background px-3 text-sm"
                    >
                      <option value="">— Not in file —</option>
                      {sheet.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border)] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {ENTITY_FIELDS[entity].map((f) => (
                      <TableHead key={f.key}>{f.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importRows.slice(0, 8).map((r, i) => (
                    <TableRow key={i}>
                      {ENTITY_FIELDS[entity].map((f) => (
                        <TableCell key={f.key} className="text-[var(--text-muted)]">
                          {String((r as unknown as Record<string, unknown>)[f.key] ?? "—") || "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {importRows.length > 8 && (
                <p className="text-xs text-[var(--text-muted)] px-4 py-2 border-t border-[var(--border)]">
                  + {importRows.length - 8} more row(s)
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--text-muted)]">
                {readyCount} of {importRows.length} row(s) have a name and will be imported.
              </p>
              <Button type="button" onClick={handleImport} disabled={pending || readyCount === 0}>
                {pending ? "Importing…" : `Import ${readyCount} ${ENTITY_LABEL[entity]}`}
              </Button>
            </div>
          </>
        )}

        {result && (
          <div className="space-y-2 rounded-lg border border-[var(--border)] p-3 text-sm">
            <p className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="size-4" /> Imported {result.imported}, skipped {result.skipped}
            </p>
            {result.errors.length > 0 && (
              <div className="flex gap-2 text-amber-800">
                <TriangleAlert className="size-4 shrink-0 mt-0.5" />
                <ul className="list-disc pl-4 space-y-0.5">
                  {result.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
