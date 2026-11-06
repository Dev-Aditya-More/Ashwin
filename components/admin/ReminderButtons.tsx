"use client";

import { MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { buildWhatsappLink, isValidWhatsappNumber } from "@/lib/whatsapp";

/** Call + "send reminder on WhatsApp" for one receivable row. The message text is prepared on the server. */
export function ReminderButtons({ phone, message }: { phone: string | null; message: string }) {
  if (!phone) return <span className="text-xs text-[var(--text-muted)]">No phone</span>;
  return (
    <div className="flex items-center justify-end gap-1.5">
      <a
        href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
        className="size-8 rounded-full flex items-center justify-center text-[var(--accent-blue)] hover:bg-blue-50"
        title="Call"
      >
        <Phone className="size-4" />
      </a>
      <button
        type="button"
        title="Send payment reminder on WhatsApp"
        className="h-8 px-2.5 rounded-full flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
        onClick={() => {
          if (!isValidWhatsappNumber(phone)) {
            toast.error("Invalid mobile number. Check it on the client's page.");
            return;
          }
          window.open(buildWhatsappLink(phone, message), "_blank", "noopener,noreferrer");
        }}
      >
        <MessageCircle className="size-4" /> Remind
      </button>
    </div>
  );
}
