"use client";

import { useEffect } from "react";

type TrackWindow = Window & {
  clarity?: (...args: unknown[]) => void;
  gtag?: (...args: unknown[]) => void;
};

// Records every call / WhatsApp / enquiry action as a conversion event in
// Microsoft Clarity and (when configured) Google Analytics, so we can see
// which visits actually turn into leads.
function track(name: string) {
  const w = window as TrackWindow;
  w.clarity?.("event", name);
  w.gtag?.("event", name, { page_path: window.location.pathname });
}

export default function LeadClickTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest("a, [data-lead]");
      if (!el) return;

      const lead = el.getAttribute("data-lead");
      if (lead) return track(lead);

      const href = el.getAttribute("href") ?? "";
      if (href.startsWith("tel:")) track("call_click");
      else if (href.includes("wa.me")) track("whatsapp_click");
      else if (href.startsWith("mailto:")) track("email_click");
    };

    const onSubmit = () => track("enquiry_form_submit");

    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmit);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("submit", onSubmit);
    };
  }, []);

  return null;
}
