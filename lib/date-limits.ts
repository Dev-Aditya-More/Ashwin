import { todayIST } from "@/lib/today";

/** Last day of the current (Indian) calendar month, as YYYY-MM-DD — the furthest a date picker should allow. */
export function endOfCurrentMonth(): string {
  const [y, m] = todayIST().split("-").map(Number);
  // Day 0 of next month = last day of this month; computed in UTC so no timezone can shift it.
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

/** True if the given YYYY-MM-DD falls in a calendar month after the current (Indian) one. */
export function isAfterCurrentMonth(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}/.test(dateStr)) return false;
  return dateStr.slice(0, 7) > todayIST().slice(0, 7);
}

export const FUTURE_MONTH_WARNING =
  "That date is in a future month — you can log entries for the current month or earlier only.";
