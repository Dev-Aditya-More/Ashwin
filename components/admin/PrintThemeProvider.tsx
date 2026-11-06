"use client";

import { setPrintTheme, type PrintTheme } from "@/lib/print/theme";

/** Hands the saved print look to the print templates (which run in the browser). Renders nothing. */
export function PrintThemeProvider({ theme }: { theme: PrintTheme }) {
  // Set during render so the very first print after a page load already uses the saved look.
  setPrintTheme(theme);
  return null;
}
