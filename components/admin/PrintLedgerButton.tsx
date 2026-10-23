"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { printLedger, type LedgerPrintRow, type PrintParty } from "@/lib/print/documents";

/** Opens the print preview for a clean party ledger (logo, party block, running balance, closing total). */
export function PrintLedgerButton({ party, rows }: { party: PrintParty; rows: LedgerPrintRow[] }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={() => printLedger(party, rows)}>
      <Printer className="size-4" /> Print Ledger
    </Button>
  );
}
