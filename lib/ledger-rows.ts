import type { ClientPayment, ClientWork, LabourPayment, VendorBill, VendorPayment } from "@/lib/types";
import type { LabourWorkWithSite } from "@/lib/actions/labour";
import type { LedgerPrintRow } from "@/lib/print/documents";

type Keyed = LedgerPrintRow & { key: string };
const finish = (rows: Keyed[]): LedgerPrintRow[] =>
  rows
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((r) => ({ date: r.date, particulars: r.particulars, debit: r.debit, credit: r.credit }));

/** Debit = increases what the client owes (work billed, refunds); credit = payments received. */
export function clientLedgerRows(work: ClientWork[], payments: ClientPayment[]): LedgerPrintRow[] {
  return finish([
    ...work.map((w) => ({
      key: `${w.work_date}T${w.created_at}`,
      date: w.work_date,
      particulars: [w.bill_no ? `Bill ${w.bill_no}` : "", w.description].filter(Boolean).join(" — "),
      debit: Number(w.amount),
      credit: 0,
    })),
    ...payments.map((p) => ({
      key: `${p.payment_date}T${p.created_at}`,
      date: p.payment_date,
      particulars: p.note ?? (p.is_refund ? "Refund" : "Payment received"),
      debit: p.is_refund ? Number(p.amount) : 0,
      credit: p.is_refund ? 0 : Number(p.amount),
    })),
  ]);
}

export function vendorLedgerRows(bills: VendorBill[], payments: VendorPayment[]): LedgerPrintRow[] {
  return finish([
    ...bills.map((b) => ({
      key: `${b.bill_date}T${b.created_at}`,
      date: b.bill_date,
      particulars: [b.bill_no ? `Bill ${b.bill_no}` : "", b.description].filter(Boolean).join(" — "),
      debit: Number(b.amount),
      credit: 0,
    })),
    ...payments.map((p) => ({
      key: `${p.payment_date}T${p.created_at}`,
      date: p.payment_date,
      particulars: p.note ?? (p.is_refund ? "Refund" : "Payment made"),
      debit: p.is_refund ? Number(p.amount) : 0,
      credit: p.is_refund ? 0 : Number(p.amount),
    })),
  ]);
}

export function labourLedgerRows(work: LabourWorkWithSite[], payments: LabourPayment[]): LedgerPrintRow[] {
  return finish([
    ...work.map((w) => ({
      key: `${w.work_date}T${w.created_at}`,
      date: w.work_date,
      particulars: [w.client_name, w.site_location, w.description].filter(Boolean).join(" — "),
      debit: Number(w.amount),
      credit: 0,
    })),
    ...payments.map((p) => ({
      key: `${p.payment_date}T${p.created_at}`,
      date: p.payment_date,
      particulars: p.note ?? (p.is_refund ? "Refund" : p.entry_type === "Advance" ? "Advance" : "Payment made"),
      debit: p.is_refund ? Number(p.amount) : 0,
      credit: p.is_refund ? 0 : Number(p.amount),
    })),
  ]);
}
