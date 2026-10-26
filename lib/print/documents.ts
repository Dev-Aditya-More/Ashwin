// Print templates ported 1:1 from the ASHWIN starter (A4 with 12.7 mm margins, pinned
// quotation footer, landscape detail sheet, GST tax invoice with UPI QR, party ledger).

import { amountInWords, hsnFor, isFeeWork, mergeForPrint, sizeInFeet } from "@/lib/doc-calc";
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

/** A4 height minus the 12.7 mm margin spacers repeated on every page. */
const PIN_PAGE = { content: ".page", spacer: ".spacer", usableMm: 297 - 25.4, repeat: ".items thead", widthMm: 210 };

const FRAME_CSS = `.frame{width:100%;border-collapse:collapse;border:0;font-size:var(--fs)}.frame>thead>tr>td,.frame>tfoot>tr>td{height:12.7mm;padding:0;border:0}.frame>tbody>tr>td{padding:0 12.7mm;border:0;vertical-align:top}`;

const QUOTE_TERMS = `<h3 class="terms-heading">Terms & Conditions</h3><div class="terms"><div>• Payment: 75% advance payment required. Remaining 25% payable upon completion of work.</div><div>• Work Commencement: Work will commence within 1 day after receipt of advance payment.</div><div>• Completion Period: 15 working days from the date of work order.</div><div>• Taxes & Charges: GST @18% and transportation charges shall be extra as applicable.</div><div>• Rate Variation: Rates may vary depending on final material selection.</div><div>• Quotation Validity: This quotation is valid for 3 days from the date of issue.</div><div>• Scaffolding: Scaffolding shall be arranged by the client. If provided by us, it will be charged separately.</div></div>`;

// ------------------------------------------------------------ Quotation / Estimate
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
        return `<tr><td>${i + 1}</td><td>${esc(l.productType || "")}</td><td class="num">${fmt(l.amount)}</td></tr>`;
      }
      if (quote) {
        const l = raw as QuoteLine;
        return `<tr><td>${i + 1}</td><td>${esc(l.name || "")}</td><td class="num">${fmt(l.rate)}</td><td>${esc(l.unit || "")}</td></tr>`;
      }
      const l = raw as EstimateLine;
      return `<tr><td>${i + 1}</td><td>${esc(l.productType || "")}</td><td>${esc(l.materialType || "")}</td><td>${esc(l.glassType || "")}</td><td>${esc(l.shadeType || "")}</td><td>${esc(l.floorType || "")}</td><td class="num">${esc(sizeInFeet(l))}</td><td class="num">${l.qty ?? ""}</td><td>${esc(l.unit || "Sq.Ft.")}</td><td class="num">${l.lumpSum ? "" : Number(l.sqft || 0).toFixed(2)}</td><td class="num">${fmt(l.rate)}</td><td class="num">${fmt(l.amount)}</td></tr>`;
    })
    .join("");

  const subtotal = Number(d.subtotal) || 0;
  const discount = Number(d.discount) || 0;
  const after = Number(d.afterDiscount ?? subtotal - discount);
  const transport = Number(d.transport) || 0;
  const hamali = Number(d.hamali) || 0;
  const taxable = Number(d.taxable ?? after + transport + hamali);
  const tax = Number(d.tax) || 0;
  const total = Number(d.total) || taxable + tax;

  const totals = quote
    ? ""
    : `<table class="totals"><tr><td>Subtotal</td><td>${money(subtotal)}</td></tr>${discount ? `<tr><td>Discount (−)</td><td>− ${money(discount)}</td></tr><tr><td>After Discount</td><td>${money(after)}</td></tr>` : ""}${transport ? `<tr><td>Transport</td><td>${money(transport)}</td></tr>` : ""}${hamali ? `<tr><td>Hamali</td><td>${money(hamali)}</td></tr>` : ""}<tr><td>Taxable Amount</td><td>${money(taxable)}</td></tr><tr><td>GST (${d.gstRate || 0}%)</td><td>${money(tax)}</td></tr><tr class="grand"><td>Total Amount</td><td>${money(total)}</td></tr></table>`;

  const detailTable = fees
    ? `<table class="fee-table"><thead><tr><th style="width:8%">Sr.</th><th>Description</th><th class="num" style="width:26%">Amount (₹)</th></tr></thead><tbody>${rows}</tbody></table>`
    : quote
    ? `<table class="doc-table"><thead><tr><th style="width:6%">Sr. No.</th><th style="width:64%">Description</th><th style="width:16%">Rate</th><th style="width:14%">Unit</th></tr></thead><tbody>${rows}</tbody></table>`
    : `<table class="doc-table"><thead><tr><th style="width:4%">Sr.</th><th>Product Type</th><th>Material</th><th>Glass Type</th><th>Shade</th><th>Floor</th><th>Size (ft)</th><th>Qty</th><th>Unit</th><th>Sq.Ft.</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>`;

  const mobile = d.clientMobile || party.phone;
  const address = d.clientAddress || party.address;

  const html = `<html><head><title>${esc((d.client ? d.client + " " : "") + (quote ? "Q-" : "E-") + d.no)}</title><style>@page{size:A4 portrait;margin:0}${FRAME_CSS}*{box-sizing:border-box}:root{--fs:9px;--ink:#333;--c-title:#000;--c-client:#1B2A6B;--c-co:#000}body{font:var(--fs) Arial,sans-serif;color:var(--ink);margin:0}.page{min-height:268mm;width:100%;max-width:none;margin:0;display:flex;flex-direction:column;padding:0}.top{display:flex;justify-content:space-between;align-items:flex-start;margin:3mm 0 14px}.logo{width:140px;height:auto;object-fit:contain;margin-top:5mm}.logo.sq{width:auto;height:96px;margin-top:2mm}.meta{text-align:right;line-height:1.7}.meta h2{font-size:21px;margin:0 0 5px;text-decoration:underline;color:var(--c-title)}.to{line-height:1.6;margin:12px 0 16px;color:var(--c-client)}table{width:100%;border-collapse:collapse;font-size:var(--fs)}.doc-table{table-layout:fixed;width:100%;flex:0 0 auto;height:auto}.doc-table th,.doc-table td{border:1px solid #777;padding:5px 3px;text-align:left;overflow-wrap:anywhere;vertical-align:middle}.doc-table th,.doc-table td{font-size:var(--fs);line-height:1.25;height:auto!important;min-height:0!important;vertical-align:top}.doc-table th:first-child,.doc-table td:first-child{width:4%}.doc-table th:nth-child(2),.doc-table td:nth-child(2){width:13%}.doc-table th:nth-child(3),.doc-table td:nth-child(3){width:11%}.doc-table th:nth-child(4),.doc-table td:nth-child(4){width:12%}.doc-table th:nth-child(5),.doc-table td:nth-child(5){width:9%}.doc-table th:nth-child(6),.doc-table td:nth-child(6){width:7%}.doc-table th:nth-child(7),.doc-table td:nth-child(7){width:13%}.doc-table th:nth-child(8),.doc-table td:nth-child(8){width:4%}.doc-table th:nth-child(9),.doc-table td:nth-child(9){width:6%}.doc-table th:nth-child(10),.doc-table td:nth-child(10){width:6%}.doc-table th:nth-child(11),.doc-table td:nth-child(11){width:6%}.doc-table th:nth-child(12),.doc-table td:nth-child(12){width:9%}.doc-table tbody tr{height:auto!important;min-height:0!important}.doc-table tbody td{height:auto!important;min-height:0!important;padding:4px 3px;vertical-align:top}.num{text-align:right;white-space:nowrap;overflow-wrap:normal}.fee-table{width:100%;border-collapse:collapse;table-layout:fixed}.fee-table th,.fee-table td{border:1px solid #777;padding:6px;text-align:left;font-size:var(--fs);overflow-wrap:anywhere}.fee-table .num{text-align:right;white-space:nowrap}.totals{width:310px;margin:10px 0 0 auto}.totals td{border:0;padding:4px}.totals td:last-child{text-align:right}.grand{font-weight:bold;border-top:2px solid var(--ink);font-size:var(--fs)}.bottom{margin-top:auto;padding-top:8px;display:flex;flex-direction:column}.quoteFooterTerms{margin-top:0;margin-bottom:0;position:relative}.quoteFooterTerms .forco{position:absolute;right:0;top:0;font-weight:normal;font-size:var(--fs);line-height:13px;text-align:right}.quoteFooterTerms .forlogo{height:28px;width:auto;vertical-align:middle;margin-left:3px}.quoteFooterTerms .forlogo.sq{height:40px}.quoteFooterTerms .forco b{font-weight:bold;color:var(--c-co)}.quoteFooterTerms .signgap{height:52px}.quoteFooterTerms h3{margin:0 0 5px;font-size:var(--fs)}.terms-heading{display:inline-block;padding-bottom:2px;border-bottom:1px solid #888;margin:0 0 5px;font-size:13px}.terms{font-size:10px;line-height:1.35;margin:0}.quoteSignatures{display:flex;align-items:flex-end;justify-content:space-between;margin-top:6px;min-height:38px}.quoteSignatures .receiver{width:auto;white-space:nowrap;text-align:left;padding-top:0}.quoteSignatures .companysign{min-width:210px;text-align:right;font-size:10px}.quoteSignatures .signspace{height:38px}.thankyou{text-align:center;margin:6px 0 7px;font-weight:600;font-size:var(--fs)}.address{text-align:center;border-top:1px solid #777;padding-top:5px;margin-top:0;font-size:var(--fs);line-height:1.35}.addressLine{font-size:var(--fs);line-height:1.35}.addressLine .gstline{display:block;margin-top:2px}.receiver{width:48%;text-align:left;padding-top:8px}.companysign{text-align:right;font-size:9px;min-width:210px}.signspace{height:32px}.frame p{line-height:1.45}.isq .frame>tfoot>tr>td{height:84mm}.isq .page{min-height:0}.isq .bottom{position:fixed;left:12.7mm;right:12.7mm;bottom:12.7mm;margin:0;padding:0;background:#fff}@media print{html,body{width:100%;height:auto;margin:0}.page{min-height:268mm}.top{margin-top:2mm}table,.bottom,.quoteFooterTerms,.quoteSignatures{break-inside:avoid}.doc-table{table-layout:fixed;width:100%;height:auto}.doc-table tbody tr{height:auto!important;min-height:0!important}.doc-table th,.doc-table td{font-size:var(--fs);line-height:1.2;padding:4px 3px;height:auto!important;min-height:0!important;vertical-align:top}.addressLine .gstline{display:block;margin-top:1px}}</style></head><body class="${quote ? "isq" : ""}"><table class="frame"><thead><tr><td></td></tr></thead><tbody><tr><td><div class="page"><div class="top">${brandLogo(d.workType, "logo")}<div class="meta"><h2>${quote ? "QUOTATION" : "ESTIMATE"}</h2><b>No.:</b> ${esc(d.no)}<br><b>Date:</b> ${esc(fmtDate(d.date))}</div></div><div class="to"><b>${esc(d.client)}</b>${mobile ? `<br>Mobile: ${esc(mobile)}` : ""}${address ? `<br>Address: ${esc(address)}` : ""}${d.siteName ? `<br>Site Name: ${esc(d.siteName)}` : ""}${!quote && d.workType ? `<br>Work: ${esc(d.workType)}` : ""}</div>${quote ? "<p>With reference to your requirement, we are pleased to submit our quotation for the proposed work at the above-mentioned site. This quotation includes supply and installation with all necessary materials as per agreed terms.</p>" : ""}${detailTable}${totals}</div></td></tr></tbody><tfoot><tr><td></td></tr></tfoot></table>${quote ? `<div class="bottom"><div class="quoteFooterTerms">${QUOTE_TERMS}<div class="forco"><b>For</b> ${brandLogo(d.workType, "forlogo")}<div class="signgap"></div>Authorised Signatory</div></div><div class="quoteSignatures"><div class="receiver">Receiver’s Signature: __________________________</div></div><div class="thankyou">Thank you for your business. We look forward to working with you.</div><div class="address"><div class="addressLine">Shop No. 10, Ghole Complex, Near Mhaske Petrol Pump, Beed Bypass Road, Satara Parisar, Chh. Sambhajinagar - 431010<br>Phone: 9822990577 · vikas@ashwin.world · GSTIN: 27AEGPT6645A1ZF</div></div></div>` : ""}</body></html>`;
  printHtmlInFrame(html, { widthMm: 210 });
}

// ------------------------------------------------------------ Detail sheet (landscape)
export function printDetailSheet(d: PrintDoc, saved: EstimateLine[]) {
  const lines = mergeForPrint(saved);
  const fees = lines.length > 0 && lines.every((l) => l.lumpSum);
  // A merged row lists every exact measurement it covers, one per line, with how many of each.
  const sizeCell = (l: (typeof lines)[number]) =>
    l.sizes
      .map((s) => `<span class="sz">${esc(s.text)}${l.sizes.length > 1 ? ` <i>(${s.qty} Nos.)</i>` : ""}</span>`)
      .join("<br>");
  const rows = lines
    .map((l, i) => {
      if (fees) return `<tr><td>${i + 1}</td><td>${esc(l.productType || "")}</td><td class="num">${fmt(l.amount)}</td></tr>`;
      return `<tr><td>${i + 1}</td><td>${esc(l.productType || "")}</td><td>${esc(l.materialType || "")}</td><td>${esc(l.glassType || "")}</td><td>${esc(l.shadeType || "")}</td><td>${esc(l.floorType || "")}</td><td>${sizeCell(l)}</td><td>${l.qty ?? ""}</td><td>${esc(l.unit || "Sq.Ft.")}</td><td class="num">${l.lumpSum ? "" : Number(l.sqft || 0).toFixed(2)}</td><td class="num">${fmt(l.rate)}</td><td class="num">${fmt(l.amount)}</td></tr>`;
    })
    .join("");
  const subtotal = Number(d.subtotal) || 0;
  const discount = Number(d.discount) || 0;
  const after = Number(d.afterDiscount ?? subtotal - discount);
  const transport = Number(d.transport) || 0;
  const hamali = Number(d.hamali) || 0;
  const taxable = Number(d.taxable ?? after + transport + hamali);
  const gstRate = Number(d.gstRate) || 0;
  const tax = Number(d.tax) || 0;
  const total = Number(d.total) || taxable + tax;

  const html = `<html><head><title>${esc((d.client ? d.client + " " : "") + "D-" + d.no)}</title><style>@page{size:A4 landscape;margin:0}${FRAME_CSS}*{box-sizing:border-box}:root{--fs:9px;--ink:#333;--c-title:#000;--c-client:#1B2A6B;--c-co:#000}body{font:var(--fs) Arial;color:var(--ink);margin:0}
h2{font-size:18px;margin:10px 0 8px;color:var(--c-title)}
.cl{line-height:1.6;color:var(--c-client)}.head{display:flex;justify-content:space-between;margin-bottom:14px}.logo{width:150px;height:auto;object-fit:contain}.logo.sq{display:block;width:auto;height:90px}.meta{text-align:right;line-height:1.7;font-size:var(--fs)}table{width:100%;border-collapse:collapse;font-size:var(--fs)}th,td{border:1px solid #777;padding:4px;vertical-align:top}.items{table-layout:fixed}.items th,.items td{overflow-wrap:anywhere}.items th{text-align:left;white-space:nowrap}.num{text-align:right;white-space:nowrap}.sz{white-space:nowrap}.sz i{font-style:normal;color:#666}.totals{width:310px;margin:12px 0 0 auto;font-size:var(--fs)}.totals td{border:0;padding:3px 5px}.totals td:last-child{text-align:right;white-space:nowrap}.grand{font-weight:bold;border-top:2px solid var(--ink);font-size:var(--fs)}.totalwords{margin-top:8px;font-weight:bold}.footer{display:flex;justify-content:space-between;margin-top:14px;font-size:var(--fs)}.address{text-align:center;margin-top:12px;border-top:1px solid #aaa;padding-top:5px}@media print{table{break-inside:avoid}.frame{break-inside:auto}}</style></head><body><table class="frame"><thead><tr><td></td></tr></thead><tbody><tr><td><div class="head"><div>${brandLogo(d.workType, "logo")}<h2>DETAIL SHEET</h2><div class="cl"><b>Client:</b> ${esc(d.client)}<br><b>Site:</b> ${esc(d.siteName || "")}<br><b>Work Type:</b> ${esc(d.workType || "")}</div></div><div class="meta"><b>Detail Sheet No.:</b> ${esc(d.no)}<br><b>Date:</b> ${esc(fmtDate(d.date))}</div></div>${fees
        ? `<table class="items"><colgroup><col style="width:8%"><col><col style="width:22%"></colgroup><thead><tr><th>Sr.</th><th>Description</th><th class="num">Amount (₹)</th></tr></thead><tbody>${rows}</tbody></table>`
        : `<table class="items"><colgroup><col style="width:3%"><col style="width:14%"><col style="width:10%"><col style="width:14%"><col style="width:7%"><col style="width:7%"><col style="width:16%"><col style="width:4%"><col style="width:5%"><col style="width:6%"><col style="width:6%"><col style="width:8%"></colgroup><thead><tr><th>Sr.</th><th>Product</th><th>Material</th><th>Glass</th><th>Shade</th><th>Floor</th><th>Size (inches)</th><th>Qty</th><th>Unit</th><th>Sq.Ft.</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>`}<table class="totals"><tr><td>Subtotal</td><td>${money(subtotal)}</td></tr>${discount ? `<tr><td>Discount</td><td>− ${money(discount)}</td></tr><tr><td>After Discount</td><td>${money(after)}</td></tr>` : ""}${transport ? `<tr><td>Transport</td><td>${money(transport)}</td></tr>` : ""}${hamali ? `<tr><td>Hamali</td><td>${money(hamali)}</td></tr>` : ""}<tr><td>Taxable Amount</td><td>${money(taxable)}</td></tr><tr><td>GST (${gstRate}%)</td><td>${money(tax)}</td></tr><tr class="grand"><td>Total Amount</td><td>${money(total)}</td></tr></table></td></tr></tbody><tfoot><tr><td></td></tr></tfoot></table></body></html>`;
  printHtmlInFrame(html, { widthMm: 297 });
}

// ------------------------------------------------------------ GST tax invoice
export function buildTaxInvoice(d: PrintDoc, saved: EstimateLine[], party: PrintParty) {
  const lines = mergeForPrint(saved);
  const inr = (n: number) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fees = isFeeBill(d.workType, lines);
  const cols = fees ? 4 : 9;
  const rowsHtml = lines
    .map((l, i) => {
      if (fees)
        return `<tr><td class="c">${i + 1}</td><td>${esc(l.productType || "")}</td><td class="c">${esc(hsnFor(l))}</td><td class="num">₹ ${inr(l.amount)}</td></tr>`;
      const size = sizeInFeet(l);
      return `<tr><td class="c">${i + 1}</td><td>${esc(l.productType || "")}</td><td class="c">${esc(hsnFor(l))}</td><td class="c">${esc(size)}</td><td class="c">${l.lumpSum ? "" : Number(l.qty || 0)}</td><td class="num">${l.lumpSum ? "" : Number(l.sqft || 0).toFixed(2)}</td><td class="c">${esc(l.unit || "SQF")}</td><td class="num">₹ ${inr(l.rate)}</td><td class="num">₹ ${inr(l.amount)}</td></tr>`;
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
  const totalSqft = lines.reduce((s, l) => s + Number(l.sqft || 0), 0).toFixed(2);
  const blank = Array.from({ length: Math.max(0, 1 - lines.length) }, () => `<tr class="blank">${"<td></td>".repeat(cols)}</tr>`).join("");
  const itemsHead = fees
    ? `<tr><th style="width:7%">Sr.<br>No.</th><th>Description</th><th style="width:14%">HSN Code</th><th style="width:22%">Amount (₹)</th></tr>`
    : `<tr><th style="width:5%">Sr.<br>No.</th><th style="width:27%">Description</th><th style="width:8%">HSN Code</th><th style="width:12%">Size</th><th style="width:6%">Qty</th><th style="width:9%">Area</th><th style="width:7%">Unit</th><th style="width:12%">Rate/Unit (₹)</th><th style="width:14%">Amount (₹)</th></tr>`;
  const itemsTotal = fees
    ? `<tr><td colspan="3"><b>Total</b></td><td class="num"><b>₹ ${inr(taxable)}</b></td></tr>`
    : `<tr><td colspan="5"><b>Total</b></td><td class="num"><b>${totalSqft}</b></td><td colspan="2"></td><td class="num"><b>₹ ${inr(taxable)}</b></td></tr>`;

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

  const html = `<!doctype html><html><head><title>Tax Invoice ${esc(d.no)}</title><style>@page{size:A4 portrait;margin:0}.frame{width:100%;border-collapse:collapse;border:0}.frame>thead>tr>td,.frame>tfoot>tr>td{height:12.7mm;padding:0;border:0}.frame>tbody>tr>td{padding:0 12.7mm;border:0;vertical-align:top}*{box-sizing:border-box}body{font:10px Arial,sans-serif;color:#222;margin:0}.page{display:flex;flex-direction:column;min-height:266mm}.spacer{flex:1 1 auto;min-height:0}.page{width:100%;margin:auto}.title{text-align:center;font-weight:bold;font-size:15px;border:1px solid #444;padding:4px;margin-bottom:5px}.head,.bill,.items,.taxbox,.terms{width:100%;border-collapse:collapse}.head td,.bill td,.items td,.items th,.taxbox td,.taxbox th,.terms td{border:1px solid #555;padding:4px;vertical-align:top}.head .logo{width:135px;height:auto;max-height:75px;object-fit:contain}.head .logo.sq{width:auto;height:80px;max-height:80px}.company{line-height:1.45}.meta{line-height:1.7}.bill{margin-top:4px}.billtitle{font-weight:bold}.items{margin-top:5px;table-layout:fixed}.items th{background:#f1f3f8;font-size:9px}.items .c{text-align:center}.items td{height:18px;padding:2px 2px}.items .blank td{height:10px}.num{text-align:right;white-space:nowrap}.summary{margin-top:4px;display:grid;grid-template-columns:58% 42%;gap:0;align-items:start}.taxbox th{background:#f1f3f8}.taxbox td,.taxbox th{font-size:7px;text-align:right;padding:2px 1px;line-height:1.15;overflow-wrap:anywhere}.taxbox th{font-size:6.7px}.taxbox{table-layout:fixed}.taxbox th:nth-child(1){width:10%}.taxbox th:nth-child(2){width:18%}.taxbox th:nth-child(3),.taxbox th:nth-child(5){width:10%}.taxbox th:nth-child(4),.taxbox th:nth-child(6){width:16%}.taxbox th:nth-child(7){width:20%}.totals td{border:0;padding:3px}.totals td:last-child{text-align:right;white-space:nowrap}.grand{font-size:13px;font-weight:bold;border-top:2px solid #333!important}.words{font-size:9px;font-weight:bold}.terms{margin-top:3px}.terms td{line-height:1.2;padding:5px}.preterms{margin-top:5px}.preterms .words{margin:3px 0 5px;line-height:1.35}.signspace{height:25px;line-height:12px}.bottom{display:grid;grid-template-columns:50% 50%;page-break-inside:avoid;gap:8px;margin-top:5px}.bank,.sign{border:0;border-top:1px solid #777;padding:5px 2px;min-height:74px}.bank{line-height:1.5}.bankrow{display:flex;gap:6px;align-items:center}.bankrow div{font-size:8px;line-height:1.35}.qr{width:64px;height:64px;object-fit:contain}.sign{display:flex;flex-direction:column;justify-content:space-between;font-weight:normal;min-width:0}.auth{text-align:right;margin-top:0;font-weight:normal;font-size:9px}.thanks{text-align:center;font-weight:bold;border-top:1px solid #555;padding:5px;margin-top:0}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}.page{break-inside:avoid}.bottom,.terms,.summary,.sign{break-inside:avoid}}</style></head><body><table class="frame"><thead><tr><td></td></tr></thead><tbody><tr><td><div class="page"><div class="title">TAX INVOICE</div><table class="head"><tr><td style="width:24%;text-align:center">${brandLogo(d.workType, "logo")}</td><td style="width:43%"><div class="company">SHOP NO. 10, GHOLE COMPLEX, NEAR MHASKE PETROL PUMP,<br>BEED BYPASS ROAD, SATARA PARISAR,<br>CHH. SAMBHAJINAGAR - 431010<br>Phone: 9822990577<br>Email: vikas@ashwin.world<br><b>GSTIN: 27AEGPT6645A1ZF</b><br>State: 27-Maharashtra</div></td><td class="meta"><b>Invoice No.:</b> ${esc(d.no)}<br><b>Date:</b> ${esc(fmtDate(d.date))}<br><b>Place Of Supply:</b> 27-Maharashtra</td></tr></table><table class="bill"><tr><td><div class="billtitle">Bill To:</div><b>${esc(d.client)}</b><br>${esc(d.clientAddress || party.address || "")}<br>Contact No: ${esc(d.clientMobile || party.phone || "")}<br>GSTIN: <b>${esc(d.clientGstin || party.gstin || "Unregistered")}</b> &nbsp; State: 27-Maharashtra</td></tr></table><table class="items"><thead>${itemsHead}</thead><tbody>${rowsHtml}${blank}${itemsTotal}</tbody></table><div class="summary"><table class="taxbox"><tr><th>HSN Code</th><th>Taxable Amount (₹)</th><th>CGST Rate</th><th>CGST Amt (₹)</th><th>SGST Rate</th><th>SGST Amt (₹)</th><th>Total Tax (₹)</th></tr>${hsnRows}<tr><th>TOTAL</th><th>${taxable.toFixed(2)}</th><th></th><th>${half.toFixed(2)}</th><th></th><th>${(tax - half).toFixed(2)}</th><th>${tax.toFixed(2)}</th></tr></table><table class="totals"><tr><td>Sub Total</td><td>${money(d.subtotal)}</td></tr>${Number(d.discount || 0) ? `<tr><td>Discount</td><td>− ${money(d.discount)}</td></tr>` : ""}${Number(d.hamali || 0) ? `<tr><td>Hamali</td><td>${money(d.hamali)}</td></tr>` : ""}${Number(d.transport || 0) ? `<tr><td>Transport</td><td>${money(d.transport)}</td></tr>` : ""}<tr><td>Taxable Amount</td><td>${money(taxable)}</td></tr><tr><td>Tax (${rate}%)</td><td>${money(tax)}</td></tr><tr><td>Round Off</td><td>${money(roundOff)}</td></tr><tr class="grand"><td>Total</td><td>${money(total)}</td></tr><tr><td>Received</td><td>${money(received)}</td></tr><tr><td><b>Balance</b></td><td><b>${money(balance)}</b></td></tr></table></div><div class="spacer"></div><div class="preterms"><div class="words"><b>Invoice Amount in Words:</b><br>${amountInWords(total)}</div><table class="terms"><tr><td style="width:58%"><b>Terms & Conditions:</b><br>Make Your Payment Within 3 days from bill date.<br>Thanks for doing business with us!</td><td style="width:42%;vertical-align:middle;text-align:center"><b>Receiver’s Signature:</b><br><br>____________________________</td></tr></table></div><div class="bottom"><div class="bank"><b>Bank Details / Scan to Pay:</b><div class="bankrow"><img class="qr" src="${qr}" alt="UPI payment QR"><div>Bank: ICICI BANK LIMITED, AURANGABAD<br>Account No.: 110505002754<br>IFSC: ICIC0006970<br>Account Name: ASHWIN ENTERPRISES<br>UPI ID: ashwinenterprises@icici<br><b>QR Amount: ${money(total)}</b></div></div></div><div class="sign"><div style="text-align:right;margin-top:auto"><div style="font-weight:bold">For ASHWIN ENTERPRISES</div><div class="signspace">&nbsp;<br>&nbsp;</div><div class="auth">Authorized Signatory</div></div></div></div><div class="thanks">THANK YOU FOR DOING BUSINESS WITH US!</div></div></td></tr></tbody><tfoot><tr><td></td></tr></tfoot></table></body></html>`;
  return { html, title: "Tax Invoice " + d.no, opts: { widthMm: 210, fit: PIN_PAGE } as PrintOptions };
}

export function printTaxInvoice(d: PrintDoc, lines: EstimateLine[], party: PrintParty) {
  const b = buildTaxInvoice(d, lines, party);
  printHtmlInFrame(b.html, { title: b.title, ...b.opts });
}


// ------------------------------------------------------------ Bill of Supply (Non-GST, ARNAV GLASS SERVICES)
export function buildBillOfSupply(d: PrintDoc, saved: EstimateLine[]) {
  const lines = mergeForPrint(saved);
  const inr = (n: unknown) => "₹ " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dmy = (x: unknown) => String(x ?? "").split("-").reverse().join("-");
  const sizeOf = (l: EstimateLine) => sizeInFeet(l);
  const fees = isFeeBill(d.workType, lines);
  const rows = lines
    .map((l, i) =>
      fees
        ? `<tr><td class="c">${i + 1}</td><td class="sl">${esc(l.productType || "")}</td><td class="r sl">${inr(l.amount)}</td></tr>`
        : `<tr><td class="c">${i + 1}</td><td class="sl">${esc(l.productType || "")}</td><td class="c sl">${esc(sizeOf(l))}</td><td class="c sl">${l.lumpSum ? "" : `${Number(l.qty || 0)} Nos.`}</td><td class="c sl">${l.lumpSum ? "" : `${Number(l.sqft || 0).toFixed(2)} Sq.ft.`}</td><td class="r sl">${inr(l.rate)}</td><td class="r sl">${inr(l.amount)}</td></tr>`
    )
    .join("");
  const itemsTable = fees
    ? `<table class="items bos"><colgroup><col style="width:9%"><col><col style="width:24%"></colgroup>
<thead><tr><th>Sr. No.</th><th class="sl">Description</th><th class="sl">Amount</th></tr></thead>
<tbody>${rows}<tr class="fill"><td class="spacer" style="height:${Math.max(0, 19 - lines.length) * 5.6}mm"></td><td class="sl"></td><td class="sl"></td></tr></tbody></table>`
    : `<table class="items bos"><colgroup><col style="width:7%"><col style="width:29%"><col style="width:13%"><col style="width:9%"><col style="width:12%"><col style="width:15%"><col style="width:15%"></colgroup>
<thead><tr><th>Sr. No.</th><th class="sl">Description</th><th class="sl">Size</th><th class="sl">Qty</th><th class="sl">Area</th><th class="sl">Rate</th><th class="sl">Amount</th></tr></thead>
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
    (adv ? trow("Advance", inr(adv)) : "") +
    trow("Balance", inr(bal), true);
  const logo = arnavLogoUrl();

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc((d.client ? d.client + " " : "") + d.no)}</title><style>
@page{size:A4 portrait;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0}:root{--fs:10px;--ink:#222}
body{font:var(--fs) Georgia,'Times New Roman',serif;color:var(--ink)}
.frame{width:100%;border-collapse:collapse;border:0}.frame>thead>tr>td,.frame>tfoot>tr>td{height:12.7mm;padding:0;border:0}.frame>tbody>tr>td{padding:0 12.7mm;border:0;vertical-align:top}
.hd{width:100%;border-collapse:collapse;border-bottom:1.5px solid #222}.hd td{padding:0 0 4px;vertical-align:bottom}.addr{font-size:11px;line-height:1.5}.hd img{width:150px;height:auto;display:block;margin-left:auto}
.ttl{text-align:right;font-size:13px;letter-spacing:.6px;margin:14px 0 8px;font-weight:bold}
.to{line-height:1.5;margin-top:4px}.to .nm{font-size:13px;font-weight:bold;margin-left:14px}.to .st{margin-left:14px}
.meta{text-align:right;line-height:1.5;margin:8px 0 3px}
table.items{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #222;table-layout:fixed}.items th{border-bottom:1px solid #222;padding:4px 3px;font-weight:normal;font-size:12px}.items td{padding:2.5px 4px;border:0;vertical-align:top}
.items .sl{border-left:1px solid #222}.c{text-align:center}.r{text-align:right;white-space:nowrap}.items tr.fill td{padding:0}
.bot{width:100%;border-collapse:collapse;border:1px solid #222;border-top:0;break-inside:avoid}.bot>tbody>tr>td{vertical-align:top;padding:0}.acc{padding:3px 4px!important;line-height:1.5;font-size:11px}
.tot{width:100%;border-collapse:collapse}.tot td{border:1px solid #222;padding:2px 6px;font-size:11px}.tot tr:first-child td{border-top:0}.tot td:first-child{border-left:1px solid #222;text-align:center}.tot td:last-child{border-right:0}.tot tr.b td{font-weight:bold}.tot tr:last-child td{border-bottom:0}
.sign{margin-top:16px;text-align:right;break-inside:avoid}.sign img{height:34px;width:auto;vertical-align:middle;margin-left:6px}.sign .gap{height:46px}.sign b{font-size:11px}
</style></head><body><table class="frame"><thead><tr><td></td></tr></thead><tbody><tr><td><div class="page">
<table class="hd"><tr><td class="addr">Shop no. 8-9, Ghole Complex, Near<br>Mhaske Petrol Pump, Beed Bypass Road,<br>Ch. Sambhajinagar. 431002. 09665343737<br>ashwin.enterrprises@gmail.com</td><td style="width:170px"><img width="491" height="164" src="${logo}"></td></tr></table>
<div class="ttl">BILL OF SUPPLY</div>
<div class="to">To,<div class="nm">${esc(d.client)}</div><div class="st">${esc(d.siteName || "")}</div></div>
<div class="meta">Bill No. <b>${esc(d.no)}</b><br>Date :- <b>${esc(dmy(d.date))}</b></div>
${itemsTable}
<table class="bot"><tr><td class="acc" style="width:62%">Account Name:- ARNAV GLASS SERVICES<br>Bank Name:- HDFC Bank Ltd., Beed bypass road, ch. Sambhajinagar.<br>Account number:-50200061793113<br>IFS code:- HDFC0009426</td><td><table class="tot">${totals}</table></td></tr></table>
<div class="sign"><b>For</b> <img width="491" height="164" src="${logo}"><div class="gap"></div><b>Authorised Signatory</b></div>
</div></td></tr></tbody><tfoot><tr><td></td></tr></tfoot></table></body></html>`;
  return { html, title: (d.client ? d.client + " " : "") + d.no, opts: { widthMm: 210, fit: PIN_PAGE } as PrintOptions };
}

export function printBillOfSupply(d: PrintDoc, lines: EstimateLine[]) {
  const b = buildBillOfSupply(d, lines);
  printHtmlInFrame(b.html, { title: b.title, ...b.opts });
}

/** GST invoices print as the ASHWIN ENTERPRISES Tax Invoice; Non-GST as the ARNAV GLASS SERVICES Bill of Supply. */
export function printInvoiceDocument(d: PrintDoc, lines: EstimateLine[], party: PrintParty) {
  if (d.type === "Non-GST") printBillOfSupply(d, lines);
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
          return `<tr><td>${esc(fmtDate(r.date))}</td><td>${esc(r.particulars)}</td><td class="n">${r.debit ? f(r.debit) : ""}</td><td class="n">${r.credit ? f(r.credit) : ""}</td><td class="n">${f(run)}</td></tr>`;
        })
        .join("")
    : '<tr><td colspan="5" style="text-align:center;padding:14px">No transactions</td></tr>';

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(party.name)} Ledger</title><style>
@page{size:A4 portrait;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#111}
.frame{width:100%;border-collapse:collapse;border:0}.frame>thead>tr>td,.frame>tfoot>tr>td{height:12.7mm;padding:0;border:0}.frame>tbody>tr>td{padding:0 12.7mm;border:0;vertical-align:top}
.hd{width:100%;border-collapse:collapse}.hd td{padding:0;border:0;vertical-align:top}.logo{width:150px;height:auto;display:block}.ttl{text-align:right}.ttl h1{margin:2mm 0 8px;font-size:20px;text-decoration:underline;letter-spacing:.3px}.ttl div{margin-top:3px;font-size:12px}
.party{margin-top:14px;line-height:1.55}.party .pn{font-size:15px;font-weight:bold}
table.led{width:100%;border-collapse:collapse;margin-top:14px;font-size:11px}table.led th,table.led td{border:1px solid #555;padding:5px 6px;vertical-align:top}table.led th{background:#eee;text-align:left}table.led .n,table.led th.n{text-align:right;white-space:nowrap}
table.led thead{display:table-header-group}table.led tr{break-inside:avoid;page-break-inside:avoid}table.led tr.tot td{font-weight:bold;background:#f5f5f5}
</style></head><body><table class="frame"><thead><tr><td></td></tr></thead><tbody><tr><td>
<table class="hd"><tr><td><img class="logo" width="300" height="138" src="${logoUrl()}"></td><td class="ttl"><h1>PARTY LEDGER</h1><div><b>Date:</b> ${today}</div></td></tr></table>
<div class="party"><div class="pn">${esc(party.name)}</div>${party.phone ? `<div>Mobile: ${esc(party.phone)}</div>` : ""}${party.address ? `<div>Address: ${esc(party.address)}</div>` : ""}</div>
<table class="led"><thead><tr><th style="width:12%">Date</th><th>Particulars</th><th class="n" style="width:16%">Debit</th><th class="n" style="width:16%">Credit</th><th class="n" style="width:17%">Balance</th></tr></thead><tbody>${body}<tr class="tot"><td colspan="2">Total / Closing Balance</td><td class="n">${f(td)}</td><td class="n">${f(tc)}</td><td class="n">${f(run)}</td></tr></tbody></table>
</td></tr></tbody><tfoot><tr><td></td></tr></tfoot></table></body></html>`;
  printHtmlInFrame(html, { title: `${party.name} Ledger`, widthMm: 210 });
}
