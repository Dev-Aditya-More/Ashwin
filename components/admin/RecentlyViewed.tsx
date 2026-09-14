"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Users, HardHat, Truck, Building2, History } from "lucide-react";
import {
  getRecentlyViewedSnapshot,
  getServerSnapshot,
  subscribeToRecentlyViewed,
} from "@/lib/recently-viewed";

const ICON = {
  Client: Users,
  Labour: HardHat,
  Vendor: Truck,
  Project: Building2,
} as const;

const TONE = {
  Client: "bg-emerald-50 text-emerald-700",
  Labour: "bg-amber-50 text-amber-700",
  Vendor: "bg-rose-50 text-rose-700",
  Project: "bg-blue-50 text-blue-700",
} as const;

export function RecentlyViewed() {
  const items = useSyncExternalStore(
    subscribeToRecentlyViewed,
    getRecentlyViewedSnapshot,
    getServerSnapshot
  );

  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <History className="size-4 text-[var(--text-muted)]" />
        <p className="font-semibold text-sm">Recently Viewed</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {items.map((item) => {
          const Icon = ICON[item.category];
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 shrink-0 rounded-lg border border-[var(--border)] pl-2 pr-3 py-1.5 hover:bg-[var(--bg-2)] transition-colors"
            >
              <span className={`size-6 rounded-full flex items-center justify-center shrink-0 ${TONE[item.category]}`}>
                <Icon className="size-3.5" />
              </span>
              <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
