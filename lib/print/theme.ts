// Print look for Ashwin's documents. One shared row in the DB (see print_settings); the dashboard layout
// hands it to the browser through <PrintThemeProvider>, and the print templates read it here.

export type InvoiceLayout = "classic" | "divine";

/** Blocks of the Tax Invoice that can be switched off. Everything is on by default. */
export type InvoiceToggles = {
  terms: boolean;
  words: boolean;
  hsn: boolean;
  bank: boolean;
  qr: boolean;
  signature: boolean;
  thanks: boolean;
};

export const TOGGLE_LABELS: { key: keyof InvoiceToggles; label: string; hint: string }[] = [
  { key: "words", label: "Amount in words", hint: "“Fourteen Thousand … Rupees only”" },
  { key: "hsn", label: "HSN tax summary", hint: "Table of HSN codes with CGST / SGST" },
  { key: "bank", label: "Bank details", hint: "Account name, number, IFSC and UPI ID" },
  { key: "qr", label: "UPI payment QR", hint: "Scan-to-pay code for the invoice total" },
  { key: "terms", label: "Terms & conditions", hint: "Payment terms line" },
  { key: "signature", label: "Signatures", hint: "Receiver’s signature and Authorised Signatory" },
  { key: "thanks", label: "Thank-you line", hint: "“Thank you for doing business with us!” at the bottom" },
];

export const DEFAULT_TOGGLES: InvoiceToggles = { terms: true, words: true, hsn: true, bank: true, qr: true, signature: true, thanks: true };

export type PrintTheme = {
  /** Tax Invoice layout: the original boxed one, or the coloured "Divine" header layout. */
  invoiceLayout: InvoiceLayout;
  /** Main colour: header bar, table header, headings, total rows. */
  accent: string;
  /** Second colour: the header's logo panel. */
  accent2: string;
  /** Tax Invoice blocks to show. */
  invoice: InvoiceToggles;
};

export const DEFAULT_PRINT_THEME: PrintTheme = { invoiceLayout: "divine", accent: "#f7941d", accent2: "#1c3f94", invoice: DEFAULT_TOGGLES };

/** Colour pairs offered in Settings. */
export const THEME_PRESETS: { name: string; accent: string; accent2: string }[] = [
  { name: "Orange & Navy", accent: "#f7941d", accent2: "#1c3f94" },
  { name: "Magenta & Navy", accent: "#8e1f7a", accent2: "#1c3f94" },
  { name: "Navy & Gold", accent: "#1c3f94", accent2: "#c9971c" },
  { name: "Green & Charcoal", accent: "#1f8a5b", accent2: "#2b2f36" },
];

const HEX = /^#[0-9a-f]{6}$/i;

/** Unknown or missing switches stay on, so a partly saved value never hides anything by accident. */
export function normalizeToggles(raw: unknown): InvoiceToggles {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out = { ...DEFAULT_TOGGLES };
  for (const k of Object.keys(out) as (keyof InvoiceToggles)[]) if (src[k] === false) out[k] = false;
  return out;
}

export function normalizeTheme(raw: Partial<Record<keyof PrintTheme, unknown>> | null | undefined): PrintTheme {
  const d = DEFAULT_PRINT_THEME;
  return {
    invoiceLayout: raw?.invoiceLayout === "classic" ? "classic" : raw?.invoiceLayout === "divine" ? "divine" : d.invoiceLayout,
    accent: typeof raw?.accent === "string" && HEX.test(raw.accent) ? raw.accent.toLowerCase() : d.accent,
    accent2: typeof raw?.accent2 === "string" && HEX.test(raw.accent2) ? raw.accent2.toLowerCase() : d.accent2,
    invoice: normalizeToggles(raw?.invoice),
  };
}

let current: PrintTheme = DEFAULT_PRINT_THEME;
export const getPrintTheme = () => current;
export const setPrintTheme = (t: PrintTheme) => {
  current = t;
};
