"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getBreakdown, type Breakdown, type BreakdownCategory } from "@/lib/actions/breakdown";
import { formatDate, formatMoney } from "@/lib/format";

type Cat = BreakdownCategory | "net";

const TITLE: Record<Cat, string> = { revenue: "Revenue", labour: "Labour", vendor: "Vendor", net: "Net" };
const HINT: Record<Cat, string> = {
  revenue: "Work billed to clients (confirmed Detail Sheets included; quotations, unconfirmed estimates and invoices are not).",
  labour: "Labour work entries.",
  vendor: "Bills received from vendors.",
  net: "Revenue minus labour and vendor costs.",
};

/**
 * A figure in the performance table that opens the party-wise details behind it —
 * like the ASHWIN workbook's "PARTY-WISE DETAILS" pop-up.
 */
export function BreakdownCell({
  category,
  value,
  from,
  to,
  label,
  fyOnly,
  className = "",
}: {
  category: Cat;
  value: number;
  from: string;
  to: string;
  label: string;
  fyOnly: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Breakdown | null>(null);

  async function show() {
    setOpen(true);
    if (!data) setData(await getBreakdown(from, to, fyOnly));
  }

  const sections: BreakdownCategory[] = category === "net" ? ["revenue", "labour", "vendor"] : [category];

  return (
    <>
      <button
        type="button"
        onClick={show}
        className={`underline decoration-dotted underline-offset-4 hover:text-[var(--accent-blue)] cursor-pointer ${className}`}
        title={`See where this ${TITLE[category].toLowerCase()} came from`}
      >
        {formatMoney(value)}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {TITLE[category]} — {label}
            </DialogTitle>
            <DialogDescription>{HINT[category]}</DialogDescription>
          </DialogHeader>

          {!data ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--text-muted)]">
              <Loader2 className="size-4 animate-spin" /> Loading party-wise details…
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((s) => (
                <Section key={s} title={category === "net" ? TITLE[s] : undefined} part={data[s]} onNavigate={() => setOpen(false)} />
              ))}
              <div className="flex justify-between border-t-2 border-[var(--text-primary)] pt-2 font-semibold">
                <span>TOTAL</span>
                <span>
                  {formatMoney(
                    category === "net" ? data.revenue.total - data.labour.total - data.vendor.total : data[category].total
                  )}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Section({
  title,
  part,
  onNavigate,
}: {
  title?: string;
  part: Breakdown[BreakdownCategory];
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <div className="space-y-1">
      {title && (
        <div className="flex justify-between text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          <span>{title}</span>
          <span>{formatMoney(part.total)}</span>
        </div>
      )}
      <div className="rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
        {part.parties.map((p) => (
          <div key={p.id}>
            <div className="flex items-center gap-2 px-3 py-2 text-sm">
              <button
                type="button"
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                aria-label="Show entries"
              >
                {expanded === p.id ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </button>
              <Link href={p.href} onClick={onNavigate} className="flex-1 font-medium hover:underline">
                {p.name}
              </Link>
              <span className="text-xs text-[var(--text-muted)]">
                {p.entries.length} entr{p.entries.length === 1 ? "y" : "ies"}
              </span>
              <span className="w-28 text-right font-medium">{formatMoney(p.amount)}</span>
            </div>
            {expanded === p.id && (
              <div className="bg-[var(--bg-2)] px-3 py-2 space-y-1">
                {p.entries.map((e, i) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <span className="w-20 shrink-0 text-[var(--text-muted)]">{formatDate(e.date)}</span>
                    <span className="flex-1">{e.description}</span>
                    <span className="text-right">{formatMoney(e.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {part.parties.length === 0 && (
          <p className="px-3 py-3 text-sm text-[var(--text-muted)]">Nothing in this period.</p>
        )}
      </div>
    </div>
  );
}
