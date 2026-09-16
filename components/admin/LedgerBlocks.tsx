import Link from "next/link";
import { Phone, MessageCircle, Users, Truck, HardHat, ArrowRight, X } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { buildWhatsappLink, buildWhatsappMessage } from "@/lib/whatsapp";
import type { WhatsappContact } from "@/lib/actions/whatsapp";
import type { MonthlyRow, DailyRow } from "@/lib/actions/dashboard";
import { endOfCurrentMonth } from "@/lib/date-limits";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "rose" | "amber" | "blue";
}) {
  const toneClass = {
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
  }[tone];

  return (
    <div className={`rounded-xl border border-[var(--border)] p-4 ${toneClass}`}>
      <p className="text-xs">{label}</p>
      <p className="text-xl font-semibold mt-1">{formatMoney(value)}</p>
    </div>
  );
}

export function QuickAccess() {
  const links = [
    { label: "Client Ledger", href: "/admin/clients", icon: Users, tone: "text-emerald-600" },
    { label: "Vendor Ledger", href: "/admin/vendors", icon: Truck, tone: "text-rose-600" },
    { label: "Labour Ledger", href: "/admin/labour", icon: HardHat, tone: "text-amber-600" },
  ];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-2)]">
        <p className="font-semibold text-sm">Quick Access</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]">
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium hover:bg-[var(--bg-2)] transition-colors"
            >
              <Icon className={`size-4 ${l.tone}`} />
              {l.label}
              <ArrowRight className="size-3.5 text-[var(--text-muted)]" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function MonthlyPerformance({
  rows,
  dailyRows,
  from,
  to,
}: {
  rows: MonthlyRow[];
  /** When present (a date range was applied), shown day-by-day instead of the FY month rows. */
  dailyRows?: DailyRow[];
  from?: string;
  to?: string;
}) {
  const filtering = !!dailyRows;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-2)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <p className="font-semibold text-sm">
          {filtering ? "Performance — Day by Day" : "FY Monthly Performance"}
        </p>
        <form action="/admin" className="flex flex-wrap items-center gap-1.5">
          <input
            type="date"
            name="from"
            defaultValue={from}
            max={endOfCurrentMonth()}
            className="h-8 rounded-md border border-[var(--border)] bg-white px-2 text-xs"
            aria-label="From date"
          />
          <span className="text-xs text-[var(--text-muted)]">to</span>
          <input
            type="date"
            name="to"
            defaultValue={to}
            max={endOfCurrentMonth()}
            className="h-8 rounded-md border border-[var(--border)] bg-white px-2 text-xs"
            aria-label="To date"
          />
          <button
            type="submit"
            className="h-8 px-3 rounded-md text-xs font-medium bg-[var(--accent-blue)] text-white hover:opacity-90 transition-opacity"
          >
            View Day-wise
          </button>
          {filtering && (
            <Link
              href="/admin"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 ml-1"
            >
              <X className="size-3" /> Clear
            </Link>
          )}
        </form>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{filtering ? "Date" : "Month"}</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Labour</TableHead>
              <TableHead className="text-right">Vendor</TableHead>
              <TableHead className="text-right">Net</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtering
              ? dailyRows!.map((d) => {
                  const hasActivity = d.revenue > 0 || d.labour > 0 || d.vendor > 0;
                  return (
                    <TableRow key={d.key}>
                      <TableCell className={hasActivity ? "font-medium" : "font-medium text-[var(--text-muted)]"}>
                        {d.label}
                      </TableCell>
                      <TableCell className="text-right">{d.revenue ? formatMoney(d.revenue) : "—"}</TableCell>
                      <TableCell className="text-right">{d.labour ? formatMoney(d.labour) : "—"}</TableCell>
                      <TableCell className="text-right">{d.vendor ? formatMoney(d.vendor) : "—"}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          !hasActivity ? "text-[var(--text-muted)]" : d.net < 0 ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        {hasActivity ? formatMoney(d.net) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              : rows.map((m) => {
                  const hasActivity = m.revenue > 0 || m.labour > 0 || m.vendor > 0;
                  return (
                    <TableRow key={m.key}>
                      <TableCell className="font-medium">
                        {hasActivity ? (
                          <Link
                            href={`/admin/transactions?month=${m.key}`}
                            className="text-[var(--accent-blue)] hover:underline"
                          >
                            {m.month}
                          </Link>
                        ) : (
                          <span className="text-[var(--text-muted)]">{m.month}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{m.revenue ? formatMoney(m.revenue) : "—"}</TableCell>
                      <TableCell className="text-right">{m.labour ? formatMoney(m.labour) : "—"}</TableCell>
                      <TableCell className="text-right">{m.vendor ? formatMoney(m.vendor) : "—"}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          !hasActivity ? "text-[var(--text-muted)]" : m.net < 0 ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        {hasActivity ? formatMoney(m.net) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
            {filtering && dailyRows!.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-[var(--text-muted)] py-8">
                  No activity in that range.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export type LedgerRow = { id: string; name: string; phone: string | null; balance: number };

export function LedgerTable({
  title,
  category,
  rows,
  tone,
}: {
  title: string;
  category: WhatsappContact["category"];
  rows: LedgerRow[];
  tone: "emerald" | "amber" | "rose";
}) {
  const toneClass = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
  }[tone];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-2)] flex items-center justify-between">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-[var(--text-muted)]">{rows.length} outstanding</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead className="text-center w-24">Contact</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const contact: WhatsappContact = {
              id: r.id,
              name: r.name,
              phone: r.phone,
              balance: r.balance,
              category,
            };
            const message = buildWhatsappMessage(contact);
            return (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-[var(--text-muted)]">{r.phone ?? "—"}</TableCell>
                <TableCell className={`text-right font-medium ${toneClass}`}>
                  {formatMoney(r.balance)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1.5">
                    {r.phone ? (
                      <>
                        <a
                          href={`tel:${r.phone}`}
                          className="size-7 rounded-full flex items-center justify-center text-[var(--accent-blue)] hover:bg-blue-50 transition-colors"
                          title="Call"
                        >
                          <Phone className="size-3.5" />
                        </a>
                        <a
                          href={buildWhatsappLink(r.phone, message)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="size-7 rounded-full flex items-center justify-center text-[var(--accent-green)] hover:bg-emerald-50 transition-colors"
                          title="WhatsApp"
                        >
                          <MessageCircle className="size-3.5" />
                        </a>
                      </>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">No phone</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-[var(--text-muted)] py-6">
                Nothing outstanding. 🎉
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
