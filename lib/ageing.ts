// Receivables ageing: how long each rupee a client owes has been pending.

export const BUCKETS = [
  { key: "b0", label: "0–30 days", min: 0 },
  { key: "b30", label: "31–60 days", min: 31 },
  { key: "b60", label: "61–90 days", min: 61 },
  { key: "b90", label: "90+ days", min: 91 },
] as const;

export type BucketKey = (typeof BUCKETS)[number]["key"];

export type Ageing = {
  /** What the client owes right now (never negative). */
  outstanding: number;
  /** Money paid beyond everything billed. */
  advance: number;
  buckets: Record<BucketKey, number>;
  /** Age in days of the oldest bill that is still (partly) unpaid; 0 when nothing is owed. */
  oldestDays: number;
};

const dayNumber = (ymd: string) => {
  const [y, m, d] = ymd.slice(0, 10).split("-").map(Number);
  return Math.floor(Date.UTC(y, (m || 1) - 1, d || 1) / 86_400_000);
};

export function bucketFor(days: number): BucketKey {
  if (days >= 91) return "b90";
  if (days >= 61) return "b60";
  if (days >= 31) return "b30";
  return "b0";
}

/**
 * Payments clear the oldest bills first (FIFO); whatever is left of a bill keeps ageing from its own date.
 * Refunds given back to the client count against what they paid, the same way the client balance does.
 */
export function computeAgeing(
  work: { amount: number | string; work_date: string }[],
  payments: { amount: number | string; is_refund?: boolean | null }[],
  todayYmd: string
): Ageing {
  const paid = payments.reduce((s, p) => s + (p.is_refund ? -Number(p.amount) : Number(p.amount)) || 0, 0);
  const buckets: Record<BucketKey, number> = { b0: 0, b30: 0, b60: 0, b90: 0 };
  const today = dayNumber(todayYmd);
  let credit = Math.max(0, paid);
  let oldestDays = 0;

  const sorted = [...work].sort((a, b) => a.work_date.localeCompare(b.work_date));
  for (const w of sorted) {
    const amount = Number(w.amount) || 0;
    const take = Math.min(credit, amount);
    credit -= take;
    const left = amount - take;
    if (left <= 0.005) continue;
    const days = Math.max(0, today - dayNumber(w.work_date));
    buckets[bucketFor(days)] += left;
    oldestDays = Math.max(oldestDays, days);
  }
  // More refunded than paid: that extra is owed too; age it with the newest bill.
  if (paid < 0 && sorted.length) {
    const last = sorted[sorted.length - 1];
    const days = Math.max(0, today - dayNumber(last.work_date));
    buckets[bucketFor(days)] += -paid;
    oldestDays = Math.max(oldestDays, days);
  }

  const r2 = (n: number) => Math.round(n * 100) / 100;
  for (const k of Object.keys(buckets) as BucketKey[]) buckets[k] = r2(buckets[k]);
  const outstanding = r2(Object.values(buckets).reduce((a, b) => a + b, 0));
  return { outstanding, advance: r2(credit), buckets, oldestDays: outstanding > 0 ? oldestDays : 0 };
}
