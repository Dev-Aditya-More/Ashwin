import Link from "next/link";
import { Banknote } from "lucide-react";
import { listLabourers } from "@/lib/actions/labour";
import { AddLabourerDialog } from "@/components/admin/dialogs/LabourDialogs";
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
import { Button } from "@/components/ui/button";

export default async function LabourPage() {
  const labourers = await listLabourers();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Labour</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {labourers.length} worker{labourers.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/labour/bulk-pay">
              <Banknote className="size-4" /> Bulk Pay
            </Link>
          </Button>
          <AddLabourerDialog />
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Default Rate</TableHead>
              <TableHead className="text-right">Money to Pay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {labourers.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/labour/${l.id}`} className="hover:underline">
                    {l.name}
                  </Link>
                </TableCell>
                <TableCell className="text-[var(--text-muted)]">{l.phone ?? "—"}</TableCell>
                <TableCell className="text-[var(--text-muted)]">
                  {l.default_rate ? formatMoney(l.default_rate) : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {l.balance > 0 ? (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                      {formatMoney(l.balance)}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Settled</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {labourers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-[var(--text-muted)] py-10">
                  No labourers yet. Add your first worker to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
