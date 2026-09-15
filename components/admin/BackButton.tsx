"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Goes back to wherever the user actually came from (Dashboard, Reports,
 * a list page, …) instead of a hardcoded parent route — so people don't
 * have to reach for the browser's own back button to retrace a click.
 * Falls back to `fallbackHref` only if there's no in-app history to go
 * back to (e.g. the page was opened directly / in a new tab).
 */
export function BackButton({ fallbackHref }: { fallbackHref: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }}
      aria-label="Go back"
      className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
    >
      <ArrowLeft className="size-4" />
    </button>
  );
}
