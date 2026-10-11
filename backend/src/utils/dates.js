// Month helpers. Months travel through the API as "YYYY-MM" strings.

export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** The current month in "YYYY-MM" form (server time, UTC). */
export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

/** First day of the month and first day of the next one, as "YYYY-MM-DD" strings. */
export function monthRange(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  const pad = (n) => String(n).padStart(2, '0');
  const start = `${year}-${pad(monthNumber)}-01`;
  const nextYear = monthNumber === 12 ? year + 1 : year;
  const nextMonth = monthNumber === 12 ? 1 : monthNumber + 1;
  const end = `${nextYear}-${pad(nextMonth)}-01`;
  return { start, end };
}

/**
 * Turns spent vs. budget into a friendly status the UI can colour-code.
 *   no_budget   - nothing set for this month
 *   within      - under 80% used
 *   approaching - 80% or more used, but not over yet
 *   over        - spent more than the budget
 */
export function budgetStatus(spent, budget) {
  if (budget == null) return 'no_budget';
  if (spent > budget) return 'over';
  if (spent >= budget * 0.8) return 'approaching';
  return 'within';
}

/** Rounds to 2 decimals so floating point noise never leaks into responses. */
export const money = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
