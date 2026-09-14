"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { GlobalSearch } from "./GlobalSearch";

export function MobileSearch() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close search" : "Search"}
        className="sm:hidden shrink-0 size-9 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-2)] transition-colors"
      >
        {open ? <X className="size-5" /> : <Search className="size-5" />}
      </button>

      {open && (
        <div className="sm:hidden absolute left-0 right-0 top-full bg-white border-b border-[var(--border)] p-3 shadow-sm z-30">
          <GlobalSearch autoFocus onNavigate={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
