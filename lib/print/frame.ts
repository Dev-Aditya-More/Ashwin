// Prints an HTML document through a hidden iframe so the preview opens on top of the
// current page (no new tab/popup). Closing the preview leaves the app exactly as it was.

export const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const fmt = (n: unknown) =>
  (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const money = (n: unknown) => "₹" + fmt(n);

export const fmtDate = (d: unknown) => String(d ?? "").split("-").reverse().join("/");

export const logoUrl = () => `${window.location.origin}/ashwin-print-logo.png`;

export function printHtmlInFrame(rawHtml: string, title?: string) {
  const html = String(rawHtml).replace(/<script[\s\S]*?<\/script>/gi, "");
  document.getElementById("printFrame")?.remove();

  const f = document.createElement("iframe");
  f.id = "printFrame";
  f.setAttribute("aria-hidden", "true");
  f.style.cssText =
    "position:fixed;left:-12000px;top:0;width:1123px;height:1123px;border:0;visibility:hidden;pointer-events:none";
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
    document.title = title || prevTitle;
    win.addEventListener("afterprint", restore);
    window.addEventListener("afterprint", restore, { once: true });

    let fired = false;
    const go = () => {
      if (fired) return;
      fired = true;
      try {
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
