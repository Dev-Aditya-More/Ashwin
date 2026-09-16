/** Last day of the current calendar month, as YYYY-MM-DD — the furthest a date picker should allow. */
export function endOfCurrentMonth(): string {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return end.toISOString().slice(0, 10);
}

/** True if the given YYYY-MM-DD falls in a calendar month after the current one. */
export function isAfterCurrentMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const key = (x: Date) => x.getFullYear() * 12 + x.getMonth();
  return key(d) > key(now);
}

export const FUTURE_MONTH_WARNING =
  "That date is in a future month — you can log entries for the current month or earlier only.";
