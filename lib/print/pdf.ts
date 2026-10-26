// Turns any print template into a real PDF file in the browser (no server, no print dialog),
// so documents can be shared straight to WhatsApp / e-mail as a PDF attachment.

import { captureDocument, prepareHtml, type CapturedDocument } from "@/lib/print/frame";

const PX_PER_MM = 96 / 25.4;
const MARGIN_MM = 12.7; // same 0.5 inch margin the printed documents use

/** "Amol Chothre E-2026-27/002" → a safe file name ending in .pdf */
export function pdfName(title: string): string {
  return `${title.replace(/[\\/:*?"<>|]+/g, "_").replace(/\s+/g, " ").trim() || "document"}.pdf`;
}

async function waitForImages(d: Document) {
  const pending = Array.from(d.images).filter((i) => !i.complete);
  await Promise.race([
    Promise.all(pending.map((i) => new Promise((r) => { i.onload = r; i.onerror = r; }))),
    new Promise((r) => setTimeout(r, 4000)),
  ]);
}

/** Render a captured document to an A4 PDF (portrait, or landscape for wide documents). */
export async function documentToPdf({ html, opts }: CapturedDocument, fileName: string): Promise<File> {
  const [{ jsPDF }, html2canvas] = await Promise.all([
    import("jspdf"),
    import("html2canvas").then((m) => m.default),
  ]);

  const landscape = (opts.widthMm ?? 210) > 250;
  const pageW = landscape ? 297 : 210;
  const pageH = landscape ? 210 : 297;
  const pageWpx = Math.round(pageW * PX_PER_MM);
  const pageHpx = Math.round(pageH * PX_PER_MM);

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = `position:fixed;left:-20000px;top:0;width:${pageWpx}px;height:${pageHpx}px;border:0;opacity:0;pointer-events:none`;
  document.body.appendChild(frame);

  try {
    const d = frame.contentWindow!.document;
    d.open();
    d.write(prepareHtml(html));
    d.close();
    // html2canvas draws collapsed table borders twice; single 1px lines look the same as on paper.
    // The quotation's footer is "fixed to the page bottom" for printing; in a PDF it becomes a normal
    // block that the spacer below pushes to the foot of the last page.
    const fix = d.createElement("style");
    fix.textContent =
      // (The Bill of Supply grid, .items.bos, already draws single column lines and is left alone.)
      ".doc-table,.fee-table,.items:not(.bos){border-collapse:separate!important;border-spacing:0!important;border-top:1px solid #777;border-left:1px solid #777}" +
      ".doc-table th,.doc-table td,.fee-table th,.fee-table td,.items:not(.bos) th,.items:not(.bos) td{border-width:0 1px 1px 0!important}" +
      `.isq .bottom{position:static!important;margin:0 ${MARGIN_MM}mm!important;padding-bottom:${MARGIN_MM}mm!important}` +
      ".isq .frame>tfoot>tr>td{height:0!important}";
    d.head.appendChild(fix);
    let spacer: HTMLElement | null = null;
    if (opts.fit) {
      const content = d.querySelector(opts.fit.content) as HTMLElement | null;
      if (content) content.style.minHeight = "0px";
      spacer = d.querySelector(opts.fit.spacer) as HTMLElement | null;
    } else {
      const footer = d.querySelector(".isq .bottom");
      if (footer) {
        spacer = d.createElement("div");
        footer.parentNode!.insertBefore(spacer, footer);
      }
    }
    if (spacer) {
      spacer.style.flex = "0 0 auto";
      spacer.style.height = "0px";
    }
    await waitForImages(d);

    const marginCss = MARGIN_MM * PX_PER_MM;
    const measure = () => {
      const rows: Span[] = Array.from(d.querySelectorAll("tr"))
        .filter((tr) => !tr.querySelector("tr")) // real table rows, not the layout rows wrapping the page
        .map((tr) => {
          const r = tr.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom };
        });
      const total = Math.ceil(d.body.getBoundingClientRect().height);
      const keepFrom = spacer ? spacer.getBoundingClientRect().bottom : null;
      return { rows, total, keepFrom };
    };

    // 1) Work out where the pages break; 2) stretch the spacer so the bottom block fills the last page.
    let m = measure();
    let slices = paginate(m.total, m.rows, pageHpx, marginCss, m.keepFrom);
    // Growing the spacer can move a page break, so settle it in a few passes.
    for (let pass = 0; spacer && pass < 5; pass++) {
      const last = slices[slices.length - 1];
      const room = pageHpx - (slices.length === 1 ? 0 : marginCss);
      const gap = Math.floor(last[0] + room - m.total - 2);
      if (Math.abs(gap) < 1) break;
      spacer.style.height = `${Math.max(0, (parseFloat(spacer.style.height) || 0) + gap)}px`;
      m = measure();
      slices = paginate(m.total, m.rows, pageHpx, marginCss, m.keepFrom);
    }
    frame.style.height = `${Math.max(m.total, pageHpx)}px`;
    await new Promise((r) => requestAnimationFrame(() => r(null)));

    const scale = 2;
    const canvas = await html2canvas(d.body, {
      scale,
      useCORS: true,
      backgroundColor: "#ffffff",
      width: pageWpx,
      height: m.total,
      windowWidth: pageWpx,
      windowHeight: Math.max(m.total, pageHpx),
      logging: false,
    });

    const pdf = new jsPDF({ orientation: landscape ? "landscape" : "portrait", unit: "mm", format: "a4" });
    slices.forEach(([start, end], page) => {
      const sy = Math.round(start * scale);
      const sh = Math.max(1, Math.min(canvas.height, Math.round(end * scale)) - sy);
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = sh;
      slice.getContext("2d")!.drawImage(canvas, 0, sy, canvas.width, sh, 0, 0, canvas.width, sh);
      if (page > 0) pdf.addPage();
      // Page 1 carries its own top margin; later pages get one added.
      const topMm = page === 0 ? 0 : MARGIN_MM;
      pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", 0, topMm, pageW, sh / scale / PX_PER_MM);
    });

    return new File([pdf.output("blob")], fileName, { type: "application/pdf" });
  } finally {
    frame.remove();
  }
}

type Span = { top: number; bottom: number };

/**
 * Splits a document `total` px tall into page slices [start, end]. Page 1 starts with the document's
 * own top margin; every later page gets a margin added on top, and every page but the last keeps one
 * at the bottom. Cuts fall between table rows (or through a tall empty filler row), and everything
 * from `keepFrom` on (the bottom block) stays together on one page.
 */
function paginate(total: number, rows: Span[], pageH: number, margin: number, keepFrom: number | null) {
  const slices: [number, number][] = [];
  let y = 0;
  while (y < total - 1 && slices.length < 60) {
    const top = slices.length === 0 ? 0 : margin;
    let end: number;
    if (y + pageH - top >= total) {
      end = total; // everything left fits: last page
    } else {
      const room = pageH - top - margin;
      end = y + room;
      if (keepFrom !== null && keepFrom > y + 1 && end > keepFrom) {
        end = keepFrom; // don't split the bottom block
      } else {
        const crossing = rows.find((r) => r.top < end && r.bottom > end);
        const tallFiller = crossing && crossing.bottom - crossing.top > 150;
        if (!tallFiller) {
          const brk = rows
            .map((r) => r.bottom)
            .filter((b) => b > y + room * 0.5 && b <= end)
            .sort((a, b) => a - b)
            .pop();
          if (brk) end = brk;
        }
      }
    }
    slices.push([y, end]);
    y = end;
  }
  return slices;
}

export type ShareOutcome = "shared" | "cancelled" | "downloaded" | "needs-tap";

/** Share a file via the device share sheet; fall back to downloading it. */
export async function shareFile(file: File, text?: string): Promise<ShareOutcome> {
  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name.replace(/\.pdf$/, ""), text });
      return "shared";
    } catch (err) {
      const name = (err as Error)?.name;
      if (name === "AbortError") return "cancelled";
      // Some browsers only allow sharing straight after a tap; making the PDF took too long.
      if (name === "NotAllowedError") return "needs-tap";
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return "downloaded";
}

/** Build the PDF of whatever `print` would print. */
export async function makePdf(print: () => void, title: string): Promise<File> {
  const doc = captureDocument(print);
  if (!doc) throw new Error("Nothing to share.");
  return documentToPdf(doc, pdfName(title));
}
