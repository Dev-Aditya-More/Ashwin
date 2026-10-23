"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/** Search box for the party lists — keeps the term in `?q=` so the server renders the filtered rows. */
export function PartySearch({ initial, placeholder }: { initial: string; placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initial);

  useEffect(() => {
    if (value === initial) return;
    const t = setTimeout(() => {
      router.replace(value.trim() ? `${pathname}?q=${encodeURIComponent(value.trim())}` : pathname);
    }, 250);
    return () => clearTimeout(t);
  }, [value, initial, pathname, router]);

  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-8"
        autoComplete="off"
      />
    </div>
  );
}
