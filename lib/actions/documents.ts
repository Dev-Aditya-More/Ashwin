"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { currentUserEmail, insertWithActor } from "@/lib/actions/audit-helper";
import {
  calcEstimate,
  isFeeWork,
  mergeSameLines,
  CATALOG_KEYS,
  GSTIN_RE,
  type EstimateLineInput,
  type QuoteLine,
} from "@/lib/doc-calc";
import type {
  ActionResult,
  CatalogMap,
  DocClient,
  Estimate,
  EstimateOption,
  GstInvoice,
  Quotation,
  RegisterRow,
} from "@/lib/doc-types";

/** Postgres/PostgREST codes for "table or column does not exist" — i.e. migration 0007 hasn't been run. */
function isMissing(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "42703" ||
    error.code === "PGRST205" ||
    error.code === "PGRST204" ||
    /does not exist|schema cache/i.test(error.message ?? "")
  );
}

const SETUP_MESSAGE =
  "Database setup pending: run supabase/migrations/0007_quotation_estimate_invoice.sql in the Supabase SQL editor.";

const CLIENT_COLS = "id, name, phone, address, gstin";

async function activeFy(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("financial_years")
    .select("id, label, start_date")
    .eq("is_active", true)
    .maybeSingle();
  return data as { id: string; label: string; start_date: string } | null;
}

/** ["2026", "27"] from the active FY label ("FY 2026-27"), falling back to the FY the start date is in. */
function fyParts(label: string | undefined, startDate: string | undefined): [string, string] {
  const m = label?.match(/(\d{4})\s*[-/]\s*(\d{2,4})/);
  if (m) return [m[1], m[2].slice(-2)];
  const d = startDate ? new Date(startDate) : new Date();
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return [String(y), String((y + 1) % 100).padStart(2, "0")];
}

type DocKind = "quotation" | "estimate" | "invoice";
const TABLE: Record<DocKind, string> = {
  quotation: "quotations",
  estimate: "estimates",
  invoice: "gst_invoices",
};

/** Next free number: Quotation 2026/27-001, Estimate 2026-27/001, GST invoice AE/2026/27-001, Non-GST bill AGS/2026/27-001. */
export async function getNextDocNo(kind: DocKind | "invoice-nongst"): Promise<string> {
  const supabase = await createClient();
  const fy = await activeFy(supabase);
  const [y, yy] = fyParts(fy?.label, fy?.start_date);
  const prefix =
    kind === "quotation"
      ? `${y}/${yy}-`
      : kind === "estimate"
      ? `${y}-${yy}/`
      : kind === "invoice-nongst"
      ? `AGS/${y}/${yy}-`
      : `AE/${y}/${yy}-`;
  const isInvoice = kind === "invoice" || kind === "invoice-nongst";
  // GST (AE/…) and Non-GST (AGS/…) bills share ONE running count: after AE/2026/27-001,
  // switching the type gives AGS/2026/27-002, so no two bills ever carry the same serial.
  // (Civil / Interior bills of supply use the plain 2026/27-001 form, so they are counted too.)
  const prefixes = isInvoice ? [`AE/${y}/${yy}-`, `AGS/${y}/${yy}-`, `${y}/${yy}-`] : [prefix];
  const table = isInvoice ? TABLE.invoice : TABLE[kind as DocKind];
  const { data } = await supabase
    .from(table)
    .select("no")
    .or(prefixes.map((p) => `no.like.${p}*`).join(","));
  let max = 0;
  for (const r of (data ?? []) as { no: string }[]) {
    const p = prefixes.find((x) => r.no.startsWith(x));
    if (!p) continue;
    const n = Number(r.no.slice(p.length).match(/^\d+/)?.[0] ?? 0);
    if (n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

function toDocClient(c: Partial<DocClient>): DocClient {
  return {
    id: c.id!,
    name: c.name!,
    phone: c.phone ?? null,
    address: c.address ?? null,
    gstin: c.gstin ?? null,
  };
}

export async function listDocClients(): Promise<DocClient[]> {
  const supabase = await createClient();
  const first = await supabase.from("clients").select(CLIENT_COLS).order("name");
  const res = first.error
    ? await supabase.from("clients").select("id, name, phone, address").order("name")
    : first;
  return ((res.data ?? []) as Partial<DocClient>[]).map(toDocClient);
}

export async function createDocClient(input: {
  name: string;
  phone?: string;
  address?: string;
  gstin?: string;
}): Promise<{ ok: true; client: DocClient } | { ok: false; error: string }> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Client name is required." };
  const gstin = (input.gstin ?? "").trim().toUpperCase();
  if (gstin && !GSTIN_RE.test(gstin)) {
    return { ok: false, error: "GSTIN must contain exactly 15 letters/numbers." };
  }
  const supabase = await createClient();
  // Case-insensitive exact match: escape LIKE wildcards so "A_B" or "50% Glass" aren't treated as patterns.
  const { data: dup } = await supabase.from("clients").select("id").ilike("name", escapeLike(name)).limit(1);
  if (dup && dup.length) return { ok: false, error: "This client already exists." };

  const row = {
    name,
    phone: input.phone?.trim() || null,
    address: input.address?.trim() || null,
  };
  let { data, error } = await supabase
    .from("clients")
    .insert({ ...row, gstin: gstin || null })
    .select(CLIENT_COLS)
    .single();
  if (error) {
    ({ data, error } = await supabase.from("clients").insert(row).select("id, name, phone, address").single());
  }
  if (error || !data) return { ok: false, error: "Could not save the client." };
  revalidatePath("/admin/clients");
  return { ok: true, client: toDocClient(data as Partial<DocClient>) };
}

// ---------------------------------------------------------------- catalog
export async function getItemCatalog(): Promise<CatalogMap> {
  const supabase = await createClient();
  // `position` (migration 0010) keeps the workbook's order; older databases fall back to insertion order.
  const ordered = await supabase
    .from("item_catalog")
    .select("category, value")
    .order("position", { ascending: true, nullsFirst: false })
    .order("created_at")
    .order("value");
  const { data } = ordered.error
    ? await supabase.from("item_catalog").select("category, value").order("created_at").order("value")
    : ordered;
  const map: CatalogMap = {};
  for (const k of CATALOG_KEYS) map[k] = [];
  for (const r of (data ?? []) as { category: string; value: string }[]) {
    (map[r.category] ??= []).push(r.value);
  }
  return map;
}

export async function addCatalogItem(category: string, value: string): Promise<ActionResult> {
  const v = value.trim();
  if (!v || !(CATALOG_KEYS as readonly string[]).includes(category)) {
    return { ok: false, error: "Invalid option." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("item_catalog").insert({ category, value: v });
  if (error && error.code !== "23505") {
    return { ok: false, error: isMissing(error) ? SETUP_MESSAGE : error.message };
  }
  return { ok: true };
}

// ---------------------------------------------------------------- lists
type Joined<T> = T & { clients: DocClient | null };
function flat<T extends { clients?: DocClient | null }>(r: T) {
  const { clients, ...rest } = r;
  return { ...rest, client: clients ?? null };
}

export async function listQuotations(): Promise<{ rows: Quotation[]; setup: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotations")
    .select(`*, clients(${CLIENT_COLS})`)
    .order("created_at", { ascending: false });
  if (error) return { rows: [], setup: isMissing(error) };
  return {
    rows: ((data ?? []) as Joined<Omit<Quotation, "client">>[]).map(flat) as unknown as Quotation[],
    setup: false,
  };
}

/** Adds each estimate's client's net payments so far (printed as "Advance Received"). */
async function withPaid(supabase: Awaited<ReturnType<typeof createClient>>, rows: Estimate[]): Promise<Estimate[]> {
  const ids = [...new Set(rows.map((r) => r.client_id))];
  if (!ids.length) return rows;
  const { data } = await supabase.from("client_payments").select("client_id, amount, is_refund").in("client_id", ids);
  const net = new Map<string, number>();
  for (const p of (data ?? []) as { client_id: string; amount: number; is_refund?: boolean | null }[]) {
    net.set(p.client_id, (net.get(p.client_id) ?? 0) + (p.is_refund ? -1 : 1) * Number(p.amount));
  }
  return rows.map((r) => ({ ...r, paid: Math.max(0, Math.round((net.get(r.client_id) ?? 0) * 100) / 100) }));
}

/** Unconfirmed estimates (the Estimate page) or confirmed ones (Detail Sheets). */
export async function listEstimates(
  confirmed: boolean,
  clientId?: string
): Promise<{ rows: Estimate[]; setup: boolean }> {
  const supabase = await createClient();
  let q = supabase
    .from("estimates")
    .select(`*, clients(${CLIENT_COLS})`)
    .order("created_at", { ascending: false });
  q = confirmed ? q.not("confirmed_at", "is", null) : q.is("confirmed_at", null);
  if (clientId) q = q.eq("client_id", clientId);
  const { data, error } = await q;
  if (error) return { rows: [], setup: isMissing(error) };
  return {
    rows: await withPaid(supabase, ((data ?? []) as Joined<Omit<Estimate, "client">>[]).map(flat) as unknown as Estimate[]),
    setup: false,
  };
}

/** Detail Sheets (confirmed estimates) for the invoice picker — only a Detail Sheet can be billed. No line items. */
export async function listEstimateOptions(): Promise<EstimateOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("estimates")
    .select("id, no, total, taxable, subtotal, site_name, work_type, clients(name, gstin)")
    .not("confirmed_at", "is", null)
    .order("created_at", { ascending: false });
  return ((data ?? []) as unknown as (Omit<EstimateOption, "client"> & {
    clients: { name: string; gstin: string | null } | null;
  })[]).map(({ clients, ...r }) => ({ ...r, client: clients ?? null }));
}

export async function listInvoices(): Promise<{ rows: GstInvoice[]; setup: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gst_invoices")
    .select(`*, clients(${CLIENT_COLS})`)
    .order("created_at", { ascending: false });
  if (error) return { rows: [], setup: isMissing(error) };
  return {
    rows: ((data ?? []) as Joined<Omit<GstInvoice, "client">>[]).map(flat) as unknown as GstInvoice[],
    setup: false,
  };
}

export async function countQuotations(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase.from("quotations").select("id", { count: "exact", head: true });
  return count ?? 0;
}

// ---------------------------------------------------------------- save
type Header = {
  no: string;
  date: string;
  clientId: string;
  siteName: string;
  workType: string;
  note: string;
};

async function checkClient(supabase: SupabaseClient, clientId: string) {
  if (!clientId) return "Please select a Client.";
  const { data } = await supabase.from("clients").select("id").eq("id", clientId).maybeSingle();
  return data ? null : "Client not found.";
}

function cleanQuoteLines(lines: QuoteLine[]): QuoteLine[] | null {
  const clean = lines.map((l) => ({
    name: String(l.name ?? "").trim(),
    unit: l.unit || "Sq.Ft.",
    rate: Math.max(0, Number(l.rate) || 0),
  }));
  return !clean.length || clean.some((l) => !l.name) ? null : clean;
}

/** Saves changes to an existing quotation (number, date, client, site, work type, notes and lines). */
export async function updateQuotation(id: string, h: Header, lines: QuoteLine[]): Promise<ActionResult> {
  const supabase = await createClient();
  const bad = await checkClient(supabase, h.clientId);
  if (bad) return { ok: false, error: bad };
  const no = h.no.trim();
  if (!no) return { ok: false, error: "Document number required." };
  const clean = cleanQuoteLines(lines);
  if (!clean) return { ok: false, error: "Enter a Description for every line." };
  const { error } = await supabase
    .from("quotations")
    .update({
      no,
      doc_date: h.date || undefined,
      client_id: h.clientId,
      site_name: h.siteName.trim() || null,
      work_type: h.workType || null,
      note: h.note.trim() || null,
      lines: clean,
    })
    .eq("id", id);
  if (error) return fail(error);
  revalidatePath("/admin/quotations");
  revalidatePath("/admin");
  return { ok: true, id, message: "Quotation updated." };
}

export async function saveQuotation(h: Header, lines: QuoteLine[]): Promise<ActionResult> {
  const supabase = await createClient();
  const bad = await checkClient(supabase, h.clientId);
  if (bad) return { ok: false, error: bad };
  const no = h.no.trim();
  if (!no) return { ok: false, error: "Document number required." };
  const clean = cleanQuoteLines(lines);
  if (!clean) return { ok: false, error: "Enter a Description for every line." };
  const [fy, actor] = await Promise.all([activeFy(supabase), currentUserEmail(supabase)]);
  try {
    const { data } = await insertStrict(
      supabase,
      "quotations",
      {
        no,
        doc_date: h.date || undefined,
        client_id: h.clientId,
        financial_year_id: fy?.id ?? null,
        site_name: h.siteName.trim() || null,
        work_type: h.workType || null,
        note: h.note.trim() || null,
        lines: clean,
      },
      actor
    );
    revalidatePath("/admin/quotations");
    revalidatePath("/admin");
    return { ok: true, id: data?.[0]?.id };
  } catch (e) {
    return fail(e);
  }
}

/** Transport and Hamali only apply to Glass & Aluminium work; Civil / Interior estimates never carry them. */
function estimateCharges<T extends { workType: string; transport: number; hamali: number }>(h: T): T {
  return isFeeWork(h.workType) ? { ...h, transport: 0, hamali: 0 } : h;
}

export async function saveEstimate(
  h: Header & {
    sourceQuoteId?: string;
    discountPct: number;
    transport: number;
    hamali: number;
    gstRate: number;
  },
  lines: EstimateLineInput[]
): Promise<ActionResult> {
  const supabase = await createClient();
  const bad = await checkClient(supabase, h.clientId);
  if (bad) return { ok: false, error: bad };
  const no = h.no.trim();
  if (!no) return { ok: false, error: "Document number required." };
  const t = calcEstimate(mergeSameLines(lines), estimateCharges(h));
  if (!t.lines.length || t.subtotal <= 0) {
    return { ok: false, error: "Rate and amount are required for an Estimate." };
  }
  const [fy, actor] = await Promise.all([activeFy(supabase), currentUserEmail(supabase)]);
  try {
    const { data } = await insertStrict(
      supabase,
      "estimates",
      {
        no,
        doc_date: h.date || undefined,
        client_id: h.clientId,
        financial_year_id: fy?.id ?? null,
        site_name: h.siteName.trim() || null,
        work_type: h.workType || null,
        note: h.note.trim() || null,
        lines: t.lines,
        subtotal: t.subtotal,
        discount_pct: t.discountPct,
        discount: t.discount,
        after_discount: t.afterDiscount,
        transport: t.transport,
        hamali: t.hamali,
        taxable: t.taxable,
        gst_rate: t.gstRate,
        tax: t.tax,
        total: t.total,
        source_quote_id: h.sourceQuoteId || null,
      },
      actor
    );
    revalidatePath("/admin/estimates");
    return { ok: true, id: data?.[0]?.id };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Saves changes to an existing estimate and carries them everywhere it is used, so nothing goes stale:
 *  - its Detail Sheet (same row) and the Due it booked in the client's ledger,
 *  - any invoice / bill of supply made from it (amounts recalculated at that bill's own GST rate;
 *    the bill keeps its number, date and type).
 */
export async function updateEstimate(
  id: string,
  h: Header & { discountPct: number; transport: number; hamali: number; gstRate: number },
  lines: EstimateLineInput[]
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: est } = await supabase.from("estimates").select("id, client_id, client_work_id").eq("id", id).maybeSingle();
  if (!est) return { ok: false, error: "Estimate not found." };
  const bad = await checkClient(supabase, h.clientId);
  if (bad) return { ok: false, error: bad };
  const no = h.no.trim();
  if (!no) return { ok: false, error: "Document number required." };
  const t = calcEstimate(mergeSameLines(lines), estimateCharges(h));
  if (!t.lines.length || t.subtotal <= 0) {
    return { ok: false, error: "Rate and amount are required for an Estimate." };
  }
  try {
    const { error } = await supabase
      .from("estimates")
      .update({
        no,
        doc_date: h.date || undefined,
        client_id: h.clientId,
        site_name: h.siteName.trim() || null,
        work_type: h.workType || null,
        note: h.note.trim() || null,
        lines: t.lines,
        subtotal: t.subtotal,
        discount_pct: t.discountPct,
        discount: t.discount,
        after_discount: t.afterDiscount,
        transport: t.transport,
        hamali: t.hamali,
        taxable: t.taxable,
        gst_rate: t.gstRate,
        tax: t.tax,
        total: t.total,
      })
      .eq("id", id);
    if (error) throw error;

    // Ledger: the Detail Sheet's Due follows the estimate.
    if (est.client_work_id) {
      const { error: wErr } = await supabase
        .from("client_work")
        .update({
          client_id: h.clientId,
          amount: t.total,
          work_date: h.date || undefined,
          description: `Estimate / Detail Sheet ${no}`,
          bill_no: no,
        })
        .eq("id", est.client_work_id);
      if (wErr) throw wErr;
    }

    // Bills made from this estimate.
    const { data: bills } = await supabase
      .from("gst_invoices")
      .select("id, invoice_type, gst_rate")
      .eq("estimate_id", id);
    for (const b of (bills ?? []) as { id: string; invoice_type: string; gst_rate: number }[]) {
      const rate = b.invoice_type === "GST" ? Number(b.gst_rate) || 0 : 0;
      const tax = Math.round(t.taxable * rate) / 100;
      const total = b.invoice_type === "GST" ? Math.round(t.taxable + tax) : Math.round(t.taxable * 100) / 100;
      await supabase
        .from("gst_invoices")
        .update({
          client_id: h.clientId,
          estimate_no: no,
          site_name: h.siteName.trim() || null,
          work_type: h.workType || null,
          lines: t.lines,
          subtotal: t.subtotal,
          discount: t.discount,
          transport: t.transport,
          hamali: t.hamali,
          taxable: t.taxable,
          tax,
          total,
        })
        .eq("id", b.id);
    }
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/admin/estimates");
  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/clients/${h.clientId}`);
  if (est.client_id !== h.clientId) revalidatePath(`/admin/clients/${est.client_id}`);
  revalidatePath("/admin");
  return { ok: true, id, message: "Estimate updated — its Detail Sheet, ledger due and bills were updated too." };
}

export async function getEstimate(id: string): Promise<Estimate | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("estimates").select(`*, clients(${CLIENT_COLS})`).eq("id", id).maybeSingle();
  if (!data) return null;
  return flat(data as Joined<Omit<Estimate, "client">>) as unknown as Estimate;
}

/** Every estimate for one client, newest first — confirmed (Detail Sheet) or not. */
export async function listClientEstimates(clientId: string): Promise<Estimate[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("estimates")
    .select(`*, clients(${CLIENT_COLS})`)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return withPaid(supabase, ((data ?? []) as Joined<Omit<Estimate, "client">>[]).map(flat) as unknown as Estimate[]);
}

/** Quotation id → number of the estimate made from it (so converted quotations can be struck through). */
export async function getQuoteConversions(): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data } = await supabase.from("estimates").select("source_quote_id, no").not("source_quote_id", "is", null);
  const out: Record<string, string> = {};
  for (const r of (data ?? []) as { source_quote_id: string; no: string }[]) out[r.source_quote_id] = r.no;
  return out;
}

/** Per client: how many quotations, estimates / detail sheets and bills exist (for the client list). */
export async function getClientDocCounts(): Promise<Record<string, { quotes: number; estimates: number; bills: number }>> {
  const supabase = await createClient();
  const [q, e, b] = await Promise.all([
    supabase.from("quotations").select("client_id"),
    supabase.from("estimates").select("client_id"),
    supabase.from("gst_invoices").select("client_id"),
  ]);
  const out: Record<string, { quotes: number; estimates: number; bills: number }> = {};
  const bump = (rows: { client_id: string }[] | null, k: "quotes" | "estimates" | "bills") => {
    for (const r of rows ?? []) (out[r.client_id] ??= { quotes: 0, estimates: 0, bills: 0 })[k]++;
  };
  bump(q.data, "quotes");
  bump(e.data, "estimates");
  bump(b.data, "bills");
  return out;
}

/** Confirms an estimate as the client's Detail Sheet and books its total as a Due entry in their ledger. */
export async function convertToDetailSheet(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: est, error } = await supabase.from("estimates").select("*").eq("id", id).maybeSingle();
  if (error || !est) return { ok: false, error: "Estimate not found." };
  if (est.confirmed_at) return { ok: false, error: "A Detail Sheet already exists for this Estimate." };
  const [fy, actor] = await Promise.all([activeFy(supabase), currentUserEmail(supabase)]);
  try {
    const { data } = await insertWithActor(
      supabase,
      "client_work",
      {
        client_id: est.client_id,
        financial_year_id: fy?.id ?? null,
        description: `Estimate / Detail Sheet ${est.no}`,
        amount: Number(est.total) || 0,
        work_date: est.doc_date,
      },
      actor,
      { bill_no: est.no }
    );
    const { error: upErr } = await supabase
      .from("estimates")
      .update({ confirmed_at: new Date().toISOString(), client_work_id: data?.[0]?.id ?? null })
      .eq("id", id);
    if (upErr) throw upErr;
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/admin/estimates");
  revalidatePath(`/admin/clients/${est.client_id}`);
  revalidatePath("/admin");
  return { ok: true, message: "Detail Sheet created and Estimate Due saved in Client Ledger." };
}

export async function saveInvoice(input: {
  estimateId: string;
  no: string;
  date: string;
  type: "GST" | "Non-GST";
  gstRate: number;
  received: number;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: est } = await supabase
    .from("estimates")
    .select(`*, clients(${CLIENT_COLS})`)
    .eq("id", input.estimateId)
    .maybeSingle();
  if (!est) return { ok: false, error: "Select a Detail Sheet." };
  if (!est.confirmed_at) {
    return { ok: false, error: `Estimate ${est.no} is not a Detail Sheet yet. Convert it to a Detail Sheet first, then bill it.` };
  }
  // One bill per estimate: either the GST invoice or the Non-GST bill of supply, never both.
  const { data: already } = await supabase
    .from("gst_invoices")
    .select("no")
    .eq("estimate_id", est.id)
    .limit(1);
  if (already && already.length) {
    return { ok: false, error: `This estimate is already billed (${already[0].no}). Delete that bill first to re-issue it.` };
  }
  // The prefix always follows the type: AE/… = GST (ASHWIN ENTERPRISES), AGS/… = Non-GST (ARNAV GLASS SERVICES).
  const typedNo = input.no.trim();
  // Civil / Interior bills of supply are issued by ASHWIN ENTERPRISES with a plain 2026/27-001 number (no AGS/).
  const civilBill = input.type === "Non-GST" && isFeeWork(est.work_type);
  const no = civilBill
    ? typedNo.replace(/^(AE|AGS)\//i, "")
    : /^(AE|AGS)\//i.test(typedNo)
    ? typedNo.replace(/^(AE|AGS)\//i, input.type === "GST" ? "AE/" : "AGS/")
    : typedNo;
  if (!no) return { ok: false, error: "Invoice number missing." };
  const gst = input.type === "GST" ? Math.max(0, Number(input.gstRate) || 0) : 0;
  const taxable = Number(est.taxable ?? est.subtotal) || 0;
  const tax = Math.round(taxable * gst) / 100;
  // GST invoices round to the rupee; a Non-GST Bill of Supply keeps paise.
  const total = input.type === "GST" ? Math.round(taxable + tax) : Math.round(taxable * 100) / 100;
  const received = Math.max(0, Number(input.received) || 0);
  const c = (est.clients ?? {}) as Partial<DocClient>;
  const [fy, actor] = await Promise.all([activeFy(supabase), currentUserEmail(supabase)]);
  try {
    const { data } = await insertStrict(
      supabase,
      "gst_invoices",
      {
        no,
        doc_date: input.date || undefined,
        client_id: est.client_id,
        estimate_id: est.id,
        estimate_no: est.no,
        financial_year_id: fy?.id ?? null,
        invoice_type: input.type,
        site_name: est.site_name,
        work_type: est.work_type,
        client_mobile: c.phone ?? null,
        client_address: c.address ?? null,
        client_gstin: c.gstin ?? null,
        lines: est.lines,
        subtotal: est.subtotal,
        discount: est.discount,
        transport: est.transport,
        hamali: est.hamali,
        taxable,
        gst_rate: gst,
        tax,
        total,
        received,
      },
      actor
    );
    revalidatePath("/admin/invoices");
    revalidatePath("/admin");
    return { ok: true, id: data?.[0]?.id };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteDocument(kind: DocKind, id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from(TABLE[kind]).delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/${kind === "invoice" ? "invoices" : `${kind}s`}`);
  revalidatePath("/admin");
  return { ok: true };
}

// ---------------------------------------------------------------- register
type Named = { name: string } | null;

export async function getDocumentRegister(
  month: string,
  type: "all" | "quotation" | "estimate" | "invoice" | "purchase"
): Promise<{ rows: RegisterRow[]; invoiceGst: number; purchaseGst: number }> {
  const supabase = await createClient();
  if (!/^\d{4}-\d{2}$/.test(month)) return { rows: [], invoiceGst: 0, purchaseGst: 0 };
  const [y, m] = month.split("-").map(Number);
  const from = `${month}-01`;
  const to = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const rows: RegisterRow[] = [];
  let invoiceGst = 0;

  if (type === "all" || type === "quotation") {
    const { data } = await supabase
      .from("quotations")
      .select("no, doc_date, clients(name)")
      .gte("doc_date", from)
      .lt("doc_date", to);
    for (const r of (data ?? []) as unknown as { no: string; doc_date: string; clients: Named }[]) {
      rows.push({ group: "document", inSales: false, kind: "Quotation", no: r.no, date: r.doc_date, party: r.clients?.name ?? "", taxable: 0, gst: 0, total: 0 });
    }
  }
  if (type === "all" || type === "estimate") {
    const { data } = await supabase
      .from("estimates")
      .select("no, doc_date, subtotal, tax, total, clients(name)")
      .gte("doc_date", from)
      .lt("doc_date", to);
    for (const r of (data ?? []) as unknown as {
      no: string; doc_date: string; subtotal: number; tax: number; total: number; clients: Named;
    }[]) {
      rows.push({ group: "document", inSales: false, kind: "Estimate", no: r.no, date: r.doc_date, party: r.clients?.name ?? "", taxable: Number(r.subtotal), gst: Number(r.tax), total: Number(r.total) });
    }
  }
  {
    // Always read invoices: the "Invoice GST" summary card needs them whatever the filter.
    const { data } = await supabase
      .from("gst_invoices")
      .select("no, doc_date, invoice_type, subtotal, tax, total, clients(name)")
      .gte("doc_date", from)
      .lt("doc_date", to);
    for (const r of (data ?? []) as unknown as {
      no: string; doc_date: string; invoice_type: string; subtotal: number; tax: number; total: number; clients: Named;
    }[]) {
      invoiceGst += Number(r.tax);
      if (type === "all" || type === "invoice") {
        rows.push({ group: "document", inSales: true, kind: `${r.invoice_type} Invoice`, no: r.no, date: r.doc_date, party: r.clients?.name ?? "", taxable: Number(r.subtotal), gst: Number(r.tax), total: Number(r.total) });
      }
    }
  }
  if (type === "all" || type === "purchase") {
    // Purchases = bills received from vendors (no GST split is recorded on those).
    const { data } = await supabase
      .from("vendor_bills")
      .select("bill_no, bill_date, amount, vendors(name)")
      .gte("bill_date", from)
      .lt("bill_date", to);
    for (const r of (data ?? []) as unknown as {
      bill_no: string | null; bill_date: string; amount: number; vendors: Named;
    }[]) {
      rows.push({ group: "purchase", inSales: false, kind: "Purchase", no: r.bill_no ?? "—", date: r.bill_date, party: r.vendors?.name ?? "", taxable: Number(r.amount), gst: 0, total: Number(r.amount) });
    }
  }
  rows.sort((a, b) => a.date.localeCompare(b.date));
  return { rows, invoiceGst, purchaseGst: 0 };
}

// ---------------------------------------------------------------- internals
function escapeLike(s: string) {
  return s.replace(/[\\%_]/g, (c) => "\\" + c);
}

function fail(e: unknown): ActionResult {
  const err = e as { code?: string; message?: string };
  if (isMissing(err)) return { ok: false, error: SETUP_MESSAGE };
  if (err?.code === "23505" && /one_per_estimate/.test(err.message ?? "")) {
    return { ok: false, error: "This estimate is already billed. Delete that bill first to re-issue it." };
  }
  if (err?.code === "23505") return { ok: false, error: "This document number already exists." };
  return { ok: false, error: err?.message || "Something went wrong. Please try again." };
}

/** Plain insert that throws on error — the new tables have no older shape to fall back to. */
async function insertStrict(
  supabase: SupabaseClient,
  table: string,
  row: Record<string, unknown>,
  actor: string | null
): Promise<{ data: { id: string }[] | null }> {
  const clean = Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined));
  const { data, error } = await supabase
    .from(table)
    .insert({ ...clean, ...(actor ? { created_by: actor } : {}) })
    .select("id");
  if (error) throw error;
  return { data };
}
