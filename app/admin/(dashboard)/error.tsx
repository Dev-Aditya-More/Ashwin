"use client";

import { useEffect } from "react";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shown instead of a blank "try again" page when a section fails to load; keeps the menu usable. */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-8 text-center space-y-3 max-w-md mx-auto mt-10">
      <p className="font-semibold">Couldn&apos;t load this page</p>
      <p className="text-sm text-[var(--text-muted)]">
        This is usually a brief connection hiccup. Nothing you saved has been lost.
      </p>
      <Button onClick={() => reset()}>
        <RotateCw className="size-4" /> Try again
      </Button>
    </div>
  );
}
