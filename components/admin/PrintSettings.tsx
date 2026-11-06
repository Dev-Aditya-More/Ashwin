"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { savePrintTheme } from "@/lib/actions/print-settings";
import { printTaxInvoice } from "@/lib/print/documents";
import { DEFAULT_PRINT_THEME, THEME_PRESETS, TOGGLE_LABELS, getPrintTheme, setPrintTheme, type InvoiceLayout, type PrintTheme } from "@/lib/print/theme";
import type { EstimateLine } from "@/lib/doc-calc";

const SAMPLE_LINES = [
  { productType: "12mm Toughened Glass – Clear", hsn: "7007", sqft: 38.5, qty: 2, unit: "Sq.Ft.", rate: 210, amount: 8085, width: 55, height: 70, widthUnit: "in", heightUnit: "in" },
  { productType: "Aluminium Section Frame", hsn: "7610", sqft: 1, qty: 1, unit: "Rft.", rate: 4200, amount: 4200, lumpSum: true },
] as unknown as EstimateLine[];

function printSample(theme: PrintTheme) {
  const prev = getPrintTheme();
  setPrintTheme(theme);
  try {
    printTaxInvoice(
      {
        no: "AE/2026/27-001",
        date: new Date().toISOString().slice(0, 10),
        client: "Sample Client",
        clientMobile: "9876543210",
        clientAddress: "Plot 12, Sample Nagar, Chh. Sambhajinagar",
        clientGstin: "27ABCDE1234F1Z5",
        siteName: "Sample Site",
        workType: "Glass & Aluminium",
        subtotal: 12285,
        taxable: 12285,
        gstRate: 18,
        tax: 2211.3,
        total: 14496,
        received: 5000,
        type: "GST",
      },
      SAMPLE_LINES,
      { name: "Sample Client" }
    );
  } finally {
    // The preview iframe has already captured its HTML; go back to the saved look straight away.
    setPrintTheme(prev);
  }
}

function MiniLayout({ kind, accent, accent2 }: { kind: InvoiceLayout; accent: string; accent2: string }) {
  return (
    <div className="h-20 w-full rounded border border-[var(--border)] bg-white p-1.5 overflow-hidden">
      {kind === "divine" ? (
        <>
          <div className="relative h-7">
            <div className="absolute left-0 top-0 h-full w-[54%] rounded-br-xl" style={{ background: accent2 }} />
            <div className="absolute left-[30%] right-0 top-0 h-4 rounded-l-full" style={{ background: accent }} />
          </div>
          <div className="mt-1.5 h-2.5 rounded-sm" style={{ background: accent }} />
          <div className="mt-1 h-1.5 rounded-sm bg-neutral-200" />
          <div className="mt-1 h-1.5 rounded-sm bg-neutral-200" />
        </>
      ) : (
        <>
          <div className="h-6 rounded-sm border border-neutral-400" />
          <div className="mt-1 h-2.5 rounded-sm bg-neutral-300" />
          <div className="mt-1 h-1.5 rounded-sm border border-neutral-300" />
          <div className="mt-1 h-1.5 rounded-sm border border-neutral-300" />
        </>
      )}
    </div>
  );
}

export function PrintSettings({ initial }: { initial: PrintTheme }) {
  const [theme, setTheme] = useState<PrintTheme>(initial);
  const [saved, setSaved] = useState<PrintTheme>(initial);
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(theme) !== JSON.stringify(saved);

  function save() {
    startTransition(async () => {
      const res = await savePrintTheme(theme);
      if (res.ok) {
        setPrintTheme(theme);
        setSaved(theme);
        if (res.warning) toast.warning(res.warning);
        else toast.success("Print look saved");
      } else toast.error(res.error);
    });
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-4 space-y-4 lg:col-span-2">
      <div>
        <p className="font-semibold text-sm">Print Layout</p>
        <p className="text-xs text-[var(--text-muted)]">How your Tax Invoice looks when printed or shared as PDF.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-md">
        {(
          [
            ["divine", "Divine", "Coloured header, accent table"],
            ["classic", "Classic", "Plain boxed layout"],
          ] as const
        ).map(([kind, name, hint]) => (
          <button
            key={kind}
            type="button"
            onClick={() => setTheme({ ...theme, invoiceLayout: kind })}
            className={`rounded-lg border p-2 text-left transition ${theme.invoiceLayout === kind ? "border-blue-500 ring-2 ring-blue-200" : "border-[var(--border)] hover:border-neutral-400"}`}
          >
            <MiniLayout kind={kind} accent={theme.accent} accent2={theme.accent2} />
            <div className="mt-1.5 flex items-center gap-1 text-sm font-medium">
              {name}
              {theme.invoiceLayout === kind && <Check className="size-3.5 text-blue-600" />}
            </div>
            <p className="text-xs text-[var(--text-muted)]">{hint}</p>
          </button>
        ))}
      </div>

      <div className={theme.invoiceLayout === "divine" ? "space-y-3" : "space-y-3 opacity-50 pointer-events-none"}>
        <p className="text-sm font-medium">Colours</p>
        <div className="flex flex-wrap gap-2">
          {THEME_PRESETS.map((p) => {
            const on = theme.accent === p.accent && theme.accent2 === p.accent2;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => setTheme({ ...theme, accent: p.accent, accent2: p.accent2 })}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${on ? "border-blue-500 ring-2 ring-blue-200" : "border-[var(--border)]"}`}
              >
                <span className="flex">
                  <span className="size-4 rounded-full border border-white" style={{ background: p.accent }} />
                  <span className="size-4 -ml-1.5 rounded-full border border-white" style={{ background: p.accent2 }} />
                </span>
                {p.name}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-4 text-xs">
          <label className="flex items-center gap-2">
            <input type="color" value={theme.accent} onChange={(e) => setTheme({ ...theme, accent: e.target.value })} className="h-8 w-10 rounded border border-[var(--border)] bg-white p-0.5" />
            Main colour (header bar, table, totals)
          </label>
          <label className="flex items-center gap-2">
            <input type="color" value={theme.accent2} onChange={(e) => setTheme({ ...theme, accent2: e.target.value })} className="h-8 w-10 rounded border border-[var(--border)] bg-white p-0.5" />
            Second colour (logo panel)
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Show on Tax Invoice</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 max-w-2xl">
          {TOGGLE_LABELS.map(({ key, label, hint }) => (
            <label key={key} className="flex items-start gap-2.5 rounded-md px-2 py-1.5 hover:bg-[var(--bg-2)] cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-blue-600"
                checked={theme.invoice[key]}
                onChange={(e) => setTheme({ ...theme, invoice: { ...theme.invoice, [key]: e.target.checked } })}
              />
              <span>
                <span className="block text-sm">{label}</span>
                <span className="block text-xs text-[var(--text-muted)]">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={save} disabled={!dirty || pending}>
          {pending && <Loader2 className="size-4 animate-spin" />} Save
        </Button>
        <Button type="button" variant="outline" onClick={() => printSample(theme)}>
          <Printer className="size-4" /> Preview Sample Invoice
        </Button>
        <Button type="button" variant="ghost" onClick={() => setTheme(DEFAULT_PRINT_THEME)}>
          Reset to default
        </Button>
      </div>
    </div>
  );
}
