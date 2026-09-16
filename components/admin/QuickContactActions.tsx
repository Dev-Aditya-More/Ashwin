"use client";

import { Phone, MessageCircle } from "lucide-react";
import { buildWhatsappLink, buildWhatsappMessage } from "@/lib/whatsapp";
import type { WhatsappContact } from "@/lib/actions/whatsapp";

/** Call + WhatsApp icon buttons for a list row — reuses the same reminder-message logic as the WhatsApp page. */
export function QuickContactActions({
  id,
  name,
  phone,
  balance,
  category,
}: {
  id: string;
  name: string;
  phone: string | null;
  balance: number;
  category: WhatsappContact["category"];
}) {
  if (!phone) {
    return <span className="text-xs text-[var(--text-muted)]">No phone</span>;
  }

  const message = buildWhatsappMessage({ id, name, phone, balance, category });

  return (
    <div className="flex items-center justify-center gap-1.5">
      <a
        href={`tel:${phone}`}
        onClick={(e) => e.stopPropagation()}
        className="size-7 rounded-full flex items-center justify-center text-[var(--accent-blue)] hover:bg-blue-50 transition-colors"
        title="Call"
      >
        <Phone className="size-3.5" />
      </a>
      <a
        href={buildWhatsappLink(phone, message)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="size-7 rounded-full flex items-center justify-center text-[var(--accent-green)] hover:bg-emerald-50 transition-colors"
        title="WhatsApp"
      >
        <MessageCircle className="size-3.5" />
      </a>
    </div>
  );
}
