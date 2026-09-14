import Link from "next/link";
import { listClients } from "@/lib/actions/clients";
import { AddClientDialog } from "@/components/admin/dialogs/ClientDialogs";
import { formatMoney } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function ClientsPage() {
  const clients = await listClients();

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

      <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Money to Receive</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((c) => (
              <TableRow key={c.id} className="cursor-pointer">
                <TableCell className="font-medium">
                  <Link href={`/admin/clients/${c.id}`} className="hover:underline">
                    {c.name}
                  </Link>
                </TableCell>
                <TableCell className="text-[var(--text-muted)]">{c.phone ?? "—"}</TableCell>
                <TableCell className="text-[var(--text-muted)] max-w-[240px] truncate">
                  {c.address ?? "—"}
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
              </TableRow>
            ))}
            {clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-[var(--text-muted)] py-10">
                  No clients yet. Add your first client to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
