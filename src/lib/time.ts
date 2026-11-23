/**
 * Calendar math in the user's profile time zone, so the server render and the browser
 * agree no matter where either runs (avoids hydration mismatches in Docker/UTC hosts).
 * Due dates are calendar dates stored at 12:00 UTC.
 */
export const safeTz = (tz?: string) => {
  try { if (tz) { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return tz; } } catch { /* fall through */ }
  return "UTC";
};

/** "YYYY-MM-DD" of the instant `d` as seen in `tz`. */
export function ymdIn(d: Date, tz?: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: safeTz(tz), year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

const dayNum = (ymd: string) => Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10)) / 86400000;

/** Days from today (in `tz`) to a stored due date (calendar date at 12:00 UTC). */
export function dueDayDiff(iso: string, tz?: string, now = new Date()) {
  return dayNum(new Date(iso).toISOString().slice(0, 10)) - dayNum(ymdIn(now, tz));
}

/** Hour of day (0–23) in `tz`. */
export function hourIn(tz?: string, now = new Date()) {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: safeTz(tz), hour: "numeric", hourCycle: "h23" }).format(now)) % 24;
}

/** Whether two instants fall on the same calendar day in `tz`. */
export function sameDayIn(a: Date, b: Date, tz?: string) {
  return ymdIn(a, tz) === ymdIn(b, tz);
}

/** Stored form of a calendar date picked in an <input type="date">. */
export const dueFromInput = (ymd: string) => `${ymd}T12:00:00.000Z`;
