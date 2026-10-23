"use client";

import { Phone, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { buildWhatsappLink, buildWhatsappMessage, isValidWhatsappNumber } from "@/lib/whatsapp";
import type { LastTxn, WhatsappContact } from "@/lib/actions/whatsapp";

/**
 * Call + WhatsApp icon buttons for a list row. The WhatsApp message follows the
 * party's latest transaction (payment received / paid / refund / balance reminder).
 */
export function QuickContactActions({
  id,
  name,
  phone,
  balance,
  category,
  lastTxn,
  brand,
}: {
  id: string;
  name: string;
  phone: string | null;
  balance: number;
  category: WhatsappContact["category"];
  lastTxn?: LastTxn | null;
  brand?: string;
}) {
  if (!phone) {
    return <span className="text-xs text-[var(--text-muted)]">No phone</span>;
  }

  const message = buildWhatsappMessage({ id, name, phone, balance, category, lastTxn, brand });

  function openWhatsapp(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isValidWhatsappNumber(phone)) {
      toast.error("Invalid mobile number. Check the number on the party's page.");
      return;
    }
    if (!message) {
      toast.info("No outstanding balance or relevant payment/refund transaction found. No message was opened.");
      return;
    }
    window.open(buildWhatsappLink(phone!, message), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex items-center justify-center gap-1.5">
      <a
        href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
        onClick={(e) => e.stopPropagation()}
        className="size-7 rounded-full flex items-center justify-center text-[var(--accent-blue)] hover:bg-blue-50 transition-colors"
        title="Call"
      >
        <Phone className="size-3.5" />
      </a>
      <button
        type="button"
        onClick={openWhatsapp}
        className="size-7 rounded-full flex items-center justify-center text-[var(--accent-green)] hover:bg-emerald-50 transition-colors"
        title="WhatsApp"
      >
        <MessageCircle className="size-3.5" />
      </button>
    </div>
  );
}
