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
import {
  detectColumnMap,
  detectTypeColumn,
  guessSheetForEntity,
  parseWorkbook,
  rowMatchesEntity,
  rowsToImportRows,
  type ParsedWorkbook,
} from "@/lib/import-parse";

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
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [sheetName, setSheetName] = useState<string>("");
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [typeColumn, setTypeColumn] = useState<string>("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ImportResult | null>(null);

  const currentSheet = workbook && sheetName ? workbook.sheets[sheetName] : null;

  function applySheetDefaults(wb: ParsedWorkbook, ent: ImportEntity) {
    const sn = guessSheetForEntity(wb, ent);
    const headers = wb.sheets[sn].headers;
    setSheetName(sn);
    setColumnMap(detectColumnMap(headers, ent) as Record<string, string>);
    setTypeColumn(detectTypeColumn(headers) ?? "");
  }

  function selectEntity(next: string) {
    const ent = next as ImportEntity;
    setEntity(ent);
    setResult(null);
    if (workbook) applySheetDefaults(workbook, ent);
  }

  function selectSheet(name: string) {
    if (!workbook) return;
    setSheetName(name);
    setResult(null);
    const headers = workbook.sheets[name].headers;
    setColumnMap(detectColumnMap(headers, entity) as Record<string, string>);
    setTypeColumn(detectTypeColumn(headers) ?? "");
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const wb = await parseWorkbook(file);
      const hasRows = wb.sheetNames.some((n) => wb.sheets[n].rows.length > 0);
      if (!hasRows) {
        toast.error("That file has no rows.");
        return;
      }
      setFileName(file.name);
      setWorkbook(wb);
      setResult(null);
      applySheetDefaults(wb, entity);
    } catch {
      toast.error("Couldn't read that file — is it a valid .csv or Excel file?");
    }
  }

  const importRows = useMemo(() => {
    if (!currentSheet) return [];
    const rows = typeColumn
      ? currentSheet.rows.filter((r) => rowMatchesEntity(r[typeColumn] ?? "", entity))
      : currentSheet.rows;
    return rowsToImportRows(rows, columnMap as never);
  }, [currentSheet, columnMap, typeColumn, entity]);

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
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.xlsm"
              className="hidden"
              onChange={handleFile}
            />
          </label>
          <Button type="button" variant="ghost" size="sm" onClick={() => downloadSample(entity)}>
            <Download className="size-4" /> Download sample template
          </Button>
          {fileName && <span className="text-sm text-[var(--text-muted)]">{fileName}</span>}
        </div>

        {workbook && currentSheet && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {workbook.sheetNames.length > 1 && (
                <div className="space-y-1.5">
                  <Label>Sheet</Label>
                  <select
                    value={sheetName}
                    onChange={(e) => selectSheet(e.target.value)}
                    className="w-full h-9 rounded-md border border-[var(--border)] bg-background px-3 text-sm"
                  >
                    {workbook.sheetNames.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-[var(--text-muted)]">
                    One workbook, one sheet per type — pick the sheet feeding this tab.
                  </p>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Type Column (optional)</Label>
                <select
                  value={typeColumn}
                  onChange={(e) => setTypeColumn(e.target.value)}
                  className="w-full h-9 rounded-md border border-[var(--border)] bg-background px-3 text-sm"
                >
                  <option value="">— This sheet is all {ENTITY_LABEL[entity].toLowerCase()} —</option>
                  {currentSheet.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[var(--text-muted)]">
                  If one sheet mixes clients, vendors &amp; labour together, pick the column that
                  says which is which.
                </p>
              </div>
            </div>

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
                      {currentSheet.headers.map((h) => (
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
              {importRows.length === 0 && (
                <p className="text-sm text-[var(--text-muted)] px-4 py-6 text-center">
                  No rows matched {ENTITY_LABEL[entity].toLowerCase()} on this sheet — check the
                  Type Column or Sheet picked above.
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
