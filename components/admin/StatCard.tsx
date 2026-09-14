import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import type { LucideIcon } from "lucide-react";

const TONES = {
  green: "bg-emerald-50 text-emerald-700 [&_.icon-badge]:bg-emerald-100",
  red: "bg-rose-50 text-rose-700 [&_.icon-badge]:bg-rose-100",
  amber: "bg-amber-50 text-amber-700 [&_.icon-badge]:bg-amber-100",
  blue: "bg-blue-50 text-blue-700 [&_.icon-badge]:bg-blue-100",
  neutral: "bg-white text-[var(--text-primary)] [&_.icon-badge]:bg-[var(--bg-2)]",
} as const;

export function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  tone = "neutral",
  isMoney = true,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  sublabel: string;
  tone?: keyof typeof TONES;
  isMoney?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border)] p-4 flex flex-col gap-3",
        TONES[tone]
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="icon-badge size-9 rounded-lg flex items-center justify-center shrink-0">
          <Icon className="size-[18px]" />
        </div>
        <p className="text-sm font-medium">{label}</p>
      </div>
      <div>
        <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
          {typeof value === "number" && isMoney ? formatMoney(value) : value}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{sublabel}</p>
      </div>
    </div>
  );
}
