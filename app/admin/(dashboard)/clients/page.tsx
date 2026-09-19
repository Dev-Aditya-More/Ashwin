import Link from "next/link";
import { listClients } from "@/lib/actions/clients";
import { AddClientDialog } from "@/components/admin/dialogs/ClientDialogs";
import { formatMoney } from "@/lib/format";
import { QuickContactActions } from "@/components/admin/QuickContactActions";
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

export default async function ClientsPage() {
  const clients = await listClients();
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

      <div className="rounded-xl border border-[var(--border)] bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Total Billed</TableHead>
              <TableHead className="text-right">Total Received</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-center w-24">Contact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/clients/${c.id}`} className="hover:underline">
                    {c.name}
                  </Link>
                </TableCell>
                <TableCell className="text-[var(--text-muted)]">{c.phone ?? "—"}</TableCell>
                <TableCell className="text-[var(--text-muted)] max-w-[200px] truncate">
                  {c.address ?? "—"}
                </TableCell>
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
                  />
                </TableCell>
              </TableRow>
            ))}
            {clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-[var(--text-muted)] py-10">
                  No clients yet. Use the Add button above to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {clients.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total</TableCell>
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
