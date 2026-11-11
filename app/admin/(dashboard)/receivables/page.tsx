import Link from "next/link";
import { getReceivables } from "@/lib/actions/receivables";
import { BUCKETS } from "@/lib/ageing";
import { buildReminderMessage } from "@/lib/whatsapp";
import { ReminderButtons } from "@/components/admin/ReminderButtons";
import { formatDate, formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const FILTERS = [
  { key: "all", label: "All", min: 0 },
  { key: "30", label: "Over 30 days", min: 31 },
  { key: "60", label: "Over 60 days", min: 61 },
  { key: "90", label: "Over 90 days", min: 91 },
] as const;

const BUCKET_TONE = ["text-emerald-700", "text-amber-700", "text-orange-700", "text-rose-700"];

function ageBadge(days: number) {
  const tone =
    days > 90 ? "bg-rose-50 text-rose-700 border-rose-200"
    : days > 60 ? "bg-orange-50 text-orange-700 border-orange-200"
    : days > 30 ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";
  return <Badge className={tone}>{days} day{days === 1 ? "" : "s"}</Badge>;
}

export default async function ReceivablesPage({ searchParams }: { searchParams: Promise<{ age?: string }> }) {
  const { age = "all" } = await searchParams;
  const filter = FILTERS.find((f) => f.key === age) ?? FILTERS[0];
  const all = await getReceivables();
  const rows = all.filter((r) => r.oldestDays >= filter.min);

  const totals = BUCKETS.map((b) => ({
    ...b,
    amount: all.reduce((s, r) => s + r.buckets[b.key], 0),
    clients: all.filter((r) => r.buckets[b.key] > 0).length,
  }));
  const grand = totals.reduce((s, t) => s + t.amount, 0);
  const shown = rows.reduce((s, r) => s + r.outstanding, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Receivables</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Who owes you, and for how long. Payments are counted against the oldest bills first.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="col-span-2 lg:col-span-1 rounded-xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs text-[var(--text-muted)]">Total to collect</p>
          <p className="text-xl font-semibold mt-1">{formatMoney(grand)}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{all.length} client{all.length === 1 ? "" : "s"}</p>
        </div>
        {totals.map((t, i) => (
          <div key={t.key} className="rounded-xl border border-[var(--border)] bg-white p-4">
            <p className="text-xs text-[var(--text-muted)]">{t.label}</p>
            <p className={`text-xl font-semibold mt-1 ${BUCKET_TONE[i]}`}>{formatMoney(t.amount)}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{t.clients} client{t.clients === 1 ? "" : "s"}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/admin/receivables" : `/admin/receivables?age=${f.key}`}
            className={`rounded-full border px-3 py-1.5 text-xs ${
              f.key === filter.key ? "border-blue-500 bg-blue-50 text-blue-700" : "border-[var(--border)] bg-white hover:bg-[var(--bg-2)]"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              {BUCKETS.map((b) => (
                <TableHead key={b.key} className="text-right whitespace-nowrap">{b.label}</TableHead>
              ))}
              <TableHead className="text-center">Oldest bill</TableHead>
              <TableHead>Last payment</TableHead>
              <TableHead className="text-right">Remind</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const message = buildReminderMessage({
                name: r.name,
                brand: r.brand,
                outstanding: r.outstanding,
                oldestDays: r.oldestDays,
                overdue30: r.buckets.b30 + r.buckets.b60 + r.buckets.b90,
              });
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/clients/${r.id}`} className="hover:underline">{r.name}</Link>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatMoney(r.outstanding)}</TableCell>
                  {BUCKETS.map((b, i) => (
                    <TableCell key={b.key} className={`text-right ${r.buckets[b.key] ? BUCKET_TONE[i] : "text-[var(--text-muted)]"}`}>
                      {r.buckets[b.key] ? formatMoney(r.buckets[b.key]) : "-"}
                    </TableCell>
                  ))}
                  <TableCell className="text-center">{ageBadge(r.oldestDays)}</TableCell>
                  <TableCell className="text-[var(--text-muted)] whitespace-nowrap">
                    {r.lastPaymentDate ? formatDate(r.lastPaymentDate) : "None yet"}
                  </TableCell>
                  <TableCell>
                    <ReminderButtons phone={r.phone} message={message} />
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-[var(--text-muted)] py-10">
                  {all.length === 0 ? "Nobody owes you anything right now." : "No clients in this age group."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {rows.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell>{rows.length} client{rows.length === 1 ? "" : "s"}</TableCell>
                <TableCell className="text-right">{formatMoney(shown)}</TableCell>
                <TableCell colSpan={7} />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
