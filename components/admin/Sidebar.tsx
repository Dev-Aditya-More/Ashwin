"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  HardHat,
  Truck,
  Building2,
  ArrowLeftRight,
  BarChart3,
  MessageCircle,
  Settings,
  Sparkles,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";

export const NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "AI Assistant", href: "/admin/assistant", icon: Sparkles },
  { label: "Clients", href: "/admin/clients", icon: Users },
  { label: "Labour", href: "/admin/labour", icon: HardHat },
  { label: "Vendors", href: "/admin/vendors", icon: Truck },
  { label: "Projects / Sites", href: "/admin/projects", icon: Building2 },
  { label: "Transactions", href: "/admin/transactions", icon: ArrowLeftRight },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Import", href: "/admin/import", icon: Upload },
  { label: "WhatsApp", href: "/admin/whatsapp", icon: MessageCircle },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-[var(--border)] bg-white h-screen sticky top-0">
      <div className="h-16 flex items-center px-5 border-b border-[var(--border)]">
        <Link href="/admin" className="flex items-center">
          <Logo className="w-[150px] h-auto" />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-2)] hover:text-[var(--text-primary)]"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[var(--border)]">
        <Link
          href="/admin/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/admin/settings")
              ? "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-2)] hover:text-[var(--text-primary)]"
          )}
        >
          <Settings className="size-4 shrink-0" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
