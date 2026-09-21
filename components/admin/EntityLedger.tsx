import { formatDate, formatMoney } from "@/lib/format";
import type { ClientWork, ClientPayment, VendorBill, VendorPayment, LabourPayment } from "@/lib/types";
import type { LabourWorkWithSite } from "@/lib/actions/labour";
import { deleteClientWork, deleteClientPayment } from "@/lib/actions/clients";
import { deleteVendorBill, deleteVendorPayment } from "@/lib/actions/vendors";
import { deleteLabourWork, deleteLabourPayment } from "@/lib/actions/labour";
import { DeleteRowButton } from "@/components/admin/dialogs/DeleteRowButton";
import {
  EditClientWorkDialog,
  EditClientPaymentDialog,
} from "@/components/admin/dialogs/ClientDialogs";
import {
  EditVendorBillDialog,
  EditVendorPaymentDialog,
} from "@/components/admin/dialogs/VendorDialogs";
import {
  EditLabourWorkDialog,
  EditLabourPaymentDialog,
} from "@/components/admin/dialogs/LabourDialogs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProjectOption = { id: string; name: string };

function BalanceCell({ value }: { value: number }) {
  return (
    <TableCell
      className={`text-right font-medium ${
        value > 0 ? "text-amber-600" : value < 0 ? "text-emerald-600" : "text-[var(--text-muted)]"
      }`}
    >
      {formatMoney(value)}
    </TableCell>
  );
}

function EmptyRow({ span }: { span: number }) {
  return (
    <TableRow>
      <TableCell colSpan={span} className="text-center text-[var(--text-muted)] py-8">
        No ledger entries yet.
      </TableCell>
    </TableRow>
  );
}

export function ClientLedgerTable({
  work,
  payments,
  clientId,
  projects,
}: {
  work: ClientWork[];
  payments: ClientPayment[];
  clientId: string;
  projects: ProjectOption[];
}) {
  type Row = {
    date: string;
    sortKey: string;
    billNo: string | null;
    particulars: string;
    paymentMode: string | null;
    debit: number;
    credit: number;
    edit: React.ReactNode;
    del: React.ReactNode;
  };

  const rows: Row[] = [
    ...work.map((w) => ({
      date: w.work_date,
      sortKey: `${w.work_date}T${w.created_at}`,
      billNo: w.bill_no ?? null,
      particulars: w.description,
      paymentMode: null,
      debit: Number(w.amount),
      credit: 0,
      edit: <EditClientWorkDialog work={w} clientId={clientId} projects={projects} />,
      del: <DeleteRowButton what="work entry" action={deleteClientWork.bind(null, w.id, clientId)} />,
    })),
    ...payments.map((p) => ({
      date: p.payment_date,
      sortKey: `${p.payment_date}T${p.created_at}`,
      billNo: null,
      particulars: p.note ?? "Payment received",
      paymentMode: p.payment_mode ?? null,
      debit: 0,
      credit: Number(p.amount),
      edit: <EditClientPaymentDialog payment={p} clientId={clientId} projects={projects} />,
      del: <DeleteRowButton what="payment" action={deleteClientPayment.bind(null, p.id, clientId)} />,
    })),
  ].sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  const withBalance: (Row & { balance: number })[] = [];
  for (const r of rows) {
    const previous = withBalance.at(-1)?.balance ?? 0;
    withBalance.push({ ...r, balance: previous + r.debit - r.credit });
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Bill No.</TableHead>
            <TableHead>Particulars</TableHead>
            <TableHead>Payment Mode</TableHead>
            <TableHead className="text-right">Debit</TableHead>
            <TableHead className="text-right">Credit</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {withBalance.map((r, i) => (
            <TableRow key={i}>
              <TableCell className="whitespace-nowrap">{formatDate(r.date)}</TableCell>
              <TableCell className="text-[var(--text-muted)]">{r.billNo ?? "—"}</TableCell>
              <TableCell>{r.particulars}</TableCell>
              <TableCell className="text-[var(--text-muted)]">{r.paymentMode ?? "—"}</TableCell>
              <TableCell className="text-right">{r.debit ? formatMoney(r.debit) : ""}</TableCell>
              <TableCell className="text-right text-emerald-600">{r.credit ? formatMoney(r.credit) : ""}</TableCell>
              <BalanceCell value={r.balance} />
              <TableCell>
                <div className="flex items-center gap-0.5">
                  {r.edit}
                  {r.del}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {withBalance.length === 0 && <EmptyRow span={8} />}
        </TableBody>
      </Table>
    </div>
  );
}

export function VendorLedgerTable({
  bills,
  payments,
  vendorId,
  projects,
}: {
  bills: VendorBill[];
  payments: VendorPayment[];
  vendorId: string;
  projects: ProjectOption[];
}) {
  type Row = {
    date: string;
    sortKey: string;
    billNo: string | null;
    item: string;
    paymentMode: string | null;
    billAmount: number;
    payment: number;
    edit: React.ReactNode;
    del: React.ReactNode;
  };

  const rows: Row[] = [
    ...bills.map((b) => ({
      date: b.bill_date,
      sortKey: `${b.bill_date}T${b.created_at}`,
      billNo: b.bill_no ?? null,
      item: b.description,
      paymentMode: null,
      billAmount: Number(b.amount),
      payment: 0,
      edit: <EditVendorBillDialog bill={b} vendorId={vendorId} projects={projects} />,
      del: <DeleteRowButton what="bill" action={deleteVendorBill.bind(null, b.id, vendorId)} />,
    })),
    ...payments.map((p) => ({
      date: p.payment_date,
      sortKey: `${p.payment_date}T${p.created_at}`,
      billNo: null,
      item: p.note ?? "Payment made",
      paymentMode: p.payment_mode ?? null,
      billAmount: 0,
      payment: Number(p.amount),
      edit: <EditVendorPaymentDialog payment={p} vendorId={vendorId} />,
      del: <DeleteRowButton what="payment" action={deleteVendorPayment.bind(null, p.id, vendorId)} />,
    })),
  ].sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  const withBalance: (Row & { balance: number })[] = [];
  for (const r of rows) {
    const previous = withBalance.at(-1)?.balance ?? 0;
    withBalance.push({ ...r, balance: previous + r.billAmount - r.payment });
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Bill No.</TableHead>
            <TableHead>Item / Material</TableHead>
            <TableHead className="text-right">Bill Amount</TableHead>
            <TableHead className="text-right">Payment</TableHead>
            <TableHead>Payment Mode</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {withBalance.map((r, i) => (
            <TableRow key={i}>
              <TableCell className="whitespace-nowrap">{formatDate(r.date)}</TableCell>
              <TableCell className="text-[var(--text-muted)]">{r.billNo ?? "—"}</TableCell>
              <TableCell>{r.item}</TableCell>
              <TableCell className="text-right">{r.billAmount ? formatMoney(r.billAmount) : ""}</TableCell>
              <TableCell className="text-right text-emerald-600">{r.payment ? formatMoney(r.payment) : ""}</TableCell>
              <TableCell className="text-[var(--text-muted)]">{r.paymentMode ?? "—"}</TableCell>
              <BalanceCell value={r.balance} />
              <TableCell>
                <div className="flex items-center gap-0.5">
                  {r.edit}
                  {r.del}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {withBalance.length === 0 && <EmptyRow span={8} />}
        </TableBody>
      </Table>
    </div>
  );
}

export function LabourLedgerTable({
  work,
  payments,
  labourerId,
  projects,
}: {
  work: LabourWorkWithSite[];
  payments: LabourPayment[];
  labourerId: string;
  projects: ProjectOption[];
}) {
  type Row = {
    date: string;
    sortKey: string;
    site: string | null;
    client: string | null;
    workDetails: string | null;
    qty: number | null;
    rate: number | null;
    workAmount: number;
    amountPaid: number;
    entryType: string | null;
    paymentMode: string | null;
    edit: React.ReactNode;
    del: React.ReactNode;
  };

  const rows: Row[] = [
    ...work.map((w) => ({
      date: w.work_date,
      sortKey: `${w.work_date}T${w.created_at}`,
      site: w.site_location,
      client: w.client_name,
      workDetails: w.description,
      qty: Number(w.quantity),
      rate: Number(w.rate),
      workAmount: Number(w.amount),
      amountPaid: 0,
      entryType: null,
      paymentMode: null,
      edit: <EditLabourWorkDialog work={w} labourerId={labourerId} projects={projects} />,
      del: <DeleteRowButton what="work entry" action={deleteLabourWork.bind(null, w.id, labourerId)} />,
    })),
    ...payments.map((p) => ({
      date: p.payment_date,
      sortKey: `${p.payment_date}T${p.created_at}`,
      site: null,
      client: null,
      workDetails: p.note ?? null,
      qty: null,
      rate: null,
      workAmount: 0,
      amountPaid: Number(p.amount),
      entryType: p.entry_type ?? "Payment",
      paymentMode: p.payment_mode ?? null,
      edit: <EditLabourPaymentDialog payment={p} labourerId={labourerId} />,
      del: <DeleteRowButton what="payment" action={deleteLabourPayment.bind(null, p.id, labourerId)} />,
    })),
  ].sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  const withBalance: (Row & { balance: number })[] = [];
  for (const r of rows) {
    const previous = withBalance.at(-1)?.balance ?? 0;
    withBalance.push({ ...r, balance: previous + r.workAmount - r.amountPaid });
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Site / Location</TableHead>
            <TableHead>Client Name</TableHead>
            <TableHead>Work Details</TableHead>
            <TableHead className="text-right">Sq.Ft. / R.Ft.</TableHead>
            <TableHead className="text-right">Rate</TableHead>
            <TableHead className="text-right">Work Amount</TableHead>
            <TableHead className="text-right">Amount Paid</TableHead>
            <TableHead>Entry Type</TableHead>
            <TableHead>Payment Mode</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {withBalance.map((r, i) => (
            <TableRow key={i}>
              <TableCell className="whitespace-nowrap">{formatDate(r.date)}</TableCell>
              <TableCell className="text-[var(--text-muted)]">{r.site ?? "—"}</TableCell>
              <TableCell className="text-[var(--text-muted)]">{r.client ?? "—"}</TableCell>
              <TableCell>{r.workDetails ?? "—"}</TableCell>
              <TableCell className="text-right">{r.qty ?? ""}</TableCell>
              <TableCell className="text-right">{r.rate ? formatMoney(r.rate) : ""}</TableCell>
              <TableCell className="text-right">{r.workAmount ? formatMoney(r.workAmount) : ""}</TableCell>
              <TableCell className="text-right text-emerald-600">
                {r.amountPaid ? formatMoney(r.amountPaid) : ""}
              </TableCell>
              <TableCell className="text-[var(--text-muted)]">{r.entryType ?? "—"}</TableCell>
              <TableCell className="text-[var(--text-muted)]">{r.paymentMode ?? "—"}</TableCell>
              <BalanceCell value={r.balance} />
              <TableCell>
                <div className="flex items-center gap-0.5">
                  {r.edit}
                  {r.del}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {withBalance.length === 0 && <EmptyRow span={12} />}
        </TableBody>
      </Table>
    </div>
  );
}
