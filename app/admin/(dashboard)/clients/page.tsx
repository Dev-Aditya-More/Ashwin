import Link from "next/link";
import { listClients } from "@/lib/actions/clients";
import { getClientDocCounts } from "@/lib/actions/documents";
import { AddClientDialog } from "@/components/admin/dialogs/ClientDialogs";
import { formatMoney } from "@/lib/format";
import { QuickContactActions } from "@/components/admin/QuickContactActions";
import { PartySearch } from "@/components/admin/PartySearch";
import { getContactContext } from "@/lib/actions/whatsapp";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const term = q.trim().toLowerCase();
  const [allClients, ctx, docs] = await Promise.all([listClients(), getContactContext(), getClientDocCounts()]);
  // Quotation-only clients are highlighted; clients with no paperwork or ledger entries at all are dimmed.
  const docState = (c: (typeof allClients)[number]) => {
    const d = docs[c.id] ?? { quotes: 0, estimates: 0, bills: 0 };
    if (d.estimates || d.bills || c.totalWork || c.totalPaid) return "active" as const;
    return d.quotes ? ("quote-only" as const) : ("empty" as const);
  };
  const clients = term
    ? allClients.filter((c) =>
        `${c.name} ${c.phone ?? ""} ${c.gstin ?? ""}`.toLowerCase().includes(term)
      )
    : allClients;
  const totals = clients.reduce(
    (acc, c) => ({
      totalWork: acc.totalWork + c.totalWork,
      totalPaid: acc.totalPaid + c.totalPaid,
      balance: acc.balance + c.balance,
    }),
    { totalWork: 0, totalPaid: 0, balance: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Clients</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {clients.length} client{clients.length === 1 ? "" : "s"}
          </p>
        </div>
        <AddClientDialog />
      </div>

      <PartySearch initial={q} placeholder="Search by name, mobile number or GSTIN" />

      <div className="rounded-xl border border-[var(--border)] bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Status / Work</TableHead>
              <TableHead className="text-right">Total Billed</TableHead>
              <TableHead className="text-right">Total Received</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-center w-24">Contact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((c) => {
              const state = docState(c);
              return (
              <TableRow
                key={c.id}
                className={state === "quote-only" ? "bg-amber-50/70" : state === "empty" ? "opacity-60" : ""}
              >
                <TableCell className="font-medium">
                  <Link href={`/admin/clients/${c.id}`} className="hover:underline">
                    {c.name}
                  </Link>
                  {state === "quote-only" && (
                    <Badge className="ml-2 bg-amber-100 text-amber-800 border-amber-200">Quotation only</Badge>
                  )}
                  {state === "empty" && (
                    <Badge variant="secondary" className="ml-2">No documents yet</Badge>
                  )}
                </TableCell>
                <TableCell className="text-[var(--text-muted)]">{c.phone ?? "—"}</TableCell>
                <TableCell className="text-[var(--text-muted)] font-mono text-xs">{c.gstin ?? "—"}</TableCell>
                <TableCell className="text-[var(--text-muted)] max-w-[200px] truncate">
                  {c.address ?? "—"}
                </TableCell>
                <TableCell className="text-[var(--text-muted)]">{c.work_status ?? "—"}</TableCell>
                <TableCell className="text-right text-[var(--text-muted)]">
                  {c.totalWork ? formatMoney(c.totalWork) : "—"}
                </TableCell>
                <TableCell className="text-right text-[var(--text-muted)]">
                  {c.totalPaid ? formatMoney(c.totalPaid) : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {c.balance > 0 ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      {formatMoney(c.balance)}
                    </Badge>
                  ) : c.balance < 0 ? (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                      Advance {formatMoney(Math.abs(c.balance))}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Settled</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <QuickContactActions
                    id={c.id}
                    name={c.name}
                    phone={c.phone}
                    balance={c.balance}
                    category="Client"
                    lastTxn={ctx.last[c.id]}
                    brand={ctx.brand[c.id]}
                  />
                </TableCell>
              </TableRow>
              );
            })}
            {clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-[var(--text-muted)] py-10">
                  {term ? "No matching party records." : "No clients yet. Use the Add button above to get started."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {clients.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5}>Total</TableCell>
                <TableCell className="text-right">{formatMoney(totals.totalWork)}</TableCell>
                <TableCell className="text-right">{formatMoney(totals.totalPaid)}</TableCell>
                <TableCell className="text-right">
                  {formatMoney(totals.balance)}
                  {totals.balance < 0 ? " advance" : ""}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
