import { Search, CalendarDays, LogOut } from "lucide-react";
import Link from "next/link";
import MobileSidebar from "./MobileSidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { logout } from "@/lib/actions/auth";
import { initials } from "@/lib/format";

export default function Topbar({
  fyLabel,
  userEmail,
}: {
  fyLabel: string;
  userEmail: string;
}) {
  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-[var(--border)] bg-white/90 backdrop-blur-sm flex items-center gap-3 px-4 md:px-6">
      <MobileSidebar />

      <div className="hidden sm:flex items-center gap-2 flex-1 min-w-0 max-w-md">
        <div className="relative w-full min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
          <input
            placeholder="Search clients, workers, vendors, projects…"
            className="w-full h-9 rounded-lg border border-[var(--border)] bg-[var(--bg-2)] pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30"
          />
        </div>
      </div>

      <div className="flex-1 sm:hidden" />

      <div className="hidden lg:flex items-center gap-2 text-sm text-[var(--text-secondary)] shrink-0">
        <CalendarDays className="size-4" />
        <span className="whitespace-nowrap">{today}</span>
        <span className="text-[var(--text-muted)]">·</span>
        <span className="font-medium text-[var(--text-primary)] whitespace-nowrap">{fyLabel}</span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="outline-none shrink-0">
          <Avatar className="size-9">
            <AvatarFallback className="bg-[var(--accent-blue)] text-white text-xs font-semibold">
              {initials(userEmail) || "AE"}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-xs text-[var(--text-muted)] truncate">{userEmail}</div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/admin/settings">Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <form action={logout}>
            <DropdownMenuItem asChild>
              <button type="submit" className="w-full flex items-center gap-2 text-left">
                <LogOut className="size-4" /> Sign out
              </button>
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
