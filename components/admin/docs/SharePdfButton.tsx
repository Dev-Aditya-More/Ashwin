"use client";

import { useState } from "react";
import { Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { makePdf, shareFile } from "@/lib/print/pdf";

/**
 * Shares the document as a PDF file (WhatsApp, e-mail… via the device share sheet).
 * Devices without file sharing get the PDF downloaded instead, ready to attach.
 */
export function SharePdfButton({
  print,
  title,
  label = "Share",
  compact = false,
  className,
}: {
  /** The same function the Print button uses — its output becomes the PDF. */
  print: () => void;
  /** PDF file name (without .pdf), e.g. "Amol Chothre E-2026-27/002". */
  title: string;
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function share() {
    setBusy(true);
    try {
      const file = await makePdf(print, title);
      const outcome = await shareFile(file);
      if (outcome === "downloaded") toast.success("PDF downloaded — attach it in WhatsApp or e-mail.");
      if (outcome === "needs-tap") {
        // The browser wants a fresh tap to open the share sheet.
        toast("PDF ready", {
          duration: 15000,
          action: { label: "Share PDF", onClick: () => void shareFile(file) },
        });
      }
    } catch (err) {
      toast.error((err as Error)?.message || "Couldn't create the PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={share} disabled={busy} title="Share as PDF" className={className}>
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Share2 className="size-3.5" />}
      {!compact && (busy ? "Making PDF…" : label)}
    </Button>
  );
}
