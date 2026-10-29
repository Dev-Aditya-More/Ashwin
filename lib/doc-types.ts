import type { EstimateLine, QuoteLine } from "@/lib/doc-calc";

export type DocClient = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  gstin: string | null;
};

export type Quotation = {
  id: string;
  no: string;
  doc_date: string;
  client_id: string;
  site_name: string | null;
  work_type: string | null;
  note: string | null;
  lines: QuoteLine[];
  client: DocClient | null;
};

export type Estimate = {
  id: string;
  no: string;
  doc_date: string;
  client_id: string;
  site_name: string | null;
  work_type: string | null;
  note: string | null;
  lines: EstimateLine[];
  subtotal: number;
  discount_pct: number;
  discount: number;
  after_discount: number;
  transport: number;
  hamali: number;
  taxable: number;
  gst_rate: number;
  tax: number;
  total: number;
  source_quote_id: string | null;
  confirmed_at: string | null;
  client_work_id: string | null;
  /** Net payments the client has made so far (advance received) — printed in the totals box. */
  paid?: number;
  client: DocClient | null;
};

export type GstInvoice = {
  id: string;
  no: string;
  doc_date: string;
  client_id: string;
  estimate_id: string | null;
  estimate_no: string | null;
  invoice_type: "GST" | "Non-GST";
  site_name: string | null;
  work_type: string | null;
  client_mobile: string | null;
  client_address: string | null;
  client_gstin: string | null;
  lines: EstimateLine[];
  subtotal: number;
  discount: number;
  transport: number;
  hamali: number;
  taxable: number;
  gst_rate: number;
  tax: number;
  total: number;
  received: number;
  client: DocClient | null;
};

/** Just what the invoice picker needs (no line items) — keeps that page light. */
export type EstimateOption = {
  id: string;
  no: string;
  total: number;
  taxable: number;
  subtotal: number;
  site_name: string | null;
  work_type?: string | null;
  client: { name: string; gstin: string | null } | null;
};

export type CatalogMap = Record<string, string[]>;

export type ActionResult = { ok: true; id?: string; message?: string } | { ok: false; error: string };

export type RegisterRow = {
  kind: string;
  /** document = paperwork issued (quotation/estimate/invoice); purchase = vendor bill received. */
  group: "document" | "purchase";
  /** Only invoices are sales. A quotation/estimate that later becomes an invoice is not earned twice. */
  inSales: boolean;
  no: string;
  date: string;
  party: string;
  taxable: number;
  gst: number;
  total: number;
};
