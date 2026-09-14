"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Building2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV } from "./Sidebar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function MobileSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-[var(--border)]">
          <div className="size-9 rounded-lg bg-[var(--accent-blue)] flex items-center justify-center shrink-0">
            <Building2 className="size-5 text-white" />
          </div>
          <p className="font-semibold text-[14px]">Ashwin Enterprises</p>
        </div>
        <nav className="py-3 px-3 space-y-0.5">
          {NAV.map((item) => {
            const active =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-2)]"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/admin/settings"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/admin/settings")
                ? "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-2)]"
            )}
          >
            <Settings className="size-4 shrink-0" />
            Settings
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
