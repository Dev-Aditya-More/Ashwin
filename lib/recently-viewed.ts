"use client";

const KEY = "ashwin-admin-recently-viewed";
const MAX_ITEMS = 8;

export type RecentItem = {
  id: string;
  name: string;
  category: "Client" | "Labour" | "Vendor" | "Project";
  href: string;
  viewedAt: number;
};

const EMPTY: RecentItem[] = [];
let cachedRaw: string | null | undefined = undefined;
let cachedItems: RecentItem[] = EMPTY;

/**
 * Cached read, keyed on the raw localStorage string — returns the SAME
 * array reference when the underlying value hasn't changed, which
 * useSyncExternalStore requires to avoid re-render loops.
 */
export function getRecentlyViewedSnapshot(): RecentItem[] {
  if (typeof window === "undefined") return EMPTY;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }

  if (raw === cachedRaw) return cachedItems;
  cachedRaw = raw;

  try {
    const parsed = raw ? JSON.parse(raw) : [];
    cachedItems = Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    cachedItems = EMPTY;
  }
  return cachedItems;
}

export function getServerSnapshot(): RecentItem[] {
  return EMPTY;
}

export function subscribeToRecentlyViewed(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function pushRecentlyViewed(item: Omit<RecentItem, "viewedAt">) {
  if (typeof window === "undefined") return;
  try {
    const existing = getRecentlyViewedSnapshot().filter((r) => r.href !== item.href);
    const next = [{ ...item, viewedAt: Date.now() }, ...existing].slice(0, MAX_ITEMS);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable (private mode, etc.) — recently-viewed is a
    // convenience feature, safe to no-op.
  }
}
