// Print templates ported 1:1 from the ASHWIN starter (A4 with 12.7 mm margins, pinned
// quotation footer, landscape detail sheet, GST tax invoice with UPI QR, party ledger).

import { amountInWords, hsnFor, isFeeWork, measureText, mergeForPrint, sizeAsWritten, sizeInFeet, unitKind } from "@/lib/doc-calc";
import type { EstimateLine, QuoteLine } from "@/lib/doc-calc";
import { arnavLogoUrl, civilLogoUrl, esc, fmt, fmtDate, logoUrl, money, printHtmlInFrame } from "@/lib/print/frame";
import type { PrintOptions } from "@/lib/print/frame";

export type PrintParty = { name: string; phone?: string | null; address?: string | null; gstin?: string | null };

export type PrintDoc = {
  no: string;
  date: string;
  client: string;
  clientMobile?: string | null;
  clientAddress?: string | null;
  clientGstin?: string | null;
  siteName?: string | null;
  workType?: string | null;
  subtotal?: number;
  discount?: number;
  afterDiscount?: number;
  transport?: number;
  hamali?: number;
  taxable?: number;
  gstRate?: number;
  tax?: number;
  total?: number;
  received?: number;
  type?: string;
};

/**
 * Civil / Interior documents carry the square ASHWIN "Plan · Design · Execute" mark (class `sq`, sized
 * by height in each template); everything else keeps the ASHWIN enterprises wordmark.
 */
function brandLogo(workType: unknown, cls: string) {
  return isFeeWork(workType)
    ? `<img class="${cls} sq" width="486" height="513" src="${civilLogoUrl()}">`
    : `<img class="${cls}" width="300" height="138" src="${logoUrl()}">`;
}

/**
 * Size / Qty / Area / Rate only mean something for measured glass & aluminium work. Civil / Interior
 * bills are fees, so they print just Sr. | Description | Amount.
 */
function isFeeBill(workType: unknown, lines: EstimateLine[]) {
  return isFeeWork(workType) || (lines.length > 0 && lines.every((l) => l.lumpSum));
}

/**
 * Print-preview title — also the file name when saved as PDF: party name (when there is one) + document no.,
 * e.g. "Amol Chothre E-2026/27-005".
 */
function docTitle(party: string | null | undefined, no: string) {
  return [String(party ?? "").trim(), no].filter(Boolean).join(" ");
}

/** An item's description cell: its Product / Type, with the optional item note in smaller text underneath. */
function describe(l: Pick<EstimateLine, "productType" | "note">) {
  const note = String(l.note ?? "").trim();
  return esc(l.productType || "") + (note ? `<div style="font-size:.88em;color:#555;font-style:italic;margin-top:1px">${esc(note)}</div>` : "");
}

/** One professional sans-serif stack for every printed document (falls back by platform). */
const FONT = "'Segoe UI',Calibri,'Helvetica Neue',Helvetica,Arial,sans-serif";

/**
 * Letterhead details per brand. Glass & Aluminium documents go out as ASHWIN ENTERPRISES (wordmark logo) or
 * ARNAV GLASS SERVICES (Non-GST bills); Civil / Interior documents carry the blue-and-gold ASHWIN mark.
 */
const GHOLE = "Ghole Complex, Near Mhaske Petrol Pump, Beed Bypass Road";
const COMPANY = {
  enterprises: { shop: "Shop No. 10", address: `${GHOLE}, Satara Parisar, Chh. Sambhajinagar - 431010`, phone: "9822990577", email: "ashwin.enterrprises@gmail.com" },
  arnav: { shop: "Shop No. 8-9", address: `${GHOLE}, Chh. Sambhajinagar - 431002`, phone: "9665343737", email: "arnavglassservices@gmail.com" },
  ashwin: { shop: "Shop No. 10", address: `${GHOLE}, Satara Parisar, Chh. Sambhajinagar - 431010`, phone: "9822990577", email: "vikas@ashwin.world" },
};
const companyFor = (workType: unknown) => (isFeeWork(workType) ? COMPANY.ashwin : COMPANY.enterprises);
const GSTIN = "27AEGPT6645A1ZF";

/** A4 height minus the 12.7 mm margin spacers repeated on every page. */
const PIN_PAGE = { content: ".page", spacer: ".spacer", usableMm: 297 - 25.4, repeat: ".items thead", widthMm: 210 };

const FRAME_CSS = `.frame{width:100%;border-collapse:collapse;border:0;font-size:var(--fs)}.frame>thead>tr>td,.frame>tfoot>tr>td{height:12.7mm;padding:0;border:0}.frame>tbody>tr>td{padding:0 12.7mm;border:0;vertical-align:top}`;

const QUOTE_TERMS = `<h3 class="terms-heading">Terms & Conditions</h3><div class="terms"><div>• Payment: 75% advance payment required. Remaining 25% payable upon completion of work.</div><div>• Work Commencement: Work will commence within 1 day after receipt of advance payment.</div><div>• Completion Period: 15 working days from the date of work order.</div><div>• Taxes & Charges: GST @18% and transportation charges shall be extra as applicable.</div><div>• Rate Variation: Rates may vary depending on final material selection.</div><div>• Quotation Validity: This quotation is valid for 3 days from the date of issue.</div><div>• Scaffolding: Scaffolding shall be arranged by the client. If provided by us, it will be charged separately.</div></div>`;

// ------------------------------------------------------------ Quotation / Estimate
function companyAddress(workType: unknown) {
  const c = companyFor(workType);
  return `${c.shop}, ${c.address}<br>Phone: ${c.phone} · ${c.email} · GSTIN: ${GSTIN}`;
}

/**
 * Last row of an items table: one empty row with the column lines, stretched by `fitPages` so the table runs
 * down to the totals / footer instead of leaving blank paper under it.
 */
function fillerRow(cols: number) {
  return `<tr class="fill"><td class="spacer"></td>${"<td></td>".repeat(cols - 1)}</tr>`;
}

/** Charges table (Subtotal → Discount → Transport → Hamali → Taxable → GST → Total) for estimates and detail sheets. */
function chargesTable(d: PrintDoc) {
  const subtotal = Number(d.subtotal) || 0;
  const discount = Number(d.discount) || 0;
  const after = Number(d.afterDiscount ?? subtotal - discount);
  const transport = Number(d.transport) || 0;
  const hamali = Number(d.hamali) || 0;
  const taxable = Number(d.taxable ?? after + transport + hamali);
  const tax = Number(d.tax) || 0;
  const total = Number(d.total) || taxable + tax;
  const row = (a: string, b: string, cls = "") => `<tr${cls ? ` class="${cls}"` : ""}><td>${a}</td><td class="num">${b}</td></tr>`;
  return {
    total,
    html:
      `<table class="charges"><tbody>` +
      row("Subtotal", money(subtotal)) +
      (discount ? row("Discount (−)", "− " + money(discount)) + row("After Discount", money(after)) : "") +
      (transport ? row("Transport", money(transport)) : "") +
      (hamali ? row("Hamali", money(hamali)) : "") +
      row("Taxable Amount", money(taxable)) +
      row(`GST (${Number(d.gstRate) || 0}%)`, money(tax)) +
      row("Total Amount", money(total), "grand") +
      row("Advance Received", money(Number(d.received) || 0)) +
      row("Balance Due", money(Math.max(0, Math.round((total - (Number(d.received) || 0)) * 100) / 100)), "grand") +
      `</tbody></table>`,
  };
}

/** Party block: name, then mobile / address / site exactly as saved — each only when it was entered. */
function partyBlock(d: PrintDoc, party?: PrintParty, extra: string[] = []) {
  const mobile = String(d.clientMobile || party?.phone || "").trim();
  const address = String(d.clientAddress || party?.address || "").trim();
  const site = String(d.siteName || "").trim();
  return [
    `<b class="pn">${esc(d.client)}</b>`,
    mobile ? `Mobile: ${esc(mobile)}` : "",
    address ? `Address: ${esc(address)}` : "",
    site ? `Site: ${esc(site)}` : "",
    ...extra,
  ]
    .filter(Boolean)
    .join("<br>");
}

/** Item tables: fixed column widths, and every value wraps inside its cell instead of spilling past it. */
const ITEMS_CSS = `table{font-size:var(--fs)}.it{width:100%;border-collapse:collapse;table-layout:fixed}.it th,.it td{border:1px solid #777;padding:4px 3px;text-align:center;vertical-align:middle;overflow-wrap:anywhere;line-height:1.3}.it th{background:#f3f4f7;font-weight:bold}.it .r{text-align:center}.it .c{text-align:center}.it .num{text-align:center;white-space:nowrap}.it tr.fill td{padding:0;border-top:0}.it tr{break-inside:avoid}.it tr.fill{break-inside:auto}.it.fit{table-layout:auto}.it.fit th,.it.fit td{white-space:nowrap;overflow-wrap:normal}.it thead{display:table-header-group}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}`;

export function printQuotationOrEstimate(
  kind: "quotation" | "estimate",
  d: PrintDoc,
  lines: (QuoteLine | EstimateLine)[],
  party: PrintParty
) {
  const quote = kind === "quotation";
  if (!quote) lines = mergeForPrint(lines as EstimateLine[]);
  // Civil / Interior estimates are fees only: print Sr. | Description | Amount instead of the measured-glass columns.
  const fees = !quote && lines.length > 0 && (lines as EstimateLine[]).every((l) => l.lumpSum);
  const rows = lines
    .map((raw, i) => {
      if (fees) {
        const l = raw as EstimateLine;
        return `<tr><td class="c">${i + 1}</td><td class="d">${describe(l)}</td><td class="num">${fmt(l.amount)}</td></tr>`;
      }
      if (quote) {
        const l = raw as QuoteLine;
        return `<tr><td class="c">${i + 1}</td><td class="d">${esc(l.name || "")}</td><td class="num">${fmt(l.rate)}</td><td class="c">${esc(l.unit || "")}</td></tr>`;
      }
      const l = raw as EstimateLine;
      return `<tr><td class="c">${i + 1}</td><td class="d">${describe(l)}</td><td>${esc(l.materialType || "")}</td><td>${esc(l.glassType || "")}</td><td>${esc(l.shadeType || "")}</td><td>${esc(l.floorType || "")}</td><td class="c">${esc(sizeInFeet(l))}</td><td class="c">${l.qty ?? ""}</td><td class="r">${esc(measureText(l))}</td><td class="num">${fmt(l.rate)}</td><td class="num">${fmt(l.amount)}</td></tr>`;
    })
    .join("");

  const cols = fees ? 3 : quote ? 4 : 11;
  const colgroup = fees
    ? `<col style="width:8%"><col><col style="width:24%">`
    : `<col style="width:8%"><col><col style="width:18%"><col style="width:14%">`;
  const head = fees
    ? `<th class="c">Sr.</th><th class="d">Description</th><th class="num">Amount (₹)</th>`
    : quote
    ? `<th class="c">Sr. No.</th><th class="d">Description</th><th class="num">Rate (₹)</th><th class="c">Unit</th>`
    : `<th class="c">Sr.</th><th>Product / Type</th><th>Material</th><th>Glass Type</th><th>Shade</th><th>Floor</th><th class="c">Size (ft)</th><th class="c">Qty</th><th class="r">Billed Qty</th><th class="num">Rate (₹)</th><th class="num">Amount (₹)</th>`;
  const fit = !quote && !fees; // measured estimate: columns size to their content, one line each
  const itemsTable = `<table class="it items${fit ? " fit" : ""}">${fit ? "" : `<colgroup>${colgroup}</colgroup>`}<thead><tr>${head}</tr></thead><tbody>${rows}${fillerRow(cols)}</tbody></table>`;

  const charges = quote ? null : chargesTable(d);
  const summary = charges
    ? `<div class="summary"><div class="words"><b>Amount in Words:</b><br>${esc(amountInWords(charges.total))}</div>${charges.html}</div>`
    : "";
  const sign = `<div class="forco"><b>For</b> ${brandLogo(d.workType, "forlogo")}<div class="signgap"></div>Authorised Signatory</div>`;
  const footer = `<div class="address">${companyAddress(d.workType)}</div>`;
  const estimateBottom = quote
    ? ""
    : `<div class="tail">${summary}<div class="esign"><div class="receiver">Client’s Signature: ______________________</div>${sign}</div>${footer}</div>`;
  const toExtra = !quote && d.workType ? [`Work: ${esc(d.workType)}`] : [];

  const title = docTitle(d.client, (quote ? "Q-" : "E-") + d.no);
  const html = `<html><head><title>${esc(title)}</title><style>@page{size:A4 ${quote ? "portrait" : "landscape"};margin:0}${FRAME_CSS}${ITEMS_CSS}*{box-sizing:border-box}:root{--fs:9px;--ink:#333;--c-title:#000;--c-client:#1B2A6B;--c-co:#000}body{font:var(--fs) ${FONT};color:var(--ink);margin:0}
.page{min-height:264mm;display:flex;flex-direction:column}.isq .page{min-height:0}.ise .page{min-height:183mm}.ise .frame>thead>tr>td{height:8mm}.ise .frame>tfoot>tr>td{height:11mm}.ise .top{margin:0 0 6px}.ise .logo{margin-top:0}.ise .logo.sq{margin-top:0}.ise .to{margin:0 0 8px}
.top{display:flex;justify-content:space-between;align-items:flex-start;margin:3mm 0 12px}.logo{width:140px;height:auto;object-fit:contain;margin-top:5mm}.logo.sq{width:auto;height:96px;margin-top:2mm}
.meta{text-align:right;line-height:1.7}.isq .meta h2{font-size:16px}.isq .meta b{min-width:30px}.meta b{display:inline-block;min-width:66px;text-align:left}.meta h2{font-size:21px;margin:0 0 5px;text-decoration:underline;color:var(--c-title)}
.to{line-height:1.6;margin:6px 0 12px;color:var(--c-client)}.to{font-size:10px}.to b.pn{font-size:14px;line-height:1.5}.intro{line-height:1.45;margin:0 0 10px}
.tail{margin-top:auto;break-inside:avoid}.summary{display:flex;gap:10px;align-items:stretch}.summary .words{flex:1;border:1px solid #777;border-top:0;padding:6px;line-height:1.5}
.charges{width:300px;border-collapse:collapse;flex:0 0 300px}.charges td{border:1px solid #777;border-top:0;padding:4px 6px;vertical-align:middle}.charges .num{text-align:center;white-space:nowrap}.charges .grand td{font-weight:bold;font-size:10px;background:#f3f4f7}
.esign{display:flex;justify-content:space-between;align-items:flex-end;margin-top:10px}.receiver{white-space:nowrap}
.forco{text-align:right;line-height:13px}.forco b{color:var(--c-co)}.forlogo{height:28px;width:auto;vertical-align:middle;margin-left:3px}.forlogo.sq{height:40px}.signgap{height:40px}
.address{text-align:center;border-top:1px solid #777;padding-top:5px;margin-top:8px;line-height:1.4}
.bottom{display:flex;flex-direction:column}.isq .frame>tfoot>tr>td{height:68mm}.isq .bottom{position:fixed;left:12.7mm;right:12.7mm;bottom:12.7mm;background:#fff}
.quoteFooterTerms{position:relative}.quoteFooterTerms .forco{position:absolute;right:0;top:0}.terms-heading{display:inline-block;padding-bottom:2px;border-bottom:1px solid #888;margin:0 0 5px;font-size:13px}.terms{font-size:10px;line-height:1.35}
.quoteSignatures{margin-top:6px;min-height:30px;display:flex;align-items:flex-end}.thankyou{text-align:center;margin:6px 0 7px;font-weight:600}
@media print{.tail,.bottom,.summary{break-inside:avoid}}</style></head><body class="${quote ? "isq" : "ise"}"><table class="frame"><thead><tr><td></td></tr></thead><tbody><tr><td><div class="page"><div class="top">${brandLogo(d.workType, "logo")}<div class="meta"><h2>${quote ? "QUOTATION" : "ESTIMATE"}</h2><b>${quote ? "Q." : "Estimate"} No.:</b> ${esc(d.no)}<br><b>Date:</b> ${esc(fmtDate(d.date))}</div></div><div class="to">To,<br>${partyBlock(d, party, toExtra)}</div>${quote ? `<p class="intro">With reference to your requirement, we are pleased to submit our quotation for the proposed work at the above-mentioned site. This quotation includes supply and installation with all necessary materials as per the agreed terms.</p>` : ""}${itemsTable}${estimateBottom}</div></td></tr></tbody><tfoot><tr><td></td></tr></tfoot></table>${quote ? `<div class="bottom"><div class="quoteFooterTerms">${QUOTE_TERMS}${sign}</div><div class="quoteSignatures"><div class="receiver">Receiver’s Signature: __________________________</div></div><div class="thankyou">Thank you for your business. We look forward to working with you.</div>${footer}</div>` : ""}</body></html>`;
  // Quotation: its fixed footer takes 68 mm of every page; estimate: the footer is part of the page flow.
  printHtmlInFrame(html, {
    title,
    widthMm: quote ? 210 : 297,
    fit: { content: ".page", spacer: ".spacer", usableMm: quote ? 297 - 12.7 - 68 : 210 - 19, repeat: ".items thead", widthMm: quote ? 210 : 297, shrink: quote ? undefined : ".it.fit" },
  });
}

// ------------------------------------------------------------ Detail sheet (landscape)
export function printDetailSheet(d: PrintDoc, saved: EstimateLine[]) {
  // Detail sheet: every saved line is its own row with its own exact size and quantity (nothing merged).
  const lines = saved;
  const fees = lines.length > 0 && lines.every((l) => l.lumpSum);
  const sizeCell = (l: EstimateLine) => `<span class="sz">${esc(sizeAsWritten(l))}</span>`;
  const rows = lines
    .map((l, i) => {
      if (fees) return `<tr><td class="c">${i + 1}</td><td class="d">${describe(l)}</td><td class="num">${fmt(l.amount)}</td></tr>`;
      return `<tr><td class="c">${i + 1}</td><td class="d">${describe(l)}</td><td>${esc(l.materialType || "")}</td><td>${esc(l.glassType || "")}</td><td>${esc(l.shadeType || "")}</td><td>${esc(l.floorType || "")}</td><td>${sizeCell(l)}</td><td class="c">${l.qty ?? ""}</td><td class="r">${esc(measureText(l))}</td><td class="num">${fmt(l.rate)}</td><td class="num">${fmt(l.amount)}</td></tr>`;
    })
    .join("");
  const charges = chargesTable(d);
  const table = fees
    ? `<table class="it items"><colgroup><col style="width:6%"><col><col style="width:20%"></colgroup><thead><tr><th class="c">Sr.</th><th class="d">Description</th><th class="num">Amount (₹)</th></tr></thead><tbody>${rows}${fillerRow(3)}</tbody></table>`
    : `<table class="it items fit"><thead><tr><th class="c">Sr.</th><th>Product / Type</th><th>Material</th><th>Glass Type</th><th>Shade</th><th>Floor</th><th>Size (inches)</th><th class="c">Qty</th><th class="r">Billed Qty</th><th class="num">Rate (₹)</th><th class="num">Amount (₹)</th></tr></thead><tbody>${rows}${fillerRow(11)}</tbody></table>`;

  const title = docTitle(d.client, "D-" + d.no);
  const html = `<html><head><title>${esc(title)}</title><style>@page{size:A4 landscape;margin:0}${FRAME_CSS}${ITEMS_CSS}*{box-sizing:border-box}:root{--fs:9px;--ink:#333;--c-title:#000;--c-client:#1B2A6B}body{font:var(--fs) ${FONT};color:var(--ink);margin:0}
.frame>thead>tr>td{height:8mm}.frame>tfoot>tr>td{height:11mm}.page{min-height:183mm;display:flex;flex-direction:column}
h2{font-size:18px;margin:4px 0 4px;color:var(--c-title)}.cl{line-height:1.6;color:var(--c-client)}.cl{font-size:10px}.cl b.pn{font-size:14px;line-height:1.5}.head{display:flex;justify-content:space-between;margin-bottom:6px}.logo{width:150px;height:auto;object-fit:contain}.logo.sq{display:block;width:auto;height:80px}.meta{text-align:right;line-height:1.7}
.sz{display:block;white-space:nowrap;margin:0 -3px;padding:2px 3px}.sz+.sz{border-top:1px solid #999}.sz:first-child{padding-top:0}.sz i{font-style:normal;color:#666}
.tail{margin-top:auto;break-inside:avoid}.summary{display:flex;gap:10px}.summary .words{flex:1;border:1px solid #777;border-top:0;padding:6px;line-height:1.5}
.charges{width:320px;border-collapse:collapse;flex:0 0 320px}.charges td{border:1px solid #777;border-top:0;padding:4px 6px;vertical-align:middle}.charges .num{text-align:center;white-space:nowrap}.charges .grand td{font-weight:bold;font-size:10px;background:#f3f4f7}
.address{text-align:center;border-top:1px solid #aaa;padding-top:5px;margin-top:8px;line-height:1.4}</style></head><body><table class="frame"><thead><tr><td></td></tr></thead><tbody><tr><td><div class="page"><div class="head"><div>${brandLogo(d.workType, "logo")}<h2>DETAIL SHEET</h2><div class="cl">${partyBlock(d, undefined, d.workType ? [`Work Type: ${esc(d.workType)}`] : [])}</div></div><div class="meta"><b>Detail Sheet No.:</b> ${esc(d.no)}<br><b>Date:</b> ${esc(fmtDate(d.date))}</div></div>${table}<div class="tail"><div class="summary"><div class="words"><b>Amount in Words:</b><br>${esc(amountInWords(charges.total))}</div>${charges.html}</div><div class="address">${companyAddress(d.workType)}</div></div></div></td></tr></tbody><tfoot><tr><td></td></tr></tfoot></table></body></html>`;
  printHtmlInFrame(html, {
    title,
    widthMm: 297,
    fit: { content: ".page", spacer: ".spacer", usableMm: 210 - 19, repeat: ".items thead", widthMm: 297, shrink: ".it.fit" },
  });
}

// ------------------------------------------------------------ GST tax invoice
export function buildTaxInvoice(d: PrintDoc, saved: EstimateLine[], party: PrintParty) {
  const lines = mergeForPrint(saved);
  const co = companyFor(d.workType);
  const inr = (n: number) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fees = isFeeBill(d.workType, lines);
  const cols = fees ? 4 : 8;
  const rowsHtml = lines
    .map((l, i) => {
      if (fees)
        return `<tr><td class="c">${i + 1}</td><td class="d">${describe(l)}</td><td class="c">${esc(hsnFor(l))}</td><td class="num">₹ ${inr(l.amount)}</td></tr>`;
      const size = sizeInFeet(l);
      return `<tr><td class="c">${i + 1}</td><td class="d">${describe(l)}</td><td class="c">${esc(hsnFor(l))}</td><td class="c">${esc(size)}</td><td class="c">${l.lumpSum ? "" : Number(l.qty || 0)}</td><td class="r">${esc(measureText(l))}</td><td class="num">₹ ${inr(l.rate)}</td><td class="num">₹ ${inr(l.amount)}</td></tr>`;
    })
    .join("");

  const taxable = Number(d.taxable ?? d.subtotal ?? 0);
  const rate = Number(d.gstRate || 18);
  const tax = Number(d.tax ?? (taxable * rate) / 100);
  const total = Number(d.total ?? Math.round(taxable + tax));
  const half = Math.round((tax / 2) * 100) / 100;
  const received = Number(d.received || 0);
  const balance = Math.max(0, total - received);
  const roundOff = Math.round((total - (taxable + tax)) * 100) / 100;
  const upi = `upi://pay?pa=ashwinenterprises@icici&pn=ASHWIN%20ENTERPRISES&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent("Invoice " + d.no)}`;
  const qr = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=4&data=" + encodeURIComponent(upi);
  // The billed quantities only add up when every line is billed in the same unit (all Sq.Ft., all Rft., …).
  const measured = lines.filter((l) => !l.lumpSum);
  const oneUnit = measured.length > 0 && measured.every((l) => unitKind(l.unit) === unitKind(measured[0].unit));
  const totalBilled = oneUnit
    ? measureText({ ...measured[0], sqft: Math.round(measured.reduce((s, l) => s + Number(l.sqft || 0), 0) * 100) / 100 })
    : "";
  const itemsHead = fees
    ? `<tr><th style="width:7%">Sr.<br>No.</th><th class="d">Description</th><th style="width:14%">HSN Code</th><th style="width:22%">Amount (₹)</th></tr>`
    : `<tr><th style="width:5%">Sr.<br>No.</th><th class="d" style="width:26%">Description</th><th style="width:8%">HSN Code</th><th style="width:11%">Size</th><th style="width:6%">Qty</th><th style="width:13%">Billed Qty</th><th style="width:14%">Rate (₹)</th><th style="width:17%">Amount (₹)</th></tr>`;
  const itemsTotal = fees
    ? `<tr class="tot"><td colspan="3"><b>Total</b></td><td class="num"><b>₹ ${inr(taxable)}</b></td></tr>`
    : `<tr class="tot"><td colspan="5"><b>Total</b></td><td class="r"><b>${esc(totalBilled)}</b></td><td></td><td class="num"><b>₹ ${inr(lines.reduce((s, l) => s + Number(l.amount || 0), 0))}</b></td></tr>`;
  const filler = `<tr class="fill"><td class="spacer"></td>${"<td></td>".repeat(cols - 1)}</tr>`;
  const mobile = String(d.clientMobile || party.phone || "").trim();
  const address = String(d.clientAddress || party.address || "").trim();
  const billTo = [
    `<b>${esc(d.client)}</b>`,
    address ? esc(address) : "",
    mobile ? `Contact No.: ${esc(mobile)}` : "",
    d.siteName ? `Site: ${esc(d.siteName)}` : "",
    `GSTIN: <b>${esc(d.clientGstin || party.gstin || "Unregistered")}</b> &nbsp; State: 27-Maharashtra`,
  ]
    .filter(Boolean)
    .join("<br>");

  // Tax summary: one row per HSN. Discount / Transport / Hamali are spread over the codes in proportion to
  // their item amounts, and the last code takes any rounding so the rows add up to the invoice exactly.
  const byHsn = new Map<string, number>();
  for (const l of lines) byHsn.set(hsnFor(l), (byHsn.get(hsnFor(l)) ?? 0) + Number(l.amount || 0));
  if (!byHsn.size) byHsn.set("7610", 0);
  const itemsSum = [...byHsn.values()].reduce((a, b) => a + b, 0);
  const r2 = (n: number) => Math.round(n * 100) / 100;
  let leftTaxable = taxable, leftCgst = half, leftSgst = r2(tax - half);
  const hsnRows = [...byHsn.entries()]
    .map(([code, amt], i, all) => {
      const last = i === all.length - 1;
      const share = itemsSum ? amt / itemsSum : 1 / all.length;
      const t = last ? r2(leftTaxable) : r2(taxable * share);
      const c = last ? r2(leftCgst) : r2(half * share);
      const s = last ? r2(leftSgst) : r2((tax - half) * share);
      leftTaxable -= t;
      leftCgst -= c;
      leftSgst -= s;
      return `<tr><td>${esc(code)}</td><td>${t.toFixed(2)}</td><td>${(rate / 2).toFixed(1)}%</td><td>${c.toFixed(2)}</td><td>${(rate / 2).toFixed(1)}%</td><td>${s.toFixed(2)}</td><td>${(c + s).toFixed(2)}</td></tr>`;
    })
    .join("");

  const html = `<!doctype html><html><head><title>${esc(docTitle(d.client, d.no))}</title><style>@page{size:A4 portrait;margin:0}.frame{width:100%;border-collapse:collapse;border:0}.frame>thead>tr>td,.frame>tfoot>tr>td{height:12.7mm;padding:0;border:0}.frame>tbody>tr>td{padding:0 12.7mm;border:0;vertical-align:top}*{box-sizing:border-box}body{font:10px ${FONT};color:#222;margin:0}.page{display:flex;flex-direction:column;min-height:260mm}.spacer{flex:1 1 auto;min-height:0}.page{width:100%;margin:auto}.title{text-align:center;font-weight:bold;font-size:15px;border:1px solid #444;padding:4px;margin-bottom:5px}.head,.bill,.items,.taxbox,.terms{width:100%;border-collapse:collapse}.head td,.bill td,.items td,.items th,.taxbox td,.taxbox th,.terms td{border:1px solid #555;padding:4px;vertical-align:middle;text-align:center}.head td,.bill td{text-align:left}.head td.meta{text-align:center;vertical-align:middle}.metab{display:inline-block;text-align:left}.head td[style*="center"]{text-align:center}.terms td:first-child{text-align:left}.head .logo{width:135px;height:auto;max-height:75px;object-fit:contain}.head .logo.sq{width:auto;height:80px;max-height:80px}.company{line-height:1.5;padding:4px 12px}.company .caddr{width:80%;min-width:230px;margin-bottom:2px}.head td.co{padding:6px 8px}.meta{line-height:1.7}.bill{margin-top:4px}.billtitle{font-weight:bold}.items{margin-top:5px;table-layout:fixed}.items th{background:#f1f3f8;font-size:9px}.items .c{text-align:center}.items td{padding:3px 3px;overflow-wrap:anywhere}.items .r{text-align:center}.items tr.fill td{padding:0;border-top:0;border-bottom:0}.items tr.tot td{border-top:1px solid #555}.items thead{display:table-header-group}.items tr{break-inside:avoid}.items tr.fill{break-inside:auto}.num{text-align:center;white-space:nowrap}.summary{margin-top:12px;display:grid;grid-template-columns:1fr 44%;column-gap:14px;align-items:start}.taxbox{margin-top:14px}.taxbox th{background:#f1f3f8}.taxbox td,.taxbox th{font-size:7px;text-align:center;vertical-align:middle;padding:2px 1px;line-height:1.15;overflow-wrap:anywhere}.taxbox th{font-size:6.7px}.taxbox{table-layout:fixed}.taxbox th:nth-child(1){width:10%}.taxbox th:nth-child(2){width:18%}.taxbox th:nth-child(3),.taxbox th:nth-child(5){width:10%}.taxbox th:nth-child(4),.taxbox th:nth-child(6){width:16%}.taxbox th:nth-child(7){width:20%}.totals{width:100%;border-collapse:collapse;table-layout:fixed}.totals td:last-child{width:${fees ? 50 : 39}%}.totals td{border:1px solid #555;padding:5px 6px}.totals td:last-child{text-align:center;white-space:nowrap}.grand{font-size:13px;font-weight:bold;border-top:2px solid #333!important}.words{font-size:9px;font-weight:bold}.terms{margin-top:3px}.terms td{line-height:1.2;padding:5px}.preterms{margin-top:auto;padding-top:5px}.preterms .words{margin:3px 0 5px;line-height:1.35}.signspace{height:25px;line-height:12px}.bottom{display:grid;grid-template-columns:50% 50%;page-break-inside:avoid;gap:8px;margin-top:5px}.bank,.sign{border:0;border-top:1px solid #777;padding:5px 2px;min-height:74px}.bank{line-height:1.5}.bankrow{display:flex;gap:6px;align-items:center}.bankrow div{font-size:8px;line-height:1.35}.qr{width:64px;height:64px;object-fit:contain}.sign{display:flex;flex-direction:column;justify-content:space-between;font-weight:normal;min-width:0}.auth{text-align:right;margin-top:0;font-weight:normal;font-size:9px}.thanks{text-align:center;font-weight:bold;border-top:1px solid #555;padding:5px;margin-top:0}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}.page{break-inside:avoid}.bottom,.terms,.summary,.sign{break-inside:avoid}}</style></head><body><table class="frame"><thead><tr><td></td></tr></thead><tbody><tr><td><div class="page"><div class="title">TAX INVOICE</div><table class="head"><tr><td style="width:24%;text-align:center">${brandLogo(d.workType, "logo")}</td><td class="co" style="width:46%"><div class="company"><div class="caddr">${esc(co.shop)}, ${esc(co.address)}</div>Phone: ${esc(co.phone)}<br>Email: ${esc(co.email)}<br><b>GSTIN: ${GSTIN}</b></div></td><td class="meta"><div class="metab"><b>Invoice No.:</b> ${esc(d.no)}<br><b>Date:</b> ${esc(fmtDate(d.date))}<br><b>Place of Supply:</b> 27-Maharashtra</div></td></tr></table><table class="bill"><tr><td><div class="billtitle">Bill To:</div>${billTo}</td></tr></table><table class="items"><thead>${itemsHead}</thead><tbody>${rowsHtml}${filler}${itemsTotal}</tbody></table><div class="summary"><table class="taxbox"><tr><th>HSN Code</th><th>Taxable Amount (₹)</th><th>CGST Rate</th><th>CGST Amt (₹)</th><th>SGST Rate</th><th>SGST Amt (₹)</th><th>Total Tax (₹)</th></tr>${hsnRows}<tr><th>TOTAL</th><th>${taxable.toFixed(2)}</th><th></th><th>${half.toFixed(2)}</th><th></th><th>${(tax - half).toFixed(2)}</th><th>${tax.toFixed(2)}</th></tr></table><table class="totals"><tr><td>Sub Total</td><td>${money(d.subtotal)}</td></tr>${Number(d.discount || 0) ? `<tr><td>Discount</td><td>− ${money(d.discount)}</td></tr>` : ""}${Number(d.hamali || 0) ? `<tr><td>Hamali</td><td>${money(d.hamali)}</td></tr>` : ""}${Number(d.transport || 0) ? `<tr><td>Transport</td><td>${money(d.transport)}</td></tr>` : ""}<tr><td>Taxable Amount</td><td>${money(taxable)}</td></tr><tr><td>Tax (${rate}%)</td><td>${money(tax)}</td></tr><tr><td>Round Off</td><td>${money(roundOff)}</td></tr><tr class="grand"><td>Total</td><td>${money(total)}</td></tr><tr><td>Advance Received</td><td>${money(received)}</td></tr><tr><td><b>Balance</b></td><td><b>${money(balance)}</b></td></tr></table></div><div class="preterms"><div class="words"><b>Invoice Amount in Words:</b><br>${amountInWords(total)}</div><table class="terms"><tr><td style="width:58%"><b>Terms & Conditions:</b><br>Please make the payment within 3 days of the bill date.<br>Thanks for doing business with us!</td><td style="width:42%;vertical-align:middle;text-align:center"><b>Receiver’s Signature:</b><br><br>____________________________</td></tr></table></div><div class="bottom"><div class="bank"><b>Bank Details / Scan to Pay:</b><div class="bankrow"><img class="qr" src="${qr}" alt="UPI payment QR"><div>Bank: ICICI BANK LIMITED, AURANGABAD<br>Account No.: 110505002754<br>IFSC: ICIC0006970<br>Account Name: ASHWIN ENTERPRISES<br>UPI ID: ashwinenterprises@icici<br><b>QR Amount: ${money(total)}</b></div></div></div><div class="sign"><div style="text-align:right;margin-top:auto"><div style="font-weight:bold">For ASHWIN ENTERPRISES</div><div class="signspace">&nbsp;<br>&nbsp;</div><div class="auth">Authorised Signatory</div></div></div></div><div class="thanks">THANK YOU FOR DOING BUSINESS WITH US!</div></div></td></tr></tbody><tfoot><tr><td></td></tr></tfoot></table></body></html>`;
  return { html, title: docTitle(d.client, d.no), opts: { widthMm: 210, fit: PIN_PAGE } as PrintOptions };
}

export function printTaxInvoice(d: PrintDoc, lines: EstimateLine[], party: PrintParty) {
  const b = buildTaxInvoice(d, lines, party);
  printHtmlInFrame(b.html, { title: b.title, ...b.opts });
}


// ------------------------------------------------------------ Bill of Supply (Non-GST, ARNAV GLASS SERVICES)
export function buildBillOfSupply(d: PrintDoc, saved: EstimateLine[], party?: PrintParty) {
  const lines = mergeForPrint(saved);
  const co = companyFor(d.workType) === COMPANY.ashwin ? COMPANY.ashwin : COMPANY.arnav;
  const inr = (n: unknown) => "₹ " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dmy = (x: unknown) => String(x ?? "").split("-").reverse().join("-");
  const sizeOf = (l: EstimateLine) => sizeInFeet(l);
  const fees = isFeeBill(d.workType, lines);
  const rows = lines
    .map((l, i) =>
      fees
        ? `<tr><td class="c">${i + 1}</td><td class="d sl">${describe(l)}</td><td class="r sl">${inr(l.amount)}</td></tr>`
        : `<tr><td class="c">${i + 1}</td><td class="d sl">${describe(l)}</td><td class="c sl">${esc(sizeOf(l))}</td><td class="c sl">${l.lumpSum ? "" : Number(l.qty || 0)}</td><td class="c sl">${esc(measureText(l))}</td><td class="r sl">${inr(l.rate)}</td><td class="r sl">${inr(l.amount)}</td></tr>`
    )
    .join("");
  const itemsTable = fees
    ? `<table class="items bos"><colgroup><col style="width:9%"><col><col style="width:24%"></colgroup>
<thead><tr><th>Sr. No.</th><th class="d sl">Description</th><th class="sl">Amount</th></tr></thead>
<tbody>${rows}<tr class="fill"><td class="spacer" style="height:${Math.max(0, 19 - lines.length) * 5.6}mm"></td><td class="sl"></td><td class="sl"></td></tr></tbody></table>`
    : `<table class="items bos"><colgroup><col style="width:7%"><col style="width:27%"><col style="width:12%"><col style="width:8%"><col style="width:15%"><col style="width:15%"><col style="width:16%"></colgroup>
<thead><tr><th>Sr. No.</th><th class="d sl">Description</th><th class="sl">Size</th><th class="sl">Qty</th><th class="sl">Billed Qty</th><th class="sl">Rate</th><th class="sl">Amount</th></tr></thead>
<tbody>${rows}<tr class="fill"><td class="spacer" style="height:${Math.max(0, 19 - lines.length) * 5.6}mm"></td><td class="sl"></td><td class="sl"></td><td class="sl"></td><td class="sl"></td><td class="sl"></td><td class="sl"></td></tr></tbody></table>`;
  const sub = Number(d.subtotal || 0);
  const disc = Number(d.discount || 0);
  const tr = Number(d.transport || 0);
  const ha = Number(d.hamali || 0);
  const total = Number(d.total ?? d.taxable ?? sub);
  const adv = Number(d.received || 0);
  const bal = Math.max(0, Math.round((total - adv) * 100) / 100);
  const trow = (a: string, b: string, bold?: boolean) => `<tr${bold ? ' class="b"' : ""}><td>${a}</td><td class="r">${b}</td></tr>`;
  const totals =
    trow("Sub Total", inr(sub)) +
    (disc ? trow("Discount", "− " + inr(disc)) : "") +
    (ha ? trow("Hamali", inr(ha)) : "") +
    (tr ? trow("Transport", inr(tr)) : "") +
    trow("Total", inr(total), true) +
    trow("Advance Received", inr(adv)) +
    trow("Balance", inr(bal), true);
  // Civil / Interior bills go out under ASHWIN (square logo, paid into Vikas Thokal's SBI account);
  // Glass & Aluminium bills stay ARNAV GLASS SERVICES with its HDFC account.
  const civil = isFeeWork(d.workType);
  const logoImg = civil
    ? `<img class="sq" width="486" height="513" src="${civilLogoUrl()}">`
    : `<img width="491" height="164" src="${arnavLogoUrl()}">`;
  const account = civil
    ? "Account Name:- Vikas Karbhrai Thokal<br>Bank Name:- SBI, Satara Parisar Branch, Beed Bypass Road, Chh. Sambhajinagar.<br>Account No.:- 30705278225<br>IFSC Code:- SBIN0021138"
    : "Account Name:- ARNAV GLASS SERVICES<br>Bank Name:- HDFC Bank Ltd., Beed Bypass Road, Chh. Sambhajinagar.<br>Account No.:- 50200061793113<br>IFSC Code:- HDFC0009426";
  const mobile = String(d.clientMobile || party?.phone || "").trim();
  const address = String(d.clientAddress || party?.address || "").trim();

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc((d.client ? d.client + " " : "") + d.no)}</title><style>
@page{size:A4 portrait;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0}:root{--fs:10px;--ink:#222}
body{font:var(--fs) ${FONT};color:var(--ink)}
.frame{width:100%;border-collapse:collapse;border:0}.frame>thead>tr>td,.frame>tfoot>tr>td{height:12.7mm;padding:0;border:0}.frame>tbody>tr>td{padding:0 12.7mm;border:0;vertical-align:top}
.hd{width:100%;border-collapse:collapse;border-bottom:1.5px solid #222}.hd td{padding:0 0 4px;vertical-align:bottom}.addr{font-size:11px;line-height:1.5;padding-right:12px!important}.addr .caddr{width:62%;min-width:230px}.wd{border:1px solid #222;border-top:0;padding:5px 6px;font-size:11px;line-height:1.5;break-inside:avoid}.hd img{width:150px;height:auto;display:block;margin-left:auto}.hd img.sq{width:auto;height:84px}
.ttl{text-align:right;font-size:13px;letter-spacing:.6px;margin:14px 0 8px;font-weight:bold}
.to{line-height:1.5;margin-top:4px}.to .nm{font-size:13px;font-weight:bold;margin-left:14px}.to .st{margin-left:14px}.to .st b{font-weight:normal;color:#555}
.meta{text-align:right;line-height:1.5;margin:8px 0 8px}
table.items{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #222;table-layout:fixed}.items th{border-bottom:1px solid #222;padding:4px 3px;font-weight:normal;font-size:12px}.items td{padding:2.5px 4px;border:0;vertical-align:middle;text-align:center;overflow-wrap:anywhere}.items tr{break-inside:avoid}.items tr.fill{break-inside:auto}
.items .sl{border-left:1px solid #222}.c{text-align:center}.r{text-align:center;white-space:nowrap}.items tr.fill td{padding:0}
.bot{width:100%;border-collapse:collapse;border:1px solid #222;border-top:0;break-inside:avoid}.bot>tbody>tr>td{vertical-align:top;padding:0}.acc{padding:3px 4px!important;line-height:1.5;font-size:11px}.aw{margin-bottom:6px}
.tot{width:100%;border-collapse:collapse;table-layout:fixed}.tot td:last-child{width:${fees ? 63 : 52}%}.tot td{border:1px solid #222;padding:2px 6px;font-size:11px;text-align:center;vertical-align:middle}.tot td:first-child{text-align:left}.tot tr:first-child td{border-top:0}.tot td:first-child{border-left:1px solid #222}.tot td:last-child{border-right:0}.tot tr.b td{font-weight:bold}.tot tr:last-child td{border-bottom:0}
.sign{margin-top:16px;text-align:right;break-inside:avoid}.sign img{height:34px;width:auto;vertical-align:middle;margin-left:6px}.sign img.sq{height:44px}.sign .gap{height:46px}.sign b{font-size:11px}
</style></head><body><table class="frame"><thead><tr><td></td></tr></thead><tbody><tr><td><div class="page">
<table class="hd"><tr><td class="addr"><div class="caddr">${esc(co.shop)}, ${esc(co.address)}</div>Phone: ${esc(co.phone)}<br>${esc(co.email)}</td><td style="width:170px">${logoImg}</td></tr></table>
<div class="ttl">BILL OF SUPPLY</div>
<div class="to">To,<div class="nm">${esc(d.client)}</div>${mobile ? `<div class="st"><b>Mobile:</b> ${esc(mobile)}</div>` : ""}${address ? `<div class="st"><b>Address:</b> ${esc(address)}</div>` : ""}${d.siteName ? `<div class="st"><b>Site:</b> ${esc(d.siteName)}</div>` : ""}</div>
<div class="meta">Bill No.:- <b>${esc(civil ? d.no.replace(/^AGS\//i, "") : d.no)}</b><br>Date:- <b>${esc(dmy(d.date))}</b></div>
${itemsTable}
<table class="bot"><tr><td class="acc" style="width:${fees ? 62 : 69}%"><div class="aw"><b>Amount in Words:</b> ${esc(amountInWords(total))}</div>${account}</td><td><table class="tot">${totals}</table></td></tr></table>
<div class="sign"><b>For</b> ${logoImg}<div class="gap"></div><b>Authorised Signatory</b></div>
</div></td></tr></tbody><tfoot><tr><td></td></tr></tfoot></table></body></html>`;
  return { html, title: (d.client ? d.client + " " : "") + d.no, opts: { widthMm: 210, fit: PIN_PAGE } as PrintOptions };
}

export function printBillOfSupply(d: PrintDoc, lines: EstimateLine[], party?: PrintParty) {
  const b = buildBillOfSupply(d, lines, party);
  printHtmlInFrame(b.html, { title: b.title, ...b.opts });
}

/** GST invoices print as the ASHWIN ENTERPRISES Tax Invoice; Non-GST as the ARNAV GLASS SERVICES Bill of Supply. */
export function printInvoiceDocument(d: PrintDoc, lines: EstimateLine[], party: PrintParty) {
  if (d.type === "Non-GST") printBillOfSupply(d, lines, party);
  else printTaxInvoice(d, lines, party);
}

// ------------------------------------------------------------ Party ledger
export type LedgerPrintRow = { date: string; particulars: string; debit: number; credit: number; balance?: number };

/** Running-balance ledger: Logo, party block, Date | Particulars | Debit | Credit | Balance, closing total. */
export function printLedger(party: PrintParty, rows: LedgerPrintRow[]) {
  const f = (n: number) => Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const now = new Date();
  const today = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
  let run = 0, td = 0, tc = 0;
  const body = rows.length
    ? rows
        .map((r) => {
          run += (r.debit || 0) - (r.credit || 0);
          td += r.debit || 0;
          tc += r.credit || 0;
          return `<tr><td>${esc(fmtDate(r.date))}</td><td class="d">${esc(r.particulars)}</td><td class="n">${r.debit ? f(r.debit) : ""}</td><td class="n">${r.credit ? f(r.credit) : ""}</td><td class="n">${f(run)}</td></tr>`;
        })
        .join("")
    : '<tr><td colspan="5" style="text-align:center;padding:14px">No transactions</td></tr>';

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(party.name)} Ledger</title><style>
@page{size:A4 portrait;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:${FONT};font-size:12px;color:#111}
.frame{width:100%;border-collapse:collapse;border:0}.frame>thead>tr>td,.frame>tfoot>tr>td{height:12.7mm;padding:0;border:0}.frame>tbody>tr>td{padding:0 12.7mm;border:0;vertical-align:top}
.hd{width:100%;border-collapse:collapse}.hd td{padding:0;border:0;vertical-align:top}.logo{width:150px;height:auto;display:block}.ttl{text-align:right}.ttl h1{margin:2mm 0 8px;font-size:20px;text-decoration:underline;letter-spacing:.3px}.ttl div{margin-top:3px;font-size:12px}
.party{margin-top:14px;line-height:1.55}.party .pn{font-size:15px;font-weight:bold}
table.led{width:100%;border-collapse:collapse;margin-top:14px;font-size:11px}table.led th,table.led td{border:1px solid #555;padding:5px 6px;vertical-align:middle;text-align:center}table.led th{background:#eee}table.led .n,table.led th.n{text-align:center;white-space:nowrap}
table.led thead{display:table-header-group}table.led tr{break-inside:avoid;page-break-inside:avoid}table.led tr.tot td{font-weight:bold;background:#f5f5f5}
</style></head><body><table class="frame"><thead><tr><td></td></tr></thead><tbody><tr><td>
<table class="hd"><tr><td><img class="logo" width="300" height="138" src="${logoUrl()}"></td><td class="ttl"><h1>PARTY LEDGER</h1><div><b>Date:</b> ${today}</div></td></tr></table>
<div class="party"><div class="pn">${esc(party.name)}</div>${party.phone ? `<div>Mobile: ${esc(party.phone)}</div>` : ""}${party.address ? `<div>Address: ${esc(party.address)}</div>` : ""}</div>
<table class="led"><thead><tr><th style="width:12%">Date</th><th class="d">Particulars</th><th class="n" style="width:16%">Debit</th><th class="n" style="width:16%">Credit</th><th class="n" style="width:17%">Balance</th></tr></thead><tbody>${body}<tr class="tot"><td colspan="2">Total / Closing Balance</td><td class="n">${f(td)}</td><td class="n">${f(tc)}</td><td class="n">${f(run)}</td></tr></tbody></table>
</td></tr></tbody><tfoot><tr><td></td></tr></tfoot></table></body></html>`;
  printHtmlInFrame(html, { title: `${party.name} Ledger`, widthMm: 210 });
}
