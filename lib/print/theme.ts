// Print look for Ashwin's documents. One shared row in the DB (see print_settings); the dashboard layout
// hands it to the browser through <PrintThemeProvider>, and the print templates read it here.

export type InvoiceLayout = "classic" | "divine";

export type PrintTheme = {
  /** Tax Invoice layout: the original boxed one, or the coloured "Divine" header layout. */
  invoiceLayout: InvoiceLayout;
  /** Main colour: header bar, table header, headings, total rows. */
  accent: string;
  /** Second colour: the header's logo panel. */
  accent2: string;
};

export const DEFAULT_PRINT_THEME: PrintTheme = { invoiceLayout: "divine", accent: "#f7941d", accent2: "#1c3f94" };

/** Colour pairs offered in Settings. */
export const THEME_PRESETS: { name: string; accent: string; accent2: string }[] = [
  { name: "Orange & Navy", accent: "#f7941d", accent2: "#1c3f94" },
  { name: "Magenta & Navy", accent: "#8e1f7a", accent2: "#1c3f94" },
  { name: "Navy & Gold", accent: "#1c3f94", accent2: "#c9971c" },
  { name: "Green & Charcoal", accent: "#1f8a5b", accent2: "#2b2f36" },
];

const HEX = /^#[0-9a-f]{6}$/i;

export function normalizeTheme(raw: Partial<Record<keyof PrintTheme, unknown>> | null | undefined): PrintTheme {
  const d = DEFAULT_PRINT_THEME;
  return {
    invoiceLayout: raw?.invoiceLayout === "classic" ? "classic" : raw?.invoiceLayout === "divine" ? "divine" : d.invoiceLayout,
    accent: typeof raw?.accent === "string" && HEX.test(raw.accent) ? raw.accent.toLowerCase() : d.accent,
    accent2: typeof raw?.accent2 === "string" && HEX.test(raw.accent2) ? raw.accent2.toLowerCase() : d.accent2,
  };
}

let current: PrintTheme = DEFAULT_PRINT_THEME;
export const getPrintTheme = () => current;
export const setPrintTheme = (t: PrintTheme) => {
  current = t;
};
