"use server";

import { createClient } from "@/lib/supabase/server";
import { buildGstReport, type GstReport, type InvoiceRow, type PurchaseRow } from "@/lib/gst-report";

type Named = { name: string } | null;

/** The GST report for one month (YYYY-MM): invoices issued and vendor bills received in that month. */
export async function getGstReport(month: string): Promise<GstReport | null> {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return null;
  const supabase = await createClient();
  const [y, m] = month.split("-").map(Number);
  const from = `${month}-01`;
  const to = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;

  const inv = await supabase
    .from("gst_invoices")
    .select("no, doc_date, invoice_type, client_gstin, lines, taxable, gst_rate, tax, total, clients(name)")
    .gte("doc_date", from)
    .lt("doc_date", to);

  // GST columns on vendor bills come from migration 0012; fall back to the plain amount without them.
  type RawBill = Omit<PurchaseRow, "vendor_name"> & { vendors: Named };
  let bills: { data: unknown; error: unknown } = await supabase
    .from("vendor_bills")
    .select("bill_no, bill_date, amount, vendor_gstin, taxable_amount, gst_amount, vendors(name)")
    .gte("bill_date", from)
    .lt("bill_date", to);
  if (bills.error) {
    bills = await supabase.from("vendor_bills").select("bill_no, bill_date, amount, vendors(name)").gte("bill_date", from).lt("bill_date", to);
  }

  const invoices: InvoiceRow[] = ((inv.data ?? []) as unknown as (Omit<InvoiceRow, "client_name"> & { clients: Named })[]).map((r) => ({
    ...r,
    client_name: r.clients?.name ?? "",
    taxable: Number(r.taxable),
    tax: Number(r.tax),
    total: Number(r.total),
    gst_rate: Number(r.gst_rate),
  }));
  const purchases: PurchaseRow[] = ((bills.data ?? []) as RawBill[]).map((r) => ({
    bill_no: r.bill_no,
    bill_date: r.bill_date,
    vendor_name: r.vendors?.name ?? "",
    vendor_gstin: r.vendor_gstin ?? null,
    amount: Number(r.amount),
    taxable_amount: r.taxable_amount != null ? Number(r.taxable_amount) : null,
    gst_amount: r.gst_amount != null ? Number(r.gst_amount) : null,
  }));
  return buildGstReport(invoices, purchases);
}
