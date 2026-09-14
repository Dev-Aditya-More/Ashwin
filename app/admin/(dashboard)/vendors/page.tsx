import Link from "next/link";
import { listVendors } from "@/lib/actions/vendors";
import { AddVendorDialog } from "@/components/admin/dialogs/VendorDialogs";
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

export default async function VendorsPage() {
  const vendors = await listVendors();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Vendors</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {vendors.length} vendor{vendors.length === 1 ? "" : "s"}
          </p>
        </div>
        <AddVendorDialog />
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Money to Pay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/vendors/${v.id}`} className="hover:underline">
                    {v.name}
                  </Link>
                </TableCell>
                <TableCell className="text-[var(--text-muted)]">{v.category ?? "—"}</TableCell>
                <TableCell className="text-[var(--text-muted)]">{v.phone ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {v.balance > 0 ? (
                    <Badge className="bg-rose-50 text-rose-700 border-rose-200">
                      {formatMoney(v.balance)}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Settled</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {vendors.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-[var(--text-muted)] py-10">
                  No vendors yet. Add your first vendor to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
