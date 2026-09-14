"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Users, HardHat, Truck, Building2 } from "lucide-react";
import { searchAll, type SearchResult } from "@/lib/actions/search";
import { cn } from "@/lib/utils";

const ICON = {
  Client: Users,
  Labour: HardHat,
  Vendor: Truck,
  Project: Building2,
} as const;

export function GlobalSearch({
  autoFocus = false,
  onNavigate,
}: {
  autoFocus?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    setOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const rows = await searchAll(value);
        setResults(rows);
      });
    }, 250);
  }

  function goTo(result: SearchResult) {
    setOpen(false);
    setQuery("");
    setResults([]);
    onNavigate?.();
    router.push(result.href);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Enter" && results[0]) {
      goTo(results[0]);
    }
  }

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
      <input
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        placeholder="Search clients, workers, vendors, projects…"
        className="w-full h-9 rounded-lg border border-[var(--border)] bg-[var(--bg-2)] pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30"
      />
      {pending && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-[var(--text-muted)]" />
      )}

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1.5 rounded-lg border border-[var(--border)] bg-white shadow-lg max-h-80 overflow-y-auto z-30">
          {results.length === 0 && !pending && (
            <p className="px-3 py-4 text-sm text-[var(--text-muted)] text-center">
              No matches for &ldquo;{query}&rdquo;
            </p>
          )}
          {results.map((result) => {
            const Icon = ICON[result.category];
            return (
              <button
                key={`${result.category}-${result.id}`}
                type="button"
                onClick={() => goTo(result)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[var(--bg-2)] transition-colors"
                )}
              >
                <Icon className="size-4 text-[var(--text-muted)] shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{result.title}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{result.subtitle}</p>
                </div>
                <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] shrink-0">
                  {result.category}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
