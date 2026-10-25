// Business dates are Indian dates. `new Date().toISOString()` is UTC, which is still "yesterday"
// in India until 5:30 am — so every default/limit date goes through these helpers instead.
const IST = "Asia/Kolkata";

/** Today's date in India, as YYYY-MM-DD. */
export function todayIST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: IST, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/** The current month in India, as YYYY-MM. */
export function thisMonthIST(): string {
  return todayIST().slice(0, 7);
}
