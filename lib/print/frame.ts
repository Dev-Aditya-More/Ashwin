// Prints an HTML document through a hidden iframe so the preview opens on top of the
// current page (no new tab/popup). Closing the preview leaves the app exactly as it was.

export const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const fmt = (n: unknown) =>
  (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const money = (n: unknown) => "₹" + fmt(n);

export const fmtDate = (d: unknown) => String(d ?? "").split("-").reverse().join("/");

export const logoUrl = () => `${window.location.origin}/ashwin-print-logo.png`;
export const civilLogoUrl = () => `${window.location.origin}/ashwin-civil-logo.png`;
export const arnavLogoUrl =() => `${window.location.origin}/arnav-logo.png`;

export type FitOptions = {
  /** The block whose height is measured (inside the 12.7 mm margin frame). */
  content: string;
  /** Empty element (div or table cell) stretched so the content ends exactly at the bottom of its last page. */
  spacer: string;
  /** Printable height of one page between the repeated top/bottom margins, in mm. */
  usableMm: number;
  /** Element repeated at the top of every continuation page (e.g. a table header); its height is reserved per extra page. */
  repeat?: string;
  /** Page width the document is laid out for; fitting is skipped if the frame is not actually that wide. */
  widthMm?: number;
};

/**
 * Pins the bottom section of a document to the bottom of its LAST page, however many
 * pages the document runs to: measure the content, work out how many pages it needs,
 * and stretch the spacer so the blocks after it land at the page foot.
 * Self-contained on purpose (no closures) so it can also be injected into a test page.
 */
export function fitPages(d: Document, o: FitOptions) {
  const content = d.querySelector(o.content) as HTMLElement | null;
  const spacer = d.querySelector(o.spacer) as HTMLElement | null;
  if (!content || !spacer) return;
  // Phones/tablets can lay the frame out at a different width than the printed page; measuring
  // then would give a wrong answer (and push the footer onto a second page), so leave the
  // layout-independent CSS fallback in charge.
  if (o.widthMm) {
    const wantPx = (o.widthMm * 96) / 25.4;
    // innerWidth includes any scrollbar; phones lay out at ~400px, far from a 794px page.
    const have = d.defaultView?.innerWidth ?? d.documentElement.clientWidth;
    if (Math.abs(have - wantPx) > 30) return;
  }
  // Measure the content at its natural size (drop the CSS one-page minimum used as the fallback).
  content.style.minHeight = "0px";
  spacer.style.flex = "0 0 auto";
  spacer.style.height = "0px";
  const usable = (o.usableMm * 96) / 25.4;
  const natural = content.getBoundingClientRect().height;
  // The small allowance covers rows that jump to the next page instead of splitting.
  const rep = o.repeat ? (d.querySelector(o.repeat) as HTMLElement | null)?.getBoundingClientRect().height ?? 0 : 0;
  // Row heights are snapped differently when printing, so the error grows with the document: keep ~1.2% slack.
  const slack = 14 + natural * 0.012;
  let pages = Math.max(1, Math.ceil((natural + slack + 6) / usable));
  while (natural + (pages - 1) * rep + slack + 6 > pages * usable) pages++;
  spacer.style.height = Math.max(0, pages * usable - natural - (pages - 1) * rep - slack) + "px";
}

const ZWSP = "\u200B";

/**
 * Viewers recognise phone numbers / e-mail addresses in a PDF's text and make them tappable.
 * An invisible zero-width space inside long digit runs and after "@" stops that without
 * changing how anything looks on paper.
 */
function neutraliseLinks(d: Document) {
  const walker = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const n of nodes) {
    const v = n.nodeValue ?? "";
    const next = v
      .replace(/\d{6,}/g, (m) => m.slice(0, 5) + ZWSP + m.slice(5))
      .replace(/@/g, "@" + ZWSP);
    if (next !== v) n.nodeValue = next;
  }
}

export type PrintOptions = { title?: string; widthMm?: number; fit?: FitOptions };

export type CapturedDocument = { html: string; opts: PrintOptions };
let capturing: ((doc: CapturedDocument) => void) | null = null;

/**
 * Runs a print function but, instead of opening the print preview, hands back the document it
 * would have printed — so the same templates also produce shareable PDFs.
 */
export function captureDocument(run: () => void): CapturedDocument | null {
  let doc: CapturedDocument | null = null;
  capturing = (d) => {
    doc = d;
  };
  try {
    run();
  } finally {
    capturing = null;
  }
  return doc;
}

/** Strip scripts and add the device-independence / no-auto-link head tags every document gets. */
export function prepareHtml(rawHtml: string): string {
  // Stop phones/PDF viewers turning phone numbers, e-mails and dates into tappable links.
  return String(rawHtml)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(
      /<head>/i,
      '<head><meta name="format-detection" content="telephone=no,date=no,address=no,email=no">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1">' +
        // Never let a logo, long word or wide table push past the page edge on any device.
        "<style>img{max-width:100%}table{max-width:100%}td,th{overflow-wrap:anywhere}" +
        "@media print{html{-webkit-text-size-adjust:100%;text-size-adjust:100%}}</style>"
    );
}

export function printHtmlInFrame(rawHtml: string, titleOrOpts?: string | PrintOptions) {
  const opts: PrintOptions = typeof titleOrOpts === "string" ? { title: titleOrOpts } : titleOrOpts ?? {};
  const title = opts.title;
  if (capturing) {
    // Someone asked for this document as a file (Share → PDF) instead of a print preview.
    capturing({ html: rawHtml, opts });
    return;
  }
  const html = prepareHtml(rawHtml);
  document.getElementById("printFrame")?.remove();

  const f = document.createElement("iframe");
  f.id = "printFrame";
  f.setAttribute("aria-hidden", "true");
  f.style.cssText =
    `position:fixed;left:-12000px;top:0;width:${opts.widthMm ?? 210}mm;height:1123px;border:0;opacity:0;pointer-events:none`;
  document.body.appendChild(f);

  const prevTitle = document.title;
  let restored = false;
  const restore = () => {
    if (restored) return;
    restored = true;
    document.title = prevTitle;
    setTimeout(() => f.remove(), 300);
  };

  try {
    const win = f.contentWindow!;
    const d = win.document;
    d.open();
    d.write(html);
    d.close();
    neutraliseLinks(d);
    document.title = title || prevTitle;
    win.addEventListener("afterprint", restore);
    window.addEventListener("afterprint", restore, { once: true });

    let fired = false;
    const go = () => {
      if (fired) return;
      fired = true;
      try {
        if (opts.fit) fitPages(d, opts.fit);
        win.focus();
        win.print();
      } catch (e) {
        restore();
        alert("Print failed: " + (e as Error).message);
      }
      setTimeout(restore, 60000);
    };

    // Wait for the logo / UPI QR before opening the print preview.
    const pending = Array.from(d.images).filter((i) => !i.complete);
    if (!pending.length) setTimeout(go, 50);
    else {
      let n = pending.length;
      const one = () => {
        if (--n <= 0) setTimeout(go, 50);
      };
      pending.forEach((i) => {
        i.onload = one;
        i.onerror = one;
      });
      setTimeout(go, 1800);
    }
  } catch (e) {
    restore();
    alert("Print failed: " + (e as Error).message);
  }
}
