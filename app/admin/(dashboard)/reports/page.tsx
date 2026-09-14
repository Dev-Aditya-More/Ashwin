import { listClients } from "@/lib/actions/clients";
import { listLabourers } from "@/lib/actions/labour";
import { listVendors } from "@/lib/actions/vendors";
import { formatMoney } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ReportsPage() {
  const [clients, labourers, vendors] = await Promise.all([
    listClients(),
    listLabourers(),
    listVendors(),
  ]);

  const totalReceivable = clients.reduce((a, c) => a + Math.max(c.balance, 0), 0);
  const totalLabourDue = labourers.reduce((a, l) => a + Math.max(l.balance, 0), 0);
  const totalVendorDue = vendors.reduce((a, v) => a + Math.max(v.balance, 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Reports</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Who owes you, and who you owe — calculated live from work, bills and payments.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-[var(--border)] bg-emerald-50 p-4">
          <p className="text-xs text-emerald-700">Total Money to Receive</p>
          <p className="text-xl font-semibold text-emerald-700 mt-1">{formatMoney(totalReceivable)}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-amber-50 p-4">
          <p className="text-xs text-amber-700">Total Labour Due</p>
          <p className="text-xl font-semibold text-amber-700 mt-1">{formatMoney(totalLabourDue)}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-rose-50 p-4">
          <p className="text-xs text-rose-700">Total Vendor Payable</p>
          <p className="text-xl font-semibold text-rose-700 mt-1">{formatMoney(totalVendorDue)}</p>
        </div>
      </div>

      <ReportTable
        title="Clients — Money to Receive"
        rows={clients.filter((c) => c.balance > 0)}
        columnLabel="Remaining"
        tone="emerald"
      />
      <ReportTable
        title="Labour — Money to Pay"
        rows={labourers.filter((l) => l.balance > 0)}
        columnLabel="Remaining"
        tone="amber"
      />
      <ReportTable
        title="Vendors — Money to Pay"
        rows={vendors.filter((v) => v.balance > 0)}
        columnLabel="Remaining"
        tone="rose"
      />
    </div>
  );
}

function ReportTable({
  title,
  rows,
  tone,
}: {
  title: string;
  rows: { id: string; name: string; balance: number }[];
  columnLabel: string;
  tone: "emerald" | "amber" | "rose";
}) {
  const toneClass = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
  }[tone];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <p className="font-semibold text-sm">{title}</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Remaining</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell className={`text-right font-medium ${toneClass}`}>
                {formatMoney(r.balance)}
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-[var(--text-muted)] py-6">
                Nothing outstanding. 🎉
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
